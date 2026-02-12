// ResQ Kenya - Transaction Service Test Suite
// Tests for payment tracking, reconciliation, and financial reporting

import {
    calculatePaymentBreakdown,
    validateMpesaReceipt,
    formatCurrency,
} from '../../services/transaction.service';

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
    doc: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    serverTimestamp: jest.fn(() => new Date()),
    Timestamp: {
        fromDate: jest.fn((d) => d),
        now: jest.fn(() => new Date()),
    },
}));

jest.mock('../../config/firebase', () => ({
    db: {},
}));

describe('services/transaction.service', () => {

    // =========================================================================
    // calculatePaymentBreakdown Tests (75/20/5 split)
    // =========================================================================
    describe('calculatePaymentBreakdown', () => {

        it('should calculate 75% provider share', () => {
            const breakdown = calculatePaymentBreakdown(10000);
            expect(breakdown.providerShare).toBe(7500);
        });

        it('should calculate 20% platform share', () => {
            const breakdown = calculatePaymentBreakdown(10000);
            expect(breakdown.platformShare).toBe(2000);
        });

        it('should calculate 5% processing fee', () => {
            const breakdown = calculatePaymentBreakdown(10000);
            expect(breakdown.processingFee).toBe(500);
        });

        it('should ensure shares sum to service amount', () => {
            const breakdown = calculatePaymentBreakdown(10000);
            const total = breakdown.providerShare + breakdown.platformShare + breakdown.processingFee;
            expect(total).toBe(breakdown.serviceAmount);
        });

        it('should handle small amounts correctly', () => {
            const breakdown = calculatePaymentBreakdown(100);
            expect(breakdown.providerShare).toBe(75);
            expect(breakdown.platformShare).toBe(20);
            expect(breakdown.processingFee).toBe(5);
        });

        it('should handle large amounts correctly', () => {
            const breakdown = calculatePaymentBreakdown(1000000);
            expect(breakdown.providerShare).toBe(750000);
            expect(breakdown.platformShare).toBe(200000);
            expect(breakdown.processingFee).toBe(50000);
        });

        it('should return serviceAmount in breakdown', () => {
            const breakdown = calculatePaymentBreakdown(5000);
            expect(breakdown.serviceAmount).toBe(5000);
        });

        it('should handle zero amount', () => {
            const breakdown = calculatePaymentBreakdown(0);
            expect(breakdown.providerShare).toBe(0);
            expect(breakdown.platformShare).toBe(0);
            expect(breakdown.processingFee).toBe(0);
        });
    });

    // =========================================================================
    // validateMpesaReceipt Tests
    // =========================================================================
    describe('validateMpesaReceipt', () => {

        it('should accept valid M-Pesa receipt format (uppercase)', () => {
            expect(validateMpesaReceipt('RK2P1234AB')).toBe(true);
            expect(validateMpesaReceipt('SGJ9M1234Z')).toBe(true);
        });

        it('should accept valid receipt with lowercase', () => {
            expect(validateMpesaReceipt('rk2p1234ab')).toBe(true);
        });

        it('should accept mixed case receipt', () => {
            expect(validateMpesaReceipt('Rk2P1234Ab')).toBe(true);
        });

        it('should reject receipts that are too short', () => {
            expect(validateMpesaReceipt('RK2P123')).toBe(false);
            expect(validateMpesaReceipt('AB12')).toBe(false);
        });

        it('should reject empty receipt', () => {
            expect(validateMpesaReceipt('')).toBe(false);
        });

        it('should reject receipt with special characters', () => {
            expect(validateMpesaReceipt('RK2P-1234')).toBe(false);
            expect(validateMpesaReceipt('RK2P 1234')).toBe(false);
        });

        it('should reject receipt that is too long', () => {
            expect(validateMpesaReceipt('RK2P1234567890ABCDEF')).toBe(false);
        });
    });

    // =========================================================================
    // formatCurrency Tests
    // =========================================================================
    describe('formatCurrency', () => {

        it('should format with KES prefix', () => {
            const result = formatCurrency(1000);
            expect(result).toContain('KES');
        });

        it('should format thousands with commas', () => {
            const result = formatCurrency(50000);
            expect(result).toContain('50,000');
        });

        it('should format small amounts', () => {
            const result = formatCurrency(100);
            expect(result).toBe('KES 100');
        });

        it('should format zero', () => {
            const result = formatCurrency(0);
            expect(result).toBe('KES 0');
        });

        it('should format millions', () => {
            const result = formatCurrency(1500000);
            expect(result).toContain('1,500,000');
        });
    });

    // =========================================================================
    // Service Function Exports
    // =========================================================================
    describe('service functions', () => {

        it('should export createTransaction function', () => {
            const { createTransaction } = require('../../services/transaction.service');
            expect(typeof createTransaction).toBe('function');
        });

        it('should export updateTransactionStatus function', () => {
            const { updateTransactionStatus } = require('../../services/transaction.service');
            expect(typeof updateTransactionStatus).toBe('function');
        });

        it('should export getTransaction function', () => {
            const { getTransaction } = require('../../services/transaction.service');
            expect(typeof getTransaction).toBe('function');
        });

        it('should export getUserTransactions function', () => {
            const { getUserTransactions } = require('../../services/transaction.service');
            expect(typeof getUserTransactions).toBe('function');
        });

        it('should export getProviderTransactions function', () => {
            const { getProviderTransactions } = require('../../services/transaction.service');
            expect(typeof getProviderTransactions).toBe('function');
        });

        it('should export generateReconciliationReport function', () => {
            const { generateReconciliationReport } = require('../../services/transaction.service');
            expect(typeof generateReconciliationReport).toBe('function');
        });

        it('should export getProviderEarningsSummary function', () => {
            const { getProviderEarningsSummary } = require('../../services/transaction.service');
            expect(typeof getProviderEarningsSummary).toBe('function');
        });

        it('should export getMockTransactions function', () => {
            const { getMockTransactions } = require('../../services/transaction.service');
            expect(typeof getMockTransactions).toBe('function');
        });
    });
});
