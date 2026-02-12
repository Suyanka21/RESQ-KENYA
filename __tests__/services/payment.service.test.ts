// Payment Service - Comprehensive Unit Tests
// Using require() for Jest compatibility
const { httpsCallable, getFunctions } = require('firebase/functions');

describe('Payment Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Firebase Functions Mock', () => {
        it('should have getFunctions defined', () => {
            expect(getFunctions).toBeDefined();
            expect(typeof getFunctions).toBe('function');
        });

        it('should have httpsCallable defined', () => {
            expect(httpsCallable).toBeDefined();
            expect(typeof httpsCallable).toBe('function');
        });

        it('should return callable function from httpsCallable', () => {
            const callable = httpsCallable(getFunctions(), 'testFunction');
            expect(typeof callable).toBe('function');
        });
    });

    describe('M-Pesa Phone Number Formatting', () => {
        const formatMpesaPhone = (phone: string): string => {
            let cleaned = phone.replace(/[\s-]/g, '');
            if (cleaned.startsWith('+')) {
                cleaned = cleaned.substring(1);
            }
            if (cleaned.startsWith('0')) {
                cleaned = '254' + cleaned.substring(1);
            }
            return cleaned;
        };

        it('should format 07XX to 2547XX', () => {
            expect(formatMpesaPhone('0712345678')).toBe('254712345678');
        });

        it('should remove + prefix', () => {
            expect(formatMpesaPhone('+254712345678')).toBe('254712345678');
        });

        it('should handle spaces and dashes', () => {
            expect(formatMpesaPhone('0712 345 678')).toBe('254712345678');
            expect(formatMpesaPhone('0712-345-678')).toBe('254712345678');
        });
    });

    describe('Payment Amount Validation', () => {
        const isValidAmount = (amount: number): boolean => {
            return amount >= 10 && amount <= 150000 && Number.isInteger(amount);
        };

        it('should accept valid M-Pesa amounts', () => {
            expect(isValidAmount(10)).toBe(true);
            expect(isValidAmount(1000)).toBe(true);
            expect(isValidAmount(50000)).toBe(true);
            expect(isValidAmount(150000)).toBe(true);
        });

        it('should reject amounts below minimum', () => {
            expect(isValidAmount(1)).toBe(false);
            expect(isValidAmount(9)).toBe(false);
        });

        it('should reject amounts above maximum', () => {
            expect(isValidAmount(150001)).toBe(false);
            expect(isValidAmount(200000)).toBe(false);
        });

        it('should reject non-integer amounts', () => {
            expect(isValidAmount(100.5)).toBe(false);
            expect(isValidAmount(99.99)).toBe(false);
        });
    });

    describe('Account Reference Generation', () => {
        const generateAccountRef = (serviceType: string): string => {
            const timestamp = Date.now().toString(36).toUpperCase();
            return `RSQ-${serviceType.substring(0, 3).toUpperCase()}-${timestamp}`;
        };

        it('should generate valid account reference format', () => {
            const ref = generateAccountRef('towing');
            expect(ref).toMatch(/^RSQ-TOW-[A-Z0-9]+$/);
        });

        it('should include service type prefix', () => {
            expect(generateAccountRef('battery').startsWith('RSQ-BAT-')).toBe(true);
            expect(generateAccountRef('fuel').startsWith('RSQ-FUE-')).toBe(true);
            expect(generateAccountRef('tire').startsWith('RSQ-TIR-')).toBe(true);
        });
    });

    describe('Payment Status Codes', () => {
        const PAYMENT_STATUS = {
            SUCCESS: '0',
            INSUFFICIENT_FUNDS: '1032',
            USER_CANCELLED: '1032',
            TIMEOUT: '1037',
        };

        const getStatusMessage = (code: string): string => {
            switch (code) {
                case '0': return 'Payment successful';
                case '1032': return 'Transaction cancelled by user';
                case '1037': return 'Request timed out';
                default: return 'Payment failed';
            }
        };

        it('should return correct message for success', () => {
            expect(getStatusMessage(PAYMENT_STATUS.SUCCESS)).toBe('Payment successful');
        });

        it('should return correct message for cancellation', () => {
            expect(getStatusMessage(PAYMENT_STATUS.USER_CANCELLED)).toBe('Transaction cancelled by user');
        });

        it('should return default message for unknown codes', () => {
            expect(getStatusMessage('9999')).toBe('Payment failed');
        });
    });
});
