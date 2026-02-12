// ResQ Kenya - Churn Prediction Service
// Phase 4: Customer and Provider Churn Risk Assessment

import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User, Provider } from '../types';
import {
    CUSTOMER_CHURN_FACTORS,
    PROVIDER_CHURN_FACTORS,
    getRiskLevel,
    validateChurnRisk,
    type ChurnRisk,
    type ChurnFactor,
    type RiskLevel,
    type RetentionCampaign,
    type RetentionAction,
} from '../types/analytics';

// ============================================
// Churn Risk Calculation
// ============================================

/**
 * Calculate churn risk for a customer
 */
export async function calculateCustomerChurnRisk(userId: string): Promise<ChurnRisk | null> {
    try {
        // Get user data
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
            return null;
        }

        const user = { id: userDoc.id, ...userDoc.data() } as User;

        // Get user activity data
        const activityMetrics = await getCustomerActivityMetrics(userId);

        // Calculate risk factors
        const factors = calculateCustomerFactors(user, activityMetrics);

        // Calculate total risk score
        const riskScore = calculateRiskScore(factors);
        const riskLevel = getRiskLevel(riskScore);

        // Find highest risk factor
        const sortedFactors = [...factors].sort((a, b) => {
            const aContribution = a.isRiskIndicator ? a.weight * 100 : 0;
            const bContribution = b.isRiskIndicator ? b.weight * 100 : 0;
            return bContribution - aContribution;
        });
        const highestRiskFactor = sortedFactors[0]?.factor || 'none';

        // Generate suggested actions
        const suggestedActions = getSuggestedActions('customer', riskLevel, factors);

        const churnRisk: ChurnRisk = {
            userId,
            userName: user.displayName,
            userType: 'customer',
            riskScore,
            riskLevel,
            factors,
            highestRiskFactor,
            suggestedActions,
            lastActive: activityMetrics.lastActiveDate,
            accountAge: activityMetrics.accountAgeDays,
            totalTransactions: activityMetrics.totalTransactions,
            lifetimeValue: activityMetrics.lifetimeValue,
            assessedAt: new Date(),
        };

        return churnRisk;
    } catch (error) {
        console.error('Error calculating customer churn risk:', error);
        return null;
    }
}

/**
 * Calculate churn risk for a provider
 */
export async function calculateProviderChurnRisk(providerId: string): Promise<ChurnRisk | null> {
    try {
        // Get provider data
        const providerDoc = await getDoc(doc(db, 'providers', providerId));
        if (!providerDoc.exists()) {
            return null;
        }

        const provider = { id: providerDoc.id, ...providerDoc.data() } as Provider;

        // Get provider activity data
        const activityMetrics = await getProviderActivityMetrics(providerId);

        // Calculate risk factors
        const factors = calculateProviderFactors(provider, activityMetrics);

        // Calculate total risk score
        const riskScore = calculateRiskScore(factors);
        const riskLevel = getRiskLevel(riskScore);

        // Find highest risk factor
        const sortedFactors = [...factors].sort((a, b) => {
            const aContribution = a.isRiskIndicator ? a.weight * 100 : 0;
            const bContribution = b.isRiskIndicator ? b.weight * 100 : 0;
            return bContribution - aContribution;
        });
        const highestRiskFactor = sortedFactors[0]?.factor || 'none';

        // Generate suggested actions
        const suggestedActions = getSuggestedActions('provider', riskLevel, factors);

        const churnRisk: ChurnRisk = {
            userId: providerId,
            userName: provider.displayName,
            userType: 'provider',
            riskScore,
            riskLevel,
            factors,
            highestRiskFactor,
            suggestedActions,
            lastActive: activityMetrics.lastActiveDate,
            accountAge: activityMetrics.accountAgeDays,
            totalTransactions: activityMetrics.totalServices,
            lifetimeValue: activityMetrics.totalEarnings,
            assessedAt: new Date(),
        };

        return churnRisk;
    } catch (error) {
        console.error('Error calculating provider churn risk:', error);
        return null;
    }
}

// ============================================
// Factor Calculation
// ============================================

interface CustomerActivityMetrics {
    lastActiveDate: Date;
    accountAgeDays: number;
    daysInactive: number;
    usageDeclinePercent: number;
    supportComplaints: number;
    paymentFailures: number;
    avgRatingGiven: number;
    cancelledRequests: number;
    responseTimeIssues: number;
    totalTransactions: number;
    lifetimeValue: number;
}

interface ProviderActivityMetrics {
    lastActiveDate: Date;
    accountAgeDays: number;
    daysOffline: number;
    acceptanceRateDecline: number;
    currentRating: number;
    ratingChange: number;
    earningsDeclinePercent: number;
    supportComplaints: number;
    lateArrivals: number;
    profileCompleteness: number;
    totalServices: number;
    totalEarnings: number;
}

function calculateCustomerFactors(
    user: User,
    metrics: CustomerActivityMetrics
): ChurnFactor[] {
    return CUSTOMER_CHURN_FACTORS.map(factorDef => {
        let currentValue: number;
        let thresholdValue = factorDef.threshold;
        let isRiskIndicator = false;
        let description = '';

        switch (factorDef.factor) {
            case 'days_inactive':
                currentValue = metrics.daysInactive;
                isRiskIndicator = currentValue > thresholdValue;
                description = `User inactive for ${currentValue} days (threshold: ${thresholdValue})`;
                break;
            case 'declining_usage':
                currentValue = metrics.usageDeclinePercent;
                isRiskIndicator = currentValue > thresholdValue * 100;
                description = `Usage declined by ${currentValue}%`;
                break;
            case 'support_complaints':
                currentValue = metrics.supportComplaints;
                isRiskIndicator = currentValue >= thresholdValue;
                description = `${currentValue} support complaints filed`;
                break;
            case 'payment_failures':
                currentValue = metrics.paymentFailures;
                isRiskIndicator = currentValue >= thresholdValue;
                description = `${currentValue} payment failures`;
                break;
            case 'low_ratings_given':
                currentValue = metrics.avgRatingGiven;
                isRiskIndicator = currentValue < thresholdValue;
                description = `Average rating given: ${currentValue.toFixed(1)}`;
                break;
            case 'cancelled_requests':
                currentValue = metrics.cancelledRequests;
                isRiskIndicator = currentValue >= thresholdValue;
                description = `${currentValue} cancelled requests`;
                break;
            case 'response_time_issues':
                currentValue = metrics.responseTimeIssues;
                isRiskIndicator = currentValue >= thresholdValue;
                description = `${currentValue} complaints about response time`;
                break;
            default:
                currentValue = 0;
                description = 'Unknown factor';
        }

        return {
            factor: factorDef.factor,
            weight: factorDef.weight,
            currentValue,
            thresholdValue,
            isRiskIndicator,
            description,
        };
    });
}

function calculateProviderFactors(
    provider: Provider,
    metrics: ProviderActivityMetrics
): ChurnFactor[] {
    return PROVIDER_CHURN_FACTORS.map(factorDef => {
        let currentValue: number;
        let thresholdValue = factorDef.threshold;
        let isRiskIndicator = false;
        let description = '';

        switch (factorDef.factor) {
            case 'days_offline':
                currentValue = metrics.daysOffline;
                isRiskIndicator = currentValue > thresholdValue;
                description = `Provider offline for ${currentValue} days`;
                break;
            case 'declining_acceptance':
                currentValue = 1 - metrics.acceptanceRateDecline;
                isRiskIndicator = currentValue < thresholdValue;
                description = `Acceptance rate: ${(currentValue * 100).toFixed(0)}%`;
                break;
            case 'declining_ratings':
                currentValue = metrics.currentRating;
                isRiskIndicator = currentValue < thresholdValue;
                description = `Current rating: ${currentValue.toFixed(1)} (${metrics.ratingChange > 0 ? '+' : ''}${metrics.ratingChange.toFixed(1)} change)`;
                break;
            case 'earnings_decline':
                currentValue = metrics.earningsDeclinePercent / 100;
                isRiskIndicator = currentValue > thresholdValue;
                description = `Earnings declined by ${metrics.earningsDeclinePercent}%`;
                break;
            case 'support_complaints':
                currentValue = metrics.supportComplaints;
                isRiskIndicator = currentValue >= thresholdValue;
                description = `${currentValue} support complaints`;
                break;
            case 'late_arrivals':
                currentValue = metrics.lateArrivals;
                isRiskIndicator = currentValue >= thresholdValue;
                description = `${currentValue} late arrivals this month`;
                break;
            case 'incomplete_profile':
                currentValue = 1 - metrics.profileCompleteness;
                isRiskIndicator = currentValue >= thresholdValue;
                description = `Profile ${(metrics.profileCompleteness * 100).toFixed(0)}% complete`;
                break;
            default:
                currentValue = 0;
                description = 'Unknown factor';
        }

        return {
            factor: factorDef.factor,
            weight: factorDef.weight,
            currentValue,
            thresholdValue,
            isRiskIndicator,
            description,
        };
    });
}

function calculateRiskScore(factors: ChurnFactor[]): number {
    let score = 0;

    for (const factor of factors) {
        if (factor.isRiskIndicator) {
            // Each risk indicator contributes based on its weight
            score += factor.weight * 100;
        }
    }

    return Math.min(100, Math.round(score));
}

// ============================================
// Activity Metrics (Mock implementations)
// ============================================

async function getCustomerActivityMetrics(userId: string): Promise<CustomerActivityMetrics> {
    // TODO: Actually calculate from database
    // For now, return mock data
    const now = new Date();
    const lastActive = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    return {
        lastActiveDate: lastActive,
        accountAgeDays: 180,
        daysInactive: 7,
        usageDeclinePercent: 10,
        supportComplaints: 0,
        paymentFailures: 0,
        avgRatingGiven: 4.2,
        cancelledRequests: 1,
        responseTimeIssues: 0,
        totalTransactions: 15,
        lifetimeValue: 45000,
    };
}

async function getProviderActivityMetrics(providerId: string): Promise<ProviderActivityMetrics> {
    // TODO: Actually calculate from database
    // For now, return mock data
    const now = new Date();
    const lastActive = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

    return {
        lastActiveDate: lastActive,
        accountAgeDays: 365,
        daysOffline: 2,
        acceptanceRateDecline: 0.1,
        currentRating: 4.6,
        ratingChange: -0.2,
        earningsDeclinePercent: 5,
        supportComplaints: 0,
        lateArrivals: 1,
        profileCompleteness: 0.95,
        totalServices: 250,
        totalEarnings: 850000,
    };
}

// ============================================
// Suggested Actions
// ============================================

function getSuggestedActions(
    userType: 'customer' | 'provider',
    riskLevel: RiskLevel,
    factors: ChurnFactor[]
): string[] {
    const actions: string[] = [];
    const riskFactors = factors.filter(f => f.isRiskIndicator);

    // General actions based on risk level
    if (riskLevel === 'critical') {
        actions.push('Escalate to account manager for personal outreach');
        actions.push('Offer significant retention incentive');
    } else if (riskLevel === 'high') {
        actions.push('Send personalized re-engagement campaign');
        actions.push(userType === 'customer' ? 'Offer discount on next service' : 'Offer bonus for next 5 jobs');
    }

    // Factor-specific actions
    for (const factor of riskFactors) {
        switch (factor.factor) {
            case 'days_inactive':
            case 'days_offline':
                actions.push('Send "We miss you" push notification');
                break;
            case 'declining_usage':
            case 'declining_acceptance':
                actions.push('Survey to understand decline reasons');
                break;
            case 'support_complaints':
                actions.push('Review complaint history and address issues');
                break;
            case 'payment_failures':
                actions.push('Assist with payment method update');
                break;
            case 'declining_ratings':
                actions.push('Provide performance feedback and training');
                break;
            case 'earnings_decline':
                actions.push('Suggest high-demand zones and times');
                break;
        }
    }

    return [...new Set(actions)]; // Remove duplicates
}

// ============================================
// Bulk Analysis
// ============================================

/**
 * Get all at-risk customers
 */
export async function getAtRiskCustomers(
    minRiskLevel: RiskLevel = 'medium'
): Promise<ChurnRisk[]> {
    const riskLevelOrder: RiskLevel[] = ['low', 'medium', 'high', 'critical'];
    const minLevelIndex = riskLevelOrder.indexOf(minRiskLevel);

    // TODO: In production, query users with activity flags
    // For now, return mock data
    const mockRisks: ChurnRisk[] = [
        {
            userId: 'user_001',
            userName: 'John Kamau',
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
                    description: 'Inactive for 45 days',
                },
            ],
            highestRiskFactor: 'days_inactive',
            suggestedActions: ['Send re-engagement email'],
            lastActive: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
            accountAge: 200,
            totalTransactions: 8,
            lifetimeValue: 24000,
            assessedAt: new Date(),
        },
    ];

    return mockRisks.filter(r =>
        riskLevelOrder.indexOf(r.riskLevel) >= minLevelIndex
    );
}

/**
 * Get all at-risk providers
 */
export async function getAtRiskProviders(
    minRiskLevel: RiskLevel = 'medium'
): Promise<ChurnRisk[]> {
    const riskLevelOrder: RiskLevel[] = ['low', 'medium', 'high', 'critical'];
    const minLevelIndex = riskLevelOrder.indexOf(minRiskLevel);

    // TODO: In production, query providers with activity flags
    // For now, return empty array
    return [];
}

/**
 * Get combined churn alerts
 */
export async function getAllChurnAlerts(
    minRiskLevel: RiskLevel = 'high'
): Promise<ChurnRisk[]> {
    const customers = await getAtRiskCustomers(minRiskLevel);
    const providers = await getAtRiskProviders(minRiskLevel);

    return [...customers, ...providers].sort(
        (a, b) => b.riskScore - a.riskScore
    );
}
