// ResQ Kenya - Analytics Types Tests
// Phase 4: Testing predictive analytics type definitions and validation

import {
    CUSTOMER_CHURN_FACTORS,
    PROVIDER_CHURN_FACTORS,
    getRiskLevel,
    validateChurnRisk,
    validateHourlyPrediction,
    validateUtilizationRate,
    getEfficiencyRating,
    type ChurnRisk,
    type HourlyPrediction,
    type RiskLevel,
    type ProviderUtilization,
} from '../../types/analytics';

describe('analytics types', () => {

    describe('CUSTOMER_CHURN_FACTORS', () => {
        it('should have 7 churn factors', () => {
            expect(CUSTOMER_CHURN_FACTORS).toHaveLength(7);
        });

        it('should have weights summing to 1.0', () => {
            const sum = CUSTOMER_CHURN_FACTORS.reduce((acc, f) => acc + f.weight, 0);
            expect(Math.abs(sum - 1.0)).toBeLessThan(0.001);
        });

        it('should have days_inactive as highest weight', () => {
            const maxFactor = [...CUSTOMER_CHURN_FACTORS].sort((a, b) => b.weight - a.weight)[0];
            expect(maxFactor.factor).toBe('days_inactive');
        });

        it('should have positive thresholds', () => {
            CUSTOMER_CHURN_FACTORS.forEach(factor => {
                expect(factor.threshold).toBeGreaterThan(0);
            });
        });
    });

    describe('PROVIDER_CHURN_FACTORS', () => {
        it('should have 7 churn factors', () => {
            expect(PROVIDER_CHURN_FACTORS).toHaveLength(7);
        });

        it('should have weights summing to 1.0', () => {
            const sum = PROVIDER_CHURN_FACTORS.reduce((acc, f) => acc + f.weight, 0);
            expect(Math.abs(sum - 1.0)).toBeLessThan(0.001);
        });

        it('should have days_offline as highest weight', () => {
            const maxFactor = [...PROVIDER_CHURN_FACTORS].sort((a, b) => b.weight - a.weight)[0];
            expect(maxFactor.factor).toBe('days_offline');
        });
    });

    describe('getRiskLevel', () => {
        it('should return critical for score >= 80', () => {
            expect(getRiskLevel(80)).toBe('critical');
            expect(getRiskLevel(95)).toBe('critical');
            expect(getRiskLevel(100)).toBe('critical');
        });

        it('should return high for score >= 60', () => {
            expect(getRiskLevel(60)).toBe('high');
            expect(getRiskLevel(75)).toBe('high');
        });

        it('should return medium for score >= 40', () => {
            expect(getRiskLevel(40)).toBe('medium');
            expect(getRiskLevel(55)).toBe('medium');
        });

        it('should return low for score < 40', () => {
            expect(getRiskLevel(39)).toBe('low');
            expect(getRiskLevel(20)).toBe('low');
            expect(getRiskLevel(0)).toBe('low');
        });
    });

    describe('validateChurnRisk', () => {
        const validChurnRisk: ChurnRisk = {
            userId: 'user_123',
            userName: 'John Doe',
            userType: 'customer',
            riskScore: 65,
            riskLevel: 'high',
            factors: [
                {
                    factor: 'days_inactive',
                    weight: 0.25,
                    currentValue: 45,
                    thresholdValue: 30,
                    isRiskIndicator: true,
                    description: 'User has been inactive for 45 days',
                },
            ],
            highestRiskFactor: 'days_inactive',
            suggestedActions: ['Send re-engagement email', 'Offer discount'],
            lastActive: new Date(),
            accountAge: 180,
            totalTransactions: 12,
            lifetimeValue: 45000,
            assessedAt: new Date(),
        };

        it('should return valid for correct churn risk', () => {
            const result = validateChurnRisk(validChurnRisk);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should return error for score below 0', () => {
            const invalid = { ...validChurnRisk, riskScore: -10 };
            const result = validateChurnRisk(invalid);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Risk score must be between 0 and 100');
        });

        it('should return error for score above 100', () => {
            const invalid = { ...validChurnRisk, riskScore: 110 };
            const result = validateChurnRisk(invalid);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Risk score must be between 0 and 100');
        });

        it('should return error for invalid user type', () => {
            const invalid = { ...validChurnRisk, userType: 'admin' as any };
            const result = validateChurnRisk(invalid);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('User type must be customer or provider');
        });

        it('should return error for mismatched risk level', () => {
            const invalid = { ...validChurnRisk, riskLevel: 'low' as RiskLevel };
            const result = validateChurnRisk(invalid);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Risk level does not match risk score');
        });

        it('should return error for empty factors array', () => {
            const invalid = { ...validChurnRisk, factors: [] };
            const result = validateChurnRisk(invalid);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('At least one churn factor is required');
        });

        it('should validate provider user type', () => {
            const providerRisk = {
                ...validChurnRisk,
                userType: 'provider' as const,
            };
            const result = validateChurnRisk(providerRisk);
            expect(result.valid).toBe(true);
        });
    });

    describe('validateHourlyPrediction', () => {
        const validPrediction: HourlyPrediction = {
            hour: 14,
            expectedRequests: 25,
            confidence: 0.85,
            recommendedProviders: 8,
            historicalAvg: 22,
            trend: 'increasing',
        };

        it('should return true for valid prediction', () => {
            expect(validateHourlyPrediction(validPrediction)).toBe(true);
        });

        it('should return false for hour < 0', () => {
            const invalid = { ...validPrediction, hour: -1 };
            expect(validateHourlyPrediction(invalid)).toBe(false);
        });

        it('should return false for hour > 23', () => {
            const invalid = { ...validPrediction, hour: 24 };
            expect(validateHourlyPrediction(invalid)).toBe(false);
        });

        it('should return false for negative expected requests', () => {
            const invalid = { ...validPrediction, expectedRequests: -5 };
            expect(validateHourlyPrediction(invalid)).toBe(false);
        });

        it('should return false for confidence < 0', () => {
            const invalid = { ...validPrediction, confidence: -0.1 };
            expect(validateHourlyPrediction(invalid)).toBe(false);
        });

        it('should return false for confidence > 1', () => {
            const invalid = { ...validPrediction, confidence: 1.5 };
            expect(validateHourlyPrediction(invalid)).toBe(false);
        });

        it('should return false for negative recommended providers', () => {
            const invalid = { ...validPrediction, recommendedProviders: -2 };
            expect(validateHourlyPrediction(invalid)).toBe(false);
        });

        it('should return true for boundary values', () => {
            const boundary = {
                ...validPrediction,
                hour: 0,
                expectedRequests: 0,
                confidence: 0,
                recommendedProviders: 0,
            };
            expect(validateHourlyPrediction(boundary)).toBe(true);
        });

        it('should return true for max boundary values', () => {
            const boundary = {
                ...validPrediction,
                hour: 23,
                confidence: 1,
            };
            expect(validateHourlyPrediction(boundary)).toBe(true);
        });
    });

    describe('validateUtilizationRate', () => {
        it('should return true for 0%', () => {
            expect(validateUtilizationRate(0)).toBe(true);
        });

        it('should return true for 100%', () => {
            expect(validateUtilizationRate(100)).toBe(true);
        });

        it('should return true for values in range', () => {
            expect(validateUtilizationRate(50)).toBe(true);
            expect(validateUtilizationRate(75)).toBe(true);
            expect(validateUtilizationRate(25)).toBe(true);
        });

        it('should return false for negative values', () => {
            expect(validateUtilizationRate(-1)).toBe(false);
            expect(validateUtilizationRate(-50)).toBe(false);
        });

        it('should return false for values > 100', () => {
            expect(validateUtilizationRate(101)).toBe(false);
            expect(validateUtilizationRate(150)).toBe(false);
        });
    });

    describe('getEfficiencyRating', () => {
        it('should return excellent for utilization >= 80', () => {
            expect(getEfficiencyRating(80)).toBe('excellent');
            expect(getEfficiencyRating(90)).toBe('excellent');
            expect(getEfficiencyRating(100)).toBe('excellent');
        });

        it('should return good for utilization >= 60', () => {
            expect(getEfficiencyRating(60)).toBe('good');
            expect(getEfficiencyRating(75)).toBe('good');
        });

        it('should return average for utilization >= 40', () => {
            expect(getEfficiencyRating(40)).toBe('average');
            expect(getEfficiencyRating(55)).toBe('average');
        });

        it('should return below_average for utilization >= 20', () => {
            expect(getEfficiencyRating(20)).toBe('below_average');
            expect(getEfficiencyRating(35)).toBe('below_average');
        });

        it('should return poor for utilization < 20', () => {
            expect(getEfficiencyRating(19)).toBe('poor');
            expect(getEfficiencyRating(10)).toBe('poor');
            expect(getEfficiencyRating(0)).toBe('poor');
        });
    });

    describe('Risk Level Boundaries', () => {
        it('should have consistent boundaries', () => {
            // Test that boundaries don't overlap
            expect(getRiskLevel(79)).toBe('high');
            expect(getRiskLevel(80)).toBe('critical');

            expect(getRiskLevel(59)).toBe('medium');
            expect(getRiskLevel(60)).toBe('high');

            expect(getRiskLevel(39)).toBe('low');
            expect(getRiskLevel(40)).toBe('medium');
        });
    });

    describe('Efficiency Rating Boundaries', () => {
        it('should have consistent boundaries', () => {
            // Test that boundaries don't overlap
            expect(getEfficiencyRating(79)).toBe('good');
            expect(getEfficiencyRating(80)).toBe('excellent');

            expect(getEfficiencyRating(59)).toBe('average');
            expect(getEfficiencyRating(60)).toBe('good');

            expect(getEfficiencyRating(39)).toBe('below_average');
            expect(getEfficiencyRating(40)).toBe('average');

            expect(getEfficiencyRating(19)).toBe('poor');
            expect(getEfficiencyRating(20)).toBe('below_average');
        });
    });
});
