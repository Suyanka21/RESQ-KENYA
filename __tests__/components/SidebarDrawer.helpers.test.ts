/**
 * Phase 4 (audit-v2 §N-HIGH-5) — SidebarDrawer pure helper tests.
 *
 * The sidebar's identity rendering pivots on two pure helpers:
 *   - `deriveInitials(displayName)` for the avatar circle
 *   - `formatWalletBalance(balance)` for the wallet sublabel
 *
 * These tests lock in the contract so a future refactor cannot
 * silently re-introduce the hardcoded `JM` / `KES 2,450` strings the
 * audit flagged.
 *
 * Skills: Test-Driven-Development (pure functions → unit tests),
 * Code-Review-and-Quality (cover edge cases — empty/whitespace name,
 * single-word name, three-word name, negative balance, NaN balance).
 */

import {
    deriveInitials,
    formatWalletBalance,
} from '../../components/dashboard/SidebarDrawer.helpers';

describe('deriveInitials (audit-v2 §N-HIGH-5)', () => {
    it('returns first+last initials for a two-word name', () => {
        expect(deriveInitials('John Mwangi')).toBe('JM');
    });

    it('returns first+last initials for a three-or-more-word name', () => {
        expect(deriveInitials('Brayan Yobra Mwangi')).toBe('BM');
    });

    it('returns two-letter prefix for a single-word name', () => {
        expect(deriveInitials('Brayan')).toBe('BR');
    });

    it('returns placeholder for an empty string', () => {
        expect(deriveInitials('')).toBe('??');
    });

    it('returns placeholder for whitespace only', () => {
        expect(deriveInitials('   ')).toBe('??');
    });

    it('returns placeholder for null', () => {
        expect(deriveInitials(null)).toBe('??');
    });

    it('returns placeholder for undefined', () => {
        expect(deriveInitials(undefined)).toBe('??');
    });

    it('uppercases lowercase input', () => {
        expect(deriveInitials('john mwangi')).toBe('JM');
    });

    it('handles tabs and multiple spaces as whitespace separators', () => {
        expect(deriveInitials('john\t \tmwangi')).toBe('JM');
    });
});

describe('formatWalletBalance (audit-v2 §N-HIGH-5)', () => {
    it('formats a normal balance with KES prefix and thousands separator', () => {
        expect(formatWalletBalance(2450)).toBe('KES 2,450');
    });

    it('formats zero as "KES 0"', () => {
        expect(formatWalletBalance(0)).toBe('KES 0');
    });

    it('floors fractional balances (whole KES only)', () => {
        expect(formatWalletBalance(1234.56)).toBe('KES 1,234');
    });

    it('returns "KES 0" for a negative balance (sensor / race noise)', () => {
        expect(formatWalletBalance(-100)).toBe('KES 0');
    });

    it('returns "KES 0" for NaN', () => {
        expect(formatWalletBalance(Number.NaN)).toBe('KES 0');
    });

    it('returns "KES 0" for Infinity', () => {
        expect(formatWalletBalance(Number.POSITIVE_INFINITY)).toBe('KES 0');
    });
});
