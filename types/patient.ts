// ResQ Kenya - Patient Information Types
// Privacy-first patient data (Kenya Data Protection Act 2019 compliant)

// ============================================================================
// PATIENT CONDITION ASSESSMENT
// ============================================================================

/**
 * AVPU Scale - Standard consciousness assessment
 * Used worldwide for quick patient assessment
 */
export type AVPUScale = 'alert' | 'voice' | 'pain' | 'unresponsive';

/**
 * Breathing status assessment
 */
export type BreathingStatus = 'normal' | 'difficulty' | 'not_breathing';

/**
 * Bleeding severity
 */
export type BleedingSeverity = 'none' | 'minor' | 'major' | 'life_threatening';

/**
 * Age category (non-specific for privacy)
 */
export type AgeCategory = 'infant' | 'child' | 'adult' | 'elderly';

/**
 * Gender options
 */
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

// ============================================================================
// PATIENT INFO (Privacy-First)
// Only essential info for dispatch - no sensitive data stored long-term
// ============================================================================

export interface PatientInfo {
    // Demographics (approximate, for dispatch only)
    ageCategory?: AgeCategory;
    gender?: Gender;

    // Vital assessment (AVPU + basic vitals)
    consciousness: AVPUScale;
    breathing: BreathingStatus;
    bleeding: BleedingSeverity;

    // Current condition
    isConscious: boolean;
    isBreathing: boolean;
    hasPulse: boolean;

    // Known conditions (optional, with consent)
    allergiesKnown?: boolean;
    allergyDetails?: string;            // Encrypted
    medicalHistory?: string[];          // Encrypted, provider-only view
    currentMedications?: string[];      // Encrypted

    // Special considerations
    isPregnant?: boolean;
    pregnancyWeeks?: number;
    hasDisability?: boolean;
    mobilityIssue?: boolean;

    // Notes
    additionalNotes?: string;
}

// ============================================================================
// PATIENT CONDITION (for dispatchers/providers)
// ============================================================================

export interface PatientCondition {
    // Primary complaint
    chiefComplaint: string;             // Main reported issue

    // Symptoms checklist
    symptoms: PatientSymptom[];

    // Mechanism of injury (if trauma)
    mechanismOfInjury?: MechanismOfInjury;

    // Pain assessment
    painLevel?: number;                 // 0-10 scale
    painLocation?: string;

    // Duration
    onsetTime: 'just_now' | 'minutes' | 'hours' | 'days';

    // First aid given
    firstAidProvided: boolean;
    firstAidDetails?: string;
}

export type PatientSymptom =
    | 'chest_pain'
    | 'difficulty_breathing'
    | 'severe_bleeding'
    | 'unconscious'
    | 'severe_pain'
    | 'broken_bone'
    | 'burn'
    | 'allergic_reaction'
    | 'seizure'
    | 'stroke_symptoms'
    | 'heart_attack_symptoms'
    | 'poisoning'
    | 'choking'
    | 'drowning'
    | 'electric_shock'
    | 'animal_bite'
    | 'road_accident'
    | 'assault'
    | 'fall'
    | 'labor_pains'
    | 'pregnancy_complication'
    | 'mental_health_crisis'
    | 'other';

export type MechanismOfInjury =
    | 'road_traffic_accident'
    | 'pedestrian_hit'
    | 'motorcycle_accident'
    | 'fall_from_height'
    | 'fall_same_level'
    | 'assault_blunt'
    | 'assault_sharp'
    | 'gunshot'
    | 'burn_flame'
    | 'burn_chemical'
    | 'burn_electrical'
    | 'drowning'
    | 'sports_injury'
    | 'industrial_accident'
    | 'animal_attack'
    | 'unknown';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get AVPU assessment description
 */
export function getAVPUDescription(avpu: AVPUScale): string {
    const descriptions: Record<AVPUScale, string> = {
        alert: 'Alert and responsive - Patient is fully conscious and aware',
        voice: 'Responds to voice - Patient responds when spoken to',
        pain: 'Responds to pain - Patient only responds to painful stimuli',
        unresponsive: 'Unresponsive - Patient does not respond to any stimuli',
    };
    return descriptions[avpu];
}

/**
 * Determine severity based on patient condition
 */
export function assessPatientSeverity(patient: PatientInfo): 'critical' | 'serious' | 'moderate' | 'minor' {
    // Critical conditions
    if (
        !patient.isBreathing ||
        !patient.hasPulse ||
        patient.consciousness === 'unresponsive' ||
        patient.bleeding === 'life_threatening'
    ) {
        return 'critical';
    }

    // Serious conditions
    if (
        patient.consciousness === 'pain' ||
        patient.breathing === 'difficulty' ||
        patient.bleeding === 'major'
    ) {
        return 'serious';
    }

    // Moderate conditions
    if (
        patient.consciousness === 'voice' ||
        patient.bleeding === 'minor'
    ) {
        return 'moderate';
    }

    return 'minor';
}

/**
 * Get recommended triage level based on patient condition
 */
export function recommendTriageLevel(patient: PatientInfo): 'red' | 'yellow' | 'green' {
    const severity = assessPatientSeverity(patient);

    switch (severity) {
        case 'critical':
            return 'red';
        case 'serious':
            return 'yellow';
        case 'moderate':
        case 'minor':
        default:
            return 'green';
    }
}

/**
 * Check if patient info requires immediate action
 */
export function requiresImmediateAction(patient: PatientInfo): boolean {
    return (
        !patient.isBreathing ||
        !patient.hasPulse ||
        patient.consciousness === 'unresponsive' ||
        patient.bleeding === 'life_threatening'
    );
}

/**
 * Get symptom display name
 */
export function getSymptomDisplayName(symptom: PatientSymptom): string {
    const names: Record<PatientSymptom, string> = {
        chest_pain: 'Chest Pain',
        difficulty_breathing: 'Difficulty Breathing',
        severe_bleeding: 'Severe Bleeding',
        unconscious: 'Unconscious',
        severe_pain: 'Severe Pain',
        broken_bone: 'Suspected Broken Bone',
        burn: 'Burn Injury',
        allergic_reaction: 'Allergic Reaction',
        seizure: 'Seizure',
        stroke_symptoms: 'Stroke Symptoms (FAST)',
        heart_attack_symptoms: 'Heart Attack Symptoms',
        poisoning: 'Poisoning',
        choking: 'Choking',
        drowning: 'Drowning',
        electric_shock: 'Electric Shock',
        animal_bite: 'Animal Bite',
        road_accident: 'Road Accident',
        assault: 'Assault Injury',
        fall: 'Fall Injury',
        labor_pains: 'Labor Pains',
        pregnancy_complication: 'Pregnancy Complication',
        mental_health_crisis: 'Mental Health Crisis',
        other: 'Other',
    };
    return names[symptom];
}

// ============================================================================
// CONSENT & PRIVACY
// ============================================================================

export interface PatientConsent {
    patientId: string;
    requestId: string;

    // Consent flags
    dataCollectionConsent: boolean;
    emergencyTreatmentConsent: boolean;
    hospitalTransferConsent: boolean;
    insuranceShareConsent: boolean;

    // Who gave consent (if patient unable)
    consentGivenBy: 'patient' | 'family' | 'bystander' | 'implied_emergency';
    relationshipToPatient?: string;

    // Consent record
    consentTimestamp: Date;
    consentMethod: 'verbal' | 'written' | 'app' | 'implied';
}

/**
 * Check if implied consent applies (Kenya law)
 * Implied consent applies when patient is unable to consent and treatment is life-saving
 */
export function canUseImpliedConsent(patient: PatientInfo, isLifeThreatening: boolean): boolean {
    const patientUnableToConsent =
        patient.consciousness === 'unresponsive' ||
        patient.consciousness === 'pain';

    return patientUnableToConsent && isLifeThreatening;
}
