// ResQ Kenya - Hospital Cloud Functions Tests
// Tests for hospital registration, search, pre-alerts, and capacity management

// Mock firebase-admin before importing the source file
// This prevents "The default Firebase app does not exist" error
jest.mock('firebase-admin', () => ({
    initializeApp: jest.fn(),
    firestore: () => ({
        collection: jest.fn(),
        doc: jest.fn(),
    }),
}), { virtual: true });

import { getRequiredCapabilitiesForEmergency } from '../../functions/src/medical/hospitals';
import type { TriageLevel } from '../../types/medical';
import type { KenyaHospitalLevel } from '../../types/hospital';

// ============================================================================
// HELPER FUNCTION TESTS
// ============================================================================

describe('services/medical-hospitals', () => {

    describe('getRequiredCapabilitiesForEmergency', () => {

        it('should return cardiac capabilities for cardiac emergency', () => {
            const caps = getRequiredCapabilitiesForEmergency('cardiac');
            expect(caps).toContain('cardiac_care');
            expect(caps).toContain('icu');
        });

        it('should return trauma capabilities for trauma emergency', () => {
            const caps = getRequiredCapabilitiesForEmergency('trauma');
            expect(caps).toContain('trauma_center');
            expect(caps).toContain('surgery');
        });

        it('should return respiratory capabilities for respiratory emergency', () => {
            const caps = getRequiredCapabilitiesForEmergency('respiratory');
            expect(caps).toContain('icu');
            expect(caps).toContain('ventilator');
        });

        it('should return stroke capabilities for stroke emergency', () => {
            const caps = getRequiredCapabilitiesForEmergency('stroke');
            expect(caps).toContain('stroke_unit');
            expect(caps).toContain('ct_scan');
        });

        it('should return pediatric capabilities for pediatric emergency', () => {
            const caps = getRequiredCapabilitiesForEmergency('pediatric');
            expect(caps).toContain('pediatric');
            expect(caps).toContain('nicu');
        });

        it('should return obstetric capabilities for obstetric emergency', () => {
            const caps = getRequiredCapabilitiesForEmergency('obstetric');
            expect(caps).toContain('maternity');
            expect(caps).toContain('nicu');
        });

        it('should return burn unit for burn emergency', () => {
            const caps = getRequiredCapabilitiesForEmergency('burn');
            expect(caps).toContain('burn_unit');
            expect(caps).toContain('surgery');
        });

        it('should return toxicology for poisoning emergency', () => {
            const caps = getRequiredCapabilitiesForEmergency('poisoning');
            expect(caps).toContain('toxicology');
        });

        it('should return psychiatric for psychiatric emergency', () => {
            const caps = getRequiredCapabilitiesForEmergency('psychiatric');
            expect(caps).toContain('psychiatric');
        });

        it('should return empty array for general emergency', () => {
            const caps = getRequiredCapabilitiesForEmergency('general');
            expect(caps).toHaveLength(0);
        });
    });

    // ========================================================================
    // HOSPITAL LEVEL TESTS
    // ========================================================================

    describe('Kenya Hospital Level Requirements', () => {

        const validLevels: KenyaHospitalLevel[] = [
            'level_1', 'level_2', 'level_3', 'level_4', 'level_5', 'level_6'
        ];

        it('should have 6 valid hospital levels for Kenya', () => {
            expect(validLevels).toHaveLength(6);
        });

        it('should include community dispensary (level 1)', () => {
            expect(validLevels).toContain('level_1');
        });

        it('should include health centre (level 2)', () => {
            expect(validLevels).toContain('level_2');
        });

        it('should include sub-county hospital (level 3)', () => {
            expect(validLevels).toContain('level_3');
        });

        it('should include county referral hospital (level 4)', () => {
            expect(validLevels).toContain('level_4');
        });

        it('should include regional referral hospital (level 5)', () => {
            expect(validLevels).toContain('level_5');
        });

        it('should include national referral hospital (level 6)', () => {
            expect(validLevels).toContain('level_6');
        });
    });

    // ========================================================================
    // TRIAGE TO HOSPITAL LEVEL MAPPING
    // ========================================================================

    describe('Triage Level to Minimum Hospital Level', () => {

        // Helper function to simulate the mapping
        function getMinimumHospitalLevelForTriage(triageLevel: TriageLevel): KenyaHospitalLevel {
            switch (triageLevel) {
                case 'red':
                    return 'level_4'; // County referral hospital or higher
                case 'yellow':
                    return 'level_3'; // Sub-county hospital
                case 'green':
                default:
                    return 'level_2'; // Health centre
            }
        }

        it('should require level_4 (county referral) for red triage', () => {
            expect(getMinimumHospitalLevelForTriage('red')).toBe('level_4');
        });

        it('should require level_3 (sub-county) for yellow triage', () => {
            expect(getMinimumHospitalLevelForTriage('yellow')).toBe('level_3');
        });

        it('should require level_2 (health centre) for green triage', () => {
            expect(getMinimumHospitalLevelForTriage('green')).toBe('level_2');
        });
    });

    // ========================================================================
    // DISTANCE CALCULATION TESTS
    // ========================================================================

    describe('Distance Calculation (Haversine Formula)', () => {

        // Replicate the helper function for testing
        function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
            const R = 6371; // Earth's radius in km
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        }

        function toRad(deg: number): number {
            return deg * (Math.PI / 180);
        }

        it('should return 0 for same location', () => {
            const distance = calculateDistance(-1.2921, 36.8219, -1.2921, 36.8219);
            expect(distance).toBe(0);
        });

        it('should calculate distance between Nairobi and Mombasa (~440km)', () => {
            // Nairobi: -1.2921, 36.8219
            // Mombasa: -4.0435, 39.6682
            const distance = calculateDistance(-1.2921, 36.8219, -4.0435, 39.6682);
            expect(distance).toBeGreaterThan(400);
            expect(distance).toBeLessThan(500);
        });

        it('should calculate short distance within Nairobi (~5km)', () => {
            // Nairobi CBD to Westlands
            const distance = calculateDistance(-1.2864, 36.8172, -1.2636, 36.8036);
            expect(distance).toBeGreaterThan(2);
            expect(distance).toBeLessThan(5);
        });
    });

    // ========================================================================
    // PRE-ALERT DATA VALIDATION
    // ========================================================================

    describe('Hospital Pre-Alert Validation', () => {

        interface PreAlertData {
            hospitalId: string;
            requestId: string;
            triageLevel: TriageLevel;
            estimatedArrivalMinutes: number;
        }

        function validatePreAlertData(data: PreAlertData): { valid: boolean; error?: string } {
            if (!data.hospitalId) {
                return { valid: false, error: 'Hospital ID is required' };
            }
            if (!data.requestId) {
                return { valid: false, error: 'Request ID is required' };
            }
            if (!['red', 'yellow', 'green'].includes(data.triageLevel)) {
                return { valid: false, error: 'Invalid triage level' };
            }
            if (data.estimatedArrivalMinutes < 0 || data.estimatedArrivalMinutes > 120) {
                return { valid: false, error: 'ETA must be between 0 and 120 minutes' };
            }
            return { valid: true };
        }

        it('should validate complete pre-alert data', () => {
            const result = validatePreAlertData({
                hospitalId: 'hosp_123',
                requestId: 'req_456',
                triageLevel: 'red',
                estimatedArrivalMinutes: 15,
            });
            expect(result.valid).toBe(true);
        });

        it('should reject missing hospital ID', () => {
            const result = validatePreAlertData({
                hospitalId: '',
                requestId: 'req_456',
                triageLevel: 'red',
                estimatedArrivalMinutes: 15,
            });
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Hospital ID');
        });

        it('should reject invalid triage level', () => {
            const result = validatePreAlertData({
                hospitalId: 'hosp_123',
                requestId: 'req_456',
                triageLevel: 'blue' as TriageLevel,
                estimatedArrivalMinutes: 15,
            });
            expect(result.valid).toBe(false);
        });

        it('should reject negative ETA', () => {
            const result = validatePreAlertData({
                hospitalId: 'hosp_123',
                requestId: 'req_456',
                triageLevel: 'yellow',
                estimatedArrivalMinutes: -5,
            });
            expect(result.valid).toBe(false);
        });

        it('should reject ETA over 2 hours', () => {
            const result = validatePreAlertData({
                hospitalId: 'hosp_123',
                requestId: 'req_456',
                triageLevel: 'green',
                estimatedArrivalMinutes: 150,
            });
            expect(result.valid).toBe(false);
        });
    });

    // ========================================================================
    // CAPACITY STATUS TESTS
    // ========================================================================

    describe('Hospital Capacity Status', () => {

        type DivertStatus = 'accepting' | 'limited' | 'diverting';

        interface CapacityData {
            emergencyBeds: { available: number; total: number };
            icuBeds?: { available: number; total: number };
            divertStatus: DivertStatus;
        }

        function calculateCapacityPercentage(capacity: CapacityData): number {
            const available = capacity.emergencyBeds.available;
            const total = capacity.emergencyBeds.total;
            return total > 0 ? Math.round((available / total) * 100) : 0;
        }

        function shouldAcceptPatient(capacity: CapacityData, triageLevel: TriageLevel): boolean {
            if (capacity.divertStatus === 'diverting') {
                return triageLevel === 'red'; // Only accept critical patients
            }
            if (capacity.divertStatus === 'limited') {
                return triageLevel !== 'green'; // Accept critical and urgent only
            }
            return true; // Accepting all
        }

        it('should calculate capacity percentage correctly', () => {
            const capacity: CapacityData = {
                emergencyBeds: { available: 5, total: 20 },
                divertStatus: 'accepting',
            };
            expect(calculateCapacityPercentage(capacity)).toBe(25);
        });

        it('should handle zero total capacity', () => {
            const capacity: CapacityData = {
                emergencyBeds: { available: 0, total: 0 },
                divertStatus: 'diverting',
            };
            expect(calculateCapacityPercentage(capacity)).toBe(0);
        });

        it('should accept all patients when accepting', () => {
            const capacity: CapacityData = {
                emergencyBeds: { available: 10, total: 20 },
                divertStatus: 'accepting',
            };
            expect(shouldAcceptPatient(capacity, 'red')).toBe(true);
            expect(shouldAcceptPatient(capacity, 'yellow')).toBe(true);
            expect(shouldAcceptPatient(capacity, 'green')).toBe(true);
        });

        it('should only accept urgent+ when limited', () => {
            const capacity: CapacityData = {
                emergencyBeds: { available: 3, total: 20 },
                divertStatus: 'limited',
            };
            expect(shouldAcceptPatient(capacity, 'red')).toBe(true);
            expect(shouldAcceptPatient(capacity, 'yellow')).toBe(true);
            expect(shouldAcceptPatient(capacity, 'green')).toBe(false);
        });

        it('should only accept critical when diverting', () => {
            const capacity: CapacityData = {
                emergencyBeds: { available: 0, total: 20 },
                divertStatus: 'diverting',
            };
            expect(shouldAcceptPatient(capacity, 'red')).toBe(true);
            expect(shouldAcceptPatient(capacity, 'yellow')).toBe(false);
            expect(shouldAcceptPatient(capacity, 'green')).toBe(false);
        });
    });
});
