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
 * Update provider availability and location
 */
export async function updateProviderLocation(
    providerId: string,
    latitude: number,
    longitude: number,
    isOnline: boolean = true
): Promise<void> {
    const providerRef = doc(db, COLLECTIONS.PROVIDERS, providerId);

    // Generate geohash for efficient geo queries
    const geohash = geofire.geohashForLocation([latitude, longitude]);

    await updateDoc(providerRef, {
        'availability.isOnline': isOnline,
        'availability.currentLocation': { latitude, longitude },
        'availability.lastUpdated': serverTimestamp(),
        geohash,
    });
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
 * Create a new service request
 */
export async function createServiceRequest(
    requestData: Omit<ServiceRequest, 'id' | 'timeline'>
): Promise<string> {
    const requestRef = doc(collection(db, COLLECTIONS.REQUESTS));

    // Generate geohash for customer location
    const { latitude, longitude } = requestData.customerLocation.coordinates;
    const geohash = geofire.geohashForLocation([latitude, longitude]);

    await setDoc(requestRef, {
        ...requestData,
        id: requestRef.id,
        status: 'pending',
        geohash,
        timeline: {
            requestedAt: serverTimestamp(),
        },
        createdAt: serverTimestamp(),
    });

    return requestRef.id;
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
 * Update service request status
 */
export async function updateRequestStatus(
    requestId: string,
    status: ServiceRequest['status'],
    additionalUpdates?: Partial<ServiceRequest>
): Promise<void> {
    const requestRef = doc(db, COLLECTIONS.REQUESTS, requestId);

    const updates: Record<string, any> = {
        status,
        updatedAt: serverTimestamp(),
    };

    // Update timeline based on status
    switch (status) {
        case 'accepted':
            updates['timeline.acceptedAt'] = serverTimestamp();
            break;
        case 'arrived':
            updates['timeline.arrivedAt'] = serverTimestamp();
            break;
        case 'completed':
            updates['timeline.completedAt'] = serverTimestamp();
            break;
    }

    if (additionalUpdates) {
        Object.assign(updates, additionalUpdates);
    }

    await updateDoc(requestRef, updates);
}

/**
 * Assign provider to request
 */
export async function assignProviderToRequest(
    requestId: string,
    providerId: string
): Promise<void> {
    await updateRequestStatus(requestId, 'accepted', { providerId });
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
