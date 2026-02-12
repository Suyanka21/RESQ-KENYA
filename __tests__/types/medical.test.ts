// ResQ Kenya - Medical Types Test Suite
// Tests for medical provider types, certifications, and triage system

import {
    getEMTLevelDisplayName,
    getTriageLevelInfo,
    getCertificationDisplayName,
    isCertificationExpired,
    certificationExpiresWithin,
    getRequiredCertifications,
    hasRequiredCertifications,
    KENYA_CERTIFICATION_ISSUERS,
    MEDICAL_RECORD_RETENTION_YEARS,
    type KenyaEMTLevel,
    type MedicalCertificationType,
    type TriageLevel,
    type MedicalProvider,
    type MedicalCertification,
} from '../../types/medical';

describe('types/medical', () => {

    // =========================================================================
    // EMT Level Tests
    // =========================================================================
    describe('KenyaEMTLevel', () => {

        it('should have 4 EMT levels', () => {
            const levels: KenyaEMTLevel[] = ['first_responder', 'emt_basic', 'emt_intermediate', 'emt_paramedic'];
            expect(levels).toHaveLength(4);
        });

        it('should get display name for first responder', () => {
            expect(getEMTLevelDisplayName('first_responder')).toBe('First Responder');
        });

        it('should get display name for emt basic', () => {
            expect(getEMTLevelDisplayName('emt_basic')).toBe('EMT Basic');
        });

        it('should get display name for emt intermediate', () => {
            expect(getEMTLevelDisplayName('emt_intermediate')).toBe('EMT Intermediate');
        });

        it('should get display name for paramedic', () => {
            expect(getEMTLevelDisplayName('emt_paramedic')).toBe('Paramedic');
        });
    });

    // =========================================================================
    // Triage Level Tests
    // =========================================================================
    describe('TriageLevel', () => {

        it('should return red triage info', () => {
            const info = getTriageLevelInfo('red');
            expect(info.name).toBe('Immediate');
            expect(info.color).toBe('#FF0000');
            expect(info.maxResponseTime).toBe(8);
        });

        it('should return yellow triage info', () => {
            const info = getTriageLevelInfo('yellow');
            expect(info.name).toBe('Urgent');
            expect(info.color).toBe('#FFD700');
            expect(info.maxResponseTime).toBe(15);
        });

        it('should return green triage info', () => {
            const info = getTriageLevelInfo('green');
            expect(info.name).toBe('Delayed');
            expect(info.color).toBe('#00FF00');
            expect(info.maxResponseTime).toBe(30);
        });
    });

    // =========================================================================
    // Certification Tests
    // =========================================================================
    describe('MedicalCertification', () => {

        it('should get certification display name', () => {
            expect(getCertificationDisplayName('emt_license')).toBe('EMT License');
            expect(getCertificationDisplayName('cpr')).toBe('CPR Certification');
            expect(getCertificationDisplayName('first_aid')).toBe('First Aid Certificate');
            expect(getCertificationDisplayName('bls')).toBe('Basic Life Support (BLS)');
            expect(getCertificationDisplayName('acls')).toBe('Advanced Cardiac Life Support (ACLS)');
        });

        it('should detect expired certification', () => {
            const expiredCert: MedicalCertification = {
                id: 'cert_1',
                type: 'cpr',
                issuer: 'Kenya Red Cross',
                certificateNumber: 'CPR-2023-001',
                issueDate: new Date('2022-01-01'),
                expiryDate: new Date('2023-01-01'), // Expired
                documentUrl: 'https://example.com/cert.pdf',
                verified: true,
            };
            expect(isCertificationExpired(expiredCert)).toBe(true);
        });

        it('should detect valid certification', () => {
            const futureCert: MedicalCertification = {
                id: 'cert_2',
                type: 'cpr',
                issuer: 'Kenya Red Cross',
                certificateNumber: 'CPR-2025-001',
                issueDate: new Date('2024-01-01'),
                expiryDate: new Date('2030-01-01'), // Not expired
                documentUrl: 'https://example.com/cert.pdf',
                verified: true,
            };
            expect(isCertificationExpired(futureCert)).toBe(false);
        });

        it('should detect certification expiring within days', () => {
            const today = new Date();
            const in15Days = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);

            const expiringCert: MedicalCertification = {
                id: 'cert_3',
                type: 'cpr',
                issuer: 'Kenya Red Cross',
                certificateNumber: 'CPR-2024-001',
                issueDate: new Date('2023-01-01'),
                expiryDate: in15Days,
                documentUrl: 'https://example.com/cert.pdf',
                verified: true,
            };

            expect(certificationExpiresWithin(expiringCert, 30)).toBe(true);
            expect(certificationExpiresWithin(expiringCert, 10)).toBe(false);
        });
    });

    // =========================================================================
    // Required Certifications Tests
    // =========================================================================
    describe('getRequiredCertifications', () => {

        it('should require first_aid and cpr for first responders', () => {
            const required = getRequiredCertifications('first_responder');
            expect(required).toContain('first_aid');
            expect(required).toContain('cpr');
            expect(required).toHaveLength(2);
        });

        it('should require emt_license, first_aid, cpr, bls for emt_basic', () => {
            const required = getRequiredCertifications('emt_basic');
            expect(required).toContain('emt_license');
            expect(required).toContain('first_aid');
            expect(required).toContain('cpr');
            expect(required).toContain('bls');
            expect(required).toHaveLength(4);
        });

        it('should require additional certs for emt_intermediate', () => {
            const required = getRequiredCertifications('emt_intermediate');
            expect(required).toContain('als');
            expect(required).toHaveLength(5);
        });

        it('should require all certs for emt_paramedic', () => {
            const required = getRequiredCertifications('emt_paramedic');
            expect(required).toContain('acls');
            expect(required).toContain('phtls');
            expect(required).toHaveLength(7);
        });
    });

    // =========================================================================
    // Provider Validation Tests
    // =========================================================================
    describe('hasRequiredCertifications', () => {

        const createMockProvider = (
            emtLevel: KenyaEMTLevel,
            certs: { type: MedicalCertificationType; expired: boolean }[]
        ): MedicalProvider => ({
            id: 'provider_1',
            userId: 'user_1',
            emtLevel,
            certifications: certs.map((c, i) => ({
                id: `cert_${i}`,
                type: c.type,
                issuer: 'Kenya Red Cross',
                certificateNumber: `CERT-${i}`,
                issueDate: new Date('2023-01-01'),
                expiryDate: c.expired ? new Date('2023-01-01') : new Date('2030-01-01'),
                documentUrl: 'https://example.com/cert.pdf',
                verified: true,
            })),
            yearsExperience: 5,
            specializations: [],
            insuranceCoverage: {
                provider: 'Test Insurance',
                policyNumber: 'POL-001',
                coverage: 'professional',
                coverageAmount: 1000000,
                expiryDate: new Date('2030-01-01'),
                documentUrl: 'https://example.com/insurance.pdf',
            },
            status: 'active',
            totalEmergencies: 0,
            averageResponseTime: 0,
            rating: 0,
        });

        it('should validate first responder with complete certs', () => {
            const provider = createMockProvider('first_responder', [
                { type: 'first_aid', expired: false },
                { type: 'cpr', expired: false },
            ]);
            const result = hasRequiredCertifications(provider);
            expect(result.valid).toBe(true);
            expect(result.missing).toHaveLength(0);
            expect(result.expired).toHaveLength(0);
        });

        it('should detect missing certifications', () => {
            const provider = createMockProvider('first_responder', [
                { type: 'first_aid', expired: false },
                // Missing CPR
            ]);
            const result = hasRequiredCertifications(provider);
            expect(result.valid).toBe(false);
            expect(result.missing).toContain('cpr');
        });

        it('should detect expired certifications', () => {
            const provider = createMockProvider('first_responder', [
                { type: 'first_aid', expired: true }, // Expired
                { type: 'cpr', expired: false },
            ]);
            const result = hasRequiredCertifications(provider);
            expect(result.valid).toBe(false);
            expect(result.expired).toContain('first_aid');
        });
    });

    // =========================================================================
    // Kenya Issuers Tests
    // =========================================================================
    describe('KENYA_CERTIFICATION_ISSUERS', () => {

        it('should include Kenya Red Cross', () => {
            expect(KENYA_CERTIFICATION_ISSUERS).toContain('Kenya Red Cross');
        });

        it('should include St. John Ambulance Kenya', () => {
            expect(KENYA_CERTIFICATION_ISSUERS).toContain('St. John Ambulance Kenya');
        });

        it('should include AMREF Health Africa', () => {
            expect(KENYA_CERTIFICATION_ISSUERS).toContain('AMREF Health Africa');
        });

        it('should have at least 5 issuers', () => {
            expect(KENYA_CERTIFICATION_ISSUERS.length).toBeGreaterThanOrEqual(5);
        });
    });

    // =========================================================================
    // Data Retention Tests
    // =========================================================================
    describe('Medical Record Retention', () => {

        it('should have 7 years retention for adults', () => {
            expect(MEDICAL_RECORD_RETENTION_YEARS).toBe(7);
        });
    });
});
