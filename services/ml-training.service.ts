// ResQ Kenya - ML Training Data Service
// Phase 4: Collect and manage training data for ML models

import { db } from '../config/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { ServiceType } from '../theme/voltage-premium';
import type { NairobiZone } from '../types/ai-dispatch';

// ============================================
// Types
// ============================================

export interface DispatchTrainingRecord {
    id?: string;
    requestId: string;
    serviceType: ServiceType;
    urgencyLevel: 'normal' | 'urgent' | 'emergency';

    // Location features
    customerLocation: { latitude: number; longitude: number };
    zone: NairobiZone;

    // Time features
    timestamp: Date;
    hour: number;
    dayOfWeek: number;
    isWeekend: boolean;
    isHoliday: boolean;
    timeSlot: 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night';

    // Provider features
    providerId: string;
    providerRating: number;
    providerCompletionRate: number;
    providerDistanceKm: number;
    providerRecentJobs: number;

    // Outcome (labels)
    outcome: 'accepted' | 'declined' | 'timed_out' | 'reassigned' | 'cancelled';
    responseTimeSeconds: number;
    wasCompletedSuccessfully: boolean;
    completionTimeMinutes?: number;
    customerRating?: number;
    tipAmount?: number;

    // Metadata
    createdAt: Date;
    modelVersion: string;
    wasTopRecommendation: boolean;
    rankPosition: number;
}

export interface TrainingDataStats {
    totalRecords: number;
    acceptanceRate: number;
    avgResponseTime: number;
    avgCompletionTime: number;
    avgCustomerRating: number;
    byServiceType: Record<ServiceType, number>;
    byOutcome: Record<string, number>;
    byTimeSlot: Record<string, number>;
    lastUpdated: Date;
}

export interface ModelMetrics {
    modelVersion: string;
    accuracy: number;
    topKAccuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    maeResponseTime: number;
    trainingRecords: number;
    evaluationRecords: number;
    trainedAt: Date;
    deployedAt?: Date;
}

// ============================================
// Training Data Collection
// ============================================

const COLLECTION_NAME = 'ml_training_data';

/**
 * Record a dispatch outcome for ML training
 */
export async function recordDispatchOutcome(
    record: Omit<DispatchTrainingRecord, 'id' | 'createdAt'>
): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...record,
            createdAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error recording dispatch outcome:', error);
        throw error;
    }
}

/**
 * Get training data statistics
 */
export async function getTrainingDataStats(): Promise<TrainingDataStats> {
    try {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));

        const records: DispatchTrainingRecord[] = [];
        snapshot.forEach(doc => {
            records.push({ id: doc.id, ...doc.data() } as DispatchTrainingRecord);
        });

        const totalRecords = records.length;
        const accepted = records.filter(r => r.outcome === 'accepted');

        const byServiceType: Record<string, number> = {};
        const byOutcome: Record<string, number> = {};
        const byTimeSlot: Record<string, number> = {};

        records.forEach(r => {
            byServiceType[r.serviceType] = (byServiceType[r.serviceType] || 0) + 1;
            byOutcome[r.outcome] = (byOutcome[r.outcome] || 0) + 1;
            byTimeSlot[r.timeSlot] = (byTimeSlot[r.timeSlot] || 0) + 1;
        });

        return {
            totalRecords,
            acceptanceRate: totalRecords > 0 ? accepted.length / totalRecords : 0,
            avgResponseTime: accepted.length > 0
                ? accepted.reduce((sum, r) => sum + r.responseTimeSeconds, 0) / accepted.length
                : 0,
            avgCompletionTime: accepted.filter(r => r.completionTimeMinutes).length > 0
                ? accepted.reduce((sum, r) => sum + (r.completionTimeMinutes || 0), 0) /
                accepted.filter(r => r.completionTimeMinutes).length
                : 0,
            avgCustomerRating: accepted.filter(r => r.customerRating).length > 0
                ? accepted.reduce((sum, r) => sum + (r.customerRating || 0), 0) /
                accepted.filter(r => r.customerRating).length
                : 0,
            byServiceType: byServiceType as Record<ServiceType, number>,
            byOutcome,
            byTimeSlot,
            lastUpdated: new Date(),
        };
    } catch (error) {
        console.error('Error getting training stats:', error);
        throw error;
    }
}

/**
 * Export training data for model training
 */
export async function exportTrainingData(
    startDate: Date,
    endDate: Date,
    serviceTypes?: ServiceType[]
): Promise<DispatchTrainingRecord[]> {
    try {
        let q = query(
            collection(db, COLLECTION_NAME),
            where('createdAt', '>=', Timestamp.fromDate(startDate)),
            where('createdAt', '<=', Timestamp.fromDate(endDate)),
            orderBy('createdAt', 'desc'),
            limit(50000) // Max export limit
        );

        const snapshot = await getDocs(q);
        const records: DispatchTrainingRecord[] = [];

        snapshot.forEach(doc => {
            const data = doc.data() as DispatchTrainingRecord;
            if (!serviceTypes || serviceTypes.includes(data.serviceType)) {
                records.push({ id: doc.id, ...data });
            }
        });

        return records;
    } catch (error) {
        console.error('Error exporting training data:', error);
        throw error;
    }
}

// ============================================
// Model Metrics
// ============================================

const METRICS_COLLECTION = 'ml_model_metrics';

/**
 * Record model training metrics
 */
export async function recordModelMetrics(metrics: ModelMetrics): Promise<void> {
    try {
        await addDoc(collection(db, METRICS_COLLECTION), {
            ...metrics,
            createdAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error recording model metrics:', error);
        throw error;
    }
}

/**
 * Get latest model metrics
 */
export async function getLatestModelMetrics(): Promise<ModelMetrics | null> {
    try {
        const q = query(
            collection(db, METRICS_COLLECTION),
            orderBy('trainedAt', 'desc'),
            limit(1)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;

        return snapshot.docs[0].data() as ModelMetrics;
    } catch (error) {
        console.error('Error getting model metrics:', error);
        return null;
    }
}

/**
 * Get model metrics history
 */
export async function getModelMetricsHistory(count: number = 10): Promise<ModelMetrics[]> {
    try {
        const q = query(
            collection(db, METRICS_COLLECTION),
            orderBy('trainedAt', 'desc'),
            limit(count)
        );

        const snapshot = await getDocs(q);
        const metrics: ModelMetrics[] = [];

        snapshot.forEach(doc => {
            metrics.push(doc.data() as ModelMetrics);
        });

        return metrics;
    } catch (error) {
        console.error('Error getting metrics history:', error);
        return [];
    }
}

// ============================================
// Feature Engineering Helpers
// ============================================

export function getTimeSlot(hour: number): DispatchTrainingRecord['timeSlot'] {
    if (hour >= 5 && hour < 8) return 'early_morning';
    if (hour >= 8 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
}

export function isKenyanHoliday(date: Date): boolean {
    const holidays = [
        { month: 0, day: 1 },   // New Year
        { month: 5, day: 1 },   // Madaraka Day
        { month: 9, day: 10 },  // Huduma Day
        { month: 9, day: 20 },  // Mashujaa Day
        { month: 11, day: 12 }, // Jamhuri Day
        { month: 11, day: 25 }, // Christmas
        { month: 11, day: 26 }, // Boxing Day
    ];

    return holidays.some(h =>
        date.getMonth() === h.month && date.getDate() === h.day
    );
}

/**
 * Prepare a record for training
 */
export function prepareTrainingRecord(
    requestId: string,
    serviceType: ServiceType,
    urgencyLevel: 'normal' | 'urgent' | 'emergency',
    customerLocation: { latitude: number; longitude: number },
    zone: NairobiZone,
    providerId: string,
    providerRating: number,
    providerCompletionRate: number,
    providerDistanceKm: number,
    providerRecentJobs: number,
    wasTopRecommendation: boolean,
    rankPosition: number
): Omit<DispatchTrainingRecord, 'id' | 'createdAt' | 'outcome' | 'responseTimeSeconds' | 'wasCompletedSuccessfully'> {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    return {
        requestId,
        serviceType,
        urgencyLevel,
        customerLocation,
        zone,
        timestamp: now,
        hour,
        dayOfWeek,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isHoliday: isKenyanHoliday(now),
        timeSlot: getTimeSlot(hour),
        providerId,
        providerRating,
        providerCompletionRate,
        providerDistanceKm,
        providerRecentJobs,
        modelVersion: 'v1.0-heuristic',
        wasTopRecommendation,
        rankPosition,
    };
}
