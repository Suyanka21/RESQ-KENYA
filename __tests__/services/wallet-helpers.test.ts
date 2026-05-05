/**
 * Phase 6 (TDD): Pure wallet math helper.
 */

import { applyDelta } from '../../functions/src/shared/wallet';

describe('functions/shared/wallet.applyDelta', () => {
    it('credits a positive delta', () => {
        expect(applyDelta(100, 50)).toBe(150);
    });

    it('debits a negative delta when funds are sufficient', () => {
        expect(applyDelta(100, -25)).toBe(75);
    });

    it('returns null when a debit would overdraw', () => {
        expect(applyDelta(50, -100)).toBeNull();
    });

    it('returns null when starting balance is zero and we try to debit', () => {
        expect(applyDelta(0, -1)).toBeNull();
    });

    it('allows debiting exactly the balance to zero', () => {
        expect(applyDelta(100, -100)).toBe(0);
    });

    it('allows starting from zero with a credit', () => {
        expect(applyDelta(0, 250)).toBe(250);
    });
});
