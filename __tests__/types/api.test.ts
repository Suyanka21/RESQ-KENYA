/**
 * Phase 6 (TDD): contract validators in types/api.ts.
 * These are pure functions; no Firebase mocks required.
 */

import {
    isValidIdempotencyKey,
    isValidCoordinates,
    isValidServiceType,
    ok,
    err,
    isOk,
} from '../../types/api';

describe('types/api', () => {
    describe('isValidIdempotencyKey', () => {
        it('accepts a 16-char alphanumeric key', () => {
            expect(isValidIdempotencyKey('abcdef0123456789')).toBe(true);
        });

        it('accepts a 64-char alphanumeric/dash/underscore key', () => {
            const key = 'a'.repeat(60) + '_-09';
            expect(isValidIdempotencyKey(key)).toBe(true);
        });

        it('rejects keys shorter than 16 chars', () => {
            expect(isValidIdempotencyKey('short')).toBe(false);
        });

        it('rejects keys longer than 64 chars', () => {
            expect(isValidIdempotencyKey('a'.repeat(65))).toBe(false);
        });

        it('rejects keys with spaces or special characters', () => {
            expect(isValidIdempotencyKey('has spaces in key 12345')).toBe(false);
            expect(isValidIdempotencyKey('has/slash/in/key1234')).toBe(false);
        });

        it('rejects non-string values', () => {
            expect(isValidIdempotencyKey(undefined)).toBe(false);
            expect(isValidIdempotencyKey(123)).toBe(false);
            expect(isValidIdempotencyKey(null)).toBe(false);
            expect(isValidIdempotencyKey({ key: 'foo' })).toBe(false);
        });
    });

    describe('isValidCoordinates', () => {
        it('accepts valid Nairobi coordinates', () => {
            expect(isValidCoordinates({ latitude: -1.2921, longitude: 36.8219 })).toBe(true);
        });

        it('rejects coordinates outside earth bounds', () => {
            expect(isValidCoordinates({ latitude: 95, longitude: 0 })).toBe(false);
            expect(isValidCoordinates({ latitude: 0, longitude: 200 })).toBe(false);
        });

        it('rejects missing or non-number coordinates', () => {
            expect(isValidCoordinates({ latitude: '0', longitude: 0 })).toBe(false);
            expect(isValidCoordinates({})).toBe(false);
            expect(isValidCoordinates(null)).toBe(false);
        });
    });

    describe('isValidServiceType', () => {
        it('accepts the 6 known service types', () => {
            ['towing', 'tire', 'battery', 'fuel', 'diagnostics', 'ambulance'].forEach((s) => {
                expect(isValidServiceType(s)).toBe(true);
            });
        });

        it('rejects unknown values', () => {
            expect(isValidServiceType('locksmith')).toBe(false);
            expect(isValidServiceType('')).toBe(false);
            expect(isValidServiceType(undefined)).toBe(false);
        });
    });

    describe('ok / err / isOk', () => {
        it('ok wraps a value', () => {
            expect(ok({ requestId: 'r1' })).toEqual({ ok: true, data: { requestId: 'r1' } });
        });

        it('err wraps an error code + message', () => {
            expect(err('invalid_quote', 'expired')).toEqual({
                ok: false,
                errorCode: 'invalid_quote',
                message: 'expired',
            });
        });

        it('isOk narrows discriminated union', () => {
            const result = ok({ x: 1 });
            if (isOk(result)) {
                // Type-level: should compile — `data` is accessible.
                expect(result.data.x).toBe(1);
            } else {
                fail('expected ok');
            }
        });
    });
});
