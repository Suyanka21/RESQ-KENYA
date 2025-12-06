// Utility Functions - Comprehensive Unit Tests

describe('Utility Functions', () => {
    describe('Currency Formatting', () => {
        const formatCurrency = (amount: number): string => {
            return `KES ${amount.toLocaleString('en-KE')}`;
        };

        it('should format small amounts', () => {
            expect(formatCurrency(100)).toBe('KES 100');
            expect(formatCurrency(999)).toBe('KES 999');
        });

        it('should format thousands with separator', () => {
            expect(formatCurrency(1000)).toBe('KES 1,000');
            expect(formatCurrency(5000)).toBe('KES 5,000');
            expect(formatCurrency(10000)).toBe('KES 10,000');
        });

        it('should format large amounts', () => {
            expect(formatCurrency(100000)).toBe('KES 100,000');
            expect(formatCurrency(1000000)).toBe('KES 1,000,000');
        });
    });

    describe('Time Formatting', () => {
        const formatTimeAgo = (date: Date): string => {
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays}d ago`;
            return date.toLocaleDateString('en-KE');
        };

        it('should format recent time as "Just now"', () => {
            const now = new Date();
            expect(formatTimeAgo(now)).toBe('Just now');
        });

        it('should format minutes ago', () => {
            const fiveMinAgo = new Date(Date.now() - 5 * 60000);
            expect(formatTimeAgo(fiveMinAgo)).toBe('5m ago');
        });

        it('should format hours ago', () => {
            const threeHoursAgo = new Date(Date.now() - 3 * 3600000);
            expect(formatTimeAgo(threeHoursAgo)).toBe('3h ago');
        });
    });

    describe('String Truncation', () => {
        const truncate = (str: string, maxLength: number): string => {
            if (str.length <= maxLength) return str;
            return str.substring(0, maxLength - 3) + '...';
        };

        it('should not truncate short strings', () => {
            expect(truncate('Hello', 10)).toBe('Hello');
        });

        it('should truncate long strings with ellipsis', () => {
            expect(truncate('This is a very long string', 15)).toBe('This is a ve...');
        });

        it('should handle exact length', () => {
            expect(truncate('Hello', 5)).toBe('Hello');
        });
    });

    describe('ID Generation', () => {
        const generateId = (prefix: string): string => {
            const timestamp = Date.now().toString(36);
            const random = Math.random().toString(36).substring(2, 6);
            return `${prefix}_${timestamp}_${random}`.toUpperCase();
        };

        it('should generate unique IDs', () => {
            const id1 = generateId('REQ');
            const id2 = generateId('REQ');
            expect(id1).not.toBe(id2);
        });

        it('should include prefix', () => {
            const id = generateId('USER');
            expect(id.startsWith('USER_')).toBe(true);
        });

        it('should generate uppercase IDs', () => {
            const id = generateId('test');
            expect(id).toBe(id.toUpperCase());
        });
    });

    describe('Input Sanitization', () => {
        const sanitizePhone = (input: string): string => {
            return input.replace(/[^0-9+]/g, '');
        };

        const sanitizeText = (input: string): string => {
            return input.trim().replace(/\s+/g, ' ');
        };

        it('should remove non-numeric characters from phone', () => {
            expect(sanitizePhone('0712-345-678')).toBe('0712345678');
            expect(sanitizePhone('(0712) 345 678')).toBe('0712345678');
        });

        it('should preserve + in phone number', () => {
            expect(sanitizePhone('+254 712 345 678')).toBe('+254712345678');
        });

        it('should normalize whitespace in text', () => {
            expect(sanitizeText('  Hello   World  ')).toBe('Hello World');
        });
    });

    describe('Rating Calculation', () => {
        const calculateAverageRating = (ratings: number[]): number => {
            if (ratings.length === 0) return 0;
            const sum = ratings.reduce((a, b) => a + b, 0);
            return Math.round((sum / ratings.length) * 10) / 10;
        };

        it('should calculate correct average', () => {
            expect(calculateAverageRating([5, 4, 5, 4, 5])).toBe(4.6);
            expect(calculateAverageRating([5, 5, 5, 5, 5])).toBe(5);
        });

        it('should return 0 for empty array', () => {
            expect(calculateAverageRating([])).toBe(0);
        });

        it('should round to one decimal place', () => {
            expect(calculateAverageRating([5, 4, 4])).toBe(4.3);
        });
    });
});
