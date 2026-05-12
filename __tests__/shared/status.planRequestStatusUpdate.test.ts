/**
 * Phase 4 (audit-v2 §N-CRIT-1) — unit tests for the
 * `planRequestStatusUpdate` helper that decides whether
 * `updateRequestStatus` should also release the provider's
 * `availability.currentRequestId`.
 *
 * Audit reference:
 *   docs/system-audit-v2.md → N-CRIT-1 (provider permanently locked
 *   out after first completed job).
 *
 * Skills: Test-Driven-Development (cover every branch + the regression
 * the audit calls out — accept → complete → accept-again cycle).
 */

import {
    planRequestStatusUpdate,
    type RequestStatusUpdatePlan,
} from '../../functions/src/shared/status';

const PROVIDER = 'provider-uid-1';
const CUSTOMER = 'customer-uid-1';
const STRANGER = 'someone-else';

function expectOk(plan: RequestStatusUpdatePlan): asserts plan is { ok: true; releaseProvider: boolean } {
    if (!plan.ok) {
        throw new Error(`expected ok plan, got ${plan.code}: ${plan.message}`);
    }
}

function expectFail(
    plan: RequestStatusUpdatePlan,
    code: 'permission-denied' | 'failed-precondition'
): asserts plan is { ok: false; code: typeof code; message: string } {
    if (plan.ok) {
        throw new Error('expected fail plan, got ok');
    }
    if (plan.code !== code) {
        throw new Error(`expected code ${code}, got ${plan.code}`);
    }
}

describe('planRequestStatusUpdate — provider release on terminal transitions (N-CRIT-1)', () => {
    it('releases the provider when the assigned provider completes their request', () => {
        const plan = planRequestStatusUpdate(
            { status: 'inProgress', providerId: PROVIDER, userId: CUSTOMER },
            'completed',
            PROVIDER
        );
        expectOk(plan);
        expect(plan.releaseProvider).toBe(true);
    });

    it('releases the provider when the assigned provider cancels mid-flight', () => {
        const plan = planRequestStatusUpdate(
            { status: 'enroute', providerId: PROVIDER, userId: CUSTOMER },
            'cancelled',
            PROVIDER
        );
        expectOk(plan);
        expect(plan.releaseProvider).toBe(true);
    });

    it('releases the provider when the customer cancels an accepted request', () => {
        const plan = planRequestStatusUpdate(
            { status: 'accepted', providerId: PROVIDER, userId: CUSTOMER },
            'cancelled',
            CUSTOMER
        );
        expectOk(plan);
        expect(plan.releaseProvider).toBe(true);
    });

    it('does NOT release the provider when the customer cancels a still-pending request', () => {
        // No provider is assigned yet → there is nothing to release.
        const plan = planRequestStatusUpdate(
            { status: 'pending', userId: CUSTOMER },
            'cancelled',
            CUSTOMER
        );
        expectOk(plan);
        expect(plan.releaseProvider).toBe(false);
    });

    it.each([
        ['accepted', 'enroute'],
        ['enroute', 'arrived'],
        ['arrived', 'inProgress'],
    ] as const)(
        'does NOT release the provider on intermediate transition %s → %s',
        (from, to) => {
            const plan = planRequestStatusUpdate(
                { status: from, providerId: PROVIDER, userId: CUSTOMER },
                to,
                PROVIDER
            );
            expectOk(plan);
            expect(plan.releaseProvider).toBe(false);
        }
    );
});

describe('planRequestStatusUpdate — authorization', () => {
    it('rejects a non-cancel transition from anyone other than the assigned provider', () => {
        const plan = planRequestStatusUpdate(
            { status: 'accepted', providerId: PROVIDER, userId: CUSTOMER },
            'enroute',
            CUSTOMER // customer cannot mark enroute
        );
        expectFail(plan, 'permission-denied');
        expect(plan.message).toMatch(/assigned provider/i);
    });

    it('rejects a non-cancel transition from a stranger', () => {
        const plan = planRequestStatusUpdate(
            { status: 'accepted', providerId: PROVIDER, userId: CUSTOMER },
            'enroute',
            STRANGER
        );
        expectFail(plan, 'permission-denied');
    });

    it('rejects a cancel from a stranger', () => {
        const plan = planRequestStatusUpdate(
            { status: 'accepted', providerId: PROVIDER, userId: CUSTOMER },
            'cancelled',
            STRANGER
        );
        expectFail(plan, 'permission-denied');
        expect(plan.message).toMatch(/Not your request/);
    });

    it('allows the assigned provider to cancel', () => {
        const plan = planRequestStatusUpdate(
            { status: 'accepted', providerId: PROVIDER, userId: CUSTOMER },
            'cancelled',
            PROVIDER
        );
        expectOk(plan);
    });

    it('allows the customer to cancel their own request', () => {
        const plan = planRequestStatusUpdate(
            { status: 'pending', userId: CUSTOMER },
            'cancelled',
            CUSTOMER
        );
        expectOk(plan);
    });
});

describe('planRequestStatusUpdate — transition graph enforcement', () => {
    it('rejects skipping states (pending → completed)', () => {
        const plan = planRequestStatusUpdate(
            { status: 'pending', providerId: PROVIDER, userId: CUSTOMER },
            'completed',
            PROVIDER
        );
        expectFail(plan, 'failed-precondition');
        expect(plan.message).toMatch(/Cannot transition from pending to completed/);
    });

    it('rejects re-entering a terminal state', () => {
        const plan = planRequestStatusUpdate(
            { status: 'completed', providerId: PROVIDER, userId: CUSTOMER },
            'completed',
            PROVIDER
        );
        expectFail(plan, 'failed-precondition');
    });
});

describe('planRequestStatusUpdate — accept → complete → accept-again cycle (audit regression)', () => {
    it('mirrors the audit scenario: a provider who completes a request must be releasable to accept the next one', () => {
        // Simulates the request doc as it appears at completion time.
        const requestAtCompletion = {
            status: 'inProgress',
            providerId: PROVIDER,
            userId: CUSTOMER,
        };

        const plan = planRequestStatusUpdate(requestAtCompletion, 'completed', PROVIDER);
        expectOk(plan);

        // The release flag is what gates the regression: without it, the
        // provider's `availability.currentRequestId` field stays set and
        // the *next* `acceptServiceRequest` call rejects the same
        // provider with `failed-precondition: Provider already has an
        // active request`.
        expect(plan.releaseProvider).toBe(true);
    });
});
