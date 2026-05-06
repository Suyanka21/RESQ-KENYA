/**
 * Phase 3 (Backend Stabilization, X-1) — mirror-sync test.
 *
 * Guards the duplication between `types/api.ts` (frontend contract) and
 * `functions/src/shared/api.ts` (backend mirror). The two files cannot
 * import each other (separate npm packages, separate `tsconfig.json`),
 * so this test asserts that the constants and validators stay
 * structurally identical. If they drift, every M-Pesa call breaks.
 *
 * Skills: API-and-Interface-Design (one-version rule),
 *          Test-Driven-Development.
 */

import * as fe from '../../types/api';
import * as be from '../../functions/src/shared/api';

describe('idempotency-key contract — frontend ↔ backend mirror', () => {
    it('exports the same length bounds on both sides', () => {
        expect(fe.IDEMPOTENCY_KEY_MIN_LENGTH).toBe(be.IDEMPOTENCY_KEY_MIN_LENGTH);
        expect(fe.IDEMPOTENCY_KEY_MAX_LENGTH).toBe(be.IDEMPOTENCY_KEY_MAX_LENGTH);
    });

    it('exports the same regex source on both sides', () => {
        expect(fe.IDEMPOTENCY_KEY_REGEX.source).toBe(be.IDEMPOTENCY_KEY_REGEX.source);
        expect(fe.IDEMPOTENCY_KEY_REGEX.flags).toBe(be.IDEMPOTENCY_KEY_REGEX.flags);
    });

    it.each([
        ['abcdef0123456789', true],
        ['short', false],
        ['has spaces in key 12345', false],
        ['_'.repeat(16), true],
        ['a'.repeat(65), false],
    ])('isValidIdempotencyKey agrees on %p ⇒ %p', (key, expected) => {
        expect(fe.isValidIdempotencyKey(key)).toBe(expected);
        expect(be.isValidIdempotencyKey(key)).toBe(expected);
    });

    it('frontend generateIdempotencyKey produces keys that the backend validator accepts', () => {
        for (let i = 0; i < 50; i++) {
            const key = fe.generateIdempotencyKey();
            expect(be.isValidIdempotencyKey(key)).toBe(true);
        }
    });
});
