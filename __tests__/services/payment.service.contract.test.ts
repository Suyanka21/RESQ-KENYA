/**
 * Phase 3 (Backend Stabilization, B-CRIT-1) — contract test.
 *
 * Asserts that `services/payment.service.ts:initiatePayment` always
 * forwards a wire payload that the canonical `initiateStkPush` callable
 * in `functions/src/mpesa/stkPush.ts` will accept (specifically:
 * `idempotencyKey` is present and satisfies `isValidIdempotencyKey`).
 *
 * The bug this guards against (audit §B-CRIT-1) is the original wrapper
 * dropping the field entirely so every real M-Pesa call would 400 with
 * `invalid-argument` once the demo path was switched off.
 *
 * Skills: API-and-Interface-Design, Test-Driven-Development.
 */

import { isValidIdempotencyKey, IDEMPOTENCY_KEY_REGEX } from '../../types/api';

// `jest.mock` factories are hoisted; we expose the spy via a `mock`-prefixed
// name so Jest's hoist-safe variable rule lets us reference it (the only
// allowed pattern other than `jest.requireActual`).
const mockCallable = jest.fn();

jest.mock('firebase/functions', () => ({
    getFunctions: jest.fn(() => ({})),
    httpsCallable: jest.fn(() => mockCallable),
}));
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    onSnapshot: jest.fn(),
}));
jest.mock('../../config/firebase', () => ({
    __esModule: true,
    default: { name: 'test-app' },
    db: {},
}));

describe('payment.service / initiatePayment — contract', () => {
    beforeEach(() => {
        mockCallable.mockReset();
        // Force the demo flag OFF so the real wire path runs. The flag is
        // read at module-import time, so we reset modules between tests.
        const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
        if (proc?.env) {
            proc.env['EXPO_PUBLIC_DEMO_MODE'] = 'false';
        }
        jest.resetModules();
    });

    // The Babel transform pipeline used here does not support dynamic
    // `import()`; use CommonJS `require` for module loading after the
    // env flag is set.
    function loadInitiatePayment(): typeof import('../../services/payment.service').initiatePayment {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require('../../services/payment.service').initiatePayment;
    }

    it('auto-generates a wire-valid idempotencyKey when caller omits one', async () => {
        mockCallable.mockResolvedValueOnce({
            data: { success: true, checkoutRequestID: 'ck_1' },
        });

        const initiatePayment = loadInitiatePayment();
        await initiatePayment({
            requestId: 'req_1',
            amount: 1500,
            phoneNumber: '254712345678',
        });

        expect(mockCallable).toHaveBeenCalledTimes(1);
        const payload = mockCallable.mock.calls[0][0] as Record<string, unknown>;
        expect(payload).toMatchObject({
            requestId: 'req_1',
            amount: 1500,
            phoneNumber: '254712345678',
        });
        expect(typeof payload['idempotencyKey']).toBe('string');
        expect(isValidIdempotencyKey(payload['idempotencyKey'])).toBe(true);
    });

    it('forwards a caller-supplied idempotencyKey verbatim when it is valid', async () => {
        mockCallable.mockResolvedValueOnce({
            data: { success: true, checkoutRequestID: 'ck_2' },
        });

        const supplied = 'idem-1234567890abcdef'; // 20 chars, in regex
        expect(isValidIdempotencyKey(supplied)).toBe(true);

        const initiatePayment = loadInitiatePayment();
        const result = await initiatePayment({
            requestId: 'req_2',
            amount: 2000,
            phoneNumber: '254712345678',
            idempotencyKey: supplied,
        });

        const payload = mockCallable.mock.calls[0][0] as Record<string, unknown>;
        expect(payload['idempotencyKey']).toBe(supplied);
        expect(result.idempotencyKey).toBe(supplied);
    });

    it('replaces an invalid caller-supplied key with an auto-generated one', async () => {
        mockCallable.mockResolvedValueOnce({
            data: { success: true, checkoutRequestID: 'ck_3' },
        });

        const tooShort = 'short';
        expect(isValidIdempotencyKey(tooShort)).toBe(false);

        const initiatePayment = loadInitiatePayment();
        const result = await initiatePayment({
            requestId: 'req_3',
            amount: 500,
            phoneNumber: '254712345678',
            idempotencyKey: tooShort,
        });

        const payload = mockCallable.mock.calls[0][0] as Record<string, unknown>;
        expect(payload['idempotencyKey']).not.toBe(tooShort);
        expect(isValidIdempotencyKey(payload['idempotencyKey'])).toBe(true);
        expect(result.idempotencyKey).toBe(payload['idempotencyKey']);
    });

    it('echoes the idempotencyKey on result so callers can persist it for retries', async () => {
        mockCallable.mockResolvedValueOnce({
            data: { success: false, error: 'Network error' },
        });

        const initiatePayment = loadInitiatePayment();
        const result = await initiatePayment({
            requestId: 'req_4',
            amount: 100,
            phoneNumber: '254712345678',
        });

        expect(result.success).toBe(false);
        expect(typeof result.idempotencyKey).toBe('string');
        expect(IDEMPOTENCY_KEY_REGEX.test(result.idempotencyKey ?? '')).toBe(true);
    });
});
