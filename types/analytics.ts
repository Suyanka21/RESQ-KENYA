// ResQ Kenya - Predictive Analytics Types
// Phase 4: Demand Forecasting, Churn Prediction, Provider Optimization

import type { ServiceType } from '../theme/voltage-premium';
import type { NairobiZone, TimeSlot } from './ai-dispatch';

// ============================================
// Demand Forecasting Types
// ============================================

/**
 * Hourly prediction for a specific zone and service
 */
export interface HourlyPrediction {
    hour: number;                  // 0-23
    expectedRequests: number;      // Predicted number of requests
    confidence: number;            // 0-1 confidence level
    recommendedProviders: number;  // Suggested provider count
    historicalAvg: number;         // Historical average for comparison
    trend: 'increasing' | 'stable' | 'decreasing';
}

/**
 * Daily forecast for demand planning
 */
export interface DailyForecast {
    date: Date;
    zone: NairobiZone;
    serviceType: ServiceType;
    totalExpectedRequests: number;
    peakHours: number[];
    minHours: number[];
    hourlyBreakdown: HourlyPrediction[];
    accuracy: number;              // Historical accuracy of predictions
}

/**
 * Weekly forecast summary
 */
export interface WeeklyForecast {
    startDate: Date;
    endDate: Date;
    zone: NairobiZone;
    dailyForecasts: DailyForecast[];
    weeklyTotal: number;
    peakDay: number;               // Day of week with highest demand
    lowDay: number;                // Day of week with lowest demand
}

/**
 * Demand pattern analysis
 */
export interface DemandPattern {
    zone: NairobiZone;
    serviceType: ServiceType;
    analysisWindow: 'week' | 'month' | 'quarter';
    patterns: {
        hourlyPattern: number[];     // 24 values, avg requests per hour
        dailyPattern: number[];      // 7 values, avg requests per day
        monthlyPattern: number[];    // 12 values, avg requests per month
    };
    seasonalFactors: {
        rainySeasonMultiplier: number;
        drySeasonMultiplier: number;
        holidayMultiplier: number;
    };
    trendDirection: 'growth' | 'stable' | 'decline';
    trendPercent: number;          // Month-over-month change
}

/**
 * Coverage alert for low provider availability
 */
export interface CoverageAlert {
    alertId: string;
    zone: NairobiZone;
    serviceType: ServiceType;
    severity: 'warning' | 'critical';
    expectedDemand: number;
    availableProviders: number;
    recommendedAction: string;
    alertTime: Date;
    resolvedAt?: Date;
}

// ============================================
// Churn Prediction Types
// ============================================

/**
 * Risk level categories
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Factors contributing to churn risk
 */
export interface ChurnFactor {
    factor: string;
    weight: number;                // 0-1 importance
    currentValue: number;
    thresholdValue: number;
    isRiskIndicator: boolean;
    description: string;
}

/**
 * Churn factors for customers
 */
export const CUSTOMER_CHURN_FACTORS = [
    { factor: 'days_inactive', weight: 0.25, threshold: 30 },
    { factor: 'declining_usage', weight: 0.20, threshold: 0.5 },    // 50% decline
    { factor: 'support_complaints', weight: 0.15, threshold: 2 },
    { factor: 'payment_failures', weight: 0.15, threshold: 1 },
    { factor: 'low_ratings_given', weight: 0.10, threshold: 2.5 },
    { factor: 'cancelled_requests', weight: 0.10, threshold: 3 },
    { factor: 'response_time_issues', weight: 0.05, threshold: 2 },
] as const;

/**
 * Churn factors for providers
 */
export const PROVIDER_CHURN_FACTORS = [
    { factor: 'days_offline', weight: 0.25, threshold: 7 },
    { factor: 'declining_acceptance', weight: 0.20, threshold: 0.7 },
    { factor: 'declining_ratings', weight: 0.15, threshold: 4.0 },
    { factor: 'earnings_decline', weight: 0.15, threshold: 0.3 },   // 30% decline
    { factor: 'support_complaints', weight: 0.10, threshold: 2 },
    { factor: 'late_arrivals', weight: 0.10, threshold: 3 },
    { factor: 'incomplete_profile', weight: 0.05, threshold: 1 },
] as const;

/**
 * Churn risk assessment for a user
 */
export interface ChurnRisk {
    userId: string;
    userName?: string;
    userType: 'customer' | 'provider';
    riskScore: number;             // 0-100
    riskLevel: RiskLevel;
    factors: ChurnFactor[];
    highestRiskFactor: string;
    suggestedActions: string[];
    lastActive: Date;
    accountAge: number;            // Days since signup
    totalTransactions: number;
    lifetimeValue: number;         // Total revenue from user
    predictedChurnDate?: Date;
    assessedAt: Date;
}

/**
 * Get risk level from score
 */
export function getRiskLevel(score: number): RiskLevel {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
}

/**
 * Retention campaign for at-risk users
 */
export interface RetentionCampaign {
    campaignId: string;
    name: string;
    targetRiskLevel: RiskLevel[];
    targetUserType: 'customer' | 'provider' | 'both';
    actions: RetentionAction[];
    startDate: Date;
    endDate?: Date;
    targetUsers: number;
    convertedUsers: number;
    conversionRate: number;
}

/**
 * Specific retention action
 */
export interface RetentionAction {
    actionType: 'discount' | 'notification' | 'call' | 'email' | 'bonus';
    message?: string;
    discountPercent?: number;
    bonusAmount?: number;
    scheduledFor?: Date;
    executed: boolean;
    executedAt?: Date;
    result?: 'converted' | 'no_response' | 'churned';
}

// ============================================
// Provider Optimization Types
// ============================================

/**
 * Provider utilization metrics
 */
export interface ProviderUtilization {
    providerId: string;
    providerName: string;
    period: 'day' | 'week' | 'month';
    utilizationRate: number;       // % of online time with active jobs
    onlineHours: number;           // Total hours online
    activeHours: number;           // Hours with active jobs
    idleHours: number;             // Online but no jobs
    avgJobsPerDay: number;
    avgEarningsPerHour: number;
    peakHours: number[];           // Hours with most jobs
    lowHours: number[];            // Hours with least jobs
    preferredZones: NairobiZone[];
    recommendedZones: ZoneRecommendation[];
    efficiency: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
}

/**
 * Zone recommendation for a provider
 */
export interface ZoneRecommendation {
    zone: NairobiZone;
    zoneName: string;
    demandLevel: number;           // Current demand
    competitionLevel: number;      // Other providers in zone
    estimatedEarningsPerHour: number;
    distanceFromCurrent: number;   // KM from current location
    recommendationScore: number;   // 0-100
    reasonText: string;
}

/**
 * Time slot recommendation
 */
export interface TimeSlotRecommendation {
    day: number;                   // 0-6
    dayName: string;
    startHour: number;
    endHour: number;
    expectedDemand: number;
    currentCoverage: number;       // Provider count
    potentialEarnings: number;
    recommendationScore: number;
}

/**
 * Provider performance insights
 */
export interface ProviderInsights {
    providerId: string;
    period: 'week' | 'month';
    utilization: ProviderUtilization;
    zoneRecommendations: ZoneRecommendation[];
    timeRecommendations: TimeSlotRecommendation[];
    earningsOptimizationPotential: number;     // % increase possible
    keyInsights: string[];
    comparisons: {
        avgProviderEarnings: number;
        percentile: number;          // Provider's ranking
        topProviderEarnings: number;
    };
}

// ============================================
// Analytics Dashboard Types
// ============================================

/**
 * Key performance indicators
 */
export interface AnalyticsKPIs {
    period: 'day' | 'week' | 'month';
    totalRequests: number;
    completedRequests: number;
    completionRate: number;
    avgResponseTime: number;       // Minutes
    avgCompletionTime: number;     // Minutes
    avgCustomerRating: number;
    totalRevenue: number;
    avgRevenuePerRequest: number;
    activeCustomers: number;
    activeProviders: number;
    newCustomers: number;
    newProviders: number;
    churnedCustomers: number;
    churnedProviders: number;
}

/**
 * Trends comparison
 */
export interface TrendComparison {
    metric: string;
    currentValue: number;
    previousValue: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
    isPositive: boolean;           // Whether the change is good
}

/**
 * Analytics report
 */
export interface AnalyticsReport {
    reportId: string;
    generatedAt: Date;
    period: { start: Date; end: Date };
    kpis: AnalyticsKPIs;
    trends: TrendComparison[];
    demandPatterns: DemandPattern[];
    churnAlerts: ChurnRisk[];
    coverageAlerts: CoverageAlert[];
    topPerformingZones: { zone: NairobiZone; revenue: number; requests: number }[];
    underperformingZones: { zone: NairobiZone; coverage: number; lostRequests: number }[];
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validate churn risk score
 */
export function validateChurnRisk(risk: ChurnRisk): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (risk.riskScore < 0 || risk.riskScore > 100) {
        errors.push('Risk score must be between 0 and 100');
    }

    if (!['customer', 'provider'].includes(risk.userType)) {
        errors.push('User type must be customer or provider');
    }

    if (getRiskLevel(risk.riskScore) !== risk.riskLevel) {
        errors.push('Risk level does not match risk score');
    }

    if (risk.factors.length === 0) {
        errors.push('At least one churn factor is required');
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Validate hourly prediction
 */
export function validateHourlyPrediction(prediction: HourlyPrediction): boolean {
    return (
        prediction.hour >= 0 && prediction.hour <= 23 &&
        prediction.expectedRequests >= 0 &&
        prediction.confidence >= 0 && prediction.confidence <= 1 &&
        prediction.recommendedProviders >= 0
    );
}

/**
 * Validate utilization rate
 */
export function validateUtilizationRate(rate: number): boolean {
    return rate >= 0 && rate <= 100;
}

/**
 * Calculate efficiency rating from utilization
 */
export function getEfficiencyRating(utilizationRate: number): ProviderUtilization['efficiency'] {
    if (utilizationRate >= 80) return 'excellent';
    if (utilizationRate >= 60) return 'good';
    if (utilizationRate >= 40) return 'average';
    if (utilizationRate >= 20) return 'below_average';
    return 'poor';
}
