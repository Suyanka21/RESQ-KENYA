/**
 * Phase 6 (TDD): Pure helpers used by the M-Pesa flow.
 *
 * These helpers live under `functions/src/shared/*` so they can be
 * imported in the root jest environment without pulling in firebase-*
 * runtimes.
 */

import {
    signCallbackToken,
    verifyCallbackToken,
    idempotencyDocId,
} from '../../functions/src/shared/crypto';
import { normaliseKenyanPhone } from '../../functions/src/shared/phone';
import {
    isAllowedStatusTransition,
    VALID_STATUS_TRANSITIONS,
    summariseStatusChange,
} from '../../functions/src/shared/status';

describe('functions/shared/crypto', () => {
    const SECRET = 'test-secret-with-enough-entropy';

    it('signCallbackToken is deterministic for the same inputs', () => {
        const a = signCallbackToken('req1', 250, SECRET);
        const b = signCallbackToken('req1', 250, SECRET);
        expect(a).toBe(b);
        expect(a).toHaveLength(32);
    });

    it('signCallbackToken changes with amount', () => {
        const a = signCallbackToken('req1', 250, SECRET);
        const b = signCallbackToken('req1', 251, SECRET);
        expect(a).not.toBe(b);
    });

    it('verifyCallbackToken accepts the matching token', () => {
        const t = signCallbackToken('req1', 250, SECRET);
        expect(verifyCallbackToken('req1', 250, t, SECRET)).toBe(true);
    });

    it('verifyCallbackToken rejects a tampered token', () => {
        const t = signCallbackToken('req1', 250, SECRET);
        const tampered = t.slice(0, -1) + (t.endsWith('a') ? 'b' : 'a');
        expect(verifyCallbackToken('req1', 250, tampered, SECRET)).toBe(false);
    });

    it('verifyCallbackToken rejects a token of the wrong length', () => {
        expect(verifyCallbackToken('req1', 250, 'short', SECRET)).toBe(false);
    });

    it('idempotencyDocId is deterministic and 32 chars', () => {
        const a = idempotencyDocId('uid1', 'key-abcdef-1234567890');
        const b = idempotencyDocId('uid1', 'key-abcdef-1234567890');
        expect(a).toBe(b);
        expect(a).toHaveLength(32);
    });

    it('idempotencyDocId differs for different users with same key', () => {
        const a = idempotencyDocId('uidA', 'key-1234567890123456');
        const b = idempotencyDocId('uidB', 'key-1234567890123456');
        expect(a).not.toBe(b);
    });
});

describe('functions/shared/phone', () => {
    it('normalises 0712-style numbers', () => {
        expect(normaliseKenyanPhone('0712345678')).toBe('254712345678');
    });

    it('normalises +254-style numbers', () => {
        expect(normaliseKenyanPhone('+254712345678')).toBe('254712345678');
    });

    it('normalises 7XX numbers without a leading 0', () => {
        expect(normaliseKenyanPhone('712345678')).toBe('254712345678');
    });

    it('normalises 1XX (Airtel/Telkom) numbers', () => {
        expect(normaliseKenyanPhone('0112345678')).toBe('254112345678');
    });

    it('rejects invalid prefixes', () => {
        expect(normaliseKenyanPhone('512345678')).toBeNull();
        expect(normaliseKenyanPhone('254212345678')).toBeNull();
    });

    it('rejects too-short numbers', () => {
        expect(normaliseKenyanPhone('07123456')).toBeNull();
    });
});

describe('functions/shared/status', () => {
    it('VALID_STATUS_TRANSITIONS exposes a defined graph', () => {
        expect(VALID_STATUS_TRANSITIONS.pending).toContain('accepted');
        expect(VALID_STATUS_TRANSITIONS.pending).toContain('cancelled');
        expect(VALID_STATUS_TRANSITIONS.completed).toEqual([]);
    });

    it('isAllowedStatusTransition allows the canonical happy path', () => {
        expect(isAllowedStatusTransition('pending', 'accepted')).toBe(true);
        expect(isAllowedStatusTransition('accepted', 'enroute')).toBe(true);
        expect(isAllowedStatusTransition('enroute', 'arrived')).toBe(true);
        expect(isAllowedStatusTransition('arrived', 'inProgress')).toBe(true);
        expect(isAllowedStatusTransition('inProgress', 'completed')).toBe(true);
    });

    it('isAllowedStatusTransition rejects skipping states', () => {
        expect(isAllowedStatusTransition('pending', 'enroute')).toBe(false);
        expect(isAllowedStatusTransition('pending', 'completed')).toBe(false);
        expect(isAllowedStatusTransition('accepted', 'arrived')).toBe(false);
    });

    it('isAllowedStatusTransition rejects transitions from terminal states', () => {
        expect(isAllowedStatusTransition('completed', 'accepted')).toBe(false);
        expect(isAllowedStatusTransition('cancelled', 'accepted')).toBe(false);
    });

    it('summariseStatusChange returns no-op when status is unchanged', () => {
        expect(summariseStatusChange('pending', 'pending')).toBe('no-op');
    });

    it('summariseStatusChange recognises pending->accepted as accepted', () => {
        expect(summariseStatusChange('pending', 'accepted')).toBe('accepted');
    });

    it('summariseStatusChange recognises terminal transitions', () => {
        expect(summariseStatusChange('inProgress', 'completed')).toBe('completed');
        expect(summariseStatusChange('accepted', 'cancelled')).toBe('cancelled');
    });

    it('summariseStatusChange returns no-op for unrecognised currents', () => {
        expect(summariseStatusChange('pending', 'enroute')).toBe('no-op');
    });
});
