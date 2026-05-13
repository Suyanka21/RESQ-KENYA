// ResQ Kenya - Provider Service (Cloud Functions Integration)
// Handles provider-side operations via Firebase Cloud Functions

import { httpsCallable, getFunctions } from 'firebase/functions';
import { doc, onSnapshot, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import app from '../config/firebase';
import type { ServiceRequest, GeoLocation } from '../types';

// Initialize Firebase Functions
const functions = getFunctions(app, 'us-central1');

/**
 * Update provider location (calls Cloud Function)
 */
export async function updateLocation(
    latitude: number,
    longitude: number,
    heading?: number,
    speed?: number
): Promise<{ success: boolean }> {
    try {
        const updateProviderLocation = httpsCallable(functions, 'updateProviderLocation');
        const result = await updateProviderLocation({ latitude, longitude, heading, speed });
        return result.data as { success: boolean };
    } catch (error) {
        console.error('Update location error:', error);
        return { success: false };
    }
}

/**
 * Set provider online/offline status
 */
export async function setAvailability(
    isOnline: boolean,
    location?: GeoLocation
): Promise<{ success: boolean; isOnline: boolean }> {
    try {
        const setProviderAvailability = httpsCallable(functions, 'setProviderAvailability');
        const result = await setProviderAvailability({
            isOnline,
            latitude: location?.latitude,
            longitude: location?.longitude,
        });
        return result.data as { success: boolean; isOnline: boolean };
    } catch (error) {
        console.error('Set availability error:', error);
        return { success: false, isOnline: false };
    }
}

/**
 * Accept a service request
 */
export async function acceptRequest(requestId: string): Promise<{ success: boolean }> {
    try {
        const acceptServiceRequest = httpsCallable(functions, 'acceptServiceRequest');
        const result = await acceptServiceRequest({ requestId });
        return result.data as { success: boolean };
    } catch (error: any) {
        console.error('Accept request error:', error);
        return { success: false };
    }
}

/**
 * Update request status (enroute, arrived, inProgress, completed)
 */
export async function updateRequestStatus(
    requestId: string,
    status: 'accepted' | 'enroute' | 'arrived' | 'inProgress' | 'completed' | 'cancelled'
): Promise<{ success: boolean }> {
    try {
        const updateStatus = httpsCallable(functions, 'updateRequestStatus');
        const result = await updateStatus({ requestId, status });
        return result.data as { success: boolean };
    } catch (error) {
        console.error('Update status error:', error);
        return { success: false };
    }
}

/**
 * Get pending requests near provider's location
 */
export async function getNearbyRequests(
    latitude: number,
    longitude: number,
    serviceTypes: string[],
    radiusKm: number = 15
): Promise<ServiceRequest[]> {
    try {
        // Import from firestore service
        const { getPendingRequestsNearby } = await import('./firestore.service');
        return await getPendingRequestsNearby(latitude, longitude, serviceTypes, radiusKm);
    } catch (error) {
        console.error('Get nearby requests error:', error);
        return [];
    }
}

/**
 * Subscribe to a specific request for real-time updates
 */
export function subscribeToRequest(
    requestId: string,
    callback: (request: ServiceRequest | null) => void
): () => void {
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
 * Subscribe to new nearby pending requests
 */
export function subscribeToNearbyRequests(
    serviceTypes: string[],
    callback: (requests: ServiceRequest[]) => void
): () => void {
    // Subscribe to pending requests matching provider's service types
    const q = query(
        collection(db, 'requests'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(20)
    );

    return onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest))
            .filter(req => serviceTypes.includes(req.serviceType));
        callback(requests);
    });
}

/**
 * Get provider's request history
 */
export async function getRequestHistory(
    providerId: string,
    limitCount: number = 20
): Promise<ServiceRequest[]> {
    try {
        const q = query(
            collection(db, 'requests'),
            where('providerId', '==', providerId),
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
 * Get provider's earnings summary.
 *
 * Phase 4 (audit-v3 §MOCK-SWEEP) — previously returned the literal
 * 7500 / 35000 / 125000 / 850000 placeholder regardless of the
 * provider's real activity. The replacement queries the canonical
 * `transactions` collection (status === 'completed', providerId
 * matches) and rolls up the provider share into today / week /
 * month / allTime buckets so a fresh provider sees zeros and an
 * active provider sees the truth.
 */
export async function getEarningsSummary(providerId: string): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    allTime: number;
}> {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfDay.getTime() - startOfDay.getDay() * 86400000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const q = query(
            collection(db, 'transactions'),
            where('providerId', '==', providerId),
            where('type', '==', 'service_payment'),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);

        let today = 0, thisWeek = 0, thisMonth = 0, allTime = 0;
        for (const docSnap of snapshot.docs) {
            const tx = docSnap.data() as any;
            if (tx.status !== 'completed') continue;
            const providerAmount = tx.breakdown?.providerShare ?? (tx.amount * 0.75);
            const txDate = tx.createdAt instanceof Date
                ? tx.createdAt
                : tx.createdAt?.toDate?.() ?? null;
            if (!txDate) continue;
            allTime += providerAmount;
            if (txDate >= startOfMonth) thisMonth += providerAmount;
            if (txDate >= startOfWeek) thisWeek += providerAmount;
            if (txDate >= startOfDay) today += providerAmount;
        }
        return { today, thisWeek, thisMonth, allTime };
    } catch (error) {
        console.error('[provider.service] getEarningsSummary failed:', error);
        return { today: 0, thisWeek: 0, thisMonth: 0, allTime: 0 };
    }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
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
    return Math.round(R * c * 10) / 10; // Round to 1 decimal
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Estimate ETA based on distance (simple formula)
 */
export function estimateETA(distanceKm: number): number {
    // Assume average speed of 30 km/h in Nairobi traffic
    const avgSpeedKmh = 30;
    return Math.ceil((distanceKm / avgSpeedKmh) * 60); // Return minutes
}
