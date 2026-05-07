// ResQ Kenya - Firestore Database Service
// Handles all Firestore operations for users, providers, and service requests

import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
    GeoPoint,
    onSnapshot,
    DocumentReference
} from 'firebase/firestore';
import * as geofire from 'geofire-common';
import { db } from '../config/firebase';
import type { User, Provider, ServiceRequest, Vehicle, EmergencyContact, SavedLocation } from '../types';

// Collection names
export const COLLECTIONS = {
    USERS: 'users',
    PROVIDERS: 'providers',
    REQUESTS: 'requests',
} as const;

// ============================================
// USER OPERATIONS
// ============================================

/**
 * Create or update user profile
 */
export async function createUser(userId: string, userData: Partial<User>): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await setDoc(userRef, {
        ...userData,
        id: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<User | null> {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() } as User;
    }
    return null;
}

/**
 * Update user profile
 */
export async function updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Add vehicle to user profile
 */
export async function addVehicle(userId: string, vehicle: Vehicle): Promise<void> {
    const user = await getUser(userId);
    if (!user) throw new Error('User not found');

    const vehicles = user.vehicles || [];

    // If this is the first vehicle or marked as primary, update others
    if (vehicle.isPrimary) {
        vehicles.forEach(v => v.isPrimary = false);
    }

    vehicles.push(vehicle);
    await updateUser(userId, { vehicles });
}

/**
 * Add emergency contact
 */
export async function addEmergencyContact(userId: string, contact: EmergencyContact): Promise<void> {
    const user = await getUser(userId);
    if (!user) throw new Error('User not found');

    const contacts = user.emergencyContacts || [];
    contacts.push(contact);
    await updateUser(userId, { emergencyContacts: contacts });
}

/**
 * Add saved location
 */
export async function addSavedLocation(userId: string, location: SavedLocation): Promise<void> {
    const user = await getUser(userId);
    if (!user) throw new Error('User not found');

    const locations = user.savedLocations || [];
    locations.push(location);
    await updateUser(userId, { savedLocations: locations });
}

// ============================================
// PROVIDER OPERATIONS
// ============================================

/**
 * Get provider by ID
 */
export async function getProvider(providerId: string): Promise<Provider | null> {
    const providerRef = doc(db, COLLECTIONS.PROVIDERS, providerId);
    const providerSnap = await getDoc(providerRef);

    if (providerSnap.exists()) {
        return { id: providerSnap.id, ...providerSnap.data() } as Provider;
    }
    return null;
}

/**
 * Phase 3 (B-HIGH-7) — DEPRECATED.
 *
 * This client-side shim wrote `providers/{uid}` directly, bypassing
 * the verification gate enforced by the `setProviderAvailability`
 * Cloud Function. Real callers must use
 * `services/provider.service.ts:updateLocation` /
 * `setAvailability` (callables).
 *
 * Throwing at runtime guarantees any forgotten call-site fails
 * loudly rather than silently corrupting state. The Firestore rules
 * tightening in Phase 3.5 also blocks the legacy direct write.
 *
 * @deprecated Use `provider.service.ts:updateLocation` /
 *             `setAvailability` instead.
 */
export async function updateProviderLocation(
    _providerId: string,
    _latitude: number,
    _longitude: number,
    _isOnline: boolean = true
): Promise<void> {
    throw new Error(
        '[deprecated] firestore.service.ts:updateProviderLocation removed. ' +
        'Call `updateLocation` / `setAvailability` from ' +
        '`services/provider.service.ts` (callable) so the verification ' +
        'gate and atomic RTDB mirror are enforced server-side.'
    );
}

/**
 * Find nearest providers within radius using geohash
 */
export async function findNearestProviders(
    serviceType: string,
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    maxResults: number = 5
): Promise<(Provider & { distance: number })[]> {
    // Generate geohash bounds for the search area
    const center = [latitude, longitude] as [number, number];
    const radiusM = radiusKm * 1000;
    const bounds = geofire.geohashQueryBounds(center, radiusM);

    const providers: (Provider & { distance: number })[] = [];

    // Query each geohash bound
    for (const bound of bounds) {
        const q = query(
            collection(db, COLLECTIONS.PROVIDERS),
            where('serviceTypes', 'array-contains', serviceType),
            where('availability.isOnline', '==', true),
            where('verificationStatus', '==', 'verified'),
            orderBy('geohash'),
            where('geohash', '>=', bound[0]),
            where('geohash', '<=', bound[1])
        );

        const snapshot = await getDocs(q);

        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            const providerLocation = data.availability?.currentLocation;

            if (providerLocation) {
                // Calculate actual distance
                const distance = geofire.distanceBetween(
                    center,
                    [providerLocation.latitude, providerLocation.longitude]
                );

                // Only include if within actual radius
                if (distance <= radiusKm) {
                    providers.push({
                        id: docSnap.id,
                        ...data,
                        distance: Math.round(distance * 10) / 10, // Round to 1 decimal
                    } as Provider & { distance: number });
                }
            }
        });
    }

    // Sort by distance and return top results
    providers.sort((a, b) => a.distance - b.distance);
    return providers.slice(0, maxResults);
}

/**
 * Get online providers count by service type
 */
export async function getOnlineProviderCount(serviceType?: string): Promise<number> {
    let q = query(
        collection(db, COLLECTIONS.PROVIDERS),
        where('availability.isOnline', '==', true),
        where('verificationStatus', '==', 'verified')
    );

    if (serviceType) {
        q = query(q, where('serviceTypes', 'array-contains', serviceType));
    }

    const snapshot = await getDocs(q);
    return snapshot.size;
}

// ============================================
// SERVICE REQUEST OPERATIONS
// ============================================

/**
 * Phase 3 (B-CRIT-3) — DEPRECATED.
 *
 * Direct-write shim that created `requests/{id}` from the client. It
 * bypassed the canonical `createServiceRequest` Cloud Function and
 * therefore the idempotency, price-quote, and serviceType validation.
 * Phase 3 escalates the previous one-time `console.warn` to a runtime
 * throw so any forgotten call-site fails loudly. The Phase 3.5
 * Firestore rules also block the legacy direct write.
 *
 * @deprecated Use
 *             `services/customer.service.ts:createServiceRequest`,
 *             which routes through the canonical callable.
 */
export async function createServiceRequest(
    _requestData: Omit<ServiceRequest, 'id' | 'timeline'>
): Promise<string> {
    throw new Error(
        '[deprecated] firestore.service.ts:createServiceRequest removed. ' +
        'Call `createServiceRequest` from `services/customer.service.ts` ' +
        '(calls the canonical Cloud Function) so idempotency + quote + ' +
        'authorization are enforced server-side.'
    );
}

/**
 * Get service request by ID
 */
export async function getServiceRequest(requestId: string): Promise<ServiceRequest | null> {
    const requestRef = doc(db, COLLECTIONS.REQUESTS, requestId);
    const requestSnap = await getDoc(requestRef);

    if (requestSnap.exists()) {
        return { id: requestSnap.id, ...requestSnap.data() } as ServiceRequest;
    }
    return null;
}

/**
 * Phase 3 (B-HIGH-2) — DEPRECATED.
 *
 * This client-side shim wrote `requests/{id}.status` directly,
 * bypassing the canonical `updateRequestStatus` Cloud Function and
 * its `VALID_STATUS_TRANSITIONS` graph. Real callers must use
 * `services/provider.service.ts:updateRequestStatus` (callable) or
 * `services/customer.service.ts:cancelServiceRequest` (also a
 * callable) so server-authoritative state-machine rules are
 * enforced.
 *
 * Throwing at runtime guarantees any forgotten call-site fails
 * loudly rather than silently corrupting state. The Firestore rules
 * tightening in Phase 3.5 makes the legacy direct write impossible
 * anyway; this guard catches the bug before the server rejects it.
 *
 * Skills: API-and-Interface-Design (deprecate clearly, fail
 * loudly), Code-Review-and-Quality.
 *
 * @deprecated Use `provider.service.ts:updateRequestStatus`
 *             (callable) instead. Will be removed in a follow-up
 *             cleanup PR once all consumers migrate.
 */
export async function updateRequestStatus(
    _requestId: string,
    _status: ServiceRequest['status'],
    _additionalUpdates?: Partial<ServiceRequest>
): Promise<void> {
    throw new Error(
        '[deprecated] firestore.service.ts:updateRequestStatus removed. ' +
        'Call `updateRequestStatus` from `services/provider.service.ts` ' +
        '(or `cancelServiceRequest` from `services/customer.service.ts`) ' +
        'so the server-side VALID_STATUS_TRANSITIONS graph is enforced.'
    );
}

/**
 * @deprecated Used the deprecated `updateRequestStatus` shim above;
 * removed for the same reason. Provider acceptance flows through
 * the `acceptServiceRequest` Cloud Function only (see
 * `services/provider.service.ts:acceptRequest`).
 */
export async function assignProviderToRequest(
    _requestId: string,
    _providerId: string
): Promise<void> {
    throw new Error(
        '[deprecated] firestore.service.ts:assignProviderToRequest removed. ' +
        'Call `acceptRequest` from `services/provider.service.ts` instead.'
    );
}

/**
 * Get user's request history
 */
export async function getUserRequests(
    userId: string,
    limitCount: number = 20
): Promise<ServiceRequest[]> {
    const q = query(
        collection(db, COLLECTIONS.REQUESTS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest));
}

/**
 * Get provider's assigned requests
 */
export async function getProviderRequests(
    providerId: string,
    status?: ServiceRequest['status']
): Promise<ServiceRequest[]> {
    let q = query(
        collection(db, COLLECTIONS.REQUESTS),
        where('providerId', '==', providerId),
        orderBy('createdAt', 'desc'),
        limit(50)
    );

    if (status) {
        q = query(q, where('status', '==', status));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest));
}

/**
 * Get pending requests near provider (for matching)
 */
export async function getPendingRequestsNearby(
    latitude: number,
    longitude: number,
    serviceTypes: string[],
    radiusKm: number = 15
): Promise<ServiceRequest[]> {
    const center = [latitude, longitude] as [number, number];
    const radiusM = radiusKm * 1000;
    const bounds = geofire.geohashQueryBounds(center, radiusM);

    const requests: ServiceRequest[] = [];

    for (const bound of bounds) {
        const q = query(
            collection(db, COLLECTIONS.REQUESTS),
            where('status', '==', 'pending'),
            orderBy('geohash'),
            where('geohash', '>=', bound[0]),
            where('geohash', '<=', bound[1])
        );

        const snapshot = await getDocs(q);

        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            const requestLocation = data.customerLocation?.coordinates;

            if (requestLocation && serviceTypes.includes(data.serviceType)) {
                const distance = geofire.distanceBetween(
                    center,
                    [requestLocation.latitude, requestLocation.longitude]
                );

                if (distance <= radiusKm) {
                    requests.push({ id: docSnap.id, ...data } as ServiceRequest);
                }
            }
        });
    }

    return requests;
}

/**
 * Subscribe to request updates (real-time)
 */
export function subscribeToRequest(
    requestId: string,
    callback: (request: ServiceRequest | null) => void
): () => void {
    const requestRef = doc(db, COLLECTIONS.REQUESTS, requestId);

    return onSnapshot(requestRef, (snapshot) => {
        if (snapshot.exists()) {
            callback({ id: snapshot.id, ...snapshot.data() } as ServiceRequest);
        } else {
            callback(null);
        }
    });
}

/**
 * Add rating to completed request
 */
export async function addRequestRating(
    requestId: string,
    rating: { stars: number; review?: string; tags?: string[] }
): Promise<void> {
    const requestRef = doc(db, COLLECTIONS.REQUESTS, requestId);
    await updateDoc(requestRef, { rating });

    // Update provider's average rating
    const request = await getServiceRequest(requestId);
    if (request?.providerId) {
        await updateProviderRating(request.providerId);
    }
}

/**
 * Recalculate provider's average rating
 */
async function updateProviderRating(providerId: string): Promise<void> {
    const q = query(
        collection(db, COLLECTIONS.REQUESTS),
        where('providerId', '==', providerId),
        where('status', '==', 'completed')
    );

    const snapshot = await getDocs(q);

    let totalRating = 0;
    let ratedCount = 0;

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.rating?.stars) {
            totalRating += data.rating.stars;
            ratedCount++;
        }
    });

    const avgRating = ratedCount > 0 ? totalRating / ratedCount : 0;

    const providerRef = doc(db, COLLECTIONS.PROVIDERS, providerId);
    await updateDoc(providerRef, {
        rating: Math.round(avgRating * 10) / 10,
        totalServices: snapshot.size,
    });
}
