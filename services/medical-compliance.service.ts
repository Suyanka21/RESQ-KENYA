// ResQ Kenya - Medical Compliance Service
// Kenya health authority compliance and data protection

import { httpsCallable, getFunctions } from 'firebase/functions';
import { doc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import app from '../config/firebase';
import type {
    MedicalProvider,
    MedicalCertification,
    KenyaEMTLevel,
    MedicalCertificationType,
    MedicalDataLog,
    MEDICAL_RECORD_RETENTION_YEARS,
} from '../types/medical';

// Initialize Firebase Functions
const functions = getFunctions(app, 'us-central1');

// Demo mode flag
const USE_DEMO_MODE = true;

// ============================================================================
// MEDICAL PROVIDER REGISTRATION
// ============================================================================

export interface RegisterMedicalProviderInput {
    emtLevel: KenyaEMTLevel;
    licenseNumber?: string;
    associatedHospital?: string;
    yearsExperience: number;
    specializations: string[];
    certifications: {
        type: MedicalCertificationType;
        issuer: string;
        certificateNumber: string;
        issueDate: string;
        expiryDate: string;
        documentUrl: string;
    }[];
    insuranceInfo: {
        provider: string;
        policyNumber: string;
        coverage: 'personal' | 'professional' | 'comprehensive';
        coverageAmount: number;
        expiryDate: string;
        documentUrl: string;
    };
}

/**
 * Register as a medical provider (EMT/Paramedic)
 */
export async function registerMedicalProvider(
    input: RegisterMedicalProviderInput
): Promise<{ success: boolean; providerId?: string; error?: string }> {
    if (USE_DEMO_MODE) {
        console.log('[DEMO] Registering medical provider:', input.emtLevel);
        await simulateDelay(1500);
        return {
            success: true,
            providerId: `demo_medical_${Date.now()}`,
        };
    }

    try {
        const register = httpsCallable(functions, 'registerMedicalProvider');
        const result = await register(input);
        return result.data as { success: boolean; providerId?: string };
    } catch (error: any) {
        console.error('Register medical provider error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// CERTIFICATION VALIDATION
// ============================================================================

/**
 * Validate EMT certification number (format check)
 * Kenya EMT licenses typically follow patterns like: EMT-XXXX-YYYY
 */
export function validateCertificationNumber(
    type: MedicalCertificationType,
    certNumber: string
): { valid: boolean; error?: string } {
    if (!certNumber || certNumber.trim().length === 0) {
        return { valid: false, error: 'Certification number is required' };
    }

    const cleanNumber = certNumber.trim().toUpperCase();

    // Type-specific validation patterns
    switch (type) {
        case 'emt_license':
            // EMT license format: EMT-XXXX-YYYY or similar
            if (cleanNumber.length < 5) {
                return { valid: false, error: 'EMT license number too short' };
            }
            break;

        case 'cpr':
        case 'first_aid':
            // Red Cross format: Usually alphanumeric
            if (cleanNumber.length < 4) {
                return { valid: false, error: 'Certificate number too short' };
            }
            break;

        case 'bls':
        case 'als':
        case 'acls':
        case 'phtls':
            // Advanced certifications
            if (cleanNumber.length < 6) {
                return { valid: false, error: 'Advanced certification number too short' };
            }
            break;
    }

    return { valid: true };
}

/**
 * Check if certification is expired
 */
export function isCertificationExpired(expiryDate: Date | string): boolean {
    const expiry = new Date(expiryDate);
    return new Date() > expiry;
}

/**
 * Check if certification expires within given days
 */
export function certificationExpiresWithin(expiryDate: Date | string, days: number): boolean {
    const expiry = new Date(expiryDate);
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + days);
    return expiry <= warningDate && !isCertificationExpired(expiryDate);
}

/**
 * Get required certifications for EMT level
 */
export function getRequiredCertifications(level: KenyaEMTLevel): MedicalCertificationType[] {
    const required: Record<KenyaEMTLevel, MedicalCertificationType[]> = {
        first_responder: ['first_aid', 'cpr'],
        emt_basic: ['emt_license', 'first_aid', 'cpr', 'bls'],
        emt_intermediate: ['emt_license', 'first_aid', 'cpr', 'bls', 'als'],
        emt_paramedic: ['emt_license', 'first_aid', 'cpr', 'bls', 'als', 'acls', 'phtls'],
    };
    return required[level];
}

/**
 * Check if provider has all required certifications
 */
export function validateProviderCertifications(
    emtLevel: KenyaEMTLevel,
    certifications: { type: MedicalCertificationType; expiryDate: Date | string }[]
): {
    valid: boolean;
    missing: MedicalCertificationType[];
    expired: MedicalCertificationType[];
    expiringIn30Days: MedicalCertificationType[];
} {
    const required = getRequiredCertifications(emtLevel);
    const providedTypes = certifications.map(c => c.type);

    const missing = required.filter(r => !providedTypes.includes(r));
    const expired: MedicalCertificationType[] = [];
    const expiringIn30Days: MedicalCertificationType[] = [];

    for (const cert of certifications) {
        if (required.includes(cert.type)) {
            if (isCertificationExpired(cert.expiryDate)) {
                expired.push(cert.type);
            } else if (certificationExpiresWithin(cert.expiryDate, 30)) {
                expiringIn30Days.push(cert.type);
            }
        }
    }

    return {
        valid: missing.length === 0 && expired.length === 0,
        missing,
        expired,
        expiringIn30Days,
    };
}

// ============================================================================
// AUDIT LOGGING (Kenya Data Protection Act 2019)
// ============================================================================

export type MedicalDataAccessReason = 'dispatch' | 'treatment' | 'audit' | 'insurance' | 'legal';

export interface LogMedicalAccessInput {
    requestId: string;
    accessReason: MedicalDataAccessReason;
    dataFields: string[];
    actionTaken: 'view' | 'update' | 'export';
}

/**
 * Log access to medical data (compliance requirement)
 */
export async function logMedicalDataAccess(
    userId: string,
    input: LogMedicalAccessInput
): Promise<void> {
    if (USE_DEMO_MODE) {
        console.log('[DEMO] Medical data access logged:', input);
        return;
    }

    try {
        await addDoc(collection(db, 'medical_audit_logs'), {
            ...input,
            accessedBy: userId,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error('Log medical data access error:', error);
        // Don't throw - logging should not break the main flow
    }
}

/**
 * Get audit logs for a request
 */
export async function getMedicalAuditLogs(requestId: string): Promise<MedicalDataLog[]> {
    if (USE_DEMO_MODE) {
        return [
            {
                id: 'log_1',
                requestId,
                accessedBy: 'demo_user',
                accessReason: 'dispatch',
                timestamp: new Date(),
                dataFields: ['location', 'patient_condition'],
                actionTaken: 'view',
            },
        ];
    }

    try {
        const q = query(
            collection(db, 'medical_audit_logs'),
            where('requestId', '==', requestId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as MedicalDataLog[];
    } catch (error) {
        console.error('Get audit logs error:', error);
        return [];
    }
}

// ============================================================================
// DATA RETENTION (Kenya law: 7 years for adults)
// ============================================================================

/**
 * Check if medical record should be retained
 * Kenya: 7 years for adults, 25 years for minors
 */
export function shouldRetainMedicalRecord(
    recordDate: Date,
    isMinor: boolean = false
): boolean {
    const retentionYears = isMinor ? 25 : 7;
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - retentionYears);
    return new Date(recordDate) > cutoffDate;
}

/**
 * Get retention expiry date for a record
 */
export function getRetentionExpiryDate(recordDate: Date, isMinor: boolean = false): Date {
    const retentionYears = isMinor ? 25 : 7;
    const expiryDate = new Date(recordDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + retentionYears);
    return expiryDate;
}

// ============================================================================
// INCIDENT REPORTS
// ============================================================================

export interface IncidentReportInput {
    requestId: string;
    patientOutcome: 'treated_on_scene' | 'transported' | 'refused' | 'deceased';
    hospitalId?: string;
    treatmentProvided: string[];
    medicationsAdministered?: {
        name: string;
        dosage: string;
        time: Date;
    }[];
    vitalSigns?: {
        bloodPressure?: string;
        heartRate?: number;
        respiratoryRate?: number;
        oxygenSaturation?: number;
        temperature?: number;
    };
    notes: string;
}

/**
 * Generate incident report for a completed service
 */
export async function generateIncidentReport(
    providerId: string,
    input: IncidentReportInput
): Promise<{ success: boolean; reportId?: string; error?: string }> {
    if (USE_DEMO_MODE) {
        console.log('[DEMO] Generating incident report:', input.requestId);
        await simulateDelay(1000);
        return {
            success: true,
            reportId: `report_${Date.now()}`,
        };
    }

    try {
        const reportRef = await addDoc(collection(db, 'incident_reports'), {
            ...input,
            providerId,
            createdAt: serverTimestamp(),
            status: 'draft',
        });

        return {
            success: true,
            reportId: reportRef.id,
        };
    } catch (error: any) {
        console.error('Generate incident report error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// KENYA CERTIFICATION ISSUERS (for dropdown menus)
// ============================================================================

export const KENYA_CERTIFICATION_ISSUERS = [
    'Kenya Red Cross',
    'St. John Ambulance Kenya',
    'AMREF Health Africa',
    'Kenya Medical Training College (KMTC)',
    'Kenya Medical Practitioners and Dentists Council (KMPDC)',
    'Nursing Council of Kenya (NCK)',
    'Emergency Plus Medical Services (E-Plus)',
    'AAR Healthcare',
] as const;

/**
 * Get certification issuer display info
 */
export function getCertificationIssuerInfo(issuer: string): {
    name: string;
    logo?: string;
    website?: string;
} {
    const issuers: Record<string, { name: string; website?: string }> = {
        'Kenya Red Cross': {
            name: 'Kenya Red Cross Society',
            website: 'https://www.redcross.or.ke',
        },
        'St. John Ambulance Kenya': {
            name: 'St. John Ambulance Kenya',
            website: 'https://www.stjohnkenya.org',
        },
        'AMREF Health Africa': {
            name: 'AMREF Health Africa',
            website: 'https://amref.org',
        },
    };

    return issuers[issuer] || { name: issuer };
}

// ============================================================================
// EMT LEVEL HELPERS
// ============================================================================

/**
 * Get EMT level display name
 */
export function getEMTLevelDisplayName(level: KenyaEMTLevel): string {
    const names: Record<KenyaEMTLevel, string> = {
        first_responder: 'First Responder',
        emt_basic: 'EMT Basic',
        emt_intermediate: 'EMT Intermediate',
        emt_paramedic: 'Paramedic',
    };
    return names[level];
}

/**
 * Get EMT level description
 */
export function getEMTLevelDescription(level: KenyaEMTLevel): string {
    const descriptions: Record<KenyaEMTLevel, string> = {
        first_responder: 'Basic first aid and CPR trained responder',
        emt_basic: 'Emergency Medical Technician with basic certification',
        emt_intermediate: 'EMT with advanced skills and IV therapy',
        emt_paramedic: 'Fully certified paramedic with advanced life support',
    };
    return descriptions[level];
}

/**
 * Get minimum EMT level for triage
 */
export function getMinimumEMTLevelForTriage(triageLevel: 'red' | 'yellow' | 'green'): KenyaEMTLevel {
    switch (triageLevel) {
        case 'red':
            return 'emt_intermediate';
        case 'yellow':
            return 'emt_basic';
        case 'green':
        default:
            return 'first_responder';
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    registerMedicalProvider,
    validateCertificationNumber,
    isCertificationExpired,
    certificationExpiresWithin,
    getRequiredCertifications,
    validateProviderCertifications,
    logMedicalDataAccess,
    getMedicalAuditLogs,
    shouldRetainMedicalRecord,
    getRetentionExpiryDate,
    generateIncidentReport,
    getCertificationIssuerInfo,
    getEMTLevelDisplayName,
    getEMTLevelDescription,
    getMinimumEMTLevelForTriage,
    KENYA_CERTIFICATION_ISSUERS,
};
