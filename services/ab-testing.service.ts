// ResQ Kenya - A/B Testing Service
// Phase 4: Framework for testing AI dispatch vs legacy dispatch

import { db } from '../config/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import type { ServiceType } from '../theme/voltage-premium';
import type { NairobiZone } from '../types/ai-dispatch';

// ============================================
// Types
// ============================================

export type ExperimentGroup = 'control' | 'treatment';
export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed';

export interface ABExperiment {
    id: string;
    name: string;
    description: string;
    hypothesis: string;

    // Configuration
    controlDescription: string;  // e.g., "Legacy distance-based dispatch"
    treatmentDescription: string; // e.g., "AI weighted scoring dispatch"
    trafficSplit: number;         // % going to treatment (0-100)

    // Targeting
    serviceTypes?: ServiceType[];
    zones?: NairobiZone[];
    minProviders?: number;

    // Duration
    startDate: Date;
    endDate?: Date;
    status: ExperimentStatus;

    // Metrics
    primaryMetric: 'acceptance_rate' | 'response_time' | 'completion_rate' | 'customer_rating';
    secondaryMetrics: string[];
    minimumSampleSize: number;

    // Results
    controlSampleSize?: number;
    treatmentSampleSize?: number;

    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}

export interface ExperimentResult {
    experimentId: string;
    group: ExperimentGroup;
    requestId: string;

    // Core metrics
    wasAccepted: boolean;
    responseTimeSeconds?: number;
    wasCompleted: boolean;
    completionTimeMinutes?: number;
    customerRating?: number;

    // Context
    serviceType: ServiceType;
    zone: NairobiZone;
    timestamp: Date;
    providerId?: string;
    providerScore?: number;
}

export interface ExperimentAnalysis {
    experimentId: string;
    analyzedAt: Date;

    control: GroupMetrics;
    treatment: GroupMetrics;

    // Statistical significance
    pValue: number;
    isSignificant: boolean;
    confidenceInterval: [number, number];
    effectSize: number;

    recommendation: 'ship' | 'iterate' | 'stop' | 'continue';
    notes: string;
}

interface GroupMetrics {
    sampleSize: number;
    acceptanceRate: number;
    avgResponseTime: number;
    completionRate: number;
    avgRating: number;
}

// ============================================
// Experiment Management
// ============================================

const EXPERIMENTS_COLLECTION = 'ab_experiments';
const RESULTS_COLLECTION = 'ab_experiment_results';

/**
 * Create a new A/B experiment
 */
export async function createExperiment(
    experiment: Omit<ABExperiment, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<string> {
    try {
        const now = new Date();
        const docRef = await addDoc(collection(db, EXPERIMENTS_COLLECTION), {
            ...experiment,
            status: 'draft',
            createdAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating experiment:', error);
        throw error;
    }
}

/**
 * Start an experiment
 */
export async function startExperiment(experimentId: string): Promise<void> {
    try {
        const expRef = doc(db, EXPERIMENTS_COLLECTION, experimentId);
        await updateDoc(expRef, {
            status: 'running',
            startDate: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error starting experiment:', error);
        throw error;
    }
}

/**
 * Pause an experiment
 */
export async function pauseExperiment(experimentId: string): Promise<void> {
    try {
        const expRef = doc(db, EXPERIMENTS_COLLECTION, experimentId);
        await updateDoc(expRef, {
            status: 'paused',
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error pausing experiment:', error);
        throw error;
    }
}

/**
 * Complete an experiment
 */
export async function completeExperiment(experimentId: string): Promise<void> {
    try {
        const expRef = doc(db, EXPERIMENTS_COLLECTION, experimentId);
        await updateDoc(expRef, {
            status: 'completed',
            endDate: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error completing experiment:', error);
        throw error;
    }
}

/**
 * Get active experiments
 */
export async function getActiveExperiments(): Promise<ABExperiment[]> {
    try {
        const q = query(
            collection(db, EXPERIMENTS_COLLECTION),
            where('status', '==', 'running')
        );

        const snapshot = await getDocs(q);
        const experiments: ABExperiment[] = [];

        snapshot.forEach(docSnap => {
            experiments.push({ id: docSnap.id, ...docSnap.data() } as ABExperiment);
        });

        return experiments;
    } catch (error) {
        console.error('Error getting active experiments:', error);
        return [];
    }
}

/**
 * Get all experiments
 */
export async function getAllExperiments(): Promise<ABExperiment[]> {
    try {
        const snapshot = await getDocs(collection(db, EXPERIMENTS_COLLECTION));
        const experiments: ABExperiment[] = [];

        snapshot.forEach(docSnap => {
            experiments.push({ id: docSnap.id, ...docSnap.data() } as ABExperiment);
        });

        return experiments;
    } catch (error) {
        console.error('Error getting experiments:', error);
        return [];
    }
}

// ============================================
// Assignment and Tracking
// ============================================

// In-memory cache for experiment assignments
const assignmentCache = new Map<string, { experimentId: string; group: ExperimentGroup }>();

/**
 * Assign a request to an experiment group
 */
export async function assignToExperiment(
    requestId: string,
    serviceType: ServiceType,
    zone: NairobiZone,
    availableProviders: number
): Promise<{ experimentId: string; group: ExperimentGroup } | null> {
    try {
        // Check cache first
        if (assignmentCache.has(requestId)) {
            return assignmentCache.get(requestId)!;
        }

        // Get active experiments
        const experiments = await getActiveExperiments();

        // Find matching experiment
        const matchingExp = experiments.find(exp => {
            if (exp.serviceTypes && !exp.serviceTypes.includes(serviceType)) return false;
            if (exp.zones && !exp.zones.includes(zone)) return false;
            if (exp.minProviders && availableProviders < exp.minProviders) return false;
            return true;
        });

        if (!matchingExp) return null;

        // Assign group based on traffic split (deterministic based on requestId)
        const hash = simpleHash(requestId);
        const group: ExperimentGroup = (hash % 100) < matchingExp.trafficSplit
            ? 'treatment'
            : 'control';

        const assignment = { experimentId: matchingExp.id, group };
        assignmentCache.set(requestId, assignment);

        return assignment;
    } catch (error) {
        console.error('Error assigning to experiment:', error);
        return null;
    }
}

/**
 * Simple hash function for deterministic assignment
 */
function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

/**
 * Record experiment result
 */
export async function recordExperimentResult(result: ExperimentResult): Promise<void> {
    try {
        await addDoc(collection(db, RESULTS_COLLECTION), {
            ...result,
            timestamp: Timestamp.fromDate(result.timestamp),
        });
    } catch (error) {
        console.error('Error recording experiment result:', error);
        throw error;
    }
}

// ============================================
// Analysis
// ============================================

/**
 * Analyze experiment results
 */
export async function analyzeExperiment(experimentId: string): Promise<ExperimentAnalysis | null> {
    try {
        // Get all results for this experiment
        const q = query(
            collection(db, RESULTS_COLLECTION),
            where('experimentId', '==', experimentId)
        );

        const snapshot = await getDocs(q);

        const control: ExperimentResult[] = [];
        const treatment: ExperimentResult[] = [];

        snapshot.forEach(docSnap => {
            const result = docSnap.data() as ExperimentResult;
            if (result.group === 'control') {
                control.push(result);
            } else {
                treatment.push(result);
            }
        });

        if (control.length === 0 || treatment.length === 0) return null;

        // Calculate metrics for each group
        const controlMetrics = calculateGroupMetrics(control);
        const treatmentMetrics = calculateGroupMetrics(treatment);

        // Calculate statistical significance (simplified)
        const effectSize = (treatmentMetrics.acceptanceRate - controlMetrics.acceptanceRate) /
            controlMetrics.acceptanceRate;
        const pooledVar = calculatePooledVariance(control, treatment);
        const zScore = Math.abs(effectSize) / Math.sqrt(pooledVar);
        const pValue = 2 * (1 - normalCDF(zScore));
        const isSignificant = pValue < 0.05;

        // Calculate confidence interval
        const marginOfError = 1.96 * Math.sqrt(pooledVar);
        const ciLower = effectSize - marginOfError;
        const ciUpper = effectSize + marginOfError;

        // Determine recommendation
        let recommendation: ExperimentAnalysis['recommendation'] = 'continue';
        const totalSamples = control.length + treatment.length;

        if (totalSamples < 100) {
            recommendation = 'continue';
        } else if (isSignificant && effectSize > 0.05) {
            recommendation = 'ship';
        } else if (isSignificant && effectSize < -0.05) {
            recommendation = 'stop';
        } else if (totalSamples >= 1000) {
            recommendation = 'iterate';
        }

        return {
            experimentId,
            analyzedAt: new Date(),
            control: controlMetrics,
            treatment: treatmentMetrics,
            pValue,
            isSignificant,
            confidenceInterval: [ciLower, ciUpper],
            effectSize,
            recommendation,
            notes: generateAnalysisNotes(controlMetrics, treatmentMetrics, isSignificant, effectSize),
        };
    } catch (error) {
        console.error('Error analyzing experiment:', error);
        return null;
    }
}

function calculateGroupMetrics(results: ExperimentResult[]): GroupMetrics {
    const accepted = results.filter(r => r.wasAccepted);
    const completed = results.filter(r => r.wasCompleted);
    const rated = results.filter(r => r.customerRating !== undefined);

    return {
        sampleSize: results.length,
        acceptanceRate: results.length > 0 ? accepted.length / results.length : 0,
        avgResponseTime: accepted.length > 0
            ? accepted.reduce((sum, r) => sum + (r.responseTimeSeconds || 0), 0) / accepted.length
            : 0,
        completionRate: accepted.length > 0 ? completed.length / accepted.length : 0,
        avgRating: rated.length > 0
            ? rated.reduce((sum, r) => sum + (r.customerRating || 0), 0) / rated.length
            : 0,
    };
}

function calculatePooledVariance(control: ExperimentResult[], treatment: ExperimentResult[]): number {
    const n1 = control.length;
    const n2 = treatment.length;
    const p1 = control.filter(r => r.wasAccepted).length / n1;
    const p2 = treatment.filter(r => r.wasAccepted).length / n2;
    const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
    return pooledP * (1 - pooledP) * (1 / n1 + 1 / n2);
}

function normalCDF(z: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * z);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

    return 0.5 * (1.0 + sign * y);
}

function generateAnalysisNotes(
    control: GroupMetrics,
    treatment: GroupMetrics,
    isSignificant: boolean,
    effectSize: number
): string {
    const parts: string[] = [];

    if (!isSignificant) {
        parts.push('Results are not statistically significant yet.');
    }

    if (effectSize > 0) {
        parts.push(`Treatment shows ${(effectSize * 100).toFixed(1)}% improvement in acceptance rate.`);
    } else if (effectSize < 0) {
        parts.push(`Treatment shows ${Math.abs(effectSize * 100).toFixed(1)}% decrease in acceptance rate.`);
    }

    if (treatment.avgResponseTime < control.avgResponseTime) {
        const improvement = ((control.avgResponseTime - treatment.avgResponseTime) / control.avgResponseTime * 100).toFixed(1);
        parts.push(`Response time improved by ${improvement}%.`);
    }

    if (treatment.avgRating > control.avgRating) {
        parts.push(`Customer ratings improved from ${control.avgRating.toFixed(2)} to ${treatment.avgRating.toFixed(2)}.`);
    }

    return parts.join(' ');
}

// ============================================
// Dispatch Integration
// ============================================

/**
 * Check if request should use AI dispatch
 */
export async function shouldUseAIDispatch(
    requestId: string,
    serviceType: ServiceType,
    zone: NairobiZone,
    availableProviders: number
): Promise<boolean> {
    const assignment = await assignToExperiment(requestId, serviceType, zone, availableProviders);

    if (!assignment) {
        // No active experiment, use AI dispatch by default
        return true;
    }

    return assignment.group === 'treatment';
}

/**
 * Get dispatcher based on experiment assignment
 */
export function getDispatcherType(group: ExperimentGroup): 'ai' | 'legacy' {
    return group === 'treatment' ? 'ai' : 'legacy';
}
