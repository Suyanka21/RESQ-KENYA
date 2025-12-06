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
    providerLocation: GeoLocation;
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
        location: GeoLocation;
        eta: number;
        distance: number;
        status: string;
    } | null) => void
): () => void {
    const requestRef = ref(rtdb, `${PATHS.ACTIVE_REQUESTS}/${requestId}`);

    const unsubscribe = onValue(requestRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val() as ActiveRequestData;
            callback({
                location: data.providerLocation,
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
 * Start provider location broadcasting
 * Called when provider goes online
 */
export async function startProviderBroadcast(
    providerId: string,
    location: GeoLocation,
    serviceTypes: string[]
): Promise<void> {
    const providerRef = ref(rtdb, `${PATHS.PROVIDER_LOCATIONS}/${providerId}`);

    await set(providerRef, {
        location: {
            ...location,
            timestamp: Date.now(),
        },
        serviceTypes,
        isOnline: true,
        lastSeen: Date.now(),
    });
}

/**
 * Update provider broadcast location
 */
export async function updateProviderBroadcast(
    providerId: string,
    location: GeoLocation
): Promise<void> {
    const providerRef = ref(rtdb, `${PATHS.PROVIDER_LOCATIONS}/${providerId}`);

    await update(providerRef, {
        location: {
            ...location,
            timestamp: Date.now(),
        },
        lastSeen: Date.now(),
    });
}

/**
 * Stop provider location broadcasting
 * Called when provider goes offline
 */
export async function stopProviderBroadcast(providerId: string): Promise<void> {
    const providerRef = ref(rtdb, `${PATHS.PROVIDER_LOCATIONS}/${providerId}`);
    await remove(providerRef);
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
