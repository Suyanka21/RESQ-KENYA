/**
 * Phase 4 (audit-v2 §N-CRIT-2 / §N-HIGH-8) — unit tests for the
 * pure RTDB seed-node builder used by `onRequestStatusChange`.
 *
 * The customer's tracking subscription depends on the `customerId`
 * field being present on the seed node so the RTDB rule
 * (`data.child('customerId').val() === auth.uid`) authorizes the
 * read. The audit (§N-CRIT-2) flagged that production never wrote
 * `customerId`; this test pins that production-path field down.
 *
 * Skills: TDD, API-and-Interface-Design (one source of truth for the
 * seed shape; rules tests import this same builder for parity).
 */

import { buildActiveRequestSeed } from '../../functions/src/services/triggers';

describe('buildActiveRequestSeed (audit-v2 §N-CRIT-2 / §N-HIGH-8)', () => {
    it('writes customerId from the request userId so the RTDB rule can authorize the customer read', () => {
        const seed = buildActiveRequestSeed({
            requestId: 'req-1',
            userId: 'customer-uid',
            providerId: 'provider-uid',
            status: 'accepted',
            customerLocation: { latitude: -1.2, longitude: 36.8 },
            providerLocation: { latitude: -1.21, longitude: 36.81 },
        });
        expect(seed.customerId).toBe('customer-uid');
    });

    it('preserves the providerId so the RTDB rule can also authorize the assigned provider read', () => {
        const seed = buildActiveRequestSeed({
            requestId: 'req-1',
            userId: 'customer-uid',
            providerId: 'provider-uid',
            status: 'accepted',
        });
        expect(seed.providerId).toBe('provider-uid');
    });

    it('coerces missing/empty userId to null so the rule predicate evaluates to false (deny) rather than throwing', () => {
        const seedNoUser = buildActiveRequestSeed({
            requestId: 'req-1',
            providerId: 'provider-uid',
            status: 'accepted',
        });
        const seedEmptyUser = buildActiveRequestSeed({
            requestId: 'req-1',
            userId: '',
            providerId: 'provider-uid',
        });
        expect(seedNoUser.customerId).toBeNull();
        expect(seedEmptyUser.customerId).toBeNull();
    });

    it('coerces missing/empty providerId to null', () => {
        const seed = buildActiveRequestSeed({
            requestId: 'req-1',
            userId: 'customer-uid',
            providerId: '',
        });
        expect(seed.providerId).toBeNull();
    });

    it('always emits providerStale = false (clears any prior stale flag)', () => {
        const seed = buildActiveRequestSeed({
            requestId: 'req-1',
            userId: 'customer-uid',
            providerId: 'provider-uid',
        });
        expect(seed.providerStale).toBe(false);
    });

    it('passes through customer/provider locations untouched when supplied', () => {
        const seed = buildActiveRequestSeed({
            requestId: 'req-1',
            userId: 'customer-uid',
            providerId: 'provider-uid',
            customerLocation: { latitude: -1.286, longitude: 36.817 },
            providerLocation: { latitude: -1.291, longitude: 36.821 },
        });
        expect(seed.customerLocation).toEqual({ latitude: -1.286, longitude: 36.817 });
        expect(seed.providerLocation).toEqual({ latitude: -1.291, longitude: 36.821 });
    });

    it('null-defaults missing locations (so the RTDB write does not introduce undefined leaves)', () => {
        const seed = buildActiveRequestSeed({
            requestId: 'req-1',
            userId: 'customer-uid',
            providerId: 'provider-uid',
        });
        expect(seed.customerLocation).toBeNull();
        expect(seed.providerLocation).toBeNull();
    });
});
