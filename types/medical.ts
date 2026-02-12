// ResQ Kenya - Medical Provider Types
// Kenya health authority compliance for ambulance/medical services

import type { GeoLocation, ServiceRequest } from './index';

// ============================================================================
// KENYA EMT CERTIFICATION LEVELS
// Based on Kenya National Ambulance Service (KNAS) / Kenya Red Cross standards
// ============================================================================

/**
 * Kenya EMT Certification Levels
 * - first_responder: Basic first aid training (Kenya Red Cross certificate)
 * - emt_basic: Basic EMT (emergency medical technician)
 * - emt_intermediate: Intermediate EMT with advanced skills
 * - emt_paramedic: Full paramedic certification (KMPDC recognized)
 */
export type KenyaEMTLevel = 'first_responder' | 'emt_basic' | 'emt_intermediate' | 'emt_paramedic';

/**
 * Types of medical certifications accepted
 */
export type MedicalCertificationType =
    | 'emt_license'     // EMT/Paramedic license
    | 'cpr'             // CPR certification
    | 'first_aid'       // First Aid certification
    | 'bls'             // Basic Life Support
    | 'als'             // Advanced Life Support (Cardiac)
    | 'acls'            // Advanced Cardiac Life Support
    | 'phtls'           // Pre-Hospital Trauma Life Support
    | 'nals';           // Neonatal Advanced Life Support

/**
 * Medical provider verification status
 */
export type MedicalProviderStatus = 'pending' | 'verified' | 'active' | 'suspended' | 'expired';

// ============================================================================
// MEDICAL CERTIFICATION
// ============================================================================

export interface MedicalCertification {
    id: string;
    type: MedicalCertificationType;
    issuer: string;                     // e.g., "Kenya Red Cross", "AMREF Health Africa", "NHIF"
    certificateNumber: string;          // Unique cert number for verification
    issueDate: Date;
    expiryDate: Date;
    documentUrl: string;                // Firebase Storage URL
    verified: boolean;
    verifiedAt?: Date;
    verifiedBy?: string;                // Admin who verified
}

// ============================================================================
// MEDICAL PROVIDER
// ============================================================================

export interface MedicalProvider {
    id: string;
    userId: string;                     // Links to base User
    emtLevel: KenyaEMTLevel;
    certifications: MedicalCertification[];

    // Professional details
    licenseNumber?: string;             // KMPDC/NCK license number
    associatedHospital?: string;        // e.g., "Kenyatta National Hospital"
    yearsExperience: number;
    specializations: MedicalSpecialization[];

    // Insurance & liability
    insuranceCoverage: InsuranceInfo;

    // Status & verification
    status: MedicalProviderStatus;
    verifiedAt?: Date;
    verifiedBy?: string;

    // Stats
    totalEmergencies: number;
    averageResponseTime: number;        // In minutes
    rating: number;
}

export interface InsuranceInfo {
    provider: string;                   // Insurance company name
    policyNumber: string;
    coverage: 'personal' | 'professional' | 'comprehensive';
    coverageAmount: number;             // KES
    expiryDate: Date;
    documentUrl: string;
}

export type MedicalSpecialization =
    | 'trauma'
    | 'cardiac'
    | 'pediatric'
    | 'obstetric'
    | 'respiratory'
    | 'toxicology'
    | 'general';

// ============================================================================
// EMERGENCY REQUEST (extends base ServiceRequest)
// ============================================================================

export type EmergencyType = 'medical' | 'trauma' | 'cardiac' | 'respiratory' | 'burn' | 'poisoning' | 'obstetric' | 'stroke' | 'pediatric' | 'psychiatric' | 'general' | 'other';

/**
 * Kenya Red Cross Triage Levels
 * - red: Immediate (life-threatening)
 * - yellow: Urgent (serious but stable)
 * - green: Delayed (minor injuries)
 */
export type TriageLevel = 'red' | 'yellow' | 'green';

export type DispatchPriority = 'emergency' | 'urgent' | 'scheduled';

export interface EmergencyRequest extends ServiceRequest {
    // Emergency-specific fields
    emergencyType: EmergencyType;
    triageLevel: TriageLevel;
    dispatchPriority: DispatchPriority;

    // Patient info (minimal for dispatch - see PatientInfo for details)
    patientCount: number;
    patientConditionSummary: string;

    // Hospital routing
    nearestHospitals: NearbyHospital[];
    selectedHospital?: string;          // Hospital ID if pre-selected
    hospitalNotified: boolean;

    // Response details
    responseTime?: number;              // Actual response time in minutes
    onSceneTime?: number;               // Time spent at scene
    transportTime?: number;             // Time to hospital
}

export interface NearbyHospital {
    hospitalId: string;
    name: string;
    distance: number;                   // km
    estimatedTime: number;              // minutes
    hasEmergency: boolean;
    hasICU: boolean;
    nhifAccredited: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get display name for EMT level
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
 * Get triage level info
 */
export function getTriageLevelInfo(level: TriageLevel): {
    name: string;
    color: string;
    description: string;
    maxResponseTime: number;
} {
    const info: Record<TriageLevel, { name: string; color: string; description: string; maxResponseTime: number }> = {
        red: {
            name: 'Immediate',
            color: '#FF0000',
            description: 'Life-threatening condition requiring immediate intervention',
            maxResponseTime: 8,     // 8 minutes
        },
        yellow: {
            name: 'Urgent',
            color: '#FFD700',
            description: 'Serious but stable condition, can wait briefly',
            maxResponseTime: 15,    // 15 minutes
        },
        green: {
            name: 'Delayed',
            color: '#00FF00',
            description: 'Minor conditions, can wait for treatment',
            maxResponseTime: 30,    // 30 minutes
        },
    };
    return info[level];
}

/**
 * Get certification type display name
 */
export function getCertificationDisplayName(type: MedicalCertificationType): string {
    const names: Record<MedicalCertificationType, string> = {
        emt_license: 'EMT License',
        cpr: 'CPR Certification',
        first_aid: 'First Aid Certificate',
        bls: 'Basic Life Support (BLS)',
        als: 'Advanced Life Support (ALS)',
        acls: 'Advanced Cardiac Life Support (ACLS)',
        phtls: 'Pre-Hospital Trauma Life Support (PHTLS)',
        nals: 'Neonatal Advanced Life Support (NALS)',
    };
    return names[type];
}

/**
 * Check if certification is expired
 */
export function isCertificationExpired(cert: MedicalCertification): boolean {
    return new Date() > new Date(cert.expiryDate);
}

/**
 * Check if certification expires within days
 */
export function certificationExpiresWithin(cert: MedicalCertification, days: number): boolean {
    const expiryDate = new Date(cert.expiryDate);
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + days);
    return expiryDate <= warningDate && !isCertificationExpired(cert);
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
 * Validate provider has all required certifications for their level
 */
export function hasRequiredCertifications(provider: MedicalProvider): {
    valid: boolean;
    missing: MedicalCertificationType[];
    expired: MedicalCertificationType[];
} {
    const required = getRequiredCertifications(provider.emtLevel);
    const providerCerts = provider.certifications.map(c => c.type);

    const missing = required.filter(r => !providerCerts.includes(r));
    const expired = provider.certifications
        .filter(c => required.includes(c.type) && isCertificationExpired(c))
        .map(c => c.type);

    return {
        valid: missing.length === 0 && expired.length === 0,
        missing,
        expired,
    };
}

// ============================================================================
// KENYAN CERTIFICATION ISSUERS
// ============================================================================

export const KENYA_CERTIFICATION_ISSUERS = [
    'Kenya Red Cross',
    'St. John Ambulance Kenya',
    'AMREF Health Africa',
    'Kenya Medical Training College (KMTC)',
    'Kenya Medical Practitioners and Dentists Council (KMPDC)',
    'Nursing Council of Kenya (NCK)',
    'National Hospital Insurance Fund (NHIF)',
    'Emergency Plus Medical Services (E-Plus)',
] as const;

// ============================================================================
// MEDICAL DATA AUDIT (Kenya Data Protection Act 2019)
// ============================================================================

export type MedicalDataAccessReason = 'dispatch' | 'treatment' | 'audit' | 'insurance' | 'legal';

export interface MedicalDataLog {
    id: string;
    requestId: string;
    accessedBy: string;                 // User ID who accessed
    accessReason: MedicalDataAccessReason;
    timestamp: Date;
    ipAddress?: string;
    dataFields: string[];               // Which fields were accessed
    actionTaken: 'view' | 'update' | 'export';
}

// Kenya law: Medical records retained for 7 years (adults), 25 years (minors)
export const MEDICAL_RECORD_RETENTION_YEARS = 7;
export const MINOR_RECORD_RETENTION_YEARS = 25;
