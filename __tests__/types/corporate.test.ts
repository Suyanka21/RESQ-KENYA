// ResQ Kenya - Corporate Types Test Suite
// Tests for Kenya-specific validation functions and helper utilities

import {
    isValidKenyaPlate,
    isValidKraPin,
    getDefaultPermissions,
    getSubscriptionPrice,
} from '../../types/corporate';

describe('types/corporate', () => {

    // =========================================================================
    // isValidKenyaPlate Tests
    // =========================================================================
    describe('isValidKenyaPlate', () => {

        describe('valid plates', () => {
            it('should accept modern format with space (KXX 123X)', () => {
                expect(isValidKenyaPlate('KDH 456P')).toBe(true);
                expect(isValidKenyaPlate('KCE 789Q')).toBe(true);
                expect(isValidKenyaPlate('KAB 123Z')).toBe(true);
            });

            it('should accept modern format without space (KXX123X)', () => {
                expect(isValidKenyaPlate('KDH456P')).toBe(true);
                expect(isValidKenyaPlate('KCE789Q')).toBe(true);
            });

            it('should accept old format without trailing letter (KXX 123)', () => {
                expect(isValidKenyaPlate('KAA 123')).toBe(true);
                expect(isValidKenyaPlate('KBB123')).toBe(true);
            });

            it('should be case insensitive', () => {
                expect(isValidKenyaPlate('kdh 456p')).toBe(true);
                expect(isValidKenyaPlate('Kdh456P')).toBe(true);
            });

            it('should handle extra whitespace', () => {
                expect(isValidKenyaPlate('KDH  456P')).toBe(true);
                expect(isValidKenyaPlate(' KDH 456P ')).toBe(true);
            });
        });

        describe('invalid plates', () => {
            it('should reject plates not starting with K', () => {
                expect(isValidKenyaPlate('ADH 456P')).toBe(false);
                expect(isValidKenyaPlate('123 456P')).toBe(false);
            });

            it('should reject plates with wrong digit count', () => {
                expect(isValidKenyaPlate('KDH 12P')).toBe(false);
                expect(isValidKenyaPlate('KDH 1234P')).toBe(false);
            });

            it('should reject plates with wrong letter count', () => {
                expect(isValidKenyaPlate('KDHH 456P')).toBe(false);
                expect(isValidKenyaPlate('KD 456P')).toBe(false);
            });

            it('should reject empty or invalid input', () => {
                expect(isValidKenyaPlate('')).toBe(false);
                expect(isValidKenyaPlate('INVALID')).toBe(false);
                expect(isValidKenyaPlate('12345')).toBe(false);
            });
        });
    });

    // =========================================================================
    // isValidKraPin Tests
    // =========================================================================
    describe('isValidKraPin', () => {

        describe('valid KRA PINs', () => {
            it('should accept PINs starting with P (individual)', () => {
                expect(isValidKraPin('P051234567Z')).toBe(true);
                expect(isValidKraPin('P000000000A')).toBe(true);
            });

            it('should accept PINs starting with A (company)', () => {
                expect(isValidKraPin('A012345678B')).toBe(true);
                expect(isValidKraPin('A987654321Z')).toBe(true);
            });

            it('should be case insensitive', () => {
                expect(isValidKraPin('p051234567z')).toBe(true);
                expect(isValidKraPin('a012345678b')).toBe(true);
            });
        });

        describe('invalid KRA PINs', () => {
            it('should reject PINs with wrong starting letter', () => {
                expect(isValidKraPin('B051234567Z')).toBe(false);
                expect(isValidKraPin('X051234567Z')).toBe(false);
            });

            it('should reject PINs with wrong digit count', () => {
                expect(isValidKraPin('P0512345Z')).toBe(false);
                expect(isValidKraPin('P05123456789Z')).toBe(false);
            });

            it('should reject PINs without trailing letter', () => {
                expect(isValidKraPin('P0512345671')).toBe(false);
            });

            it('should reject empty or invalid input', () => {
                expect(isValidKraPin('')).toBe(false);
                expect(isValidKraPin('INVALID')).toBe(false);
                expect(isValidKraPin('12345678901')).toBe(false);
            });
        });
    });

    // =========================================================================
    // getDefaultPermissions Tests
    // =========================================================================
    describe('getDefaultPermissions', () => {

        it('should return full permissions for admin role', () => {
            const permissions = getDefaultPermissions('admin');
            expect(permissions.canRequestService).toBe(true);
            expect(permissions.canApproveRequests).toBe(true);
            expect(permissions.canManageVehicles).toBe(true);
            expect(permissions.canManageEmployees).toBe(true);
            expect(permissions.canViewBilling).toBe(true);
        });

        it('should return fleet manager permissions', () => {
            const permissions = getDefaultPermissions('fleet_manager');
            expect(permissions.canManageVehicles).toBe(true);
            expect(permissions.canManageEmployees).toBe(false); // Key difference
            expect(permissions.canViewBilling).toBe(true);
        });

        it('should return limited permissions for driver role', () => {
            const permissions = getDefaultPermissions('driver');
            expect(permissions.canRequestService).toBe(true);
            expect(permissions.canApproveRequests).toBe(false);
            expect(permissions.canManageVehicles).toBe(false);
            expect(permissions.canViewBilling).toBe(false);
        });

        it('should return read-only permissions for viewer role', () => {
            const permissions = getDefaultPermissions('viewer');
            expect(permissions.canRequestService).toBe(false);
            expect(permissions.canViewAllRequests).toBe(true);
            expect(permissions.canViewBilling).toBe(true);
            expect(permissions.canExportReports).toBe(true);
        });
    });

    // =========================================================================
    // getSubscriptionPrice Tests
    // =========================================================================
    describe('getSubscriptionPrice', () => {

        it('should return starter tier pricing in KES', () => {
            const pricing = getSubscriptionPrice('starter');
            expect(pricing.monthly).toBe(50000);
            expect(pricing.vehicleLimit).toBe(10);
            expect(pricing.features).toContain('Up to 10 vehicles');
        });

        it('should return business tier pricing in KES', () => {
            const pricing = getSubscriptionPrice('business');
            expect(pricing.monthly).toBe(150000);
            expect(pricing.vehicleLimit).toBe(50);
            expect(pricing.features).toContain('Priority response (15 min)');
        });

        it('should return enterprise tier pricing in KES', () => {
            const pricing = getSubscriptionPrice('enterprise');
            expect(pricing.monthly).toBe(250000);
            expect(pricing.vehicleLimit).toBe(9999);
            expect(pricing.features).toContain('Unlimited vehicles');
        });

        it('should have increasing price tiers', () => {
            const starter = getSubscriptionPrice('starter');
            const business = getSubscriptionPrice('business');
            const enterprise = getSubscriptionPrice('enterprise');

            expect(business.monthly).toBeGreaterThan(starter.monthly);
            expect(enterprise.monthly).toBeGreaterThan(business.monthly);
        });
    });
});
