/**
 * Phase 4 (audit-v2 §N-HIGH-9) — invariant tests for the
 * `acceptServiceRequest` planner.
 *
 * The pre-extraction live callable interleaved five invariant gates
 * with the Firestore transaction body. The audit's documented worst
 * case is a future regression that removes a gate and is not caught
 * by CI — because no test was exercising the function at the callable
 * level. This suite locks in each invariant as a separate unit test
 * against the extracted pure planner.
 *
 * One test per invariant. One additional happy-path test. One test
 * per non-invariant rejection path (missing auth, missing requestId,
 * missing request doc, missing provider doc) to lock in the
 * boundary checks.
 *
 * Skills: Test-Driven-Development (one-failing-test-per-invariant
 * pattern), Code-Review-and-Quality (every documented behaviour gets
 * an assertion), Trustless-System-Auditor (each test corresponds to a
 * concrete failure scenario the audit identified).
 */

import {
    planAcceptServiceRequest,
    type AcceptRequestInput,
    type ProviderSlice,
    type RequestSlice,
} from '../../functions/src/shared/acceptRequestPlanner';

const REQUEST_ID = 'req-abc-123';
const PROVIDER_ID = 'prov-xyz-789';

/**
 * Factory — a valid request+provider pair that should ACCEPT. Each
 * test overrides one field to trip a specific invariant.
 */
function baseInput(overrides: {
    request?: Partial<RequestSlice> | null;
    provider?: Partial<ProviderSlice> | null;
    requestId?: string;
    providerId?: string;
} = {}): AcceptRequestInput {
    const requestBase: RequestSlice = {
        status: 'pending',
        serviceType: 'towing',
    };
    const providerBase: ProviderSlice = {
        verificationStatus: 'verified',
        serviceTypes: ['towing', 'tire', 'battery'],
        availability: {
            isOnline: true,
            currentRequestId: null,
        },
    };
    return {
        requestId: overrides.requestId ?? REQUEST_ID,
        providerId: overrides.providerId ?? PROVIDER_ID,
        request:
            overrides.request === null
                ? null
                : { ...requestBase, ...(overrides.request ?? {}) },
        provider:
            overrides.provider === null
                ? null
                : { ...providerBase, ...(overrides.provider ?? {}) },
    };
}

describe('planAcceptServiceRequest — happy path', () => {
    it('returns an accept plan with the correct two patches', () => {
        const plan = planAcceptServiceRequest(baseInput());
        expect(plan.kind).toBe('accept');
        if (plan.kind === 'accept') {
            expect(plan.requestUpdate.providerId).toBe(PROVIDER_ID);
            expect(plan.requestUpdate.status).toBe('accepted');
            expect(plan.requestUpdate.acceptedAtSentinel).toBe('server-timestamp');
            expect(plan.requestUpdate.updatedAtSentinel).toBe('server-timestamp');
            expect(plan.providerUpdate['availability.currentRequestId']).toBe(REQUEST_ID);
        }
    });

    it('accepts when the provider was already pinned to THIS request (idempotency)', () => {
        // Re-accept of an already-assigned request by the SAME provider
        // (e.g. retry-on-network-error path) must not trip the
        // already-busy invariant. status=pending will already have
        // moved to 'accepted' in practice so the request slice is
        // independent of the provider pinning.
        const input = baseInput({
            provider: { availability: { isOnline: true, currentRequestId: REQUEST_ID } },
        });
        const plan = planAcceptServiceRequest(input);
        expect(plan.kind).toBe('accept');
    });

    // CodeRabbit feedback (PR #9): the previous test pinned the
    // "retry while request still pending" idempotency shape. The
    // companion shape — a retry that happens AFTER the first accept
    // has already flipped the request to 'accepted' — must hit the
    // `already-assigned` branch (NOT the accept branch), and must
    // emit no patches.
    it('rejects retry-after-success (request already accepted) with no patches', () => {
        const input = baseInput({
            request: { status: 'accepted', serviceType: 'towing' },
            provider: { availability: { isOnline: true, currentRequestId: REQUEST_ID } },
        });
        const plan = planAcceptServiceRequest(input);
        expect(plan.kind).toBe('reject');
        if (plan.kind === 'reject') {
            expect(plan.code).toBe('already-assigned');
        }
        // Type-narrowing guarantee: a reject plan exposes neither
        // requestUpdate nor providerUpdate.
        expect((plan as { requestUpdate?: unknown }).requestUpdate).toBeUndefined();
        expect((plan as { providerUpdate?: unknown }).providerUpdate).toBeUndefined();
    });
});

describe('planAcceptServiceRequest — boundary rejections', () => {
    it('rejects when requestId is empty string', () => {
        const plan = planAcceptServiceRequest(baseInput({ requestId: '' }));
        expect(plan.kind).toBe('reject');
        if (plan.kind === 'reject') expect(plan.code).toBe('invalid-argument');
    });

    it('rejects when providerId is empty string (unauth)', () => {
        const plan = planAcceptServiceRequest(baseInput({ providerId: '' }));
        expect(plan.kind).toBe('reject');
        if (plan.kind === 'reject') expect(plan.code).toBe('unauthenticated');
    });

    it('rejects when the request doc is missing', () => {
        const plan = planAcceptServiceRequest(baseInput({ request: null }));
        expect(plan.kind).toBe('reject');
        if (plan.kind === 'reject') expect(plan.code).toBe('not-found');
    });

    it('rejects when the caller has no provider doc', () => {
        const plan = planAcceptServiceRequest(baseInput({ provider: null }));
        expect(plan.kind).toBe('reject');
        if (plan.kind === 'reject') expect(plan.code).toBe('permission-denied');
    });
});

describe('planAcceptServiceRequest — invariant (5) request status', () => {
    it('rejects when request.status is not pending (already accepted)', () => {
        const plan = planAcceptServiceRequest(
            baseInput({ request: { status: 'accepted', serviceType: 'towing' } })
        );
        expect(plan.kind).toBe('reject');
        if (plan.kind === 'reject') expect(plan.code).toBe('already-assigned');
    });

    it('rejects when request.status is completed', () => {
        const plan = planAcceptServiceRequest(
            baseInput({ request: { status: 'completed', serviceType: 'towing' } })
        );
        expect(plan.kind).toBe('reject');
        if (plan.kind === 'reject') expect(plan.code).toBe('already-assigned');
    });

    it('rejects when request.status is cancelled', () => {
        const plan = planAcceptServiceRequest(
            baseInput({ request: { status: 'cancelled', serviceType: 'towing' } })
        );
        expect(plan.kind).toBe('reject');
        if (plan.kind === 'reject') expect(plan.code).toBe('already-assigned');
    });
});

describe('planAcceptServiceRequest — invariant (1) verification', () => {
    it('rejects an unverified provider', () => {
        const plan = planAcceptServiceRequest(
            baseInput({
                provider: {
                    verificationStatus: 'pending',
                    serviceTypes: ['towing'],
                    availability: { isOnline: true, currentRequestId: null },
                },
            })
        );
        expect(plan.kind).toBe('reject');
        if (plan.kind === 'reject') expect(plan.code).toBe('not-verified');
    });

    it('rejects a suspended provider', () => {
        const plan = planAcceptServiceRequest(
            baseInput({
                provider: {
                    verificationStatus: 'suspended',
                    serviceTypes: ['towing'],
                    availability: { isOnline: true, currentRequestId: null },
                },
            })
        );
        expect(plan.kind).toBe('reject');
        if (plan.kind === 'reject') expect(plan.code).toBe('not-verified');
    });

    it('rejects a provider with missing verificationStatus (default-deny)', () => {
        // Set verificationStatus explicitly to undefined so the
        // factory's merge from `providerBase` does not silently
        // re-supply `'verified'`. This is the test's whole point.
        const plan = planAcceptServiceRequest(
            baseInput({
                provider: {
                    verificationStatus: undefined,
                    serviceTypes: ['towing'],
                    availability: { isOnline: true, currentRequestId: null },
                },
            })
        );
        expect(plan.kind).toBe('reject');
        if (plan.kind === 'reject') expect(plan.code).toBe('not-verified');
    });
});

describe('planAcceptServiceRequest — invariant (2) online', () => {
    it('rejects an offline provider', () => {
        const plan = planAcceptServiceRequest(
            baseInput({
                provider: {
                    verificationStatus: 'verified',
                    serviceTypes: ['towing'],
                    availability: { isOnline: false, currentRequestId: null },
                },
            })
        );
        expect(plan.kind).toBe('reject');
        if (plan.kind === 'reject') expect(plan.code).toBe('not-online');
    });

    it('rejects a provider with no availability object (default-deny)', () => {
        // Explicitly clear availability so the factory's merge from
        // `providerBase` does not silently re-supply `isOnline: true`.
        const plan = planAcceptServiceRequest(
            baseInput({
                provider: {
                    verificationStatus: 'verified',
                    serviceTypes: ['towing'],
                    availability: undefined,
                },
            })
        );
        expect(plan.kind).toBe('reject');
        if (plan.kind === 'reject') expect(plan.code).toBe('not-online');
    });
});

describe('planAcceptServiceRequest — invariant (3) service type', () => {
    it('rejects when provider does not offer the requested service', () => {
        const plan = planAcceptServiceRequest(
            baseInput({
                provider: {
                    verificationStatus: 'verified',
                    serviceTypes: ['battery', 'tire'],   // no 'towing'
                    availability: { isOnline: true, currentRequestId: null },
                },
            })
        );
        expect(plan.kind).toBe('reject');
        if (plan.kind === 'reject') expect(plan.code).toBe('service-type-mismatch');
    });

    it('rejects when provider.serviceTypes is not an array (corrupted doc)', () => {
        const plan = planAcceptServiceRequest(
            baseInput({
                provider: {
                    verificationStatus: 'verified',
                    serviceTypes: 'towing' as unknown as string[], // corrupted shape
                    availability: { isOnline: true, currentRequestId: null },
                },
            })
        );
        expect(plan.kind).toBe('reject');
        if (plan.kind === 'reject') expect(plan.code).toBe('service-type-mismatch');
    });
});

describe('planAcceptServiceRequest — invariant (4) idle', () => {
    it('rejects a provider already pinned to a DIFFERENT request', () => {
        const plan = planAcceptServiceRequest(
            baseInput({
                provider: {
                    verificationStatus: 'verified',
                    serviceTypes: ['towing'],
                    availability: {
                        isOnline: true,
                        currentRequestId: 'some-other-req',
                    },
                },
            })
        );
        expect(plan.kind).toBe('reject');
        if (plan.kind === 'reject') expect(plan.code).toBe('already-busy');
    });

    it('accepts when currentRequestId is the empty string (treated as unset)', () => {
        const plan = planAcceptServiceRequest(
            baseInput({
                provider: {
                    verificationStatus: 'verified',
                    serviceTypes: ['towing'],
                    availability: { isOnline: true, currentRequestId: '' },
                },
            })
        );
        expect(plan.kind).toBe('accept');
    });
});
