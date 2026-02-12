// ResQ Kenya - Medical Onboarding Screen Tests
// Tests for EMT/Paramedic registration form

import React from 'react';
import type { KenyaEMTLevel, MedicalCertificationType } from '../../types/medical';

// ============================================================================
// FORM DATA TYPES (matching the component)
// ============================================================================

interface FormData {
    emtLevel: KenyaEMTLevel | null;
    yearsExperience: string;
    previousEmployer: string;
    certifications: {
        type: MedicalCertificationType;
        certNumber: string;
        expiryDate: string;
    }[];
    insuranceProvider: string;
    insurancePolicyNumber: string;
    insuranceExpiry: string;
    agreeToTerms: boolean;
}

// ============================================================================
// EMT LEVEL VALIDATION TESTS
// ============================================================================

describe('Medical Onboarding - EMT Level Selection', () => {

    const EMT_LEVELS: { value: KenyaEMTLevel; label: string }[] = [
        { value: 'first_responder', label: 'First Responder' },
        { value: 'emt_basic', label: 'EMT Basic' },
        { value: 'emt_intermediate', label: 'EMT Intermediate' },
        { value: 'emt_paramedic', label: 'Paramedic' },
    ];

    it('should have 4 EMT levels defined', () => {
        expect(EMT_LEVELS).toHaveLength(4);
    });

    it('should include First Responder as entry level', () => {
        const firstResponder = EMT_LEVELS.find(l => l.value === 'first_responder');
        expect(firstResponder).toBeDefined();
        expect(firstResponder?.label).toBe('First Responder');
    });

    it('should include EMT Basic', () => {
        const emtBasic = EMT_LEVELS.find(l => l.value === 'emt_basic');
        expect(emtBasic).toBeDefined();
    });

    it('should include EMT Intermediate', () => {
        const emtIntermediate = EMT_LEVELS.find(l => l.value === 'emt_intermediate');
        expect(emtIntermediate).toBeDefined();
    });

    it('should include Paramedic as highest level', () => {
        const paramedic = EMT_LEVELS.find(l => l.value === 'emt_paramedic');
        expect(paramedic).toBeDefined();
        expect(paramedic?.label).toBe('Paramedic');
    });
});

// ============================================================================
// REQUIRED CERTIFICATIONS BY EMT LEVEL
// ============================================================================

describe('Medical Onboarding - Required Certifications', () => {

    const REQUIRED_CERTS: Record<KenyaEMTLevel, MedicalCertificationType[]> = {
        first_responder: ['first_aid', 'cpr'],
        emt_basic: ['emt_license', 'first_aid', 'cpr', 'bls'],
        emt_intermediate: ['emt_license', 'first_aid', 'cpr', 'bls', 'als'],
        emt_paramedic: ['emt_license', 'first_aid', 'cpr', 'bls', 'als', 'acls', 'phtls'],
    };

    it('should require first_aid for all levels', () => {
        Object.values(REQUIRED_CERTS).forEach(certs => {
            expect(certs).toContain('first_aid');
        });
    });

    it('should require cpr for all levels', () => {
        Object.values(REQUIRED_CERTS).forEach(certs => {
            expect(certs).toContain('cpr');
        });
    });

    it('should require 2 certifications for first responder', () => {
        expect(REQUIRED_CERTS.first_responder).toHaveLength(2);
    });

    it('should require 4 certifications for EMT Basic', () => {
        expect(REQUIRED_CERTS.emt_basic).toHaveLength(4);
        expect(REQUIRED_CERTS.emt_basic).toContain('bls');
    });

    it('should require 5 certifications for EMT Intermediate', () => {
        expect(REQUIRED_CERTS.emt_intermediate).toHaveLength(5);
        expect(REQUIRED_CERTS.emt_intermediate).toContain('als');
    });

    it('should require 7 certifications for Paramedic', () => {
        expect(REQUIRED_CERTS.emt_paramedic).toHaveLength(7);
        expect(REQUIRED_CERTS.emt_paramedic).toContain('acls');
        expect(REQUIRED_CERTS.emt_paramedic).toContain('phtls');
    });

    it('should require emt_license for all levels except first responder', () => {
        expect(REQUIRED_CERTS.first_responder).not.toContain('emt_license');
        expect(REQUIRED_CERTS.emt_basic).toContain('emt_license');
        expect(REQUIRED_CERTS.emt_intermediate).toContain('emt_license');
        expect(REQUIRED_CERTS.emt_paramedic).toContain('emt_license');
    });
});

// ============================================================================
// FORM VALIDATION TESTS
// ============================================================================

describe('Medical Onboarding - Form Validation', () => {

    const initialFormData: FormData = {
        emtLevel: null,
        yearsExperience: '',
        previousEmployer: '',
        certifications: [],
        insuranceProvider: '',
        insurancePolicyNumber: '',
        insuranceExpiry: '',
        agreeToTerms: false,
    };

    function validateStep1(data: FormData): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        if (!data.emtLevel) {
            errors.push('EMT level is required');
        }
        if (!data.yearsExperience) {
            errors.push('Years of experience is required');
        }
        return { valid: errors.length === 0, errors };
    }

    function validateStep2(data: FormData, requiredCerts: MedicalCertificationType[]): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (data.certifications.length < requiredCerts.length) {
            errors.push('All required certifications must be provided');
        }

        const certTypes = data.certifications.map(c => c.type);
        requiredCerts.forEach(req => {
            if (!certTypes.includes(req)) {
                errors.push(`Missing certification: ${req}`);
            }
        });

        // Check each cert has valid data
        data.certifications.forEach((cert, i) => {
            if (!cert.certNumber.trim()) {
                errors.push(`Certification ${i + 1}: Certificate number required`);
            }
            if (!cert.expiryDate) {
                errors.push(`Certification ${i + 1}: Expiry date required`);
            }
        });

        return { valid: errors.length === 0, errors };
    }

    function validateStep3(data: FormData): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        if (!data.insuranceProvider.trim()) {
            errors.push('Insurance provider is required');
        }
        if (!data.insurancePolicyNumber.trim()) {
            errors.push('Policy number is required');
        }
        if (!data.insuranceExpiry) {
            errors.push('Insurance expiry date is required');
        }
        return { valid: errors.length === 0, errors };
    }

    function validateStep4(data: FormData): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        if (!data.agreeToTerms) {
            errors.push('You must agree to the terms and conditions');
        }
        return { valid: errors.length === 0, errors };
    }

    // Step 1 Tests
    it('should fail step 1 with empty EMT level', () => {
        const result = validateStep1(initialFormData);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('EMT level is required');
    });

    it('should fail step 1 with missing experience', () => {
        const data = { ...initialFormData, emtLevel: 'emt_basic' as KenyaEMTLevel };
        const result = validateStep1(data);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Years of experience is required');
    });

    it('should pass step 1 with valid data', () => {
        const data = {
            ...initialFormData,
            emtLevel: 'emt_basic' as KenyaEMTLevel,
            yearsExperience: '3',
        };
        const result = validateStep1(data);
        expect(result.valid).toBe(true);
    });

    // Step 2 Tests
    it('should fail step 2 with missing certifications', () => {
        const result = validateStep2(initialFormData, ['first_aid', 'cpr']);
        expect(result.valid).toBe(false);
    });

    it('should fail step 2 with incomplete certification data', () => {
        const data = {
            ...initialFormData,
            certifications: [
                { type: 'first_aid' as MedicalCertificationType, certNumber: '', expiryDate: '' },
            ],
        };
        const result = validateStep2(data, ['first_aid']);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('number'))).toBe(true);
    });

    it('should pass step 2 with complete certifications', () => {
        const data = {
            ...initialFormData,
            certifications: [
                { type: 'first_aid' as MedicalCertificationType, certNumber: 'FA-123', expiryDate: '2027-06-15' },
                { type: 'cpr' as MedicalCertificationType, certNumber: 'CPR-456', expiryDate: '2027-06-15' },
            ],
        };
        const result = validateStep2(data, ['first_aid', 'cpr']);
        expect(result.valid).toBe(true);
    });

    // Step 3 Tests
    it('should fail step 3 with missing insurance provider', () => {
        const result = validateStep3(initialFormData);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Insurance provider is required');
    });

    it('should pass step 3 with complete insurance info', () => {
        const data = {
            ...initialFormData,
            insuranceProvider: 'Jubilee Insurance',
            insurancePolicyNumber: 'JUB-2026-12345',
            insuranceExpiry: '2027-01-01',
        };
        const result = validateStep3(data);
        expect(result.valid).toBe(true);
    });

    // Step 4 Tests
    it('should fail step 4 without agreeing to terms', () => {
        const result = validateStep4(initialFormData);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('You must agree to the terms and conditions');
    });

    it('should pass step 4 with terms agreed', () => {
        const data = { ...initialFormData, agreeToTerms: true };
        const result = validateStep4(data);
        expect(result.valid).toBe(true);
    });
});

// ============================================================================
// DATE VALIDATION TESTS
// ============================================================================

describe('Medical Onboarding - Date Validation', () => {

    function isDateInFuture(dateString: string): boolean {
        const date = new Date(dateString);
        const now = new Date();
        return date > now;
    }

    function isDateExpiringSoon(dateString: string, daysThreshold: number = 30): boolean {
        const date = new Date(dateString);
        const now = new Date();
        const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);
        return date <= thresholdDate && date > now;
    }

    it('should validate future dates correctly', () => {
        const futureDate = '2028-12-31';
        expect(isDateInFuture(futureDate)).toBe(true);
    });

    it('should reject past dates', () => {
        const pastDate = '2020-01-01';
        expect(isDateInFuture(pastDate)).toBe(false);
    });

    it('should detect dates expiring within 30 days', () => {
        const today = new Date();
        const in15Days = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
        const dateString = in15Days.toISOString().split('T')[0];
        expect(isDateExpiringSoon(dateString, 30)).toBe(true);
    });

    it('should not flag dates expiring after threshold', () => {
        const today = new Date();
        const in60Days = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
        const dateString = in60Days.toISOString().split('T')[0];
        expect(isDateExpiringSoon(dateString, 30)).toBe(false);
    });
});

// ============================================================================
// EXPERIENCE YEARS PARSING
// ============================================================================

describe('Medical Onboarding - Experience Years Parsing', () => {

    function parseExperienceYears(value: string): number | null {
        // Check for negative indicator before cleaning
        if (value.includes('-')) {
            return null;
        }
        const cleaned = value.trim().replace(/[^\d.]/g, '');
        const parsed = parseFloat(cleaned);
        if (isNaN(parsed) || parsed < 0 || parsed > 50) {
            return null;
        }
        return parsed;
    }

    it('should parse valid integer years', () => {
        expect(parseExperienceYears('5')).toBe(5);
        expect(parseExperienceYears('10')).toBe(10);
    });

    it('should parse decimal years', () => {
        expect(parseExperienceYears('2.5')).toBe(2.5);
    });

    it('should handle years with text', () => {
        expect(parseExperienceYears('5 years')).toBe(5);
    });

    it('should reject negative values', () => {
        expect(parseExperienceYears('-2')).toBe(null);
    });

    it('should reject unreasonable values', () => {
        expect(parseExperienceYears('60')).toBe(null);
    });

    it('should reject non-numeric strings', () => {
        expect(parseExperienceYears('abc')).toBe(null);
    });
});
