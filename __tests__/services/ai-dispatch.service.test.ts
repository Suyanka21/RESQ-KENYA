// ResQ Kenya - AI Dispatch Service Tests
// Phase 4: Testing AI dispatch algorithms

import {
    calculateDistanceScore,
    calculateRatingScore,
    calculateResponseTimeScore,
    calculateCompletionRateScore,
    calculateRecentActivityScore,
    calculateProviderScoreFactors,
    calculateWeightedScore,
    calculateProviderScore,
    getServiceWeights,
    rankProviders,
} from '../../services/ai-dispatch.service';
import { DEFAULT_DISPATCH_WEIGHTS } from '../../types/ai-dispatch';
import type { Provider, GeoLocation } from '../../types';

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
    addDoc: jest.fn(),
}));

describe('ai-dispatch.service', () => {

    describe('calculateDistanceScore', () => {
        it('should return 100 for 0 km distance', () => {
            expect(calculateDistanceScore(0)).toBe(100);
        });

        it('should return 0 for distance at max radius', () => {
            expect(calculateDistanceScore(15, 15)).toBe(0);
        });

        it('should return 0 for distance beyond max radius', () => {
            expect(calculateDistanceScore(20, 15)).toBe(0);
        });

        it('should return 50 for distance at half of radius', () => {
            expect(calculateDistanceScore(7.5, 15)).toBe(50);
        });

        it('should scale linearly with distance', () => {
            const score3km = calculateDistanceScore(3, 15);
            const score6km = calculateDistanceScore(6, 15);
            expect(score3km).toBeGreaterThan(score6km);
            expect(score3km).toBe(80);
            expect(score6km).toBe(60);
        });

        it('should handle negative distance as 0', () => {
            expect(calculateDistanceScore(-5)).toBe(100);
        });

        it('should use custom max distance', () => {
            expect(calculateDistanceScore(5, 10)).toBe(50);
            expect(calculateDistanceScore(5, 20)).toBe(75);
        });
    });

    describe('calculateRatingScore', () => {
        it('should convert 5-star rating to 100', () => {
            expect(calculateRatingScore(5)).toBe(100);
        });

        it('should convert 4-star rating to 80', () => {
            expect(calculateRatingScore(4)).toBe(80);
        });

        it('should convert 0-star rating to 0', () => {
            expect(calculateRatingScore(0)).toBe(0);
        });

        it('should handle decimal ratings', () => {
            expect(calculateRatingScore(4.5)).toBe(90);
            expect(calculateRatingScore(3.7)).toBe(74);
        });

        it('should clamp negative ratings to 0', () => {
            expect(calculateRatingScore(-1)).toBe(0);
        });

        it('should clamp ratings above 5 to 100', () => {
            expect(calculateRatingScore(6)).toBe(100);
        });
    });

    describe('calculateResponseTimeScore', () => {
        it('should return 100 for <= 30 seconds', () => {
            expect(calculateResponseTimeScore(30)).toBe(100);
            expect(calculateResponseTimeScore(15)).toBe(100);
            expect(calculateResponseTimeScore(0)).toBe(100);
        });

        it('should return 0 for >= 300 seconds', () => {
            expect(calculateResponseTimeScore(300)).toBe(0);
            expect(calculateResponseTimeScore(400)).toBe(0);
        });

        it('should scale between 30 and 300 seconds', () => {
            const score60 = calculateResponseTimeScore(60);
            const score150 = calculateResponseTimeScore(150);
            expect(score60).toBeGreaterThan(score150);
            expect(score60).toBeGreaterThan(0);
            expect(score150).toBeGreaterThan(0);
        });
    });

    describe('calculateCompletionRateScore', () => {
        it('should return same value for valid percentages', () => {
            expect(calculateCompletionRateScore(95)).toBe(95);
            expect(calculateCompletionRateScore(80)).toBe(80);
        });

        it('should clamp values above 100', () => {
            expect(calculateCompletionRateScore(110)).toBe(100);
        });

        it('should clamp negative values to 0', () => {
            expect(calculateCompletionRateScore(-10)).toBe(0);
        });
    });

    describe('calculateRecentActivityScore', () => {
        it('should return 50 for average activity', () => {
            expect(calculateRecentActivityScore(7, 14)).toBe(50);
        });

        it('should return 100 for expected activity', () => {
            expect(calculateRecentActivityScore(14, 14)).toBe(100);
        });

        it('should cap at 100 for high activity', () => {
            expect(calculateRecentActivityScore(30, 14)).toBe(100);
        });

        it('should return low score for low activity', () => {
            expect(calculateRecentActivityScore(2, 14)).toBeLessThan(50);
        });

        it('should handle zero expected jobs', () => {
            expect(calculateRecentActivityScore(5, 0)).toBe(50);
        });
    });

    describe('calculateProviderScoreFactors', () => {
        const mockProvider: Provider = {
            id: 'prov_001',
            phoneNumber: '+254700000001',
            displayName: 'Test Provider',
            serviceTypes: ['towing', 'battery'],
            rating: 4.5,
            totalServices: 100,
            verificationStatus: 'verified',
            vehicle: { type: 'Tow Truck', licensePlate: 'KAA 123A' },
            availability: {
                isOnline: true,
                currentLocation: { latitude: -1.2800, longitude: 36.8200 },
            },
            earnings: { today: 5000, thisWeek: 35000, thisMonth: 120000, allTime: 800000 },
        };

        const customerLocation: GeoLocation = {
            latitude: -1.2864,
            longitude: 36.8172,
        };

        it('should calculate all score factors', () => {
            const factors = calculateProviderScoreFactors(mockProvider, customerLocation);

            expect(factors).toHaveProperty('distance');
            expect(factors).toHaveProperty('rating');
            expect(factors).toHaveProperty('responseTime');
            expect(factors).toHaveProperty('completionRate');
            expect(factors).toHaveProperty('recentActivity');
        });

        it('should have all factors in 0-100 range', () => {
            const factors = calculateProviderScoreFactors(mockProvider, customerLocation);

            expect(factors.distance).toBeGreaterThanOrEqual(0);
            expect(factors.distance).toBeLessThanOrEqual(100);
            expect(factors.rating).toBeGreaterThanOrEqual(0);
            expect(factors.rating).toBeLessThanOrEqual(100);
            expect(factors.responseTime).toBeGreaterThanOrEqual(0);
            expect(factors.responseTime).toBeLessThanOrEqual(100);
            expect(factors.completionRate).toBeGreaterThanOrEqual(0);
            expect(factors.completionRate).toBeLessThanOrEqual(100);
            expect(factors.recentActivity).toBeGreaterThanOrEqual(0);
            expect(factors.recentActivity).toBeLessThanOrEqual(100);
        });

        it('should give high distance score for nearby provider', () => {
            const factors = calculateProviderScoreFactors(mockProvider, customerLocation);
            expect(factors.distance).toBeGreaterThan(80);
        });

        it('should convert rating correctly', () => {
            const factors = calculateProviderScoreFactors(mockProvider, customerLocation);
            expect(factors.rating).toBe(90); // 4.5 * 20 = 90
        });
    });

    describe('calculateWeightedScore', () => {
        it('should calculate weighted sum correctly', () => {
            const factors = {
                distance: 80,
                rating: 90,
                responseTime: 70,
                completionRate: 95,
                recentActivity: 60,
            };

            const score = calculateWeightedScore(factors, DEFAULT_DISPATCH_WEIGHTS);

            // 80*0.3 + 90*0.25 + 70*0.2 + 95*0.15 + 60*0.1 = 24 + 22.5 + 14 + 14.25 + 6 = 80.75
            expect(score).toBe(81); // Rounded
        });

        it('should respect different weights', () => {
            const factors = {
                distance: 100,
                rating: 0,
                responseTime: 0,
                completionRate: 0,
                recentActivity: 0,
            };

            // Only distance has value, so score = 100 * distance weight
            const score = calculateWeightedScore(factors, DEFAULT_DISPATCH_WEIGHTS);
            expect(score).toBe(30); // 100 * 0.30
        });

        it('should return 0 for all-zero factors', () => {
            const factors = {
                distance: 0,
                rating: 0,
                responseTime: 0,
                completionRate: 0,
                recentActivity: 0,
            };

            expect(calculateWeightedScore(factors, DEFAULT_DISPATCH_WEIGHTS)).toBe(0);
        });

        it('should return 100 for all-100 factors', () => {
            const factors = {
                distance: 100,
                rating: 100,
                responseTime: 100,
                completionRate: 100,
                recentActivity: 100,
            };

            expect(calculateWeightedScore(factors, DEFAULT_DISPATCH_WEIGHTS)).toBe(100);
        });
    });

    describe('calculateProviderScore', () => {
        const mockProvider: Provider = {
            id: 'prov_001',
            phoneNumber: '+254700000001',
            displayName: 'Test Provider',
            serviceTypes: ['towing'],
            rating: 4.5,
            totalServices: 100,
            verificationStatus: 'verified',
            vehicle: { type: 'Tow Truck', licensePlate: 'KAA 123A' },
            availability: {
                isOnline: true,
                currentLocation: { latitude: -1.2864, longitude: 36.8172 },
            },
            earnings: { today: 5000, thisWeek: 35000, thisMonth: 120000, allTime: 800000 },
        };

        const customerLocation: GeoLocation = {
            latitude: -1.2864,
            longitude: 36.8172,
        };

        it('should return complete provider score object', () => {
            const score = calculateProviderScore(mockProvider, customerLocation);

            expect(score.providerId).toBe('prov_001');
            expect(score.providerName).toBe('Test Provider');
            expect(score.serviceTypes).toEqual(['towing']);
            expect(score.totalScore).toBeGreaterThan(0);
            expect(score.factors).toBeDefined();
            expect(score.weights).toEqual(DEFAULT_DISPATCH_WEIGHTS);
            expect(score.isAvailable).toBe(true);
        });

        it('should calculate ETA', () => {
            const score = calculateProviderScore(mockProvider, customerLocation);
            expect(score.estimatedETA).toBeGreaterThanOrEqual(0);
        });

        it('should give high score for nearby, high-rated provider', () => {
            const score = calculateProviderScore(mockProvider, customerLocation);
            expect(score.totalScore).toBeGreaterThan(70);
        });
    });

    describe('getServiceWeights', () => {
        it('should return default weights for unknown service', () => {
            const weights = getServiceWeights('battery');
            expect(weights).toEqual(DEFAULT_DISPATCH_WEIGHTS);
        });

        it('should return ambulance-specific weights', () => {
            const weights = getServiceWeights('ambulance');
            expect(weights.distance).toBe(0.40); // Higher for emergency
            expect(weights.responseTime).toBe(0.30); // Higher for speed
        });

        it('should return towing-specific weights', () => {
            const weights = getServiceWeights('towing');
            expect(weights.distance).toBe(0.35);
            expect(weights.rating).toBe(0.20);
        });

        it('should have all weights sum to 1.0', () => {
            const ambulanceWeights = getServiceWeights('ambulance');
            const sum = ambulanceWeights.distance + ambulanceWeights.rating +
                ambulanceWeights.responseTime + ambulanceWeights.completionRate +
                ambulanceWeights.recentActivity;
            expect(Math.abs(sum - 1.0)).toBeLessThan(0.001);
        });
    });

    describe('rankProviders', () => {
        const providers: Provider[] = [
            {
                id: 'prov_far',
                phoneNumber: '+254700000001',
                displayName: 'Far Provider',
                serviceTypes: ['towing'],
                rating: 5.0,
                totalServices: 200,
                verificationStatus: 'verified',
                vehicle: { type: 'Tow Truck', licensePlate: 'KAB 123B' },
                availability: {
                    isOnline: true,
                    currentLocation: { latitude: -1.35, longitude: 36.90 }, // ~10km away
                },
                earnings: { today: 0, thisWeek: 0, thisMonth: 0, allTime: 0 },
            },
            {
                id: 'prov_near',
                phoneNumber: '+254700000002',
                displayName: 'Near Provider',
                serviceTypes: ['towing'],
                rating: 4.0,
                totalServices: 50,
                verificationStatus: 'verified',
                vehicle: { type: 'Tow Truck', licensePlate: 'KAC 123C' },
                availability: {
                    isOnline: true,
                    currentLocation: { latitude: -1.2864, longitude: 36.8172 }, // Same location
                },
                earnings: { today: 0, thisWeek: 0, thisMonth: 0, allTime: 0 },
            },
        ];

        const customerLocation: GeoLocation = {
            latitude: -1.2864,
            longitude: 36.8172,
        };

        it('should rank providers by score descending', () => {
            const ranked = rankProviders(providers, customerLocation);

            expect(ranked[0].totalScore).toBeGreaterThanOrEqual(ranked[1].totalScore);
        });

        it('should prefer nearby provider despite lower rating', () => {
            const ranked = rankProviders(providers, customerLocation);

            // Near provider should be ranked higher due to distance weight
            expect(ranked[0].providerId).toBe('prov_near');
        });

        it('should return all providers', () => {
            const ranked = rankProviders(providers, customerLocation);
            expect(ranked).toHaveLength(2);
        });

        it('should handle empty provider list', () => {
            const ranked = rankProviders([], customerLocation);
            expect(ranked).toHaveLength(0);
        });
    });
});
