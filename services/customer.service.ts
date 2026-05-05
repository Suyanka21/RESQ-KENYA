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
 * Generate a client-side idempotency key safe for the canonical
 * `createServiceRequest` contract (16-64 char alphanumeric/underscore/dash).
 * Falls back to `Math.random` in environments without `crypto.randomUUID`.
 */
export function generateIdempotencyKey(): string {
    type CryptoLike = { randomUUID?: () => string };
    const cryptoApi: CryptoLike | undefined =
        (globalThis as unknown as { crypto?: CryptoLike }).crypto;
    if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
        return cryptoApi.randomUUID();
    }
    const ts = Date.now().toString(36);
    const rnd = Math.random().toString(36).slice(2, 14);
    return `idem_${ts}_${rnd}`;
}

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
    USE_DEMO_MODE = enabled;
}

/** Read the current demo-mode flag (mainly for tests). */
export function isDemoMode(): boolean {
    return USE_DEMO_MODE;
}
