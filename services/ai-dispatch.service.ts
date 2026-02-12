// ResQ Kenya - AI Dispatch Service
// Phase 4: AI-Powered Provider Matching and Dispatch Optimization

import { httpsCallable, getFunctions } from 'firebase/functions';
import { collection, query, where, getDocs, doc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import app from '../config/firebase';
import type { Provider, ServiceRequest, GeoLocation } from '../types';
import {
    DEFAULT_DISPATCH_WEIGHTS,
    getZoneFromCoordinates,
    getTimeSlot,
    validateDispatchRequest,
    type DispatchWeights,
    type ProviderScore,
    type ProviderScoreFactors,
    type DispatchPrediction,
    type DispatchRequest,
    type DispatchTrainingData,
    type DispatchOutcome,
    type ModelMetrics,
    type ConfidenceLevel,
    getConfidenceLevel,
} from '../types/ai-dispatch';
import { calculateDistance, estimateETA } from './provider.service';

// Initialize Firebase Functions
const functions = getFunctions(app, 'us-central1');

// ============================================
// Provider Scoring Functions
// ============================================

/**
 * Calculate distance score (closer = higher score)
 * Uses inverse linear scaling: 100 at 0km, 0 at maxDistanceKm
 */
export function calculateDistanceScore(distanceKm: number, maxDistanceKm: number = 15): number {
    if (distanceKm <= 0) return 100;
    if (distanceKm >= maxDistanceKm) return 0;
    return Math.round((1 - distanceKm / maxDistanceKm) * 100);
}

/**
 * Calculate rating score (converts 5-star rating to 0-100)
 */
export function calculateRatingScore(rating: number): number {
    if (rating < 0) return 0;
    if (rating > 5) return 100;
    return Math.round(rating * 20);
}

/**
 * Calculate response time score (faster = higher)
 * Based on historical avg response time in seconds
 */
export function calculateResponseTimeScore(avgResponseSeconds: number): number {
    // Optimal: < 30 seconds = 100
    // Poor: > 300 seconds (5 min) = 0
    if (avgResponseSeconds <= 30) return 100;
    if (avgResponseSeconds >= 300) return 0;
    return Math.round((1 - (avgResponseSeconds - 30) / 270) * 100);
}

/**
 * Calculate completion rate score (percentage to 0-100)
 */
export function calculateCompletionRateScore(completionRate: number): number {
    return Math.round(Math.max(0, Math.min(100, completionRate)));
}

/**
 * Calculate recent activity score
 * Based on jobs in last 7 days, normalized against expected
 */
export function calculateRecentActivityScore(jobsLast7Days: number, expectedJobs: number = 14): number {
    if (expectedJobs <= 0) return 50;
    const ratio = jobsLast7Days / expectedJobs;
    return Math.round(Math.min(100, ratio * 100));
}

/**
 * Calculate all scoring factors for a provider
 */
export function calculateProviderScoreFactors(
    provider: Provider,
    customerLocation: GeoLocation,
    providerMetrics?: {
        avgResponseSeconds?: number;
        completionRate?: number;
        jobsLast7Days?: number;
    }
): ProviderScoreFactors {
    // Calculate distance
    const providerLocation = provider.availability?.currentLocation;
    const distanceKm = providerLocation
        ? calculateDistance(
            customerLocation.latitude,
            customerLocation.longitude,
            providerLocation.latitude,
            providerLocation.longitude
        )
        : 15; // Max distance if no location

    return {
        distance: calculateDistanceScore(distanceKm),
        rating: calculateRatingScore(provider.rating || 4.0),
        responseTime: calculateResponseTimeScore(providerMetrics?.avgResponseSeconds || 60),
        completionRate: calculateCompletionRateScore(providerMetrics?.completionRate || 90),
        recentActivity: calculateRecentActivityScore(providerMetrics?.jobsLast7Days || 7),
    };
}

/**
 * Calculate weighted total score for a provider
 */
export function calculateWeightedScore(
    factors: ProviderScoreFactors,
    weights: DispatchWeights = DEFAULT_DISPATCH_WEIGHTS
): number {
    return Math.round(
        factors.distance * weights.distance +
        factors.rating * weights.rating +
        factors.responseTime * weights.responseTime +
        factors.completionRate * weights.completionRate +
        factors.recentActivity * weights.recentActivity
    );
}

/**
 * Calculate complete provider score
 */
export function calculateProviderScore(
    provider: Provider,
    customerLocation: GeoLocation,
    weights: DispatchWeights = DEFAULT_DISPATCH_WEIGHTS,
    providerMetrics?: {
        avgResponseSeconds?: number;
        completionRate?: number;
        jobsLast7Days?: number;
    }
): ProviderScore {
    const factors = calculateProviderScoreFactors(provider, customerLocation, providerMetrics);
    const totalScore = calculateWeightedScore(factors, weights);

    const providerLocation = provider.availability?.currentLocation;
    const distanceKm = providerLocation
        ? calculateDistance(
            customerLocation.latitude,
            customerLocation.longitude,
            providerLocation.latitude,
            providerLocation.longitude
        )
        : 15;

    return {
        providerId: provider.id,
        providerName: provider.displayName,
        serviceTypes: provider.serviceTypes,
        totalScore,
        factors,
        weights,
        distanceKm,
        estimatedETA: estimateETA(distanceKm),
        isAvailable: provider.availability?.isOnline ?? false,
        currentLocation: providerLocation,
    };
}

// ============================================
// Dispatch Prediction Functions
// ============================================

/**
 * Find optimal provider for a service request
 */
export async function findOptimalProvider(
    request: DispatchRequest,
    weights: DispatchWeights = DEFAULT_DISPATCH_WEIGHTS
): Promise<DispatchPrediction | null> {
    // Validate request
    const validation = validateDispatchRequest(request);
    if (!validation.valid) {
        console.error('Invalid dispatch request:', validation.errors);
        return null;
    }

    try {
        // Query available providers
        const providersQuery = query(
            collection(db, 'providers'),
            where('availability.isOnline', '==', true),
            where('verificationStatus', '==', 'verified'),
            where('serviceTypes', 'array-contains', request.serviceType)
        );

        const snapshot = await getDocs(providersQuery);
        const providers: Provider[] = [];

        snapshot.forEach(doc => {
            providers.push({ id: doc.id, ...doc.data() } as Provider);
        });

        if (providers.length === 0) {
            return null;
        }

        // Filter by distance and exclusions
        const maxDistance = request.maxDistanceKm || 15;
        const excludeSet = new Set(request.excludeProviders || []);

        const eligibleProviders = providers.filter(p => {
            if (excludeSet.has(p.id)) return false;

            const location = p.availability?.currentLocation;
            if (!location) return false;

            const distance = calculateDistance(
                request.customerLocation.latitude,
                request.customerLocation.longitude,
                location.latitude,
                location.longitude
            );

            return distance <= maxDistance;
        });

        if (eligibleProviders.length === 0) {
            return null;
        }

        // Score all providers
        const scoredProviders = eligibleProviders.map(p =>
            calculateProviderScore(p, request.customerLocation, weights)
        );

        // Sort by score descending
        scoredProviders.sort((a, b) => b.totalScore - a.totalScore);

        // Take top N results
        const maxResults = request.maxResults || 5;
        const topProviders = scoredProviders.slice(0, maxResults);

        // Calculate confidence based on score distribution
        const topScore = topProviders[0].totalScore;
        const secondScore = topProviders.length > 1 ? topProviders[1].totalScore : 0;
        const scoreDiff = topScore - secondScore;

        // Higher confidence when clear winner (large score gap)
        const confidence = Math.min(1, 0.5 + (scoreDiff / 200));

        // Predict acceptance based on provider's historical acceptance rate
        // For now, use a simple heuristic based on distance and rating
        const predictedAcceptance = Math.min(0.95, 0.5 + (topProviders[0].factors.distance / 200));

        return {
            requestId: request.requestId,
            recommendedProvider: topProviders[0],
            alternatives: topProviders.slice(1),
            confidence,
            confidenceLevel: getConfidenceLevel(confidence),
            predictedAcceptanceRate: predictedAcceptance,
            predictedETA: topProviders[0].estimatedETA,
            modelVersion: 'v1.0-heuristic',
            timestamp: new Date(),
        };
    } catch (error) {
        console.error('Error finding optimal provider:', error);
        return null;
    }
}

/**
 * Find optimal provider using Cloud Function
 */
export async function findOptimalProviderRemote(
    request: DispatchRequest
): Promise<DispatchPrediction | null> {
    try {
        const findOptimal = httpsCallable(functions, 'findOptimalProvider');
        const result = await findOptimal(request);
        return result.data as DispatchPrediction;
    } catch (error) {
        console.error('Remote findOptimalProvider error:', error);
        // Fallback to local calculation
        return findOptimalProvider(request);
    }
}

// ============================================
// Training Data Collection
// ============================================

/**
 * Record dispatch outcome for training
 */
export async function recordDispatchOutcome(
    requestId: string,
    providerId: string,
    outcome: DispatchOutcome,
    responseTimeSeconds: number,
    completionTimeMinutes?: number,
    customerRating?: number
): Promise<void> {
    try {
        // Get request details
        const requestDoc = await getDocs(
            query(collection(db, 'requests'), where('id', '==', requestId))
        );

        if (requestDoc.empty) {
            console.error('Request not found for training data:', requestId);
            return;
        }

        const request = requestDoc.docs[0].data() as ServiceRequest;
        const now = new Date();

        const trainingData: DispatchTrainingData = {
            requestId,
            serviceType: request.serviceType,
            urgencyLevel: 'normal', // TODO: Get from request
            customerLocation: request.customerLocation.coordinates,
            zoneName: getZoneFromCoordinates(
                request.customerLocation.coordinates.latitude,
                request.customerLocation.coordinates.longitude
            ),
            timestamp: now,
            timeSlot: getTimeSlot(now.getHours()),
            dayOfWeek: now.getDay(),
            isWeekend: now.getDay() === 0 || now.getDay() === 6,
            isHoliday: false, // TODO: Integrate holiday calendar
            providerId,
            providerDistanceKm: 5, // TODO: Calculate from actual data
            providerRating: 4.5, // TODO: Get from provider doc
            providerCompletionRate: 95,
            providerTotalJobs: 100,
            outcome,
            responseTimeSeconds,
            wasCompletedSuccessfully: outcome === 'accepted' && completionTimeMinutes !== undefined,
            completionTimeMinutes,
            customerRating,
        };

        // Store training data
        await addDoc(collection(db, 'dispatch_training_data'), trainingData);
    } catch (error) {
        console.error('Error recording dispatch outcome:', error);
    }
}

/**
 * Get model performance metrics
 */
export async function getModelMetrics(): Promise<ModelMetrics> {
    // TODO: Calculate from actual training data
    return {
        totalPredictions: 1000,
        accuracyRate: 0.78,
        top3AccuracyRate: 0.92,
        avgResponseTime: 45,
        avgCompletionTime: 25,
        avgCustomerRating: 4.5,
        lastUpdated: new Date(),
    };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get service-specific dispatch weights
 * Some services may prioritize different factors
 */
export function getServiceWeights(serviceType: string): DispatchWeights {
    switch (serviceType) {
        case 'ambulance':
            // Medical emergency: prioritize distance and response time
            return {
                distance: 0.40,
                rating: 0.15,
                responseTime: 0.30,
                completionRate: 0.10,
                recentActivity: 0.05,
            };
        case 'towing':
            // Towing: balance of distance and equipment capability
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

/**
 * Rank providers without database access (for testing/offline)
 */
export function rankProviders(
    providers: Provider[],
    customerLocation: GeoLocation,
    weights: DispatchWeights = DEFAULT_DISPATCH_WEIGHTS
): ProviderScore[] {
    const scores = providers.map(p =>
        calculateProviderScore(p, customerLocation, weights)
    );

    return scores.sort((a, b) => b.totalScore - a.totalScore);
}
