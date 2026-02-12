// ResQ Kenya - Pricing Types Tests
// Phase 4: Testing dynamic pricing type definitions and validation

import {
    SURGE_LIMITS,
    SURGE_EXEMPT_SERVICES,
    KENYA_BASE_PRICING,
    calculateDemandLevel,
    calculateSupplyLevel,
    isSurgeExempt,
    getServiceBasePricing,
    validateSurgeMultiplier,
    validatePriceCalculation,
    validateDemandZone,
    calculateSurgeMultiplier,
    type PriceCalculation,
    type DemandZone,
    type ServiceBasePricing,
} from '../../types/pricing';

describe('pricing types', () => {

    describe('SURGE_LIMITS', () => {
        it('should have min multiplier of 1.0', () => {
            expect(SURGE_LIMITS.MIN_MULTIPLIER).toBe(1.0);
        });

        it('should have max multiplier of 2.5', () => {
            expect(SURGE_LIMITS.MAX_MULTIPLIER).toBe(2.5);
        });

        it('should have surge threshold of 2.0', () => {
            expect(SURGE_LIMITS.SURGE_THRESHOLD).toBe(2.0);
        });

        it('should have 15 min cool down', () => {
            expect(SURGE_LIMITS.COOL_DOWN_MINUTES).toBe(15);
        });
    });

    describe('calculateDemandLevel', () => {
        it('should return 5 when demand equals average', () => {
            expect(calculateDemandLevel(10, 10)).toBe(5);
        });

        it('should return higher value for above-average demand', () => {
            expect(calculateDemandLevel(20, 10)).toBeGreaterThan(5);
        });

        it('should return lower value for below-average demand', () => {
            expect(calculateDemandLevel(5, 10)).toBeLessThan(5);
        });

        it('should cap at 10', () => {
            expect(calculateDemandLevel(100, 10)).toBe(10);
        });

        it('should floor at 0', () => {
            expect(calculateDemandLevel(0, 10)).toBe(0);
        });

        it('should return 5 when avg is 0', () => {
            expect(calculateDemandLevel(10, 0)).toBe(5);
        });
    });

    describe('calculateSupplyLevel', () => {
        it('should return 5 when supply equals expected', () => {
            expect(calculateSupplyLevel(10, 10)).toBe(5);
        });

        it('should return higher value for above-expected supply', () => {
            expect(calculateSupplyLevel(20, 10)).toBeGreaterThan(5);
        });

        it('should return lower value for below-expected supply', () => {
            expect(calculateSupplyLevel(5, 10)).toBeLessThan(5);
        });

        it('should cap at 10', () => {
            expect(calculateSupplyLevel(100, 10)).toBe(10);
        });

        it('should floor at 0', () => {
            expect(calculateSupplyLevel(0, 10)).toBe(0);
        });

        it('should return 5 when expected is 0', () => {
            expect(calculateSupplyLevel(10, 0)).toBe(5);
        });
    });

    describe('SURGE_EXEMPT_SERVICES', () => {
        it('should include ambulance', () => {
            expect(SURGE_EXEMPT_SERVICES).toContain('ambulance');
        });

        it('should not include towing', () => {
            expect(SURGE_EXEMPT_SERVICES).not.toContain('towing');
        });
    });

    describe('isSurgeExempt', () => {
        it('should return true for ambulance', () => {
            expect(isSurgeExempt('ambulance')).toBe(true);
        });

        it('should return false for towing', () => {
            expect(isSurgeExempt('towing')).toBe(false);
        });

        it('should return false for battery', () => {
            expect(isSurgeExempt('battery')).toBe(false);
        });

        it('should return false for fuel', () => {
            expect(isSurgeExempt('fuel')).toBe(false);
        });
    });

    describe('KENYA_BASE_PRICING', () => {
        it('should have 6 service types', () => {
            expect(KENYA_BASE_PRICING).toHaveLength(6);
        });

        it('should have positive base prices for all services', () => {
            KENYA_BASE_PRICING.forEach(pricing => {
                expect(pricing.basePrice).toBeGreaterThan(0);
            });
        });

        it('should have min charge <= max charge', () => {
            KENYA_BASE_PRICING.forEach(pricing => {
                expect(pricing.minCharge).toBeLessThanOrEqual(pricing.maxCharge);
            });
        });

        it('should have peak multiplier >= 1.0', () => {
            KENYA_BASE_PRICING.forEach(pricing => {
                expect(pricing.peakMultiplier).toBeGreaterThanOrEqual(1.0);
            });
        });

        it('should have ambulance with peak multiplier of 1.0 (no surge)', () => {
            const ambulance = KENYA_BASE_PRICING.find(p => p.serviceType === 'ambulance');
            expect(ambulance?.peakMultiplier).toBe(1.0);
        });
    });

    describe('getServiceBasePricing', () => {
        it('should return pricing for towing', () => {
            const pricing = getServiceBasePricing('towing');
            expect(pricing).toBeDefined();
            expect(pricing?.serviceType).toBe('towing');
            expect(pricing?.basePrice).toBe(3000);
        });

        it('should return pricing for ambulance', () => {
            const pricing = getServiceBasePricing('ambulance');
            expect(pricing).toBeDefined();
            expect(pricing?.serviceType).toBe('ambulance');
        });

        it('should return undefined for unknown service', () => {
            const pricing = getServiceBasePricing('unknown' as any);
            expect(pricing).toBeUndefined();
        });
    });

    describe('validateSurgeMultiplier', () => {
        it('should return true for multiplier of 1.0', () => {
            expect(validateSurgeMultiplier(1.0)).toBe(true);
        });

        it('should return true for multiplier of 2.5', () => {
            expect(validateSurgeMultiplier(2.5)).toBe(true);
        });

        it('should return true for valid multiplier in range', () => {
            expect(validateSurgeMultiplier(1.5)).toBe(true);
            expect(validateSurgeMultiplier(2.0)).toBe(true);
        });

        it('should return false for multiplier below 1.0', () => {
            expect(validateSurgeMultiplier(0.9)).toBe(false);
            expect(validateSurgeMultiplier(0)).toBe(false);
        });

        it('should return false for multiplier above 2.5', () => {
            expect(validateSurgeMultiplier(2.6)).toBe(false);
            expect(validateSurgeMultiplier(3.0)).toBe(false);
        });
    });

    describe('calculateSurgeMultiplier', () => {
        it('should return 1.0 when ratio is at threshold', () => {
            expect(calculateSurgeMultiplier(2.0)).toBe(1.0);
        });

        it('should return 1.0 when ratio is below threshold', () => {
            expect(calculateSurgeMultiplier(1.5)).toBe(1.0);
            expect(calculateSurgeMultiplier(1.0)).toBe(1.0);
        });

        it('should return higher multiplier for higher ratio', () => {
            const lowRatio = calculateSurgeMultiplier(2.5);
            const highRatio = calculateSurgeMultiplier(4.0);
            expect(highRatio).toBeGreaterThan(lowRatio);
        });

        it('should cap at max multiplier', () => {
            expect(calculateSurgeMultiplier(100)).toBe(2.5);
        });

        it('should return value between min and max', () => {
            const result = calculateSurgeMultiplier(3.0);
            expect(result).toBeGreaterThanOrEqual(1.0);
            expect(result).toBeLessThanOrEqual(2.5);
        });
    });

    describe('validatePriceCalculation', () => {
        const validCalculation: PriceCalculation = {
            serviceType: 'towing',
            basePrice: 3000,
            surgeMultiplier: 1.5,
            surgeActive: true,
            adjustedPrice: 4500,
            breakdown: {
                baseServiceFee: 3000,
                distanceFee: 500,
                surgeAmount: 500,
                platformFee: 450,
                processingFee: 50,
            },
            providerEarnings: 2250,
            platformEarnings: 750,
            currency: 'KES',
            validUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 min from now
            quoteId: 'quote_123',
        };

        it('should return valid for correct calculation', () => {
            const result = validatePriceCalculation(validCalculation);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should return error for negative base price', () => {
            const invalid = { ...validCalculation, basePrice: -100 };
            const result = validatePriceCalculation(invalid);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Base price cannot be negative');
        });

        it('should return error for surge multiplier out of range', () => {
            const invalid = { ...validCalculation, surgeMultiplier: 3.0 };
            const result = validatePriceCalculation(invalid);
            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('Surge multiplier must be between');
        });

        it('should return error when breakdown does not sum correctly', () => {
            const invalid = {
                ...validCalculation,
                breakdown: {
                    ...validCalculation.breakdown,
                    surgeAmount: 10000, // Wrong amount
                },
            };
            const result = validatePriceCalculation(invalid);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Breakdown does not sum to adjusted price');
        });

        it('should return error for expired quote', () => {
            const invalid = {
                ...validCalculation,
                validUntil: new Date(Date.now() - 1000), // Expired
            };
            const result = validatePriceCalculation(invalid);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Price quote has expired');
        });
    });

    describe('validateDemandZone', () => {
        const validZone: DemandZone = {
            zoneId: 'cbd',
            zoneName: 'CBD',
            centerLat: -1.2864,
            centerLng: 36.8172,
            radiusKm: 2.5,
            currentDemand: 7,
            avgDemand: 5,
            surgeActive: true,
            surgeMultiplier: 1.5,
            lastUpdated: new Date(),
            activeRequests: 15,
            availableProviders: 8,
            estimatedWaitTime: 5,
        };

        it('should return true for valid zone', () => {
            expect(validateDemandZone(validZone)).toBe(true);
        });

        it('should return false for negative demand', () => {
            const invalid = { ...validZone, currentDemand: -1 };
            expect(validateDemandZone(invalid)).toBe(false);
        });

        it('should return false for demand > 10', () => {
            const invalid = { ...validZone, currentDemand: 11 };
            expect(validateDemandZone(invalid)).toBe(false);
        });

        it('should return false for surge multiplier out of range', () => {
            const invalid = { ...validZone, surgeMultiplier: 3.0 };
            expect(validateDemandZone(invalid)).toBe(false);
        });

        it('should return false for negative providers', () => {
            const invalid = { ...validZone, availableProviders: -1 };
            expect(validateDemandZone(invalid)).toBe(false);
        });

        it('should return false for negative wait time', () => {
            const invalid = { ...validZone, estimatedWaitTime: -5 };
            expect(validateDemandZone(invalid)).toBe(false);
        });

        it('should return true for boundary values', () => {
            const boundary = {
                ...validZone,
                currentDemand: 0,
                surgeMultiplier: 1.0,
                availableProviders: 0,
                estimatedWaitTime: 0,
            };
            expect(validateDemandZone(boundary)).toBe(true);
        });
    });
});
