// ResQ Kenya - Medical Compliance Service Test Suite
// Tests for certification validation, audit logging, and data retention

import {
    validateCertificationNumber,
    isCertificationExpired,
    certificationExpiresWithin,
    getRequiredCertifications,
    validateProviderCertifications,
    shouldRetainMedicalRecord,
    getRetentionExpiryDate,
    getEMTLevelDisplayName,
    getEMTLevelDescription,
    getMinimumEMTLevelForTriage,
    KENYA_CERTIFICATION_ISSUERS,
} from '../../services/medical-compliance.service';

describe('services/medical-compliance.service', () => {

    // =========================================================================
    // Certification Validation Tests
    // =========================================================================
    describe('validateCertificationNumber', () => {

        it('should reject empty certification number', () => {
            const result = validateCertificationNumber('emt_license', '');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('required');
        });

        it('should reject whitespace-only certification number', () => {
            const result = validateCertificationNumber('cpr', '   ');
            expect(result.valid).toBe(false);
        });

        it('should reject too-short EMT license number', () => {
            const result = validateCertificationNumber('emt_license', 'AB');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('short');
        });

        it('should accept valid EMT license number', () => {
            const result = validateCertificationNumber('emt_license', 'EMT-2024-001');
            expect(result.valid).toBe(true);
        });

        it('should accept valid CPR certification', () => {
            const result = validateCertificationNumber('cpr', 'CPR2024');
            expect(result.valid).toBe(true);
        });

        it('should reject too-short advanced certification', () => {
            const result = validateCertificationNumber('acls', 'ABC');
            expect(result.valid).toBe(false);
        });

        it('should accept valid advanced certification', () => {
            const result = validateCertificationNumber('phtls', 'PHTLS-2024-KE-001');
            expect(result.valid).toBe(true);
        });
    });

    // =========================================================================
    // Certification Expiry Tests
    // =========================================================================
    describe('isCertificationExpired', () => {

        it('should detect expired date', () => {
            const pastDate = new Date('2020-01-01');
            expect(isCertificationExpired(pastDate)).toBe(true);
        });

        it('should detect non-expired date', () => {
            const futureDate = new Date('2030-01-01');
            expect(isCertificationExpired(futureDate)).toBe(false);
        });

        it('should handle string date format', () => {
            expect(isCertificationExpired('2020-01-01')).toBe(true);
            expect(isCertificationExpired('2030-01-01')).toBe(false);
        });
    });

    describe('certificationExpiresWithin', () => {

        it('should detect expiring soon', () => {
            const in10Days = new Date();
            in10Days.setDate(in10Days.getDate() + 10);
            expect(certificationExpiresWithin(in10Days, 30)).toBe(true);
        });

        it('should not flag distant expiry', () => {
            const in100Days = new Date();
            in100Days.setDate(in100Days.getDate() + 100);
            expect(certificationExpiresWithin(in100Days, 30)).toBe(false);
        });

        it('should not flag already expired', () => {
            const pastDate = new Date('2020-01-01');
            expect(certificationExpiresWithin(pastDate, 30)).toBe(false);
        });
    });

    // =========================================================================
    // Required Certifications Tests
    // =========================================================================
    describe('getRequiredCertifications', () => {

        it('should return 2 certs for first_responder', () => {
            const certs = getRequiredCertifications('first_responder');
            expect(certs).toHaveLength(2);
            expect(certs).toContain('first_aid');
            expect(certs).toContain('cpr');
        });

        it('should return 4 certs for emt_basic', () => {
            const certs = getRequiredCertifications('emt_basic');
            expect(certs).toHaveLength(4);
        });

        it('should return 5 certs for emt_intermediate', () => {
            const certs = getRequiredCertifications('emt_intermediate');
            expect(certs).toHaveLength(5);
            expect(certs).toContain('als');
        });

        it('should return 7 certs for emt_paramedic', () => {
            const certs = getRequiredCertifications('emt_paramedic');
            expect(certs).toHaveLength(7);
            expect(certs).toContain('acls');
            expect(certs).toContain('phtls');
        });
    });

    // =========================================================================
    // Provider Validation Tests
    // =========================================================================
    describe('validateProviderCertifications', () => {

        it('should validate complete first responder', () => {
            const result = validateProviderCertifications('first_responder', [
                { type: 'first_aid', expiryDate: '2030-01-01' },
                { type: 'cpr', expiryDate: '2030-01-01' },
            ]);
            expect(result.valid).toBe(true);
            expect(result.missing).toHaveLength(0);
        });

        it('should detect missing certifications', () => {
            const result = validateProviderCertifications('first_responder', [
                { type: 'first_aid', expiryDate: '2030-01-01' },
            ]);
            expect(result.valid).toBe(false);
            expect(result.missing).toContain('cpr');
        });

        it('should detect expired certifications', () => {
            const result = validateProviderCertifications('first_responder', [
                { type: 'first_aid', expiryDate: '2020-01-01' },
                { type: 'cpr', expiryDate: '2030-01-01' },
            ]);
            expect(result.valid).toBe(false);
            expect(result.expired).toContain('first_aid');
        });

        it('should detect expiring soon certifications', () => {
            const in15Days = new Date();
            in15Days.setDate(in15Days.getDate() + 15);

            const result = validateProviderCertifications('first_responder', [
                { type: 'first_aid', expiryDate: in15Days },
                { type: 'cpr', expiryDate: '2030-01-01' },
            ]);
            expect(result.expiringIn30Days).toContain('first_aid');
        });
    });

    // =========================================================================
    // Data Retention Tests (Kenya Law)
    // =========================================================================
    describe('shouldRetainMedicalRecord', () => {

        it('should retain recent adult records', () => {
            const recentDate = new Date();
            recentDate.setFullYear(recentDate.getFullYear() - 3);
            expect(shouldRetainMedicalRecord(recentDate, false)).toBe(true);
        });

        it('should not retain old adult records (>7 years)', () => {
            const oldDate = new Date();
            oldDate.setFullYear(oldDate.getFullYear() - 10);
            expect(shouldRetainMedicalRecord(oldDate, false)).toBe(false);
        });

        it('should retain old minor records (up to 25 years)', () => {
            const oldDate = new Date();
            oldDate.setFullYear(oldDate.getFullYear() - 20);
            expect(shouldRetainMedicalRecord(oldDate, true)).toBe(true);
        });
    });

    describe('getRetentionExpiryDate', () => {

        it('should return 7 years for adult records', () => {
            const recordDate = new Date('2020-01-01');
            const expiryDate = getRetentionExpiryDate(recordDate, false);
            expect(expiryDate.getFullYear()).toBe(2027);
        });

        it('should return 25 years for minor records', () => {
            const recordDate = new Date('2020-01-01');
            const expiryDate = getRetentionExpiryDate(recordDate, true);
            expect(expiryDate.getFullYear()).toBe(2045);
        });
    });

    // =========================================================================
    // EMT Level Helper Tests
    // =========================================================================
    describe('getEMTLevelDisplayName', () => {

        it('should return display names', () => {
            expect(getEMTLevelDisplayName('first_responder')).toBe('First Responder');
            expect(getEMTLevelDisplayName('emt_basic')).toBe('EMT Basic');
            expect(getEMTLevelDisplayName('emt_intermediate')).toBe('EMT Intermediate');
            expect(getEMTLevelDisplayName('emt_paramedic')).toBe('Paramedic');
        });
    });

    describe('getEMTLevelDescription', () => {

        it('should return descriptions', () => {
            expect(getEMTLevelDescription('first_responder')).toContain('first aid');
            expect(getEMTLevelDescription('emt_paramedic')).toContain('paramedic');
        });
    });

    describe('getMinimumEMTLevelForTriage', () => {

        it('should require intermediate for red triage', () => {
            expect(getMinimumEMTLevelForTriage('red')).toBe('emt_intermediate');
        });

        it('should require basic for yellow triage', () => {
            expect(getMinimumEMTLevelForTriage('yellow')).toBe('emt_basic');
        });

        it('should allow first responder for green triage', () => {
            expect(getMinimumEMTLevelForTriage('green')).toBe('first_responder');
        });
    });

    // =========================================================================
    // Kenya Issuers Tests
    // =========================================================================
    describe('KENYA_CERTIFICATION_ISSUERS', () => {

        it('should include major Kenya issuers', () => {
            expect(KENYA_CERTIFICATION_ISSUERS).toContain('Kenya Red Cross');
            expect(KENYA_CERTIFICATION_ISSUERS).toContain('St. John Ambulance Kenya');
            expect(KENYA_CERTIFICATION_ISSUERS).toContain('AMREF Health Africa');
        });
    });
});
