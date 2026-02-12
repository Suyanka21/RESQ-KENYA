// ResQ Kenya - AI Dispatch Types
// Phase 4: AI-Powered Dispatch Algorithm

import type { ServiceType } from '../theme/voltage-premium';
import type { GeoLocation } from './index';

// ============================================
// Provider Scoring Types
// ============================================

/**
 * Weights for each scoring factor in provider matching
 * All weights must sum to 1.0
 */
export interface DispatchWeights {
    distance: number;       // Weight for proximity (0-1)
    rating: number;         // Weight for provider rating (0-1)
    responseTime: number;   // Weight for avg response time (0-1)
    completionRate: number; // Weight for completion rate (0-1)
    recentActivity: number; // Weight for recent activity (0-1)
}

/**
 * Default weights for scoring algorithm
 * Can be adjusted based on service type or zone
 */
export const DEFAULT_DISPATCH_WEIGHTS: DispatchWeights = {
    distance: 0.30,        // 30% weight - proximity is key
    rating: 0.25,          // 25% weight - quality matters
    responseTime: 0.20,    // 20% weight - speed of acceptance
    completionRate: 0.15,  // 15% weight - reliability
    recentActivity: 0.10,  // 10% weight - engagement
};

/**
 * Breakdown of individual scoring factors for a provider
 * Each factor is normalized to 0-100 scale
 */
export interface ProviderScoreFactors {
    distance: number;        // 0-100, closer = higher score
    rating: number;          // 0-100, based on 5-star rating (rating * 20)
    responseTime: number;    // 0-100, faster avg response = higher
    completionRate: number;  // 0-100, percentage of completed jobs
    recentActivity: number;  // 0-100, jobs in last 7 days normalized
}

/**
 * Complete provider score with all factors
 */
export interface ProviderScore {
    providerId: string;
    providerName: string;
    serviceTypes: ServiceType[];
    totalScore: number;           // Weighted sum of all factors (0-100)
    factors: ProviderScoreFactors;
    weights: DispatchWeights;
    distanceKm: number;           // Actual distance in km
    estimatedETA: number;         // Estimated arrival time in minutes
    isAvailable: boolean;
    currentLocation?: GeoLocation;
}

// ============================================
// Dispatch Prediction Types
// ============================================

/**
 * Confidence level for predictions
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'very_high';

/**
 * Get confidence level from numeric value
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
    if (confidence >= 0.9) return 'very_high';
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
}

/**
 * Result of AI dispatch prediction
 */
export interface DispatchPrediction {
    requestId: string;
    recommendedProvider: ProviderScore;
    alternatives: ProviderScore[];       // Next best options (max 4)
    confidence: number;                   // 0-1 confidence in recommendation
    confidenceLevel: ConfidenceLevel;
    predictedAcceptanceRate: number;      // 0-1 likelihood of acceptance
    predictedETA: number;                 // Minutes to arrival
    modelVersion: string;
    timestamp: Date;
}

/**
 * Dispatch request parameters
 */
export interface DispatchRequest {
    requestId: string;
    serviceType: ServiceType;
    customerLocation: GeoLocation;
    urgencyLevel: 'normal' | 'urgent' | 'emergency';
    preferredProviderId?: string;        // Optional preferred provider
    maxDistanceKm?: number;              // Max search radius (default: 15)
    maxResults?: number;                 // Max providers to consider (default: 10)
    excludeProviders?: string[];         // Providers to exclude
}

// ============================================
// Training Data Types
// ============================================

/**
 * Time slot categories for pattern analysis
 */
export type TimeSlot =
    | 'early_morning'    // 5:00 - 7:59
    | 'morning'          // 8:00 - 11:59
    | 'afternoon'        // 12:00 - 16:59
    | 'evening'          // 17:00 - 20:59
    | 'night';           // 21:00 - 4:59

/**
 * Get time slot from hour
 */
export function getTimeSlot(hour: number): TimeSlot {
    if (hour >= 5 && hour < 8) return 'early_morning';
    if (hour >= 8 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
}

/**
 * Dispatch outcome for training data
 */
export type DispatchOutcome =
    | 'accepted'          // Provider accepted request
    | 'declined'          // Provider declined
    | 'timed_out'         // No response within timeout
    | 'reassigned'        // Assigned to different provider
    | 'cancelled';        // Customer cancelled

/**
 * Training data record for ML model
 */
export interface DispatchTrainingData {
    // Request context
    requestId: string;
    serviceType: ServiceType;
    urgencyLevel: 'normal' | 'urgent' | 'emergency';

    // Location context
    customerLocation: GeoLocation;
    zoneName: string;

    // Time context
    timestamp: Date;
    timeSlot: TimeSlot;
    dayOfWeek: number;           // 0 = Sunday, 6 = Saturday
    isWeekend: boolean;
    isHoliday: boolean;

    // Provider context
    providerId: string;
    providerDistanceKm: number;
    providerRating: number;
    providerCompletionRate: number;
    providerTotalJobs: number;

    // Outcome (filled after request completes)
    outcome: DispatchOutcome;
    responseTimeSeconds: number;
    wasCompletedSuccessfully: boolean;
    completionTimeMinutes?: number;
    customerRating?: number;
    customerTipped?: boolean;
    tipAmount?: number;
}

/**
 * Aggregated model metrics
 */
export interface ModelMetrics {
    totalPredictions: number;
    accuracyRate: number;        // % of correct top-1 predictions
    top3AccuracyRate: number;    // % of correct within top-3
    avgResponseTime: number;     // Avg seconds to accept
    avgCompletionTime: number;   // Avg minutes to complete
    avgCustomerRating: number;   // Avg rating after service
    lastUpdated: Date;
}

// ============================================
// Zone-Based Dispatch Types
// ============================================

/**
 * Nairobi zones for dispatch optimization
 */
export type NairobiZone =
    | 'cbd'                // Central Business District
    | 'westlands'          // Westlands area
    | 'kilimani'           // Kilimani/Lavington
    | 'upperhill'          // Upper Hill
    | 'eastleigh'          // Eastleigh
    | 'industrial_area'    // Industrial Area
    | 'ngong_road'         // Ngong Road corridor
    | 'thika_road'         // Thika Road corridor
    | 'mombasa_road'       // Mombasa Road corridor
    | 'karen'              // Karen
    | 'langata'            // Langata
    | 'kiambu'             // Kiambu Road
    | 'other';             // Areas outside main zones

/**
 * Zone definition with boundaries
 */
export interface ZoneDefinition {
    id: NairobiZone;
    name: string;
    centerLat: number;
    centerLng: number;
    radiusKm: number;
    avgDemand: number;         // Avg requests per hour
    peakHours: number[];       // Peak demand hours
    commonServices: ServiceType[];
}

/**
 * Default Nairobi zone definitions
 */
export const NAIROBI_ZONES: ZoneDefinition[] = [
    { id: 'cbd', name: 'CBD', centerLat: -1.2864, centerLng: 36.8172, radiusKm: 2.5, avgDemand: 12, peakHours: [8, 9, 17, 18], commonServices: ['battery', 'fuel', 'towing'] },
    { id: 'westlands', name: 'Westlands', centerLat: -1.2674, centerLng: 36.8048, radiusKm: 3, avgDemand: 8, peakHours: [9, 18, 19], commonServices: ['battery', 'diagnostics'] },
    { id: 'kilimani', name: 'Kilimani', centerLat: -1.2921, centerLng: 36.7821, radiusKm: 3, avgDemand: 6, peakHours: [7, 18], commonServices: ['fuel', 'tire'] },
    { id: 'upperhill', name: 'Upper Hill', centerLat: -1.2974, centerLng: 36.8167, radiusKm: 2, avgDemand: 7, peakHours: [8, 17], commonServices: ['battery', 'fuel'] },
    { id: 'eastleigh', name: 'Eastleigh', centerLat: -1.2728, centerLng: 36.8499, radiusKm: 2.5, avgDemand: 5, peakHours: [10, 16], commonServices: ['tire', 'towing'] },
    { id: 'industrial_area', name: 'Industrial Area', centerLat: -1.3108, centerLng: 36.8524, radiusKm: 4, avgDemand: 9, peakHours: [6, 7, 17, 18], commonServices: ['towing', 'diagnostics', 'tire'] },
    { id: 'ngong_road', name: 'Ngong Road', centerLat: -1.3062, centerLng: 36.7611, radiusKm: 5, avgDemand: 7, peakHours: [7, 8, 17, 18], commonServices: ['fuel', 'battery', 'towing'] },
    { id: 'thika_road', name: 'Thika Road', centerLat: -1.2219, centerLng: 36.8876, radiusKm: 6, avgDemand: 10, peakHours: [6, 7, 18, 19], commonServices: ['towing', 'tire', 'fuel'] },
    { id: 'mombasa_road', name: 'Mombasa Road', centerLat: -1.3389, centerLng: 36.8979, radiusKm: 6, avgDemand: 11, peakHours: [6, 7, 17, 18], commonServices: ['towing', 'fuel', 'tire'] },
    { id: 'karen', name: 'Karen', centerLat: -1.3226, centerLng: 36.7127, radiusKm: 5, avgDemand: 4, peakHours: [8, 17], commonServices: ['battery', 'fuel'] },
    { id: 'langata', name: 'Langata', centerLat: -1.3546, centerLng: 36.7547, radiusKm: 4, avgDemand: 5, peakHours: [7, 18], commonServices: ['tire', 'battery'] },
    { id: 'kiambu', name: 'Kiambu Road', centerLat: -1.2133, centerLng: 36.8312, radiusKm: 5, avgDemand: 6, peakHours: [7, 18], commonServices: ['fuel', 'towing'] },
];

/**
 * Determine zone from coordinates
 */
export function getZoneFromCoordinates(lat: number, lng: number): NairobiZone {
    // Calculate distance to each zone center and return closest
    let closestZone: NairobiZone = 'other';
    let minDistance = Infinity;

    for (const zone of NAIROBI_ZONES) {
        const distance = calculateHaversineDistance(lat, lng, zone.centerLat, zone.centerLng);
        if (distance < zone.radiusKm && distance < minDistance) {
            minDistance = distance;
            closestZone = zone.id;
        }
    }

    return closestZone;
}

/**
 * Haversine distance calculation (km)
 */
function calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

// ============================================
// Validation Functions
// ============================================

/**
 * Validate dispatch weights sum to 1.0
 */
export function validateDispatchWeights(weights: DispatchWeights): boolean {
    const sum = weights.distance + weights.rating + weights.responseTime +
        weights.completionRate + weights.recentActivity;
    return Math.abs(sum - 1.0) < 0.001; // Allow small floating point error
}

/**
 * Validate provider score factors are in range
 */
export function validateProviderScoreFactors(factors: ProviderScoreFactors): boolean {
    const values = Object.values(factors);
    return values.every(v => v >= 0 && v <= 100);
}

/**
 * Validate GeoLocation coordinates
 */
export function validateGeoLocation(location: GeoLocation): boolean {
    return (
        location.latitude >= -90 && location.latitude <= 90 &&
        location.longitude >= -180 && location.longitude <= 180
    );
}

/**
 * Validate dispatch request
 */
export function validateDispatchRequest(request: DispatchRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.requestId) {
        errors.push('Request ID is required');
    }

    if (!request.serviceType) {
        errors.push('Service type is required');
    }

    if (!request.customerLocation) {
        errors.push('Customer location is required');
    } else if (!validateGeoLocation(request.customerLocation)) {
        errors.push('Invalid customer location coordinates');
    }

    if (request.maxDistanceKm !== undefined && (request.maxDistanceKm < 1 || request.maxDistanceKm > 50)) {
        errors.push('Max distance must be between 1 and 50 km');
    }

    if (request.maxResults !== undefined && (request.maxResults < 1 || request.maxResults > 20)) {
        errors.push('Max results must be between 1 and 20');
    }

    return { valid: errors.length === 0, errors };
}
