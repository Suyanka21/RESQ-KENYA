// ResQ Kenya - Dynamic Pricing Types
// Phase 4: Surge Pricing & Dynamic Pricing Engine

import type { ServiceType } from '../theme/voltage-premium';
import type { NairobiZone } from './ai-dispatch';

// ============================================
// Surge Pricing Types
// ============================================

/**
 * Surge multiplier bounds
 */
export const SURGE_LIMITS = {
    MIN_MULTIPLIER: 1.0,      // No surge
    MAX_MULTIPLIER: 2.5,      // Max 2.5x price
    SURGE_THRESHOLD: 2.0,     // Demand/supply ratio to trigger surge
    COOL_DOWN_MINUTES: 15,    // Min time between surge changes
} as const;

/**
 * Weather conditions that affect pricing
 */
export type WeatherCondition =
    | 'clear'
    | 'cloudy'
    | 'rain'
    | 'heavy_rain'
    | 'storm';

/**
 * Factors that influence surge pricing
 */
export interface SurgeFactors {
    demandLevel: number;           // Current demand (0-10 scale)
    supplyLevel: number;           // Available providers (0-10 scale)
    demandSupplyRatio: number;     // Demand / Supply ratio
    timeSlot: 'peak' | 'normal' | 'off_peak';
    dayOfWeek: number;             // 0 = Sunday, 6 = Saturday
    isWeekend: boolean;
    weather?: WeatherCondition;
    specialEvents?: string[];      // Concerts, matches, holidays
    locationZone: NairobiZone;
    recentRequestCount: number;    // Requests in last 15 min
    availableProviders: number;    // Online providers in zone
}

/**
 * Calculate demand level from request count
 */
export function calculateDemandLevel(requestsPerHour: number, avgRequestsPerHour: number): number {
    if (avgRequestsPerHour === 0) return 5;
    const ratio = requestsPerHour / avgRequestsPerHour;
    return Math.min(10, Math.max(0, Math.round(ratio * 5)));
}

/**
 * Calculate supply level from provider count
 */
export function calculateSupplyLevel(availableProviders: number, expectedProviders: number): number {
    if (expectedProviders === 0) return 5;
    const ratio = availableProviders / expectedProviders;
    return Math.min(10, Math.max(0, Math.round(ratio * 5)));
}

// ============================================
// Price Calculation Types
// ============================================

/**
 * Breakdown of a price calculation
 */
export interface PriceBreakdown {
    baseServiceFee: number;        // Base fee for service type
    distanceFee: number;           // Fee based on distance
    surgeAmount: number;           // Additional surge charge
    platformFee: number;           // Platform commission
    processingFee: number;         // Payment processing fee
}

/**
 * Complete price calculation result
 */
export interface PriceCalculation {
    serviceType: ServiceType;
    basePrice: number;             // Price before surge
    surgeMultiplier: number;       // Applied multiplier (1.0 = no surge)
    surgeActive: boolean;
    adjustedPrice: number;         // Final price to customer
    breakdown: PriceBreakdown;
    providerEarnings: number;      // 75% of base price (no surge bonus)
    platformEarnings: number;      // Platform + surge earnings
    currency: 'KES' | 'USD' | 'AED';
    validUntil: Date;              // Price quote expiry
    quoteId: string;               // Unique quote ID for transaction
}

/**
 * Price calculation request
 */
export interface PriceRequest {
    serviceType: ServiceType;
    customerLocation: { latitude: number; longitude: number };
    destinationLocation?: { latitude: number; longitude: number };
    distanceKm?: number;
    scheduledTime?: Date;          // For future bookings
}

// ============================================
// Demand Zone Types
// ============================================

/**
 * Active demand zone with current pricing
 */
export interface DemandZone {
    zoneId: NairobiZone;
    zoneName: string;
    centerLat: number;
    centerLng: number;
    radiusKm: number;
    currentDemand: number;         // Current demand level (0-10)
    avgDemand: number;             // Historical average
    surgeActive: boolean;
    surgeMultiplier: number;
    surgeStartedAt?: Date;
    lastUpdated: Date;
    activeRequests: number;
    availableProviders: number;
    estimatedWaitTime: number;     // Minutes
}

/**
 * Heat map data point for visualization
 */
export interface HeatMapPoint {
    lat: number;
    lng: number;
    intensity: number;             // 0-1 intensity for heat map
    requestCount: number;
}

/**
 * Demand heat map for admin dashboard
 */
export interface DemandHeatMap {
    points: HeatMapPoint[];
    zones: DemandZone[];
    timestamp: Date;
    intervalMinutes: number;       // Data collection interval
}

// ============================================
// Pricing History & Analytics
// ============================================

/**
 * Price event for analytics
 */
export interface PriceEvent {
    eventId: string;
    timestamp: Date;
    zone: NairobiZone;
    serviceType: ServiceType;
    multiplier: number;
    reason: 'demand_spike' | 'low_supply' | 'special_event' | 'weather' | 'manual';
    durationMinutes: number;
    requestsAffected: number;
    revenueImpact: number;
}

/**
 * Pricing analytics summary
 */
export interface PricingAnalytics {
    period: 'day' | 'week' | 'month';
    startDate: Date;
    endDate: Date;
    totalRequests: number;
    surgeRequestsPercent: number;  // % of requests with surge
    avgSurgeMultiplier: number;
    maxSurgeMultiplier: number;
    surgeRevenue: number;          // Additional revenue from surge
    topSurgeZones: { zone: NairobiZone; surgeMinutes: number }[];
    peakSurgeTimes: { hour: number; avgMultiplier: number }[];
}

// ============================================
// Service-Specific Pricing Rules
// ============================================

/**
 * Services excluded from surge pricing
 */
export const SURGE_EXEMPT_SERVICES: ServiceType[] = ['ambulance'];

/**
 * Check if service is exempt from surge pricing
 */
export function isSurgeExempt(serviceType: ServiceType): boolean {
    return SURGE_EXEMPT_SERVICES.includes(serviceType);
}

/**
 * Base pricing per service type (in KES for Kenya market)
 */
export interface ServiceBasePricing {
    serviceType: ServiceType;
    basePrice: number;
    pricePerKm: number;
    minCharge: number;
    maxCharge: number;
    peakMultiplier: number;        // Multiplier during peak hours
}

/**
 * Kenya pricing configuration
 */
export const KENYA_BASE_PRICING: ServiceBasePricing[] = [
    { serviceType: 'towing', basePrice: 3000, pricePerKm: 150, minCharge: 3000, maxCharge: 15000, peakMultiplier: 1.2 },
    { serviceType: 'tire', basePrice: 1500, pricePerKm: 0, minCharge: 1500, maxCharge: 3000, peakMultiplier: 1.1 },
    { serviceType: 'battery', basePrice: 2000, pricePerKm: 100, minCharge: 2000, maxCharge: 4000, peakMultiplier: 1.1 },
    { serviceType: 'fuel', basePrice: 1000, pricePerKm: 50, minCharge: 1000, maxCharge: 2500, peakMultiplier: 1.0 },
    { serviceType: 'diagnostics', basePrice: 2500, pricePerKm: 100, minCharge: 2500, maxCharge: 5000, peakMultiplier: 1.0 },
    { serviceType: 'ambulance', basePrice: 5000, pricePerKm: 200, minCharge: 5000, maxCharge: 25000, peakMultiplier: 1.0 }, // No surge
];

/**
 * Get base pricing for a service type
 */
export function getServiceBasePricing(serviceType: ServiceType): ServiceBasePricing | undefined {
    return KENYA_BASE_PRICING.find(p => p.serviceType === serviceType);
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validate surge multiplier is within bounds
 */
export function validateSurgeMultiplier(multiplier: number): boolean {
    return multiplier >= SURGE_LIMITS.MIN_MULTIPLIER &&
        multiplier <= SURGE_LIMITS.MAX_MULTIPLIER;
}

/**
 * Validate price calculation result
 */
export function validatePriceCalculation(calc: PriceCalculation): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (calc.basePrice < 0) {
        errors.push('Base price cannot be negative');
    }

    if (!validateSurgeMultiplier(calc.surgeMultiplier)) {
        errors.push(`Surge multiplier must be between ${SURGE_LIMITS.MIN_MULTIPLIER} and ${SURGE_LIMITS.MAX_MULTIPLIER}`);
    }

    if (calc.adjustedPrice < calc.basePrice && calc.surgeMultiplier >= 1) {
        errors.push('Adjusted price cannot be less than base price when surge is active');
    }

    const breakdownTotal = calc.breakdown.baseServiceFee + calc.breakdown.distanceFee +
        calc.breakdown.surgeAmount + calc.breakdown.platformFee +
        calc.breakdown.processingFee;

    if (Math.abs(breakdownTotal - calc.adjustedPrice) > 1) {
        errors.push('Breakdown does not sum to adjusted price');
    }

    if (calc.validUntil < new Date()) {
        errors.push('Price quote has expired');
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Validate demand zone data
 */
export function validateDemandZone(zone: DemandZone): boolean {
    return (
        zone.currentDemand >= 0 && zone.currentDemand <= 10 &&
        zone.avgDemand >= 0 &&
        zone.surgeMultiplier >= SURGE_LIMITS.MIN_MULTIPLIER &&
        zone.surgeMultiplier <= SURGE_LIMITS.MAX_MULTIPLIER &&
        zone.availableProviders >= 0 &&
        zone.estimatedWaitTime >= 0
    );
}

/**
 * Calculate surge multiplier from demand/supply ratio
 */
export function calculateSurgeMultiplier(demandSupplyRatio: number): number {
    if (demandSupplyRatio <= SURGE_LIMITS.SURGE_THRESHOLD) {
        return SURGE_LIMITS.MIN_MULTIPLIER;
    }

    // Linear scaling from threshold to max
    const scaleFactor = (demandSupplyRatio - SURGE_LIMITS.SURGE_THRESHOLD) /
        (SURGE_LIMITS.SURGE_THRESHOLD * 2);
    const multiplier = SURGE_LIMITS.MIN_MULTIPLIER +
        scaleFactor * (SURGE_LIMITS.MAX_MULTIPLIER - SURGE_LIMITS.MIN_MULTIPLIER);

    return Math.min(SURGE_LIMITS.MAX_MULTIPLIER, Math.round(multiplier * 10) / 10);
}
