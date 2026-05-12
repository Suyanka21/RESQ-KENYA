// ResQ Kenya - Customer Service (Cloud Functions Integration)
// Handles customer-side operations via Firebase Cloud Functions
//
// Phase 2 (Contract Stabilization): all writes go through the canonical
// Cloud Functions and the shared `CallResult<T,E>` envelope from `types/api`.
// The legacy `{ success, requestId }` shape is preserved at the boundary so
// existing call-sites do not break — the new shape is layered on top.

import { httpsCallable, getFunctions } from 'firebase/functions';
import { doc, onSnapshot, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import app from '../config/firebase';
import type { ServiceRequest, GeoLocation } from '../types';
import type {
    CallResult,
    CreateServiceRequestErrorCode,
    CreateServiceRequestInput,
    PricingInput,
} from '../types/api';
import { generateIdempotencyKey as generateIdempotencyKeyFromContract } from '../types/api';

// Initialize Firebase Functions
const functions = getFunctions(app, 'us-central1');

/**
 * Demo mode toggle. Phase 2: gate behind a runtime flag so production builds
 * never accidentally simulate. Default is `false` (talk to real backend);
 * opt in to demo mode by setting `EXPO_PUBLIC_DEMO_MODE='true'` at build
 * time, or call `setDemoMode(true)` at startup for ad-hoc local testing.
 *
 * We read the env var through a runtime accessor (not a direct
 * `process.env.EXPO_PUBLIC_*`) because `babel-preset-expo` constant-folds
 * those through `expo/virtual/env`, which breaks the unit-test transform.
 *
 * Default-OFF posture is intentional: a missing or undefined env var must
 * never silently bypass the production backend (CodeRabbit PR #3, comment
 * 15).
 */
let USE_DEMO_MODE: boolean = (() => {
    // Indirect access avoids babel-preset-expo's `process.env.EXPO_PUBLIC_*`
    // constant-folding while still picking up the value at runtime.
    const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
    const flag = env ? env['EXPO_PUBLIC_DEMO_MODE'] : undefined;
    return flag === 'true' || flag === '1';
})();

/**
 * Phase 4 (audit-v2 §N-HIGH-10) — boot-time demo-mode banner.
 *
 * The audit observed that `setDemoMode` mutates a module-level `let`
 * from anywhere in the JS bundle, with no telemetry that records the
 * runtime flag. A single bad call-site could permanently silence the
 * entire customer backend integration for a session, and reviewers
 * would have no signal that it happened.
 *
 * Fix posture: keep the public `setDemoMode` API (it has legitimate
 * test-harness uses — see `__tests__/services/customer-demo-mode.test.ts`)
 * but make every transition LOUD:
 *   - log the runtime value at module load so the boot of a real build
 *     is visible in production crash logs / `console`
 *   - log every subsequent `setDemoMode(...)` call with a stack trace
 *     hint so an accidental call-site can be located
 *
 * Two safety extensions on top of the audit recommendation:
 *   - `setDemoMode` is a no-op when `__DEV__ === false` and the flag is
 *     being set to `true` (the audit's stated worst case: production
 *     accidentally simulating). Tests run with `__DEV__` truthy.
 *   - `isDemoMode()` (existing helper) is the canonical read path; do
 *     NOT read `USE_DEMO_MODE` directly anywhere outside this module.
 *
 * Skills: Security-and-Hardening (server / boundary-level posture
 * applied to the client too — privileged flips must be observable),
 * API-and-Interface-Design (loud boundary log so the contract
 * "demo is OFF by default" cannot silently flip).
 */
if (USE_DEMO_MODE) {
     
    console.warn(
        '[customer.service] DEMO MODE IS ACTIVE — backend calls are being SIMULATED. ' +
        'EXPO_PUBLIC_DEMO_MODE=true is set at build time. If this is a real ' +
        'production build, treat this as an immediate operational incident.'
    );
} else {
    // Even the OFF path logs once at module load so production deploys
    // have a positive signal that the flag was inspected and is OFF.
     
    console.log('[customer.service] demo mode OFF (live backend)');
}

/**
 * Re-export of the canonical idempotency-key generator from `types/api.ts`
 * (the contract layer). Phase 3 (X-1): single source of truth — frontend
 * wrappers and the `functions/src/shared/api.ts` mirror reference the
 * same regex/length bounds. Existing call-sites that imported
 * `generateIdempotencyKey` from this file continue to work unchanged.
 */
export const generateIdempotencyKey = generateIdempotencyKeyFromContract;

/**
 * Create a service request (calls the canonical Cloud Function).
 *
 * Returns the legacy `{ success, requestId, error }` shape for backwards
 * compatibility with existing call-sites; new code should prefer
 * `createServiceRequestV2` which returns the typed `CallResult` envelope.
 */
export async function createServiceRequest(data: {
    serviceType: string;
    customerLocation: {
        coordinates: GeoLocation;
        address: string;
        landmark?: string;
        instructions?: string;
    };
    serviceDetails?: Record<string, any>;
    pricing?: PricingInput;
    quoteId?: string;
    /** Optional client-supplied idempotency key. Auto-generated if absent. */
    idempotencyKey?: string;
}): Promise<{ success: boolean; requestId?: string; error?: string }> {
    // Demo mode - simulate request creation
    if (USE_DEMO_MODE) {
        console.log('[DEMO] Creating service request:', data);
        await simulateDelay(1000);
        return {
            success: true,
            requestId: `demo_${Date.now()}`,
        };
    }

    const result = await createServiceRequestV2({
        ...data,
        // Cast: the server validates `serviceType` against the allow-list.
        serviceType: data.serviceType as CreateServiceRequestInput['serviceType'],
        idempotencyKey: data.idempotencyKey ?? generateIdempotencyKey(),
        // Strip undefined to match `CustomerLocationInput`.
        customerLocation: {
            coordinates: {
                latitude: data.customerLocation.coordinates.latitude,
                longitude: data.customerLocation.coordinates.longitude,
            },
            address: data.customerLocation.address,
            ...(data.customerLocation.landmark !== undefined && {
                landmark: data.customerLocation.landmark,
            }),
            ...(data.customerLocation.instructions !== undefined && {
                instructions: data.customerLocation.instructions,
            }),
        },
    });

    if (result.ok) {
        return { success: true, requestId: result.data.requestId };
    }
    return { success: false, error: result.message };
}

/**
 * Phase 2 typed wrapper: returns the discriminated `CallResult` envelope.
 * Prefer this in new code so callers can branch on `result.errorCode`.
 */
export async function createServiceRequestV2(
    input: CreateServiceRequestInput
): Promise<CallResult<{ requestId: string }, CreateServiceRequestErrorCode>> {
    try {
        const callable = httpsCallable<CreateServiceRequestInput, unknown>(
            functions,
            'createServiceRequest'
        );
        const response = await callable(input);
        const data = response.data as
            | CallResult<{ requestId: string }, CreateServiceRequestErrorCode>
            | { success: boolean; requestId?: string };

        // Forward-compat: server already returns `CallResult` shape.
        if (data && typeof data === 'object' && 'ok' in data) {
            return data as CallResult<{ requestId: string }, CreateServiceRequestErrorCode>;
        }
        // Backwards-compat: server may still be on the old shape during rollout.
        if (data && (data as { success?: boolean }).success && (data as { requestId?: string }).requestId) {
            return { ok: true, data: { requestId: (data as { requestId: string }).requestId } };
        }
        return { ok: false, errorCode: 'internal', message: 'Unexpected server response shape' };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('createServiceRequestV2 error:', message);
        return { ok: false, errorCode: 'internal', message };
    }
}

/**
 * Cancel a service request
 */
export async function cancelServiceRequest(requestId: string): Promise<{ success: boolean }> {
    if (USE_DEMO_MODE) {
        console.log('[DEMO] Cancelling request:', requestId);
        await simulateDelay(500);
        return { success: true };
    }

    try {
        const cancelRequest = httpsCallable(functions, 'updateRequestStatus');
        const result = await cancelRequest({ requestId, status: 'cancelled' });
        return result.data as { success: boolean };
    } catch (error) {
        console.error('Cancel request error:', error);
        return { success: false };
    }
}

/**
 * Subscribe to request updates in real-time
 */
export function subscribeToRequest(
    requestId: string,
    callback: (request: ServiceRequest | null) => void
): () => void {
    // Demo mode - simulate provider updates
    if (USE_DEMO_MODE && requestId.startsWith('demo_')) {
        let currentEta = 7;
        const stages = ['pending', 'accepted', 'enroute', 'arrived', 'inProgress', 'completed'] as const;
        let stageIndex = 0;

        // Simulate provider finding and movement
        const interval = setInterval(() => {
            if (stageIndex < stages.length) {
                const mockRequest: Partial<ServiceRequest> = {
                    id: requestId,
                    status: stages[stageIndex],
                    providerId: stageIndex >= 1 ? 'demo_provider_1' : undefined,
                    timeline: {
                        requestedAt: new Date(),
                        acceptedAt: stageIndex >= 1 ? new Date() : undefined,
                        arrivedAt: stageIndex >= 3 ? new Date() : undefined,
                        completedAt: stageIndex >= 5 ? new Date() : undefined,
                    },
                };

                // Add mock provider info after acceptance
                if (stageIndex >= 1) {
                    (mockRequest as any).providerInfo = {
                        displayName: 'John - Towing Services',
                        rating: 4.8,
                        totalServices: 156,
                        vehicle: { type: 'Isuzu FRR', licensePlate: 'KDG 456X' },
                        phoneNumber: '+254700123456',
                    };
                    (mockRequest as any).eta = currentEta;
                }

                callback(mockRequest as ServiceRequest);
                stageIndex++;
                currentEta = Math.max(0, currentEta - 1);
            } else {
                clearInterval(interval);
            }
        }, 3000);

        return () => clearInterval(interval);
    }

    // Production mode - real Firestore subscription
    const requestRef = doc(db, 'requests', requestId);
    return onSnapshot(requestRef, (snapshot) => {
        if (snapshot.exists()) {
            callback({ id: snapshot.id, ...snapshot.data() } as ServiceRequest);
        } else {
            callback(null);
        }
    });
}

/**
 * Get customer's request history
 */
export async function getRequestHistory(
    userId: string,
    limitCount: number = 20
): Promise<ServiceRequest[]> {
    if (USE_DEMO_MODE) {
        // Return mock history
        return [
            {
                id: 'hist_1',
                userId,
                serviceType: 'towing',
                status: 'completed',
                customerLocation: {
                    coordinates: { latitude: -1.2864, longitude: 36.8172 },
                    address: 'Westlands, Nairobi',
                },
                timeline: { requestedAt: new Date(Date.now() - 86400000 * 2), completedAt: new Date(Date.now() - 86400000 * 2 + 3600000) },
                pricing: { total: 3500 },
                rating: { stars: 5, review: 'Excellent service!' },
            } as ServiceRequest,
            {
                id: 'hist_2',
                userId,
                serviceType: 'battery',
                status: 'completed',
                customerLocation: {
                    coordinates: { latitude: -1.2920, longitude: 36.8219 },
                    address: 'CBD, Nairobi',
                },
                timeline: { requestedAt: new Date(Date.now() - 86400000 * 7), completedAt: new Date(Date.now() - 86400000 * 7 + 1800000) },
                pricing: { total: 2000 },
                rating: { stars: 4 },
            } as ServiceRequest,
        ];
    }

    try {
        const q = query(
            collection(db, 'requests'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest));
    } catch (error) {
        console.error('Get history error:', error);
        return [];
    }
}

/**
 * Add rating to completed request
 */
export async function addRating(
    requestId: string,
    rating: { stars: number; review?: string; tags?: string[] }
): Promise<{ success: boolean }> {
    if (USE_DEMO_MODE) {
        console.log('[DEMO] Adding rating:', requestId, rating);
        await simulateDelay(500);
        return { success: true };
    }

    try {
        const addRequestRating = httpsCallable(functions, 'addRequestRating');
        const result = await addRequestRating({ requestId, rating });
        return result.data as { success: boolean };
    } catch (error) {
        console.error('Add rating error:', error);
        return { success: false };
    }
}

/**
 * Get estimated price for a service
 */
export function calculateServicePrice(
    serviceType: string,
    options: {
        fuelAmount?: number;
        distance?: number;
        fuelType?: 'petrol' | 'diesel';
    } = {}
): {
    basePrice: number;
    distanceFee: number;
    platformFee: number;
    total: number;
} {
    const basePrices: Record<string, number> = {
        towing: 3500,
        battery: 2000,
        tire: 1500,
        fuel: 200, // Delivery fee only
        diagnostics: 2500,
        ambulance: 5000,
    };

    const basePrice = basePrices[serviceType] || 0;
    const distanceFee = (options.distance || 0) * 50; // KES 50 per km

    // For fuel, add fuel cost
    let additionalCharges = 0;
    if (serviceType === 'fuel' && options.fuelAmount) {
        additionalCharges = options.fuelAmount; // Customer pays for fuel at market rate
    }

    const subtotal = basePrice + distanceFee + additionalCharges;
    const platformFee = Math.round(subtotal * 0.05); // 5% platform fee
    const total = subtotal + platformFee;

    return {
        basePrice: basePrice + additionalCharges,
        distanceFee,
        platformFee,
        total,
    };
}

/**
 * Phase 4 (audit-v2 §N-HIGH-5) — wallet balance subscription.
 *
 * Source-Driven-Development reference: the `wallets/{userId}` doc is
 * the canonical balance store, owner-readable per
 * `firestore.rules:137-139` (`allow read: if isAuthenticated() &&
 * isOwner(userId)`). The wallet ledger lives in the
 * `wallets/{userId}/ledger` subcollection (see
 * `functions/src/wallet/wallet.ts:11-30`); we only need the top-level
 * `balance` field here.
 *
 * Returns a teardown function so callers can unsubscribe on unmount.
 * Demo mode returns a stable mock balance and a noop teardown so the
 * sidebar still has something to render during local testing.
 *
 * Skills: API-and-Interface-Design (subscription returns the canonical
 * teardown callback shape used by every other subscribe* helper in
 * this file), Security-and-Hardening (the read is owner-scoped — the
 * Firestore rule denies any caller that isn't `request.auth.uid ===
 * userId`).
 */
export function subscribeToWalletBalance(
    userId: string,
    callback: (balance: number) => void
): () => void {
    if (USE_DEMO_MODE) {
        // Stable mock so the sidebar renders something during local
        // testing. The real wallet helper returns whole KES; the demo
        // value matches that contract.
        callback(2450);
        return () => undefined;
    }
    const walletRef = doc(db, 'wallets', userId);
    return onSnapshot(
        walletRef,
        (snapshot) => {
            if (!snapshot.exists()) {
                // Wallet not yet created (new user; the first M-Pesa
                // top-up will provision it). Render 0 — better than
                // surfacing a permission-denied or null.
                callback(0);
                return;
            }
            const raw = snapshot.data()?.balance;
            callback(typeof raw === 'number' ? raw : 0);
        },
        (error) => {
            // Don't surface to the user — the sidebar is non-essential
            // chrome and the rest of the app keeps working. Log so the
            // failure is observable in Crashlytics / dev logs.
             
            console.warn('[wallet] subscription error:', error.message);
            callback(0);
        }
    );
}

/**
 * Format ETA display
 */
export function formatETA(minutes: number): string {
    if (minutes < 1) return 'Arriving now';
    if (minutes === 1) return '1 min';
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Calculate distance between two points (km)
 */
export function calculateDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

function simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Toggle demo mode at runtime. Useful for tests and for staging builds that
 * want to flip between live Cloud Functions and the in-memory simulation
 * without rebuilding.
 */
export function setDemoMode(enabled: boolean): void {
    // Phase 4 (audit-v2 §N-HIGH-10) — production safety + audit trail.
    //
    // The audit's worst case is a forgotten test or feature toggle that
    // calls `setDemoMode(true)` against a real production build. The
    // following guard refuses to enable demo mode unless either
    // `__DEV__` is truthy (Expo/RN dev build) or `process.env.NODE_ENV`
    // explicitly says we are running tests. The guard does NOT block
    // disabling demo mode — turning the simulator OFF is always safe.
    if (enabled) {
        const isDev = (() => {
            try {
                // RN/Expo injects `__DEV__` at bundle time. Reading it
                // directly avoids a `typeof` check that the bundler may
                // tree-shake into `false`.
                return Boolean((globalThis as { __DEV__?: boolean }).__DEV__);
            } catch {
                return false;
            }
        })();
        const nodeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } })
            .process?.env?.['NODE_ENV'];
        const isTest = nodeEnv === 'test' || nodeEnv === 'development';

        if (!isDev && !isTest) {
             
            console.error(
                '[customer.service] REFUSED to enable demo mode in a non-dev/non-test build. ' +
                'If you need to simulate the backend, set EXPO_PUBLIC_DEMO_MODE at build time.'
            );
            return;
        }
         
        console.warn(
            '[customer.service] setDemoMode(true) — demo mode now ON. ' +
            'This will SIMULATE backend calls. Remember to flip it back to OFF.'
        );
    } else if (USE_DEMO_MODE) {
         
        console.log('[customer.service] setDemoMode(false) — back to live backend');
    }
    USE_DEMO_MODE = enabled;
}

/** Read the current demo-mode flag (mainly for tests). */
export function isDemoMode(): boolean {
    return USE_DEMO_MODE;
}
