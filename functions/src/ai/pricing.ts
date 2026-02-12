/**
 * ResQ Kenya - Dynamic Pricing Cloud Functions
 * Phase 4: Surge Pricing and Demand Zone Analysis
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

interface PriceRequest {
    serviceType: ServiceType;
    customerLocation: GeoLocation;
    distanceKm?: number;
    scheduledTime?: string;
}

interface PriceBreakdown {
    baseServiceFee: number;
    distanceFee: number;
    surgeAmount: number;
    platformFee: number;
    processingFee: number;
}

interface PriceCalculation {
    serviceType: ServiceType;
    basePrice: number;
    surgeMultiplier: number;
    surgeActive: boolean;
    adjustedPrice: number;
    breakdown: PriceBreakdown;
    providerEarnings: number;
    platformEarnings: number;
    currency: 'KES' | 'USD' | 'AED';
    validUntil: FirebaseFirestore.Timestamp;
    quoteId: string;
}

interface DemandZone {
    zoneId: string;
    zoneName: string;
    centerLat: number;
    centerLng: number;
    radiusKm: number;
    currentDemand: number;
    avgDemand: number;
    surgeActive: boolean;
    surgeMultiplier: number;
    lastUpdated: FirebaseFirestore.Timestamp;
    activeRequests: number;
    availableProviders: number;
    estimatedWaitTime: number;
}

// ============================================
// Constants
// ============================================

const SURGE_LIMITS = {
    MIN_MULTIPLIER: 1.0,
    MAX_MULTIPLIER: 2.5,
    SURGE_THRESHOLD: 2.0,
    COOL_DOWN_MINUTES: 15,
};

const SURGE_EXEMPT_SERVICES: ServiceType[] = ['ambulance'];

const KENYA_BASE_PRICING: Record<ServiceType, {
    basePrice: number;
    pricePerKm: number;
    minCharge: number;
    maxCharge: number;
}> = {
    towing: { basePrice: 3000, pricePerKm: 150, minCharge: 3000, maxCharge: 15000 },
    tire: { basePrice: 1500, pricePerKm: 0, minCharge: 1500, maxCharge: 3000 },
    battery: { basePrice: 2000, pricePerKm: 100, minCharge: 2000, maxCharge: 4000 },
    fuel: { basePrice: 1000, pricePerKm: 50, minCharge: 1000, maxCharge: 2500 },
    diagnostics: { basePrice: 2500, pricePerKm: 100, minCharge: 2500, maxCharge: 5000 },
    ambulance: { basePrice: 5000, pricePerKm: 200, minCharge: 5000, maxCharge: 25000 },
};

const NAIROBI_ZONES = [
    { id: 'cbd', name: 'CBD', centerLat: -1.2864, centerLng: 36.8172, radiusKm: 2.5, avgDemand: 12 },
    { id: 'westlands', name: 'Westlands', centerLat: -1.2674, centerLng: 36.8048, radiusKm: 3, avgDemand: 8 },
    { id: 'kilimani', name: 'Kilimani', centerLat: -1.2921, centerLng: 36.7821, radiusKm: 3, avgDemand: 6 },
    { id: 'upperhill', name: 'Upper Hill', centerLat: -1.2974, centerLng: 36.8167, radiusKm: 2, avgDemand: 7 },
    { id: 'industrial_area', name: 'Industrial Area', centerLat: -1.3108, centerLng: 36.8524, radiusKm: 4, avgDemand: 9 },
    { id: 'thika_road', name: 'Thika Road', centerLat: -1.2219, centerLng: 36.8876, radiusKm: 6, avgDemand: 10 },
    { id: 'mombasa_road', name: 'Mombasa Road', centerLat: -1.3389, centerLng: 36.8979, radiusKm: 6, avgDemand: 11 },
];

// ============================================
// Helper Functions
// ============================================

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

function getZoneFromLocation(lat: number, lng: number): typeof NAIROBI_ZONES[0] | null {
    for (const zone of NAIROBI_ZONES) {
        const distance = calculateDistance(lat, lng, zone.centerLat, zone.centerLng);
        if (distance <= zone.radiusKm) {
            return zone;
        }
    }
    return null;
}

function generateQuoteId(): string {
    return `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function isSurgeExempt(serviceType: ServiceType): boolean {
    return SURGE_EXEMPT_SERVICES.includes(serviceType);
}

// ============================================
// Cloud Functions
// ============================================

/**
 * Get price quote for a service request
 */
export const getPriceQuote = functions.https.onCall(
    async (data: PriceRequest, context) => {
        if (!data.serviceType || !data.customerLocation) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Missing required fields: serviceType, customerLocation'
            );
        }

        const { serviceType, customerLocation, distanceKm = 0 } = data;
        const pricing = KENYA_BASE_PRICING[serviceType];

        if (!pricing) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                `Unknown service type: ${serviceType}`
            );
        }

        try {
            // Calculate base price
            const distanceFee = distanceKm * pricing.pricePerKm;
            const basePrice = Math.max(
                pricing.minCharge,
                Math.min(pricing.maxCharge, pricing.basePrice + distanceFee)
            );

            // Get surge multiplier
            let surgeMultiplier = 1.0;
            let surgeActive = false;

            if (!isSurgeExempt(serviceType)) {
                const zone = getZoneFromLocation(
                    customerLocation.latitude,
                    customerLocation.longitude
                );

                if (zone) {
                    const zoneDoc = await db.collection('surge_zones').doc(zone.id).get();
                    if (zoneDoc.exists) {
                        const zoneData = zoneDoc.data();
                        surgeMultiplier = zoneData?.surgeMultiplier || 1.0;
                        surgeActive = surgeMultiplier > 1.0;
                    }
                }
            }

            // Calculate adjusted price
            const adjustedPrice = Math.round(basePrice * surgeMultiplier);

            // Calculate breakdown
            const surgeAmount = surgeActive ? Math.round(basePrice * (surgeMultiplier - 1)) : 0;
            const platformFee = Math.round(basePrice * 0.20);
            const processingFee = Math.round(adjustedPrice * 0.03);

            const breakdown: PriceBreakdown = {
                baseServiceFee: pricing.basePrice,
                distanceFee: Math.round(distanceFee),
                surgeAmount,
                platformFee,
                processingFee,
            };

            // Calculate earnings split
            const providerEarnings = Math.round(basePrice * 0.75);
            const platformEarnings = adjustedPrice - providerEarnings - processingFee;

            // Quote valid for 10 minutes
            const validUntil = admin.firestore.Timestamp.fromDate(
                new Date(Date.now() + 10 * 60 * 1000)
            );

            const quote: PriceCalculation = {
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

            // Store quote for validation
            await db.collection('price_quotes').doc(quote.quoteId).set({
                ...quote,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                used: false,
            });

            return {
                success: true,
                data: quote,
            };
        } catch (error) {
            console.error('Error getting price quote:', error);
            throw new functions.https.HttpsError('internal', 'Failed to calculate price');
        }
    }
);

/**
 * Update surge pricing for a zone
 * Called by scheduled function every 5 minutes
 */
export const updateZoneSurge = functions.https.onCall(
    async (data: { zoneId: string }, context) => {
        // Check admin auth
        if (!context.auth?.token?.admin) {
            throw new functions.https.HttpsError('permission-denied', 'Admin access required');
        }

        const { zoneId } = data;
        const zone = NAIROBI_ZONES.find(z => z.id === zoneId);

        if (!zone) {
            throw new functions.https.HttpsError('not-found', 'Zone not found');
        }

        try {
            // Get current demand metrics
            const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

            // Count recent requests in zone
            const requestsSnapshot = await db
                .collection('requests')
                .where('status', 'in', ['pending', 'assigned'])
                .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(fifteenMinAgo))
                .get();

            let activeRequests = 0;
            requestsSnapshot.forEach(doc => {
                const req = doc.data();
                const loc = req.customerLocation?.coordinates;
                if (loc) {
                    const dist = calculateDistance(loc.latitude, loc.longitude, zone.centerLat, zone.centerLng);
                    if (dist <= zone.radiusKm) {
                        activeRequests++;
                    }
                }
            });

            // Count available providers in zone
            const providersSnapshot = await db
                .collection('providers')
                .where('availability.isOnline', '==', true)
                .get();

            let availableProviders = 0;
            providersSnapshot.forEach(doc => {
                const prov = doc.data();
                const loc = prov.availability?.currentLocation;
                if (loc) {
                    const dist = calculateDistance(loc.latitude, loc.longitude, zone.centerLat, zone.centerLng);
                    if (dist <= zone.radiusKm) {
                        availableProviders++;
                    }
                }
            });

            // Calculate demand/supply ratio
            const demandSupplyRatio = availableProviders > 0
                ? activeRequests / availableProviders
                : activeRequests > 0 ? 10 : 1;

            // Calculate surge multiplier
            let surgeMultiplier = SURGE_LIMITS.MIN_MULTIPLIER;
            if (demandSupplyRatio > SURGE_LIMITS.SURGE_THRESHOLD) {
                const scaleFactor = (demandSupplyRatio - SURGE_LIMITS.SURGE_THRESHOLD) /
                    (SURGE_LIMITS.SURGE_THRESHOLD * 2);
                surgeMultiplier = Math.min(
                    SURGE_LIMITS.MAX_MULTIPLIER,
                    SURGE_LIMITS.MIN_MULTIPLIER + scaleFactor * (SURGE_LIMITS.MAX_MULTIPLIER - SURGE_LIMITS.MIN_MULTIPLIER)
                );
                surgeMultiplier = Math.round(surgeMultiplier * 10) / 10;
            }

            // Apply cool down check
            const currentZoneDoc = await db.collection('surge_zones').doc(zoneId).get();
            if (currentZoneDoc.exists) {
                const currentData = currentZoneDoc.data();
                const lastUpdated = currentData?.lastUpdated?.toDate();
                if (lastUpdated) {
                    const minutesSinceUpdate = (Date.now() - lastUpdated.getTime()) / (60 * 1000);
                    if (minutesSinceUpdate < SURGE_LIMITS.COOL_DOWN_MINUTES &&
                        Math.abs(surgeMultiplier - (currentData?.surgeMultiplier || 1.0)) < 0.3) {
                        // Skip update if within cooldown and minimal change
                        return { success: true, skipped: true };
                    }
                }
            }

            // Calculate demand level (0-10)
            const demandLevel = Math.min(10, Math.round((activeRequests / zone.avgDemand) * 5));

            // Calculate estimated wait time
            const estimatedWaitTime = availableProviders > 0
                ? Math.min(30, Math.max(5, Math.round(5 + (activeRequests / availableProviders) * 5)))
                : 30;

            const demandZone: DemandZone = {
                zoneId,
                zoneName: zone.name,
                centerLat: zone.centerLat,
                centerLng: zone.centerLng,
                radiusKm: zone.radiusKm,
                currentDemand: demandLevel,
                avgDemand: zone.avgDemand,
                surgeActive: surgeMultiplier > 1.0,
                surgeMultiplier,
                lastUpdated: admin.firestore.Timestamp.now(),
                activeRequests,
                availableProviders,
                estimatedWaitTime,
            };

            await db.collection('surge_zones').doc(zoneId).set(demandZone);

            // Log price event if surge changed
            if (surgeMultiplier > 1.0) {
                await db.collection('price_events').add({
                    zoneId,
                    multiplier: surgeMultiplier,
                    reason: 'demand_spike',
                    requestsAffected: activeRequests,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                });
            }

            return {
                success: true,
                data: demandZone,
            };
        } catch (error) {
            console.error('Error updating zone surge:', error);
            throw new functions.https.HttpsError('internal', 'Failed to update surge pricing');
        }
    }
);

/**
 * Get all demand zones with current surge status
 */
export const getDemandZones = functions.https.onCall(
    async (data, context) => {
        try {
            const zonesSnapshot = await db.collection('surge_zones').get();

            const zones: DemandZone[] = [];
            zonesSnapshot.forEach(doc => {
                zones.push(doc.data() as DemandZone);
            });

            // If no zones in DB, return defaults
            if (zones.length === 0) {
                return {
                    success: true,
                    data: NAIROBI_ZONES.map(z => ({
                        zoneId: z.id,
                        zoneName: z.name,
                        centerLat: z.centerLat,
                        centerLng: z.centerLng,
                        radiusKm: z.radiusKm,
                        currentDemand: 5,
                        avgDemand: z.avgDemand,
                        surgeActive: false,
                        surgeMultiplier: 1.0,
                        lastUpdated: admin.firestore.Timestamp.now(),
                        activeRequests: 0,
                        availableProviders: 0,
                        estimatedWaitTime: 10,
                    })),
                };
            }

            return {
                success: true,
                data: zones,
            };
        } catch (error) {
            console.error('Error getting demand zones:', error);
            throw new functions.https.HttpsError('internal', 'Failed to get demand zones');
        }
    }
);

/**
 * Scheduled function to update all zone surge pricing
 * Runs every 5 minutes
 */
export const scheduledSurgeUpdate = functions.pubsub
    .schedule('every 5 minutes')
    .onRun(async (context) => {
        console.log('Running scheduled surge update');

        for (const zone of NAIROBI_ZONES) {
            try {
                // Reuse logic from updateZoneSurge
                const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

                const requestsSnapshot = await db
                    .collection('requests')
                    .where('status', 'in', ['pending', 'assigned'])
                    .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(fifteenMinAgo))
                    .get();

                let activeRequests = 0;
                requestsSnapshot.forEach(doc => {
                    const req = doc.data();
                    const loc = req.customerLocation?.coordinates;
                    if (loc) {
                        const dist = calculateDistance(loc.latitude, loc.longitude, zone.centerLat, zone.centerLng);
                        if (dist <= zone.radiusKm) {
                            activeRequests++;
                        }
                    }
                });

                const providersSnapshot = await db
                    .collection('providers')
                    .where('availability.isOnline', '==', true)
                    .get();

                let availableProviders = 0;
                providersSnapshot.forEach(doc => {
                    const prov = doc.data();
                    const loc = prov.availability?.currentLocation;
                    if (loc) {
                        const dist = calculateDistance(loc.latitude, loc.longitude, zone.centerLat, zone.centerLng);
                        if (dist <= zone.radiusKm) {
                            availableProviders++;
                        }
                    }
                });

                const demandSupplyRatio = availableProviders > 0
                    ? activeRequests / availableProviders
                    : activeRequests > 0 ? 10 : 1;

                let surgeMultiplier = SURGE_LIMITS.MIN_MULTIPLIER;
                if (demandSupplyRatio > SURGE_LIMITS.SURGE_THRESHOLD) {
                    const scaleFactor = (demandSupplyRatio - SURGE_LIMITS.SURGE_THRESHOLD) /
                        (SURGE_LIMITS.SURGE_THRESHOLD * 2);
                    surgeMultiplier = Math.min(
                        SURGE_LIMITS.MAX_MULTIPLIER,
                        SURGE_LIMITS.MIN_MULTIPLIER + scaleFactor * (SURGE_LIMITS.MAX_MULTIPLIER - SURGE_LIMITS.MIN_MULTIPLIER)
                    );
                    surgeMultiplier = Math.round(surgeMultiplier * 10) / 10;
                }

                const demandLevel = Math.min(10, Math.round((activeRequests / zone.avgDemand) * 5));
                const estimatedWaitTime = availableProviders > 0
                    ? Math.min(30, Math.max(5, Math.round(5 + (activeRequests / availableProviders) * 5)))
                    : 30;

                await db.collection('surge_zones').doc(zone.id).set({
                    zoneId: zone.id,
                    zoneName: zone.name,
                    centerLat: zone.centerLat,
                    centerLng: zone.centerLng,
                    radiusKm: zone.radiusKm,
                    currentDemand: demandLevel,
                    avgDemand: zone.avgDemand,
                    surgeActive: surgeMultiplier > 1.0,
                    surgeMultiplier,
                    lastUpdated: admin.firestore.Timestamp.now(),
                    activeRequests,
                    availableProviders,
                    estimatedWaitTime,
                });

            } catch (error) {
                console.error(`Error updating zone ${zone.id}:`, error);
            }
        }

        return null;
    });
