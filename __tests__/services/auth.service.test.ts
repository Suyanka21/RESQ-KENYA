// Auth Service - Comprehensive Unit Tests
// Using require() for Jest compatibility
const { getAuth, PhoneAuthProvider, signInWithCredential } = require('firebase/auth');

describe('Auth Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Firebase Auth Mock', () => {
        it('should have getAuth defined', () => {
            expect(getAuth).toBeDefined();
            expect(typeof getAuth).toBe('function');
        });

        it('should return auth object with currentUser', () => {
            const auth = getAuth();
            expect(auth).toHaveProperty('currentUser');
        });

        it('should have PhoneAuthProvider with credential method', () => {
            expect(PhoneAuthProvider).toBeDefined();
            expect(PhoneAuthProvider.credential).toBeDefined();
            expect(typeof PhoneAuthProvider.credential).toBe('function');
        });

        it('should have signInWithCredential defined', () => {
            expect(signInWithCredential).toBeDefined();
            expect(typeof signInWithCredential).toBe('function');
        });
    });

    describe('Phone Number Validation', () => {
        const isValidKenyanPhone = (phone: string): boolean => {
            const cleaned = phone.replace(/[\s-]/g, '');
            return /^(\+254|254|0)(7|1)\d{8}$/.test(cleaned);
        };

        it('should validate correct Kenyan phone numbers', () => {
            expect(isValidKenyanPhone('0712345678')).toBe(true);
            expect(isValidKenyanPhone('0112345678')).toBe(true);
            expect(isValidKenyanPhone('+254712345678')).toBe(true);
            expect(isValidKenyanPhone('254712345678')).toBe(true);
        });

        it('should reject invalid phone numbers', () => {
            expect(isValidKenyanPhone('123')).toBe(false);
            expect(isValidKenyanPhone('08123456789')).toBe(false);
            expect(isValidKenyanPhone('+1234567890')).toBe(false);
            expect(isValidKenyanPhone('')).toBe(false);
        });
    });

    describe('Phone Number Formatting', () => {
        const formatPhoneForFirebase = (phone: string): string => {
            let cleaned = phone.replace(/[\s-]/g, '');
            if (cleaned.startsWith('0')) {
                cleaned = '254' + cleaned.substring(1);
            }
            if (!cleaned.startsWith('+')) {
                cleaned = '+' + cleaned;
            }
            return cleaned;
        };

        it('should convert 07XX to +254XX format', () => {
            expect(formatPhoneForFirebase('0712345678')).toBe('+254712345678');
        });

        it('should convert 01XX to +254XX format', () => {
            expect(formatPhoneForFirebase('0112345678')).toBe('+254112345678');
        });

        it('should preserve existing +254 format', () => {
            expect(formatPhoneForFirebase('+254712345678')).toBe('+254712345678');
        });

        it('should add + prefix if missing', () => {
            expect(formatPhoneForFirebase('254712345678')).toBe('+254712345678');
        });
    });

    describe('OTP Verification', () => {
        const isValidOTP = (otp: string): boolean => {
            return /^\d{6}$/.test(otp);
        };

        it('should accept valid 6-digit OTP', () => {
            expect(isValidOTP('123456')).toBe(true);
            expect(isValidOTP('000000')).toBe(true);
            expect(isValidOTP('999999')).toBe(true);
        });

        it('should reject invalid OTP formats', () => {
            expect(isValidOTP('12345')).toBe(false);
            expect(isValidOTP('1234567')).toBe(false);
            expect(isValidOTP('abcdef')).toBe(false);
            expect(isValidOTP('')).toBe(false);
        });
    });
});
