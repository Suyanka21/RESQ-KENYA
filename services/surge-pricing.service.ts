// ResQ Kenya - Surge Pricing Service
// Phase 4: Dynamic Pricing Engine with Surge Multipliers

import { httpsCallable, getFunctions } from 'firebase/functions';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import app from '../config/firebase';
import type { ServiceType } from '../theme/voltage-premium';
import { getZoneFromCoordinates, NAIROBI_ZONES, type NairobiZone } from '../types/ai-dispatch';
import {
    SURGE_LIMITS,
    KENYA_BASE_PRICING,
    isSurgeExempt,
    getServiceBasePricing,
    calculateSurgeMultiplier,
    validateSurgeMultiplier,
    calculateDemandLevel,
    calculateSupplyLevel,
    type SurgeFactors,
    type PriceCalculation,
    type PriceBreakdown,
    type PriceRequest,
    type DemandZone,
    type HeatMapPoint,
    type DemandHeatMap,
} from '../types/pricing';

// Initialize Firebase Functions
const functions = getFunctions(app, 'us-central1');

// ============================================
// Cache for zone pricing (updates every 5 min)
// ============================================

interface ZonePricingCache {
    zones: Map<NairobiZone, DemandZone>;
    lastUpdated: Date;
    ttlMs: number;
}

const pricingCache: ZonePricingCache = {
    zones: new Map(),
    lastUpdated: new Date(0),
    ttlMs: 5 * 60 * 1000, // 5 minutes
};

// ============================================
// Price Calculation Functions
// ============================================

/**
 * Calculate base price for a service
 */
export function calculateBasePrice(
    serviceType: ServiceType,
    distanceKm: number = 0
): number {
    const pricing = getServiceBasePricing(serviceType);
    if (!pricing) {
        console.error('No pricing found for service:', serviceType);
        return 2000; // Default fallback
    }

    const distanceFee = distanceKm * pricing.pricePerKm;
    const totalBase = pricing.basePrice + distanceFee;

    // Clamp to min/max
    return Math.max(pricing.minCharge, Math.min(pricing.maxCharge, totalBase));
}

/**
 * Apply surge multiplier to base price
 */
export function applySticker(
    basePrice: number,
    surgeMultiplier: number
): number {
    if (!validateSurgeMultiplier(surgeMultiplier)) {
        console.warn('Invalid surge multiplier, using 1.0:', surgeMultiplier);
        surgeMultiplier = 1.0;
    }
    return Math.round(basePrice * surgeMultiplier);
}

/**
 * Calculate price breakdown
 */
export function calculatePriceBreakdown(
    basePrice: number,
    surgeMultiplier: number,
    distanceKm: number = 0
): PriceBreakdown {
    const serviceType = 'towing' as ServiceType; // Placeholder
    const pricing = getServiceBasePricing(serviceType);

    const baseServiceFee = pricing?.basePrice || basePrice;
    const distanceFee = distanceKm * (pricing?.pricePerKm || 0);
    const surgeAmount = surgeMultiplier > 1 ? Math.round(basePrice * (surgeMultiplier - 1)) : 0;
    const adjustedTotal = basePrice + surgeAmount;

    // Platform fee: 20% of base (not surge)
    const platformFee = Math.round(basePrice * 0.20);

    // Processing fee: 3% of total
    const processingFee = Math.round(adjustedTotal * 0.03);

    return {
        baseServiceFee,
        distanceFee,
        surgeAmount,
        platformFee,
        processingFee,
    };
}

/**
 * Generate a unique quote ID
 */
function generateQuoteId(): string {
    return `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get full price calculation for a service request
 */
export async function getPriceQuote(
    request: PriceRequest
): Promise<PriceCalculation> {
    const { serviceType, customerLocation, distanceKm = 0 } = request;

    // Get zone for surge calculation
    const zone = getZoneFromCoordinates(
        customerLocation.latitude,
        customerLocation.longitude
    );

    // Calculate base price
    const basePrice = calculateBasePrice(serviceType, distanceKm);

    // Get surge multiplier (exempt for medical)
    let surgeMultiplier = 1.0;
    let surgeActive = false;

    if (!isSurgeExempt(serviceType)) {
        const zoneData = await getZoneSurgeData(zone);
        surgeMultiplier = zoneData?.surgeMultiplier || 1.0;
        surgeActive = surgeMultiplier > 1.0;
    }

    // Calculate adjusted price
    const adjustedPrice = applySticker(basePrice, surgeMultiplier);

    // Calculate breakdown
    const breakdown = calculatePriceBreakdown(basePrice, surgeMultiplier, distanceKm);

    // Provider earnings: 75% of base price (surge goes to platform)
    const providerEarnings = Math.round(basePrice * 0.75);

    // Platform earnings: 25% base + surge amount
    const platformEarnings = adjustedPrice - providerEarnings - breakdown.processingFee;

    // Quote valid for 10 minutes
    const validUntil = new Date(Date.now() + 10 * 60 * 1000);

    return {
        serviceType,
        basePrice,
        surgeMultiplier,
        surgeActive,
        adjustedPrice,
        breakdown,
        providerEarnings,
        platformEarnings,
        currency: 'KES',
        validUntil,
        quoteId: generateQuoteId(),
    };
}

/**
 * Get price quote using Cloud Function
 */
export async function getPriceQuoteRemote(
    request: PriceRequest
): Promise<PriceCalculation | null> {
    try {
        const getQuote = httpsCallable(functions, 'getPriceQuote');
        const result = await getQuote(request);
        return result.data as PriceCalculation;
    } catch (error) {
        console.error('Remote getPriceQuote error:', error);
        // Fallback to local calculation
        return getPriceQuote(request);
    }
}

// ============================================
// Zone Surge Data Functions
// ============================================

/**
 * Get surge data for a specific zone
 */
export async function getZoneSurgeData(zone: NairobiZone): Promise<DemandZone | null> {
    // Check cache first
    if (isCacheValid() && pricingCache.zones.has(zone)) {
        return pricingCache.zones.get(zone) || null;
    }

    try {
        const zoneDoc = await getDoc(doc(db, 'surge_zones', zone));
        if (zoneDoc.exists()) {
            const data = zoneDoc.data() as DemandZone;
            pricingCache.zones.set(zone, data);
            return data;
        }

        // Return default if not found
        return getDefaultZoneData(zone);
    } catch (error) {
        console.error('Error getting zone surge data:', error);
        return getDefaultZoneData(zone);
    }
}

/**
 * Get all active demand zones
 */
export async function getAllDemandZones(): Promise<DemandZone[]> {
    // Check cache
    if (isCacheValid() && pricingCache.zones.size > 0) {
        return Array.from(pricingCache.zones.values());
    }

    try {
        const zonesQuery = query(collection(db, 'surge_zones'));
        const snapshot = await getDocs(zonesQuery);

        const zones: DemandZone[] = [];
        snapshot.forEach(doc => {
            const zone = doc.data() as DemandZone;
            zones.push(zone);
            pricingCache.zones.set(doc.id as NairobiZone, zone);
        });

        pricingCache.lastUpdated = new Date();

        // If no zones in DB, return defaults
        if (zones.length === 0) {
            return NAIROBI_ZONES.map(z => getDefaultZoneData(z.id));
        }

        return zones;
    } catch (error) {
        console.error('Error getting all demand zones:', error);
        return NAIROBI_ZONES.map(z => getDefaultZoneData(z.id));
    }
}

/**
 * Get active surge zones (where surge is currently active)
 */
export async function getActiveSurgeZones(): Promise<DemandZone[]> {
    const allZones = await getAllDemandZones();
    return allZones.filter(z => z.surgeActive && z.surgeMultiplier > 1.0);
}

// ============================================
// Surge Calculation Functions
// ============================================

/**
 * Calculate surge factors for a zone
 */
export function calculateSurgeFactors(
    requestsInZone: number,
    avgRequestsPerHour: number,
    availableProviders: number,
    expectedProviders: number,
    zone: NairobiZone
): SurgeFactors {
    const demandLevel = calculateDemandLevel(requestsInZone, avgRequestsPerHour);
    const supplyLevel = calculateSupplyLevel(availableProviders, expectedProviders);

    const now = new Date();
    const hour = now.getHours();

    return {
        demandLevel,
        supplyLevel,
        demandSupplyRatio: supplyLevel > 0 ? demandLevel / supplyLevel : 10,
        timeSlot: getTimeSlotCategory(hour),
        dayOfWeek: now.getDay(),
        isWeekend: now.getDay() === 0 || now.getDay() === 6,
        locationZone: zone,
        recentRequestCount: requestsInZone,
        availableProviders,
    };
}

/**
 * Calculate surge multiplier from factors
 */
export function calculateSurgeFromFactors(factors: SurgeFactors): number {
    // Base calculation from demand/supply ratio
    let multiplier = calculateSurgeMultiplier(factors.demandSupplyRatio);

    // Peak time adjustment
    if (factors.timeSlot === 'peak') {
        multiplier = Math.min(SURGE_LIMITS.MAX_MULTIPLIER, multiplier * 1.1);
    } else if (factors.timeSlot === 'off_peak') {
        multiplier = Math.max(SURGE_LIMITS.MIN_MULTIPLIER, multiplier * 0.9);
    }

    // Weather adjustment (if available)
    if (factors.weather === 'heavy_rain' || factors.weather === 'storm') {
        multiplier = Math.min(SURGE_LIMITS.MAX_MULTIPLIER, multiplier * 1.2);
    }

    return Math.round(multiplier * 10) / 10;
}

/**
 * Update zone surge pricing
 */
export async function updateZoneSurge(
    zone: NairobiZone,
    surgeMultiplier: number,
    factors: Partial<SurgeFactors>
): Promise<void> {
    if (!validateSurgeMultiplier(surgeMultiplier)) {
        console.error('Invalid surge multiplier:', surgeMultiplier);
        return;
    }

    const zoneDefinition = NAIROBI_ZONES.find(z => z.id === zone);
    if (!zoneDefinition) {
        console.error('Unknown zone:', zone);
        return;
    }

    const demandZone: DemandZone = {
        zoneId: zone,
        zoneName: zoneDefinition.name,
        centerLat: zoneDefinition.centerLat,
        centerLng: zoneDefinition.centerLng,
        radiusKm: zoneDefinition.radiusKm,
        currentDemand: factors.demandLevel || 5,
        avgDemand: zoneDefinition.avgDemand,
        surgeActive: surgeMultiplier > 1.0,
        surgeMultiplier,
        surgeStartedAt: surgeMultiplier > 1.0 ? new Date() : undefined,
        lastUpdated: new Date(),
        activeRequests: factors.recentRequestCount || 0,
        availableProviders: factors.availableProviders || 0,
        estimatedWaitTime: calculateEstimatedWait(factors.availableProviders || 0, factors.recentRequestCount || 0),
    };

    try {
        await setDoc(doc(db, 'surge_zones', zone), demandZone);
        pricingCache.zones.set(zone, demandZone);
    } catch (error) {
        console.error('Error updating zone surge:', error);
    }
}

// ============================================
// Heat Map Functions
// ============================================

/**
 * Generate demand heat map for visualization
 */
export async function generateDemandHeatMap(): Promise<DemandHeatMap> {
    const zones = await getAllDemandZones();

    const points: HeatMapPoint[] = zones.map(zone => ({
        lat: zone.centerLat,
        lng: zone.centerLng,
        intensity: zone.currentDemand / 10, // Normalize to 0-1
        requestCount: zone.activeRequests,
    }));

    return {
        points,
        zones,
        timestamp: new Date(),
        intervalMinutes: 5,
    };
}

// ============================================
// Helper Functions
// ============================================

function isCacheValid(): boolean {
    return Date.now() - pricingCache.lastUpdated.getTime() < pricingCache.ttlMs;
}

function getDefaultZoneData(zone: NairobiZone): DemandZone {
    const zoneDefinition = NAIROBI_ZONES.find(z => z.id === zone);
    if (!zoneDefinition) {
        return {
            zoneId: zone,
            zoneName: 'Unknown',
            centerLat: -1.2864,
            centerLng: 36.8172,
            radiusKm: 5,
            currentDemand: 5,
            avgDemand: 5,
            surgeActive: false,
            surgeMultiplier: 1.0,
            lastUpdated: new Date(),
            activeRequests: 0,
            availableProviders: 0,
            estimatedWaitTime: 10,
        };
    }

    return {
        zoneId: zone,
        zoneName: zoneDefinition.name,
        centerLat: zoneDefinition.centerLat,
        centerLng: zoneDefinition.centerLng,
        radiusKm: zoneDefinition.radiusKm,
        currentDemand: 5,
        avgDemand: zoneDefinition.avgDemand,
        surgeActive: false,
        surgeMultiplier: 1.0,
        lastUpdated: new Date(),
        activeRequests: 0,
        availableProviders: 0,
        estimatedWaitTime: 10,
    };
}

function getTimeSlotCategory(hour: number): 'peak' | 'normal' | 'off_peak' {
    // Peak hours: 7-9 AM and 5-7 PM
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
        return 'peak';
    }
    // Off-peak: 10 PM - 6 AM
    if (hour >= 22 || hour <= 6) {
        return 'off_peak';
    }
    return 'normal';
}

function calculateEstimatedWait(availableProviders: number, activeRequests: number): number {
    if (availableProviders === 0) return 30; // Max wait
    if (activeRequests === 0) return 5; // Min wait

    // Simple calculation: more requests than providers = longer wait
    const ratio = activeRequests / availableProviders;
    return Math.min(30, Math.max(5, Math.round(5 + ratio * 5)));
}

/**
 * Clear pricing cache (for testing)
 */
export function clearPricingCache(): void {
    pricingCache.zones.clear();
    pricingCache.lastUpdated = new Date(0);
}
