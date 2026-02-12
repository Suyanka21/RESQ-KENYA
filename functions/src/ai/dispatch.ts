/**
 * ResQ Kenya - AI Dispatch Cloud Functions
 * Phase 4: AI-Powered Provider Matching and Dispatch
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Define ServiceType locally to avoid cross-package imports
type ServiceType = 'towing' | 'tire' | 'battery' | 'fuel' | 'diagnostics' | 'ambulance';

const db = admin.firestore();

// ============================================
// Types
// ============================================

interface GeoLocation {
    latitude: number;
    longitude: number;
}

interface DispatchWeights {
    distance: number;
    rating: number;
    responseTime: number;
    completionRate: number;
    recentActivity: number;
}

interface ProviderScore {
    providerId: string;
    providerName: string;
    serviceTypes: ServiceType[];
    totalScore: number;
    factors: {
        distance: number;
        rating: number;
        responseTime: number;
        completionRate: number;
        recentActivity: number;
    };
    distanceKm: number;
    estimatedETA: number;
    isAvailable: boolean;
}

interface DispatchRequest {
    requestId: string;
    serviceType: ServiceType;
    customerLocation: GeoLocation;
    urgencyLevel: 'normal' | 'urgent' | 'emergency';
    preferredProviderId?: string;
    maxDistanceKm?: number;
    maxResults?: number;
    excludeProviders?: string[];
}

interface DispatchPrediction {
    requestId: string;
    recommendedProvider: ProviderScore;
    alternatives: ProviderScore[];
    confidence: number;
    confidenceLevel: 'low' | 'medium' | 'high' | 'very_high';
    predictedAcceptanceRate: number;
    predictedETA: number;
    modelVersion: string;
    timestamp: FirebaseFirestore.Timestamp;
}

// Default weights
const DEFAULT_DISPATCH_WEIGHTS: DispatchWeights = {
    distance: 0.30,
    rating: 0.25,
    responseTime: 0.20,
    completionRate: 0.15,
    recentActivity: 0.10,
};

// Nairobi zones for geofencing
const NAIROBI_ZONES = [
    { id: 'cbd', name: 'CBD', centerLat: -1.2864, centerLng: 36.8172, radiusKm: 2.5 },
    { id: 'westlands', name: 'Westlands', centerLat: -1.2674, centerLng: 36.8048, radiusKm: 3 },
    { id: 'kilimani', name: 'Kilimani', centerLat: -1.2921, centerLng: 36.7821, radiusKm: 3 },
    { id: 'upperhill', name: 'Upper Hill', centerLat: -1.2974, centerLng: 36.8167, radiusKm: 2 },
];

// ============================================
// Helper Functions
// ============================================

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

function estimateETA(distanceKm: number): number {
    // Assume 30 km/h average in Nairobi traffic
    const avgSpeedKmH = 30;
    return Math.ceil((distanceKm / avgSpeedKmH) * 60);
}

function calculateDistanceScore(distanceKm: number, maxDistanceKm: number = 15): number {
    if (distanceKm <= 0) return 100;
    if (distanceKm >= maxDistanceKm) return 0;
    return Math.round((1 - distanceKm / maxDistanceKm) * 100);
}

function calculateRatingScore(rating: number): number {
    if (rating < 0) return 0;
    if (rating > 5) return 100;
    return Math.round(rating * 20);
}

function calculateResponseTimeScore(avgResponseSeconds: number): number {
    if (avgResponseSeconds <= 30) return 100;
    if (avgResponseSeconds >= 300) return 0;
    return Math.round((1 - (avgResponseSeconds - 30) / 270) * 100);
}

function getConfidenceLevel(confidence: number): 'low' | 'medium' | 'high' | 'very_high' {
    if (confidence >= 0.9) return 'very_high';
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
}

function getServiceWeights(serviceType: ServiceType): DispatchWeights {
    switch (serviceType) {
        case 'ambulance':
            return {
                distance: 0.40,
                rating: 0.15,
                responseTime: 0.30,
                completionRate: 0.10,
                recentActivity: 0.05,
            };
        case 'towing':
            return {
                distance: 0.35,
                rating: 0.20,
                responseTime: 0.20,
                completionRate: 0.15,
                recentActivity: 0.10,
            };
        default:
            return DEFAULT_DISPATCH_WEIGHTS;
    }
}

// ============================================
// Cloud Functions
// ============================================

/**
 * Find optimal provider for a service request
 */
export const findOptimalProvider = functions.https.onCall(
    async (data: DispatchRequest, context) => {
        // Validate input
        if (!data.requestId || !data.serviceType || !data.customerLocation) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Missing required fields: requestId, serviceType, customerLocation'
            );
        }

        const { serviceType, customerLocation, urgencyLevel = 'normal' } = data;
        const maxDistanceKm = data.maxDistanceKm || (urgencyLevel === 'emergency' ? 25 : 15);
        const maxResults = data.maxResults || 5;
        const excludeSet = new Set(data.excludeProviders || []);

        try {
            // Query available providers
            const providersSnapshot = await db
                .collection('providers')
                .where('availability.isOnline', '==', true)
                .where('verificationStatus', '==', 'verified')
                .where('serviceTypes', 'array-contains', serviceType)
                .get();

            if (providersSnapshot.empty) {
                return {
                    success: false,
                    error: 'No available providers found',
                    data: null,
                };
            }

            // Get service-specific weights
            const weights = getServiceWeights(serviceType);

            // Calculate scores for each provider
            const scoredProviders: ProviderScore[] = [];

            for (const doc of providersSnapshot.docs) {
                const provider = doc.data();
                const providerId = doc.id;

                // Skip excluded providers
                if (excludeSet.has(providerId)) continue;

                // Check if provider has location
                const providerLocation = provider.availability?.currentLocation;
                if (!providerLocation) continue;

                // Calculate distance
                const distanceKm = calculateDistance(
                    customerLocation.latitude,
                    customerLocation.longitude,
                    providerLocation.latitude,
                    providerLocation.longitude
                );

                // Skip if too far
                if (distanceKm > maxDistanceKm) continue;

                // Get provider metrics (from stats subcollection or cached)
                const statsDoc = await db.collection('providers').doc(providerId)
                    .collection('stats').doc('current').get();
                const stats = statsDoc.exists ? statsDoc.data() : {};

                // Calculate scoring factors
                const factors = {
                    distance: calculateDistanceScore(distanceKm, maxDistanceKm),
                    rating: calculateRatingScore(provider.rating || 4.0),
                    responseTime: calculateResponseTimeScore(stats?.avgResponseSeconds || 60),
                    completionRate: Math.round(stats?.completionRate || 90),
                    recentActivity: Math.min(100, Math.round((stats?.jobsLast7Days || 7) * 100 / 14)),
                };

                // Calculate weighted total score
                const totalScore = Math.round(
                    factors.distance * weights.distance +
                    factors.rating * weights.rating +
                    factors.responseTime * weights.responseTime +
                    factors.completionRate * weights.completionRate +
                    factors.recentActivity * weights.recentActivity
                );

                scoredProviders.push({
                    providerId,
                    providerName: provider.displayName || 'Provider',
                    serviceTypes: provider.serviceTypes || [serviceType],
                    totalScore,
                    factors,
                    distanceKm,
                    estimatedETA: estimateETA(distanceKm),
                    isAvailable: true,
                });
            }

            if (scoredProviders.length === 0) {
                return {
                    success: false,
                    error: 'No providers within range',
                    data: null,
                };
            }

            // Sort by score descending
            scoredProviders.sort((a, b) => b.totalScore - a.totalScore);

            // Take top results
            const topProviders = scoredProviders.slice(0, maxResults);

            // Calculate confidence
            const topScore = topProviders[0].totalScore;
            const secondScore = topProviders.length > 1 ? topProviders[1].totalScore : 0;
            const scoreDiff = topScore - secondScore;
            const confidence = Math.min(1, 0.5 + (scoreDiff / 200));

            // Predict acceptance rate
            const predictedAcceptance = Math.min(0.95, 0.5 + (topProviders[0].factors.distance / 200));

            const prediction: DispatchPrediction = {
                requestId: data.requestId,
                recommendedProvider: topProviders[0],
                alternatives: topProviders.slice(1),
                confidence,
                confidenceLevel: getConfidenceLevel(confidence),
                predictedAcceptanceRate: predictedAcceptance,
                predictedETA: topProviders[0].estimatedETA,
                modelVersion: 'v1.0-heuristic',
                timestamp: admin.firestore.Timestamp.now(),
            };

            // Store prediction for training data
            await db.collection('dispatch_predictions').add({
                ...prediction,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return {
                success: true,
                data: prediction,
            };
        } catch (error) {
            console.error('Error finding optimal provider:', error);
            throw new functions.https.HttpsError('internal', 'Failed to find optimal provider');
        }
    }
);

/**
 * Record dispatch outcome for ML training
 */
export const recordDispatchOutcome = functions.https.onCall(
    async (data: {
        requestId: string;
        providerId: string;
        outcome: 'accepted' | 'declined' | 'timed_out' | 'reassigned' | 'cancelled';
        responseTimeSeconds: number;
        completionTimeMinutes?: number;
        customerRating?: number;
        tipAmount?: number;
    }, context) => {
        if (!data.requestId || !data.providerId || !data.outcome) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Missing required fields'
            );
        }

        try {
            // Get request details
            const requestDoc = await db.collection('requests').doc(data.requestId).get();
            if (!requestDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Request not found');
            }

            const request = requestDoc.data();

            // Get provider details
            const providerDoc = await db.collection('providers').doc(data.providerId).get();
            const provider = providerDoc.exists ? providerDoc.data() : {};

            const now = new Date();
            const hour = now.getHours();

            // Create training data record
            const trainingData = {
                requestId: data.requestId,
                serviceType: request?.serviceType,
                urgencyLevel: request?.urgencyLevel || 'normal',
                customerLocation: request?.customerLocation?.coordinates,
                timestamp: admin.firestore.Timestamp.now(),
                timeSlot: getTimeSlot(hour),
                dayOfWeek: now.getDay(),
                isWeekend: now.getDay() === 0 || now.getDay() === 6,

                providerId: data.providerId,
                providerRating: provider?.rating || 4.0,
                providerCompletionRate: provider?.completionRate || 90,

                outcome: data.outcome,
                responseTimeSeconds: data.responseTimeSeconds,
                wasCompletedSuccessfully: data.outcome === 'accepted' && data.completionTimeMinutes !== undefined,
                completionTimeMinutes: data.completionTimeMinutes,
                customerRating: data.customerRating,
                tipAmount: data.tipAmount,

                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            await db.collection('dispatch_training_data').add(trainingData);

            // Update provider stats
            if (data.outcome === 'accepted') {
                await updateProviderStats(data.providerId, {
                    responseTimeSeconds: data.responseTimeSeconds,
                    completionTimeMinutes: data.completionTimeMinutes,
                    customerRating: data.customerRating,
                    tipAmount: data.tipAmount,
                });
            }

            return { success: true };
        } catch (error) {
            console.error('Error recording dispatch outcome:', error);
            throw new functions.https.HttpsError('internal', 'Failed to record outcome');
        }
    }
);

function getTimeSlot(hour: number): string {
    if (hour >= 5 && hour < 8) return 'early_morning';
    if (hour >= 8 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
}

async function updateProviderStats(
    providerId: string,
    data: {
        responseTimeSeconds: number;
        completionTimeMinutes?: number;
        customerRating?: number;
        tipAmount?: number;
    }
): Promise<void> {
    const statsRef = db.collection('providers').doc(providerId)
        .collection('stats').doc('current');

    await db.runTransaction(async (transaction) => {
        const statsDoc = await transaction.get(statsRef);
        const current = statsDoc.exists ? statsDoc.data() : {
            totalJobs: 0,
            avgResponseSeconds: 60,
            avgCompletionMinutes: 25,
            avgRating: 4.0,
            totalTips: 0,
            jobsLast7Days: 0,
        };

        const newTotalJobs = (current?.totalJobs || 0) + 1;
        const newAvgResponse = ((current?.avgResponseSeconds || 60) * (current?.totalJobs || 0) + data.responseTimeSeconds) / newTotalJobs;
        const newAvgCompletion = data.completionTimeMinutes
            ? ((current?.avgCompletionMinutes || 25) * (current?.totalJobs || 0) + data.completionTimeMinutes) / newTotalJobs
            : current?.avgCompletionMinutes;
        const newAvgRating = data.customerRating
            ? ((current?.avgRating || 4.0) * (current?.totalJobs || 0) + data.customerRating) / newTotalJobs
            : current?.avgRating;

        transaction.set(statsRef, {
            totalJobs: newTotalJobs,
            avgResponseSeconds: Math.round(newAvgResponse),
            avgCompletionMinutes: Math.round(newAvgCompletion || 25),
            avgRating: Math.round(newAvgRating * 10) / 10,
            totalTips: (current?.totalTips || 0) + (data.tipAmount || 0),
            jobsLast7Days: (current?.jobsLast7Days || 0) + 1,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    });
}

/**
 * Get model performance metrics
 */
export const getDispatchMetrics = functions.https.onCall(
    async (data: { period?: 'day' | 'week' | 'month' }, context) => {
        const period = data?.period || 'week';

        // Calculate time range
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'day':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        try {
            // Query training data
            const trainingSnapshot = await db
                .collection('dispatch_training_data')
                .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
                .get();

            let totalPredictions = 0;
            let correctPredictions = 0;
            let totalResponseTime = 0;
            let totalCompletionTime = 0;
            let totalRating = 0;
            let completedJobs = 0;

            trainingSnapshot.forEach(doc => {
                const data = doc.data();
                totalPredictions++;

                if (data.outcome === 'accepted') {
                    correctPredictions++;
                    totalResponseTime += data.responseTimeSeconds || 0;
                    completedJobs++;

                    if (data.completionTimeMinutes) {
                        totalCompletionTime += data.completionTimeMinutes;
                    }
                    if (data.customerRating) {
                        totalRating += data.customerRating;
                    }
                }
            });

            return {
                success: true,
                data: {
                    period,
                    totalPredictions,
                    accuracyRate: totalPredictions > 0 ? correctPredictions / totalPredictions : 0,
                    avgResponseTime: completedJobs > 0 ? Math.round(totalResponseTime / completedJobs) : 0,
                    avgCompletionTime: completedJobs > 0 ? Math.round(totalCompletionTime / completedJobs) : 0,
                    avgCustomerRating: completedJobs > 0 ? Math.round((totalRating / completedJobs) * 10) / 10 : 0,
                    lastUpdated: admin.firestore.Timestamp.now(),
                },
            };
        } catch (error) {
            console.error('Error getting dispatch metrics:', error);
            throw new functions.https.HttpsError('internal', 'Failed to get metrics');
        }
    }
);
