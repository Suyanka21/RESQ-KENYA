// ResQ Kenya - AI Dispatch Types Tests
// Phase 4: Testing AI dispatch type definitions and validation

import {
    DEFAULT_DISPATCH_WEIGHTS,
    getConfidenceLevel,
    getTimeSlot,
    NAIROBI_ZONES,
    getZoneFromCoordinates,
    validateDispatchWeights,
    validateProviderScoreFactors,
    validateGeoLocation,
    validateDispatchRequest,
    type DispatchWeights,
    type ProviderScoreFactors,
    type DispatchRequest,
    type NairobiZone,
    type TimeSlot,
    type ConfidenceLevel,
} from '../../types/ai-dispatch';

describe('ai-dispatch types', () => {

    describe('DEFAULT_DISPATCH_WEIGHTS', () => {
        it('should sum to 1.0', () => {
            const sum = DEFAULT_DISPATCH_WEIGHTS.distance +
                DEFAULT_DISPATCH_WEIGHTS.rating +
                DEFAULT_DISPATCH_WEIGHTS.responseTime +
                DEFAULT_DISPATCH_WEIGHTS.completionRate +
                DEFAULT_DISPATCH_WEIGHTS.recentActivity;
            expect(Math.abs(sum - 1.0)).toBeLessThan(0.001);
        });

        it('should have distance as highest weight', () => {
            const weights = Object.entries(DEFAULT_DISPATCH_WEIGHTS);
            const maxWeight = weights.reduce((a, b) => a[1] > b[1] ? a : b);
            expect(maxWeight[0]).toBe('distance');
        });

        it('should have all positive weights', () => {
            Object.values(DEFAULT_DISPATCH_WEIGHTS).forEach(weight => {
                expect(weight).toBeGreaterThan(0);
            });
        });
    });

    describe('getConfidenceLevel', () => {
        it('should return very_high for confidence >= 0.9', () => {
            expect(getConfidenceLevel(0.9)).toBe('very_high');
            expect(getConfidenceLevel(0.95)).toBe('very_high');
            expect(getConfidenceLevel(1.0)).toBe('very_high');
        });

        it('should return high for confidence >= 0.7', () => {
            expect(getConfidenceLevel(0.7)).toBe('high');
            expect(getConfidenceLevel(0.85)).toBe('high');
        });

        it('should return medium for confidence >= 0.5', () => {
            expect(getConfidenceLevel(0.5)).toBe('medium');
            expect(getConfidenceLevel(0.65)).toBe('medium');
        });

        it('should return low for confidence < 0.5', () => {
            expect(getConfidenceLevel(0.4)).toBe('low');
            expect(getConfidenceLevel(0.1)).toBe('low');
            expect(getConfidenceLevel(0)).toBe('low');
        });
    });

    describe('getTimeSlot', () => {
        it('should return early_morning for hours 5-7', () => {
            expect(getTimeSlot(5)).toBe('early_morning');
            expect(getTimeSlot(6)).toBe('early_morning');
            expect(getTimeSlot(7)).toBe('early_morning');
        });

        it('should return morning for hours 8-11', () => {
            expect(getTimeSlot(8)).toBe('morning');
            expect(getTimeSlot(11)).toBe('morning');
        });

        it('should return afternoon for hours 12-16', () => {
            expect(getTimeSlot(12)).toBe('afternoon');
            expect(getTimeSlot(16)).toBe('afternoon');
        });

        it('should return evening for hours 17-20', () => {
            expect(getTimeSlot(17)).toBe('evening');
            expect(getTimeSlot(20)).toBe('evening');
        });

        it('should return night for hours 21-4', () => {
            expect(getTimeSlot(21)).toBe('night');
            expect(getTimeSlot(0)).toBe('night');
            expect(getTimeSlot(4)).toBe('night');
        });
    });

    describe('NAIROBI_ZONES', () => {
        it('should have 12 defined zones', () => {
            expect(NAIROBI_ZONES).toHaveLength(12);
        });

        it('should have CBD as first zone', () => {
            expect(NAIROBI_ZONES[0].id).toBe('cbd');
            expect(NAIROBI_ZONES[0].name).toBe('CBD');
        });

        it('should have valid coordinates for all zones', () => {
            NAIROBI_ZONES.forEach(zone => {
                expect(zone.centerLat).toBeGreaterThan(-2);
                expect(zone.centerLat).toBeLessThan(0);
                expect(zone.centerLng).toBeGreaterThan(36);
                expect(zone.centerLng).toBeLessThan(38);
            });
        });

        it('should have positive radius for all zones', () => {
            NAIROBI_ZONES.forEach(zone => {
                expect(zone.radiusKm).toBeGreaterThan(0);
            });
        });

        it('should have peak hours for all zones', () => {
            NAIROBI_ZONES.forEach(zone => {
                expect(zone.peakHours.length).toBeGreaterThan(0);
                zone.peakHours.forEach(hour => {
                    expect(hour).toBeGreaterThanOrEqual(0);
                    expect(hour).toBeLessThanOrEqual(23);
                });
            });
        });

        it('should have common services for all zones', () => {
            NAIROBI_ZONES.forEach(zone => {
                expect(zone.commonServices.length).toBeGreaterThan(0);
            });
        });
    });

    describe('getZoneFromCoordinates', () => {
        it('should return cbd for CBD center coordinates', () => {
            expect(getZoneFromCoordinates(-1.2864, 36.8172)).toBe('cbd');
        });

        it('should return westlands for Westlands center', () => {
            expect(getZoneFromCoordinates(-1.2674, 36.8048)).toBe('westlands');
        });

        it('should return other for coordinates outside all zones', () => {
            expect(getZoneFromCoordinates(-2.0, 37.0)).toBe('other');
            expect(getZoneFromCoordinates(0, 0)).toBe('other');
        });

        it('should handle edge cases at zone boundaries', () => {
            // Slightly outside CBD but close
            const zone = getZoneFromCoordinates(-1.28, 36.81);
            expect(['cbd', 'upperhill', 'other']).toContain(zone);
        });
    });

    describe('validateDispatchWeights', () => {
        it('should return true for valid weights summing to 1.0', () => {
            const weights: DispatchWeights = {
                distance: 0.3,
                rating: 0.3,
                responseTime: 0.2,
                completionRate: 0.1,
                recentActivity: 0.1,
            };
            expect(validateDispatchWeights(weights)).toBe(true);
        });

        it('should return true for default weights', () => {
            expect(validateDispatchWeights(DEFAULT_DISPATCH_WEIGHTS)).toBe(true);
        });

        it('should return false for weights not summing to 1.0', () => {
            const invalidWeights: DispatchWeights = {
                distance: 0.5,
                rating: 0.5,
                responseTime: 0.5,
                completionRate: 0.5,
                recentActivity: 0.5,
            };
            expect(validateDispatchWeights(invalidWeights)).toBe(false);
        });

        it('should handle floating point precision', () => {
            const weights: DispatchWeights = {
                distance: 0.33,
                rating: 0.33,
                responseTime: 0.33,
                completionRate: 0.005,
                recentActivity: 0.005,
            };
            expect(validateDispatchWeights(weights)).toBe(true);
        });
    });

    describe('validateProviderScoreFactors', () => {
        it('should return true for valid factors in range 0-100', () => {
            const factors: ProviderScoreFactors = {
                distance: 85,
                rating: 90,
                responseTime: 75,
                completionRate: 95,
                recentActivity: 60,
            };
            expect(validateProviderScoreFactors(factors)).toBe(true);
        });

        it('should return true for boundary values', () => {
            const minFactors: ProviderScoreFactors = {
                distance: 0,
                rating: 0,
                responseTime: 0,
                completionRate: 0,
                recentActivity: 0,
            };
            expect(validateProviderScoreFactors(minFactors)).toBe(true);

            const maxFactors: ProviderScoreFactors = {
                distance: 100,
                rating: 100,
                responseTime: 100,
                completionRate: 100,
                recentActivity: 100,
            };
            expect(validateProviderScoreFactors(maxFactors)).toBe(true);
        });

        it('should return false for negative values', () => {
            const invalidFactors: ProviderScoreFactors = {
                distance: -5,
                rating: 90,
                responseTime: 75,
                completionRate: 95,
                recentActivity: 60,
            };
            expect(validateProviderScoreFactors(invalidFactors)).toBe(false);
        });

        it('should return false for values over 100', () => {
            const invalidFactors: ProviderScoreFactors = {
                distance: 85,
                rating: 150,
                responseTime: 75,
                completionRate: 95,
                recentActivity: 60,
            };
            expect(validateProviderScoreFactors(invalidFactors)).toBe(false);
        });
    });

    describe('validateGeoLocation', () => {
        it('should return true for valid Nairobi coordinates', () => {
            expect(validateGeoLocation({ latitude: -1.2864, longitude: 36.8172 })).toBe(true);
        });

        it('should return true for boundary latitude values', () => {
            expect(validateGeoLocation({ latitude: -90, longitude: 0 })).toBe(true);
            expect(validateGeoLocation({ latitude: 90, longitude: 0 })).toBe(true);
        });

        it('should return true for boundary longitude values', () => {
            expect(validateGeoLocation({ latitude: 0, longitude: -180 })).toBe(true);
            expect(validateGeoLocation({ latitude: 0, longitude: 180 })).toBe(true);
        });

        it('should return false for invalid latitude', () => {
            expect(validateGeoLocation({ latitude: -95, longitude: 36 })).toBe(false);
            expect(validateGeoLocation({ latitude: 95, longitude: 36 })).toBe(false);
        });

        it('should return false for invalid longitude', () => {
            expect(validateGeoLocation({ latitude: -1, longitude: -185 })).toBe(false);
            expect(validateGeoLocation({ latitude: -1, longitude: 185 })).toBe(false);
        });
    });

    describe('validateDispatchRequest', () => {
        const validRequest: DispatchRequest = {
            requestId: 'req_123',
            serviceType: 'towing',
            customerLocation: { latitude: -1.2864, longitude: 36.8172 },
            urgencyLevel: 'normal',
        };

        it('should return valid for complete request', () => {
            const result = validateDispatchRequest(validRequest);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should return error for missing request ID', () => {
            const request = { ...validRequest, requestId: '' };
            const result = validateDispatchRequest(request);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Request ID is required');
        });

        it('should return error for missing service type', () => {
            const request = { ...validRequest, serviceType: '' as any };
            const result = validateDispatchRequest(request);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Service type is required');
        });

        it('should return error for missing customer location', () => {
            const request = { ...validRequest, customerLocation: undefined as any };
            const result = validateDispatchRequest(request);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Customer location is required');
        });

        it('should return error for invalid customer location', () => {
            const request = { ...validRequest, customerLocation: { latitude: 95, longitude: 36 } };
            const result = validateDispatchRequest(request);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Invalid customer location coordinates');
        });

        it('should validate maxDistanceKm range', () => {
            const tooSmall = { ...validRequest, maxDistanceKm: 0 };
            expect(validateDispatchRequest(tooSmall).valid).toBe(false);

            const tooLarge = { ...validRequest, maxDistanceKm: 100 };
            expect(validateDispatchRequest(tooLarge).valid).toBe(false);

            const valid = { ...validRequest, maxDistanceKm: 15 };
            expect(validateDispatchRequest(valid).valid).toBe(true);
        });

        it('should validate maxResults range', () => {
            const tooSmall = { ...validRequest, maxResults: 0 };
            expect(validateDispatchRequest(tooSmall).valid).toBe(false);

            const tooLarge = { ...validRequest, maxResults: 25 };
            expect(validateDispatchRequest(tooLarge).valid).toBe(false);

            const valid = { ...validRequest, maxResults: 10 };
            expect(validateDispatchRequest(valid).valid).toBe(true);
        });

        it('should allow optional fields', () => {
            const requestWithOptionals: DispatchRequest = {
                ...validRequest,
                preferredProviderId: 'prov_456',
                maxDistanceKm: 20,
                maxResults: 5,
                excludeProviders: ['prov_789'],
            };
            const result = validateDispatchRequest(requestWithOptionals);
            expect(result.valid).toBe(true);
        });
    });
});
