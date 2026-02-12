// ResQ Kenya - Customer Service (Cloud Functions Integration)
// Handles customer-side operations via Firebase Cloud Functions

import { httpsCallable, getFunctions } from 'firebase/functions';
import { doc, onSnapshot, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import app from '../config/firebase';
import type { ServiceRequest, GeoLocation } from '../types';

// Initialize Firebase Functions
const functions = getFunctions(app, 'us-central1');

// Demo mode flag - set to true to use simulations instead of real API
const USE_DEMO_MODE = true;

/**
 * Create a service request (calls Cloud Function)
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
    pricing?: {
        baseServiceFee: number;
        distanceFee?: number;
        additionalCharges?: number;
        platformFee?: number;
        total: number;
    };
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

    try {
        const createRequest = httpsCallable(functions, 'createServiceRequest');
        const result = await createRequest(data);
        return result.data as { success: boolean; requestId?: string };
    } catch (error: any) {
        console.error('Create request error:', error);
        return { success: false, error: error.message };
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
 * Toggle demo mode (for testing)
 */
export function setDemoMode(enabled: boolean): void {
    // Note: In TypeScript, we can't modify const. In production, use env variable
    console.log(`Demo mode: ${enabled ? 'enabled' : 'disabled'}`);
}
