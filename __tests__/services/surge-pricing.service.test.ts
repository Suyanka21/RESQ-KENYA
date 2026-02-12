// ResQ Kenya - Surge Pricing Service Tests
// Phase 4: Testing dynamic pricing algorithms

import {
    calculateBasePrice,
    applySticker,
    calculatePriceBreakdown,
    calculateSurgeFactors,
    calculateSurgeFromFactors,
    clearPricingCache,
} from '../../services/surge-pricing.service';
import { SURGE_LIMITS, KENYA_BASE_PRICING } from '../../types/pricing';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
    db: {},
    default: {},
}));

jest.mock('firebase/functions', () => ({
    getFunctions: jest.fn(() => ({})),
    httpsCallable: jest.fn(() => jest.fn()),
}));

jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(() => Promise.resolve({ forEach: jest.fn(), empty: true, docs: [] })),
    doc: jest.fn(),
    setDoc: jest.fn(),
    getDoc: jest.fn(() => Promise.resolve({ exists: () => false })),
}));

describe('surge-pricing.service', () => {

    beforeEach(() => {
        clearPricingCache();
    });

    describe('calculateBasePrice', () => {
        it('should return base price for towing', () => {
            const price = calculateBasePrice('towing', 0);
            expect(price).toBe(3000);
        });

        it('should add distance fee for towing', () => {
            const price = calculateBasePrice('towing', 10);
            // Base: 3000, Distance: 10 * 150 = 1500, Total = 4500
            expect(price).toBe(4500);
        });

        it('should cap at max charge', () => {
            const price = calculateBasePrice('towing', 100);
            // Would be 3000 + 15000 = 18000, but max is 15000
            expect(price).toBe(15000);
        });

        it('should use min charge when total is lower', () => {
            const price = calculateBasePrice('tire', 0);
            // Tire has no distance fee, just base price
            expect(price).toBeGreaterThanOrEqual(1500);
        });

        it('should return base prices for all service types', () => {
            const services = ['towing', 'tire', 'battery', 'fuel', 'diagnostics', 'ambulance'];

            services.forEach(service => {
                const price = calculateBasePrice(service as any, 0);
                expect(price).toBeGreaterThan(0);
            });
        });

        it('should return default for unknown service', () => {
            const price = calculateBasePrice('unknown' as any, 0);
            expect(price).toBe(2000); // Default fallback
        });
    });

    describe('applySticker', () => {
        it('should not change price with 1.0 multiplier', () => {
            expect(applySticker(3000, 1.0)).toBe(3000);
        });

        it('should increase price with surge multiplier', () => {
            expect(applySticker(3000, 1.5)).toBe(4500);
        });

        it('should apply max surge correctly', () => {
            expect(applySticker(3000, 2.5)).toBe(7500);
        });

        it('should round to nearest integer', () => {
            expect(applySticker(3000, 1.33)).toBe(3990);
        });

        it('should fall back to 1.0 for invalid multiplier', () => {
            expect(applySticker(3000, 0.5)).toBe(3000);
            expect(applySticker(3000, 3.0)).toBe(3000);
        });
    });

    describe('calculatePriceBreakdown', () => {
        it('should include all breakdown components', () => {
            const breakdown = calculatePriceBreakdown(3000, 1.0, 5);

            expect(breakdown).toHaveProperty('baseServiceFee');
            expect(breakdown).toHaveProperty('distanceFee');
            expect(breakdown).toHaveProperty('surgeAmount');
            expect(breakdown).toHaveProperty('platformFee');
            expect(breakdown).toHaveProperty('processingFee');
        });

        it('should have zero surge amount for no surge', () => {
            const breakdown = calculatePriceBreakdown(3000, 1.0, 5);
            expect(breakdown.surgeAmount).toBe(0);
        });

        it('should calculate surge amount correctly', () => {
            const breakdown = calculatePriceBreakdown(3000, 1.5, 5);
            // Surge amount = 3000 * (1.5 - 1) = 1500
            expect(breakdown.surgeAmount).toBe(1500);
        });

        it('should calculate platform fee as 20% of base', () => {
            const breakdown = calculatePriceBreakdown(3000, 1.0, 5);
            expect(breakdown.platformFee).toBe(600);
        });

        it('should calculate processing fee as 3% of total', () => {
            const breakdown = calculatePriceBreakdown(3000, 1.0, 0);
            // 3% of 3000 = 90
            expect(breakdown.processingFee).toBe(90);
        });
    });

    describe('calculateSurgeFactors', () => {
        it('should calculate demand level', () => {
            const factors = calculateSurgeFactors(20, 10, 5, 10, 'cbd');
            expect(factors.demandLevel).toBeGreaterThan(5);
        });

        it('should calculate supply level', () => {
            const factors = calculateSurgeFactors(10, 10, 5, 10, 'cbd');
            expect(factors.supplyLevel).toBeLessThan(10);
        });

        it('should calculate demand/supply ratio', () => {
            const factors = calculateSurgeFactors(10, 10, 5, 10, 'westlands');
            expect(factors.demandSupplyRatio).toBeGreaterThan(0);
        });

        it('should identify time slot category', () => {
            const factors = calculateSurgeFactors(10, 10, 5, 10, 'kilimani');
            expect(['peak', 'normal', 'off_peak']).toContain(factors.timeSlot);
        });

        it('should store zone correctly', () => {
            const factors = calculateSurgeFactors(10, 10, 5, 10, 'cbd');
            expect(factors.locationZone).toBe('cbd');
        });

        it('should handle zero supply', () => {
            const factors = calculateSurgeFactors(10, 10, 0, 10, 'cbd');
            expect(factors.demandSupplyRatio).toBeGreaterThan(1);
        });
    });

    describe('calculateSurgeFromFactors', () => {
        it('should return 1.0 for balanced demand/supply', () => {
            const factors = {
                demandLevel: 5,
                supplyLevel: 5,
                demandSupplyRatio: 1.0,
                timeSlot: 'normal' as const,
                dayOfWeek: 2,
                isWeekend: false,
                locationZone: 'cbd' as const,
                recentRequestCount: 10,
                availableProviders: 10,
            };

            const multiplier = calculateSurgeFromFactors(factors);
            expect(multiplier).toBe(1.0);
        });

        it('should increase for high demand/supply ratio', () => {
            const factors = {
                demandLevel: 10,
                supplyLevel: 2,
                demandSupplyRatio: 5.0,
                timeSlot: 'normal' as const,
                dayOfWeek: 2,
                isWeekend: false,
                locationZone: 'cbd' as const,
                recentRequestCount: 50,
                availableProviders: 5,
            };

            const multiplier = calculateSurgeFromFactors(factors);
            expect(multiplier).toBeGreaterThan(1.0);
        });

        it('should apply peak time multiplier', () => {
            const normalFactors = {
                demandLevel: 7,
                supplyLevel: 3,
                demandSupplyRatio: 2.5,
                timeSlot: 'normal' as const,
                dayOfWeek: 2,
                isWeekend: false,
                locationZone: 'cbd' as const,
                recentRequestCount: 25,
                availableProviders: 8,
            };

            const peakFactors = { ...normalFactors, timeSlot: 'peak' as const };

            const normalMultiplier = calculateSurgeFromFactors(normalFactors);
            const peakMultiplier = calculateSurgeFromFactors(peakFactors);

            expect(peakMultiplier).toBeGreaterThanOrEqual(normalMultiplier);
        });

        it('should apply off-peak discount', () => {
            const normalFactors = {
                demandLevel: 7,
                supplyLevel: 3,
                demandSupplyRatio: 2.5,
                timeSlot: 'normal' as const,
                dayOfWeek: 2,
                isWeekend: false,
                locationZone: 'cbd' as const,
                recentRequestCount: 25,
                availableProviders: 8,
            };

            const offPeakFactors = { ...normalFactors, timeSlot: 'off_peak' as const };

            const normalMultiplier = calculateSurgeFromFactors(normalFactors);
            const offPeakMultiplier = calculateSurgeFromFactors(offPeakFactors);

            expect(offPeakMultiplier).toBeLessThanOrEqual(normalMultiplier);
        });

        it('should apply weather multiplier for bad weather', () => {
            const normalFactors = {
                demandLevel: 7,
                supplyLevel: 3,
                demandSupplyRatio: 2.5,
                timeSlot: 'normal' as const,
                dayOfWeek: 2,
                isWeekend: false,
                locationZone: 'cbd' as const,
                recentRequestCount: 25,
                availableProviders: 8,
            };

            const rainFactors = { ...normalFactors, weather: 'heavy_rain' as const };

            const normalMultiplier = calculateSurgeFromFactors(normalFactors);
            const rainMultiplier = calculateSurgeFromFactors(rainFactors);

            expect(rainMultiplier).toBeGreaterThan(normalMultiplier);
        });

        it('should cap at max multiplier', () => {
            const extremeFactors = {
                demandLevel: 10,
                supplyLevel: 1,
                demandSupplyRatio: 10.0,
                timeSlot: 'peak' as const,
                dayOfWeek: 5,
                isWeekend: false,
                weather: 'storm' as const,
                locationZone: 'cbd' as const,
                recentRequestCount: 100,
                availableProviders: 2,
            };

            const multiplier = calculateSurgeFromFactors(extremeFactors);
            expect(multiplier).toBeLessThanOrEqual(SURGE_LIMITS.MAX_MULTIPLIER);
        });

        it('should never go below 1.0', () => {
            const lowDemandFactors = {
                demandLevel: 1,
                supplyLevel: 10,
                demandSupplyRatio: 0.1,
                timeSlot: 'off_peak' as const,
                dayOfWeek: 0,
                isWeekend: true,
                locationZone: 'karen' as const,
                recentRequestCount: 1,
                availableProviders: 20,
            };

            const multiplier = calculateSurgeFromFactors(lowDemandFactors);
            expect(multiplier).toBeGreaterThanOrEqual(SURGE_LIMITS.MIN_MULTIPLIER);
        });
    });

    describe('KENYA_BASE_PRICING', () => {
        it('should have 6 service types', () => {
            expect(KENYA_BASE_PRICING).toHaveLength(6);
        });

        it('should have ambulance as highest base price', () => {
            const ambulance = KENYA_BASE_PRICING.find(p => p.serviceType === 'ambulance');
            const others = KENYA_BASE_PRICING.filter(p => p.serviceType !== 'ambulance');

            others.forEach(other => {
                expect(ambulance!.basePrice).toBeGreaterThanOrEqual(other.basePrice);
            });
        });

        it('should have fuel as lowest base price', () => {
            const fuel = KENYA_BASE_PRICING.find(p => p.serviceType === 'fuel');
            expect(fuel!.basePrice).toBe(1000);
        });
    });
});
