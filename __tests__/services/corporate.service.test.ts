// ResQ Kenya - Corporate Service Test Suite
// Tests for corporate account operations and billing utilities

import {
    formatKES,
    calculateVAT,
    formatKenyaPlate,
} from '../../services/corporate.service';

// Mock Firebase modules
jest.mock('firebase/functions', () => ({
    getFunctions: jest.fn(() => ({})),
    httpsCallable: jest.fn(() => jest.fn()),
}));

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    onSnapshot: jest.fn(),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
}));

jest.mock('../../config/firebase', () => ({
    db: {},
    default: {},
}));

describe('services/corporate.service', () => {

    // =========================================================================
    // formatKES Tests
    // =========================================================================
    describe('formatKES', () => {

        it('should format small amounts correctly', () => {
            expect(formatKES(100)).toBe('KES 100');
            expect(formatKES(999)).toBe('KES 999');
        });

        it('should format thousands with commas', () => {
            expect(formatKES(1000)).toBe('KES 1,000');
            expect(formatKES(50000)).toBe('KES 50,000');
            expect(formatKES(150000)).toBe('KES 150,000');
        });

        it('should format millions with commas', () => {
            expect(formatKES(1000000)).toBe('KES 1,000,000');
            expect(formatKES(2500000)).toBe('KES 2,500,000');
        });

        it('should handle zero', () => {
            expect(formatKES(0)).toBe('KES 0');
        });

        it('should handle negative amounts', () => {
            expect(formatKES(-5000)).toBe('KES -5,000');
        });
    });

    // =========================================================================
    // calculateVAT Tests (16% Kenya VAT)
    // =========================================================================
    describe('calculateVAT', () => {

        it('should calculate 16% VAT correctly', () => {
            const result = calculateVAT(100000);
            expect(result.subtotal).toBe(100000);
            expect(result.vat).toBe(16000);
            expect(result.total).toBe(116000);
        });

        it('should round VAT to nearest shilling', () => {
            const result = calculateVAT(99);
            // 99 * 0.16 = 15.84 → rounds to 16
            expect(result.vat).toBe(16);
            expect(result.total).toBe(115);
        });

        it('should handle subscription pricing', () => {
            // Starter tier: 50,000 KES
            const starter = calculateVAT(50000);
            expect(starter.vat).toBe(8000);
            expect(starter.total).toBe(58000);

            // Business tier: 150,000 KES
            const business = calculateVAT(150000);
            expect(business.vat).toBe(24000);
            expect(business.total).toBe(174000);

            // Enterprise tier: 250,000 KES
            const enterprise = calculateVAT(250000);
            expect(enterprise.vat).toBe(40000);
            expect(enterprise.total).toBe(290000);
        });

        it('should handle zero amount', () => {
            const result = calculateVAT(0);
            expect(result.subtotal).toBe(0);
            expect(result.vat).toBe(0);
            expect(result.total).toBe(0);
        });
    });

    // =========================================================================
    // formatKenyaPlate Tests
    // =========================================================================
    describe('formatKenyaPlate', () => {

        it('should add space after first 3 characters', () => {
            expect(formatKenyaPlate('KDH456P')).toBe('KDH 456P');
            expect(formatKenyaPlate('KCE789Q')).toBe('KCE 789Q');
        });

        it('should handle already formatted plates', () => {
            expect(formatKenyaPlate('KDH 456P')).toBe('KDH 456P');
        });

        it('should convert to uppercase', () => {
            expect(formatKenyaPlate('kdh456p')).toBe('KDH 456P');
            expect(formatKenyaPlate('kce 789q')).toBe('KCE 789Q');
        });

        it('should handle old format plates (without trailing letter)', () => {
            expect(formatKenyaPlate('KAA123')).toBe('KAA 123');
        });

        it('should handle short/invalid input gracefully', () => {
            expect(formatKenyaPlate('KD')).toBe('KD');
            expect(formatKenyaPlate('')).toBe('');
        });
    });

    // =========================================================================
    // Service Function Mocking Tests
    // =========================================================================
    describe('service functions', () => {

        it('should export createCorporateAccount function', () => {
            const { createCorporateAccount } = require('../../services/corporate.service');
            expect(typeof createCorporateAccount).toBe('function');
        });

        it('should export getCorporateStats function', () => {
            const { getCorporateStats } = require('../../services/corporate.service');
            expect(typeof getCorporateStats).toBe('function');
        });

        it('should export addCorporateVehicle function', () => {
            const { addCorporateVehicle } = require('../../services/corporate.service');
            expect(typeof addCorporateVehicle).toBe('function');
        });

        it('should export addCorporateEmployee function', () => {
            const { addCorporateEmployee } = require('../../services/corporate.service');
            expect(typeof addCorporateEmployee).toBe('function');
        });

        it('should export getPaymentHistory function', () => {
            const { getPaymentHistory } = require('../../services/corporate.service');
            expect(typeof getPaymentHistory).toBe('function');
        });

        it('should export recordPayment function', () => {
            const { recordPayment } = require('../../services/corporate.service');
            expect(typeof recordPayment).toBe('function');
        });
    });
});
