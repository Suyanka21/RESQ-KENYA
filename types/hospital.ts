// ResQ Kenya - Hospital Types
// Kenya hospital system integration

import type { GeoLocation } from './index';

// ============================================================================
// KENYA HOSPITAL LEVELS
// Based on Kenya Ministry of Health classification
// ============================================================================

/**
 * Kenya Hospital Levels (Ministry of Health)
 * Level 1: Community health units
 * Level 2: Dispensaries
 * Level 3: Health centers
 * Level 4: Sub-county hospitals
 * Level 5: County referral hospitals
 * Level 6: National referral hospitals (e.g., Kenyatta National Hospital)
 */
export type KenyaHospitalLevel =
    | 'level_1'     // Community health unit
    | 'level_2'     // Dispensary
    | 'level_3'     // Health center
    | 'level_4'     // Sub-county hospital
    | 'level_5'     // County referral hospital
    | 'level_6';    // National referral hospital

/**
 * Hospital ownership type
 */
export type HospitalType = 'public' | 'private' | 'mission' | 'ngo';

// ============================================================================
// HOSPITAL INTERFACE
// ============================================================================

export interface Hospital {
    id: string;
    name: string;
    type: HospitalType;
    level: KenyaHospitalLevel;

    // Location
    location: GeoLocation;
    address: string;
    county: string;
    subCounty: string;

    // Contact
    emergencyContact: string;
    switchboard?: string;
    email?: string;

    // Accreditation
    nhifAccredited: boolean;
    nhifCode?: string;                  // NHIF facility code

    // Capabilities
    hasEmergency: boolean;
    hasICU: boolean;
    hasMaternity: boolean;
    hasPediatrics: boolean;
    hasTraumaCenter: boolean;
    hasBurnUnit: boolean;
    hasDialysis: boolean;
    hasNICU: boolean;                   // Neonatal ICU

    // Specializations offered
    specializations: HospitalSpecialization[];

    // Capacity
    totalBeds?: number;
    icuBeds?: number;
    emergencyBays?: number;

    // Operating hours
    operatingHours: '24/7' | 'limited';
    emergencyHours?: string;            // e.g., "24 hours" or "8am-10pm"

    // Additional info
    acceptsAmbulance: boolean;
    helipadAvailable: boolean;
}

export type HospitalSpecialization =
    | 'general_medicine'
    | 'surgery'
    | 'orthopedics'
    | 'cardiology'
    | 'neurology'
    | 'oncology'
    | 'obstetrics'
    | 'pediatrics'
    | 'psychiatry'
    | 'nephrology'
    | 'dermatology'
    | 'ophthalmology'
    | 'ent'             // Ear, Nose, Throat
    | 'urology'
    | 'gastroenterology'
    | 'pulmonology'
    | 'endocrinology'
    | 'rheumatology'
    | 'infectious_disease'
    | 'emergency_medicine'
    | 'trauma'
    | 'burns';

/**
 * specific capabilities required for emergency types
 */
export type HospitalEmergencyCapability =
    | 'cardiac_care'
    | 'icu'
    | 'trauma_center'
    | 'surgery'
    | 'ventilator'
    | 'stroke_unit'
    | 'ct_scan'
    | 'pediatric'
    | 'nicu'
    | 'maternity'
    | 'burn_unit'
    | 'toxicology'
    | 'psychiatric'
    | 'general_medicine';

// ============================================================================
// HOSPITAL AVAILABILITY (Real-time updates)
// ============================================================================

export interface HospitalAvailability {
    hospitalId: string;
    lastUpdated: Date;

    // Bed availability
    emergencyBedsAvailable: number;
    icuBedsAvailable: number;
    maternityBedsAvailable: number;
    generalBedsAvailable: number;

    // Current wait times (estimated)
    emergencyWaitMinutes: number;

    // Status
    acceptingEmergencies: boolean;
    acceptingAmbulances: boolean;
    onDiversion: boolean;               // Redirecting ambulances elsewhere
    diversionReason?: string;

    // Staff availability
    emergencyDoctorAvailable: boolean;
    surgeonOnCall: boolean;
    specialistOnCall: string[];
}

// ============================================================================
// MAJOR NAIROBI HOSPITALS
// ============================================================================

export const NAIROBI_HOSPITALS: Partial<Hospital>[] = [
    // National Referral (Level 6)
    {
        name: 'Kenyatta National Hospital',
        type: 'public',
        level: 'level_6',
        county: 'Nairobi',
        subCounty: 'Dagoretti North',
        emergencyContact: '+254 20 2726300',
        nhifAccredited: true,
        hasEmergency: true,
        hasICU: true,
        hasTraumaCenter: true,
        hasBurnUnit: true,
        operatingHours: '24/7',
        acceptsAmbulance: true,
        helipadAvailable: true,
    },
    // County Referral (Level 5)
    {
        name: 'Aga Khan University Hospital',
        type: 'private',
        level: 'level_5',
        county: 'Nairobi',
        subCounty: 'Parklands',
        emergencyContact: '+254 20 366 2000',
        nhifAccredited: true,
        hasEmergency: true,
        hasICU: true,
        hasTraumaCenter: true,
        operatingHours: '24/7',
        acceptsAmbulance: true,
        helipadAvailable: true,
    },
    {
        name: 'Nairobi Hospital',
        type: 'private',
        level: 'level_5',
        county: 'Nairobi',
        subCounty: 'Upper Hill',
        emergencyContact: '+254 20 2845000',
        nhifAccredited: true,
        hasEmergency: true,
        hasICU: true,
        operatingHours: '24/7',
        acceptsAmbulance: true,
        helipadAvailable: false,
    },
    {
        name: 'MP Shah Hospital',
        type: 'private',
        level: 'level_4',
        county: 'Nairobi',
        subCounty: 'Parklands',
        emergencyContact: '+254 20 4291000',
        nhifAccredited: true,
        hasEmergency: true,
        hasICU: true,
        operatingHours: '24/7',
        acceptsAmbulance: true,
        helipadAvailable: false,
    },
    {
        name: 'Avenue Hospital',
        type: 'private',
        level: 'level_4',
        county: 'Nairobi',
        subCounty: 'Parklands',
        emergencyContact: '+254 20 2711520',
        nhifAccredited: true,
        hasEmergency: true,
        hasICU: true,
        operatingHours: '24/7',
        acceptsAmbulance: true,
        helipadAvailable: false,
    },
    {
        name: 'Mater Misericordiae Hospital',
        type: 'mission',
        level: 'level_4',
        county: 'Nairobi',
        subCounty: 'South B',
        emergencyContact: '+254 20 6531199',
        nhifAccredited: true,
        hasEmergency: true,
        hasICU: true,
        hasMaternity: true,
        operatingHours: '24/7',
        acceptsAmbulance: true,
        helipadAvailable: false,
    },
    {
        name: 'Gertrude\'s Children\'s Hospital',
        type: 'private',
        level: 'level_4',
        county: 'Nairobi',
        subCounty: 'Muthaiga',
        emergencyContact: '+254 20 7206000',
        nhifAccredited: true,
        hasEmergency: true,
        hasICU: true,
        hasPediatrics: true,
        hasNICU: true,
        operatingHours: '24/7',
        acceptsAmbulance: true,
        helipadAvailable: false,
    },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get hospital level display name
 */
export function getHospitalLevelName(level: KenyaHospitalLevel): string {
    const names: Record<KenyaHospitalLevel, string> = {
        level_1: 'Community Health Unit',
        level_2: 'Dispensary',
        level_3: 'Health Center',
        level_4: 'Sub-County Hospital',
        level_5: 'County Referral Hospital',
        level_6: 'National Referral Hospital',
    };
    return names[level];
}

/**
 * Get hospital level description
 */
export function getHospitalLevelDescription(level: KenyaHospitalLevel): string {
    const descriptions: Record<KenyaHospitalLevel, string> = {
        level_1: 'Basic community health services and referral',
        level_2: 'Outpatient services, minor treatments',
        level_3: 'Outpatient and basic inpatient services',
        level_4: 'Full hospital with surgery and specialist services',
        level_5: 'Advanced referral with comprehensive specialist care',
        level_6: 'Highest tier with all specializations and research',
    };
    return descriptions[level];
}

/**
 * Get minimum hospital level for emergency type
 */
export function getMinimumHospitalLevel(emergencyType: string): KenyaHospitalLevel {
    const levelMap: Record<string, KenyaHospitalLevel> = {
        trauma: 'level_5',
        cardiac: 'level_5',
        burn: 'level_5',
        respiratory: 'level_4',
        medical: 'level_4',
        obstetric: 'level_4',
        other: 'level_3',
    };
    return levelMap[emergencyType] || 'level_3';
}

/**
 * Check if hospital can handle emergency type
 */
export function canHandleEmergency(hospital: Hospital, emergencyType: string): boolean {
    if (!hospital.hasEmergency || !hospital.acceptsAmbulance) {
        return false;
    }

    // Check specific capabilities
    switch (emergencyType) {
        case 'trauma':
            return hospital.hasTraumaCenter || hospital.level === 'level_6';
        case 'cardiac':
            return hospital.hasICU && hospital.level >= 'level_4';
        case 'burn':
            return hospital.hasBurnUnit || hospital.level === 'level_6';
        case 'obstetric':
            return hospital.hasMaternity;
        default:
            return true;
    }
}

/**
 * Filter hospitals that can handle the emergency
 */
export function filterSuitableHospitals(
    hospitals: Hospital[],
    emergencyType: string,
    requireICU: boolean = false
): Hospital[] {
    return hospitals.filter(h => {
        if (!canHandleEmergency(h, emergencyType)) return false;
        if (requireICU && !h.hasICU) return false;
        return true;
    });
}

// ============================================================================
// KENYA EMERGENCY NUMBERS
// ============================================================================

export const KENYA_EMERGENCY_NUMBERS = {
    // National emergency
    police: '999',
    general: '112',        // GSM standard (works on all networks)

    // Ambulance services
    kenyaRedCross: '1199',
    stJohnAmbulance: '0800 720 990',
    emergencyPlus: '0800 723 253',
    aakAmbulance: '0700 000 999',

    // Fire
    fireAndRescue: '999',

    // Medical helplines
    nhifHelpline: '0800 720 601',
    healthHelpline: '0800 720 990',
} as const;

/**
 * Get formatted emergency number for display
 */
export function formatEmergencyNumber(number: string): string {
    // Remove spaces for dialing
    return number.replace(/\s/g, '');
}

/**
 * Check if a number is an emergency number
 */
export function isEmergencyNumber(number: string): boolean {
    const cleanNumber = number.replace(/\s/g, '');
    const emergencyNumbers = Object.values(KENYA_EMERGENCY_NUMBERS);
    return emergencyNumbers.includes(cleanNumber as any);
}
