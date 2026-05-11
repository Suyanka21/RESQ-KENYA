// ResQ Kenya - Realtime Database Service
// Handles live location tracking during active service requests

import {
    ref,
    set,
    get,
    update,
    remove,
    onValue,
    off,
    push,
    serverTimestamp as rtdbServerTimestamp
} from 'firebase/database';
import { rtdb } from '../config/firebase';
import type { GeoLocation } from '../types';

// Database paths
const PATHS = {
    ACTIVE_REQUESTS: 'activeRequests',
    PROVIDER_LOCATIONS: 'providerLocations',
} as const;

// ============================================
// ACTIVE REQUEST TRACKING
// ============================================

interface ActiveRequestData {
    providerId: string;
    customerId: string;
    serviceType: string;
    /**
     * Phase 4 (audit-v2 §N-MED-1) — null until the provider's FIRST
     * location push. The seed (`triggers.buildActiveRequestSeed`)
     * writes `providerLocation: null` so consumers MUST tolerate it.
     */
    providerLocation: GeoLocation | null;
    customerLocation: GeoLocation;
    eta: number; // seconds
    distance: number; // meters
    status: string;
    startedAt: number;
}

/**
 * Start tracking an active request
 * Called when provider accepts a request
 */
export async function startRequestTracking(
    requestId: string,
    data: Omit<ActiveRequestData, 'startedAt'>
): Promise<void> {
    const requestRef = ref(rtdb, `${PATHS.ACTIVE_REQUESTS}/${requestId}`);

    await set(requestRef, {
        ...data,
        startedAt: Date.now(),
    });
}

/**
 * Update provider location during active request
 */
export async function updateProviderLocationRT(
    requestId: string,
    location: GeoLocation,
    eta?: number,
    distance?: number
): Promise<void> {
    const locationRef = ref(rtdb, `${PATHS.ACTIVE_REQUESTS}/${requestId}/providerLocation`);

    await update(ref(rtdb, `${PATHS.ACTIVE_REQUESTS}/${requestId}`), {
        providerLocation: {
            ...location,
            timestamp: Date.now(),
        },
        ...(eta !== undefined && { eta }),
        ...(distance !== undefined && { distance }),
        lastUpdate: Date.now(),
    });
}

/**
 * Subscribe to provider location updates (for customer app)
 */
export function subscribeToProviderLocation(
    requestId: string,
    callback: (data: {
        /**
         * Phase 4 (audit-v2 §N-MED-1) — `location` is null until the
         * provider's first location push. Consumers MUST render a
         * "locating provider…" placeholder rather than dereferencing
         * `.latitude` / `.longitude`.
         */
        location: GeoLocation | null;
        eta: number;
        distance: number;
        status: string;
    } | null) => void
): () => void {
    const requestRef = ref(rtdb, `${PATHS.ACTIVE_REQUESTS}/${requestId}`);

    onValue(requestRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val() as ActiveRequestData;
            callback({
                location: data.providerLocation ?? null,
                eta: data.eta,
                distance: data.distance,
                status: data.status,
            });
        } else {
            callback(null);
        }
    });

    // Return cleanup function
    return () => off(requestRef);
}

/**
 * Update request status in realtime
 */
export async function updateRequestStatusRT(
    requestId: string,
    status: string
): Promise<void> {
    const statusRef = ref(rtdb, `${PATHS.ACTIVE_REQUESTS}/${requestId}/status`);
    await set(statusRef, status);
}

/**
 * End request tracking (when completed or cancelled)
 */
export async function endRequestTracking(requestId: string): Promise<void> {
    const requestRef = ref(rtdb, `${PATHS.ACTIVE_REQUESTS}/${requestId}`);
    await remove(requestRef);
}

/**
 * Get active request data
 */
export async function getActiveRequest(requestId: string): Promise<ActiveRequestData | null> {
    const requestRef = ref(rtdb, `${PATHS.ACTIVE_REQUESTS}/${requestId}`);
    const snapshot = await get(requestRef);

    if (snapshot.exists()) {
        return snapshot.val() as ActiveRequestData;
    }
    return null;
}

// ============================================
// PROVIDER LOCATION BROADCASTING
// ============================================

/**
 * Phase 4 (audit-v2 §N-HIGH-3) — DEPRECATED.
 *
 * The legacy broadcast helpers wrote directly from the client to
 * RTDB `providerLocations/{providerId}`. The audit flagged this as
 * a forgeable surface: RTDB rules cannot query Firestore to check
 * `providers/{uid}.verificationStatus`, so an unverified provider
 * could spoof location updates. The companion fix in
 * `database.rules.json` locks the `providerLocations` branch to
 * server-only writes; the only legitimate online-flip path is now
 * the `setProviderAvailability` Cloud Function (and `updateLocation`
 * for streaming updates), both of which enforce the verification
 * gate before mutating state.
 *
 * Throwing here guarantees that any forgotten client call-site fails
 * loudly rather than silently getting permission-denied from the
 * RTDB rule and confusing the provider's UI.
 *
 * Skills: Deprecation-and-Migration (loud failure beats silent
 * permission-denied), Security-and-Hardening (defense in depth —
 * also blocked by the RTDB rule).
 *
 * @deprecated Use `services/provider.service.ts:setAvailability` and
 *             `services/provider.service.ts:updateLocation`.
 */
export async function startProviderBroadcast(
    _providerId: string,
    _location: GeoLocation,
    _serviceTypes: string[]
): Promise<void> {
    throw new Error(
        '[deprecated] realtime.service.ts:startProviderBroadcast removed. ' +
        'Call `setAvailability(true, location)` from ' +
        '`services/provider.service.ts` instead — the callable ' +
        'enforces the verification gate (audit-v2 §N-HIGH-3).'
    );
}

/**
 * Phase 4 (audit-v2 §N-HIGH-3) — DEPRECATED.
 * @deprecated Use `services/provider.service.ts:updateLocation`.
 */
export async function updateProviderBroadcast(
    _providerId: string,
    _location: GeoLocation
): Promise<void> {
    throw new Error(
        '[deprecated] realtime.service.ts:updateProviderBroadcast removed. ' +
        'Call `updateLocation(latitude, longitude)` from ' +
        '`services/provider.service.ts` instead.'
    );
}

/**
 * Phase 4 (audit-v2 §N-HIGH-3) — DEPRECATED.
 * @deprecated Use `services/provider.service.ts:setAvailability(false)`.
 */
export async function stopProviderBroadcast(_providerId: string): Promise<void> {
    throw new Error(
        '[deprecated] realtime.service.ts:stopProviderBroadcast removed. ' +
        'Call `setAvailability(false)` from ' +
        '`services/provider.service.ts` instead.'
    );
}

/**
 * Subscribe to all online providers (for admin/debugging)
 */
export function subscribeToOnlineProviders(
    callback: (providers: Record<string, any>) => void
): () => void {
    const providersRef = ref(rtdb, PATHS.PROVIDER_LOCATIONS);

    const unsubscribe = onValue(providersRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        } else {
            callback({});
        }
    });

    return () => off(providersRef);
}

// ============================================
// ETA CALCULATION UTILITIES
// ============================================

/**
 * Calculate ETA based on distance and average speed
 * @param distanceKm Distance in kilometers
 * @param avgSpeedKmh Average speed in km/h (default: 30 for urban Nairobi)
 * @returns ETA in seconds
 */
export function calculateETA(distanceKm: number, avgSpeedKmh: number = 30): number {
    const hours = distanceKm / avgSpeedKmh;
    return Math.round(hours * 3600); // Convert to seconds
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Format ETA for display
 */
export function formatETA(seconds: number): string {
    if (seconds < 60) {
        return 'Less than a minute';
    }

    const minutes = Math.round(seconds / 60);

    if (minutes < 60) {
        return `${minutes} min${minutes !== 1 ? 's' : ''}`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;

    if (remainingMins === 0) {
        return `${hours} hr${hours !== 1 ? 's' : ''}`;
    }

    return `${hours} hr ${remainingMins} min`;
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
}
