// ResQ Kenya - Demand Forecast Service
// Phase 4: Predictive Analytics for Demand Planning

import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ServiceType } from '../theme/voltage-premium';
import { NAIROBI_ZONES, getTimeSlot, type NairobiZone, type TimeSlot } from '../types/ai-dispatch';
import {
    type HourlyPrediction,
    type DailyForecast,
    type WeeklyForecast,
    type DemandPattern,
    type CoverageAlert,
    validateHourlyPrediction,
} from '../types/analytics';
export type { CoverageAlert } from '../types/analytics';

// ============================================
// Historical Data Cache
// ============================================

interface DemandHistoryCache {
    data: Map<string, number[]>; // zone_service_dayOfWeek_hour -> request counts
    lastUpdated: Date;
    ttlMs: number;
}

const historyCache: DemandHistoryCache = {
    data: new Map(),
    lastUpdated: new Date(0),
    ttlMs: 60 * 60 * 1000, // 1 hour
};

// ============================================
// Prediction Functions
// ============================================

/**
 * Predict hourly demand for a zone and service type
 */
export function predictHourlyDemand(
    zone: NairobiZone,
    serviceType: ServiceType,
    date: Date,
    historicalAvg: number[] = getDefaultHourlyPattern()
): HourlyPrediction[] {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const predictions: HourlyPrediction[] = [];

    for (let hour = 0; hour < 24; hour++) {
        // Get base historical average
        const baseAvg = historicalAvg[hour] || 5;

        // Apply day-of-week multiplier
        const dayMultiplier = getDayOfWeekMultiplier(dayOfWeek);

        // Calculate expected requests
        const expectedRequests = Math.round(baseAvg * dayMultiplier);

        // Calculate confidence (higher for peak hours with more data)
        const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
        const confidence = isPeakHour ? 0.85 : 0.7;

        // Recommended providers: 1 provider per 3-4 expected requests
        const recommendedProviders = Math.max(1, Math.ceil(expectedRequests / 3.5));

        // Determine trend
        const prevHourAvg = historicalAvg[hour > 0 ? hour - 1 : 23] || baseAvg;
        const trend: HourlyPrediction['trend'] =
            expectedRequests > prevHourAvg * 1.1 ? 'increasing' :
                expectedRequests < prevHourAvg * 0.9 ? 'decreasing' : 'stable';

        predictions.push({
            hour,
            expectedRequests,
            confidence,
            recommendedProviders,
            historicalAvg: baseAvg,
            trend,
        });
    }

    return predictions;
}

/**
 * Get daily forecast for a zone
 */
export async function getDailyForecast(
    zone: NairobiZone,
    serviceType: ServiceType,
    date: Date
): Promise<DailyForecast> {
    // Get historical average for this zone
    const historicalAvg = await getHistoricalHourlyAverage(zone, serviceType);

    // Predict hourly demand
    const hourlyBreakdown = predictHourlyDemand(zone, serviceType, date, historicalAvg);

    // Calculate totals
    const totalExpectedRequests = hourlyBreakdown.reduce(
        (sum, h) => sum + h.expectedRequests, 0
    );

    // Find peak and min hours
    const sortedByDemand = [...hourlyBreakdown].sort(
        (a, b) => b.expectedRequests - a.expectedRequests
    );
    const peakHours = sortedByDemand.slice(0, 4).map(h => h.hour);
    const minHours = sortedByDemand.slice(-4).map(h => h.hour);

    // Calculate overall accuracy (average of hourly confidence)
    const accuracy = hourlyBreakdown.reduce(
        (sum, h) => sum + h.confidence, 0
    ) / 24;

    return {
        date,
        zone,
        serviceType,
        totalExpectedRequests,
        peakHours,
        minHours,
        hourlyBreakdown,
        accuracy,
    };
}

/**
 * Get weekly forecast for a zone
 */
export async function getWeeklyForecast(
    zone: NairobiZone,
    serviceType: ServiceType,
    startDate: Date
): Promise<WeeklyForecast> {
    const dailyForecasts: DailyForecast[] = [];

    const currentDate = new Date(startDate);
    for (let i = 0; i < 7; i++) {
        const forecast = await getDailyForecast(zone, serviceType, new Date(currentDate));
        dailyForecasts.push(forecast);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate weekly total
    const weeklyTotal = dailyForecasts.reduce(
        (sum, d) => sum + d.totalExpectedRequests, 0
    );

    // Find peak and low days
    const sortedByTotal = [...dailyForecasts].sort(
        (a, b) => b.totalExpectedRequests - a.totalExpectedRequests
    );
    const peakDay = sortedByTotal[0].date.getDay();
    const lowDay = sortedByTotal[6].date.getDay();

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    return {
        startDate,
        endDate,
        zone,
        dailyForecasts,
        weeklyTotal,
        peakDay,
        lowDay,
    };
}

// ============================================
// Demand Pattern Analysis
// ============================================

/**
 * Analyze demand patterns for a zone and service
 */
export async function analyzeDemandPatterns(
    zone: NairobiZone,
    serviceType: ServiceType,
    window: 'week' | 'month' | 'quarter' = 'month'
): Promise<DemandPattern> {
    // Get historical data
    const hourlyPattern = await getHistoricalHourlyAverage(zone, serviceType);
    const dailyPattern = getDailyPattern();
    const monthlyPattern = getMonthlyPattern();

    // Calculate seasonal factors (Kenya: rainy seasons Apr-May, Oct-Nov)
    const now = new Date();
    const month = now.getMonth();
    const isRainySeason = [3, 4, 9, 10].includes(month);

    return {
        zone,
        serviceType,
        analysisWindow: window,
        patterns: {
            hourlyPattern,
            dailyPattern,
            monthlyPattern,
        },
        seasonalFactors: {
            rainySeasonMultiplier: 1.3, // 30% more requests in rain
            drySeasonMultiplier: 0.9,
            holidayMultiplier: 1.5,
        },
        trendDirection: 'growth',
        trendPercent: 12, // Example: 12% month-over-month growth
    };
}

// ============================================
// Coverage Alerts
// ============================================

/**
 * Check for low coverage alerts
 */
export async function checkCoverageAlerts(
    zone: NairobiZone,
    serviceType: ServiceType,
    availableProviders: number,
    threshold: number = 0.5
): Promise<CoverageAlert | null> {
    // Get expected demand for current hour
    const now = new Date();
    const forecast = await getDailyForecast(zone, serviceType, now);
    const currentHour = now.getHours();
    const hourlyPrediction = forecast.hourlyBreakdown[currentHour];

    const expectedDemand = hourlyPrediction.expectedRequests;
    const recommendedProviders = hourlyPrediction.recommendedProviders;

    // Check if coverage is below threshold
    const coverageRatio = recommendedProviders > 0
        ? availableProviders / recommendedProviders
        : 1;

    if (coverageRatio < threshold) {
        const severity: CoverageAlert['severity'] = coverageRatio < 0.25 ? 'critical' : 'warning';

        return {
            alertId: `alert_${zone}_${serviceType}_${Date.now()}`,
            zone,
            serviceType,
            severity,
            expectedDemand,
            availableProviders,
            recommendedAction: generateRecommendedAction(zone, availableProviders, recommendedProviders),
            alertTime: new Date(),
        };
    }

    return null;
}

/**
 * Get all active coverage alerts
 */
export async function getActiveCoverageAlerts(): Promise<CoverageAlert[]> {
    const alerts: CoverageAlert[] = [];

    // Check all zones for common service types
    const serviceTypes: ServiceType[] = ['towing', 'battery', 'fuel', 'tire', 'ambulance'];

    for (const zone of NAIROBI_ZONES) {
        for (const serviceType of serviceTypes) {
            // Get available providers (mock for now)
            const availableProviders = await getAvailableProviderCount(zone.id, serviceType);

            const alert = await checkCoverageAlerts(zone.id, serviceType, availableProviders);
            if (alert) {
                alerts.push(alert);
            }
        }
    }

    return alerts;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get historical hourly average from cache or database
 */
async function getHistoricalHourlyAverage(
    zone: NairobiZone,
    serviceType: ServiceType
): Promise<number[]> {
    const cacheKey = `${zone}_${serviceType}`;

    if (historyCache.data.has(cacheKey) && isCacheValid()) {
        return historyCache.data.get(cacheKey) || getDefaultHourlyPattern();
    }

    // TODO: Fetch from database when enough historical data exists
    // For now, return pattern based on zone characteristics
    const zoneData = NAIROBI_ZONES.find(z => z.id === zone);
    if (!zoneData) {
        return getDefaultHourlyPattern();
    }

    // Generate pattern based on zone's avg demand
    const pattern = generateZonePattern(zoneData.avgDemand, zoneData.peakHours);
    historyCache.data.set(cacheKey, pattern);
    historyCache.lastUpdated = new Date();

    return pattern;
}

function isCacheValid(): boolean {
    return Date.now() - historyCache.lastUpdated.getTime() < historyCache.ttlMs;
}

function getDefaultHourlyPattern(): number[] {
    // Default pattern: low overnight, peaks at 8-9 AM and 5-6 PM
    return [
        2, 1, 1, 1, 1, 2, 4, 8, 12, 10, 8, 7,  // 0-11
        8, 7, 6, 7, 8, 12, 10, 7, 5, 4, 3, 2   // 12-23
    ];
}

function generateZonePattern(avgDemand: number, peakHours: number[]): number[] {
    const pattern: number[] = [];
    const peakSet = new Set(peakHours);

    for (let hour = 0; hour < 24; hour++) {
        if (peakSet.has(hour)) {
            pattern.push(Math.round(avgDemand * 1.5));
        } else if (hour >= 0 && hour < 6) {
            pattern.push(Math.round(avgDemand * 0.3));
        } else if (hour >= 6 && hour < 10) {
            pattern.push(Math.round(avgDemand * 1.2));
        } else if (hour >= 10 && hour < 17) {
            pattern.push(Math.round(avgDemand * 0.8));
        } else if (hour >= 17 && hour < 20) {
            pattern.push(Math.round(avgDemand * 1.1));
        } else {
            pattern.push(Math.round(avgDemand * 0.5));
        }
    }

    return pattern;
}

function getDayOfWeekMultiplier(dayOfWeek: number): number {
    // Monday-Thursday: baseline
    // Friday: slightly higher
    // Saturday-Sunday: lower
    const multipliers = [0.7, 1.0, 1.0, 1.0, 1.0, 1.2, 0.8];
    return multipliers[dayOfWeek];
}

function getDailyPattern(): number[] {
    // Relative demand by day: Sun, Mon, Tue, Wed, Thu, Fri, Sat
    return [0.7, 1.0, 1.0, 1.0, 1.0, 1.2, 0.8];
}

function getMonthlyPattern(): number[] {
    // Relative demand by month (Kenya patterns)
    return [1.0, 0.9, 1.0, 1.3, 1.2, 0.9, 0.9, 0.9, 1.0, 1.2, 1.3, 1.1];
}

function generateRecommendedAction(
    zone: NairobiZone,
    available: number,
    recommended: number
): string {
    const deficit = recommended - available;
    const zoneData = NAIROBI_ZONES.find(z => z.id === zone);
    const zoneName = zoneData?.name || zone;

    if (available === 0) {
        return `URGENT: No providers available in ${zoneName}. Notify ${recommended} providers to go online.`;
    }

    return `Low coverage in ${zoneName}. Need ${deficit} more providers (currently ${available}/${recommended}).`;
}

async function getAvailableProviderCount(
    zone: NairobiZone,
    serviceType: ServiceType
): Promise<number> {
    // TODO: Actually query provider availability
    // For now, return mock data
    const mockCounts: Record<NairobiZone, number> = {
        cbd: 8,
        westlands: 5,
        kilimani: 4,
        upperhill: 3,
        eastleigh: 3,
        industrial_area: 6,
        ngong_road: 4,
        thika_road: 5,
        mombasa_road: 7,
        karen: 2,
        langata: 2,
        kiambu: 3,
        other: 1,
    };

    return mockCounts[zone] || 2;
}

/**
 * Clear forecast cache (for testing)
 */
export function clearForecastCache(): void {
    historyCache.data.clear();
    historyCache.lastUpdated = new Date(0);
}
