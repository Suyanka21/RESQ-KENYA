/**
 * Phase 4 (audit-v2 §N-CRIT-4) — unit tests for the medical-dispatch
 * planner. Every invariant is its own test so a regression surfaces
 * the exact constraint that broke.
 *
 * Skills: TDD (failing-test-first against the planner), Code-Review-
 * and-Quality (each invariant gets a dedicated assertion line).
 */

import {
    planAssignMedicalProvider,
    isProviderSuitableForTriage,
    shouldReleaseMedicalProvider,
    type AssignMedicalProviderPlan,
} from '../../functions/src/medical/dispatch.planner';

const PROVIDER = 'provider-1';
const STRANGER = 'stranger-1';

function expectOk(plan: AssignMedicalProviderPlan): asserts plan is { ok: true } {
    if (!plan.ok) {
        throw new Error(`expected ok, got code=${plan.code} message=${plan.message}`);
    }
}

function expectFail(
    plan: AssignMedicalProviderPlan,
    code: 'permission-denied' | 'not-found' | 'failed-precondition'
): asserts plan is { ok: false; code: typeof code; message: string } {
    if (plan.ok) {
        throw new Error(`expected ok=false code=${code}, got ok=true`);
    }
    if (plan.code !== code) {
        throw new Error(`expected code=${code}, got code=${plan.code}`);
    }
}

describe('planAssignMedicalProvider (audit-v2 §N-CRIT-4)', () => {
    describe('invariant 1 — caller authorization', () => {
        it('rejects when caller is not the providerId (no admin override yet)', () => {
            const plan = planAssignMedicalProvider({
                callerUid: STRANGER,
                providerId: PROVIDER,
                request: { status: 'pending', triageLevel: 'green' },
                provider: { status: 'active', emtLevel: 'first_responder' },
            });
            expectFail(plan, 'permission-denied');
        });
    });

    describe('invariant 2 — request must exist', () => {
        it('rejects when the request snap is missing', () => {
            const plan = planAssignMedicalProvider({
                callerUid: PROVIDER,
                providerId: PROVIDER,
                provider: { status: 'active', emtLevel: 'first_responder' },
            });
            expectFail(plan, 'not-found');
        });
    });

    describe('invariant 3 — request must be pending (no double-assign)', () => {
        it.each(['accepted', 'enroute', 'arrived', 'completed', 'cancelled'])(
            'rejects when the request is already in status %s',
            (status) => {
                const plan = planAssignMedicalProvider({
                    callerUid: PROVIDER,
                    providerId: PROVIDER,
                    request: { status, triageLevel: 'green' },
                    provider: { status: 'active', emtLevel: 'first_responder' },
                });
                expectFail(plan, 'failed-precondition');
                expect(plan.message).toContain(status);
            }
        );
    });

    describe('invariant 4 — provider verification', () => {
        it('rejects when provider snap is missing', () => {
            const plan = planAssignMedicalProvider({
                callerUid: PROVIDER,
                providerId: PROVIDER,
                request: { status: 'pending', triageLevel: 'green' },
            });
            expectFail(plan, 'not-found');
        });

        it.each(['pending_verification', 'rejected', 'suspended'])(
            'rejects when provider.status is %s',
            (status) => {
                const plan = planAssignMedicalProvider({
                    callerUid: PROVIDER,
                    providerId: PROVIDER,
                    request: { status: 'pending', triageLevel: 'green' },
                    provider: { status, emtLevel: 'first_responder' },
                });
                expectFail(plan, 'failed-precondition');
            }
        );
    });

    describe('invariant 5 — provider idleness', () => {
        it('rejects when provider already has currentRequestId set', () => {
            const plan = planAssignMedicalProvider({
                callerUid: PROVIDER,
                providerId: PROVIDER,
                request: { status: 'pending', triageLevel: 'green' },
                provider: {
                    status: 'active',
                    emtLevel: 'first_responder',
                    currentRequestId: 'other-emergency',
                },
            });
            expectFail(plan, 'failed-precondition');
            expect(plan.message).toContain('already');
        });

        it('rejects when provider toggled isAvailable=false', () => {
            const plan = planAssignMedicalProvider({
                callerUid: PROVIDER,
                providerId: PROVIDER,
                request: { status: 'pending', triageLevel: 'green' },
                provider: {
                    status: 'active',
                    emtLevel: 'first_responder',
                    isAvailable: false,
                },
            });
            expectFail(plan, 'failed-precondition');
        });
    });

    describe('invariant 6 — EMT level matches triage level', () => {
        it('rejects first_responder for red (life-threatening) calls', () => {
            const plan = planAssignMedicalProvider({
                callerUid: PROVIDER,
                providerId: PROVIDER,
                request: { status: 'pending', triageLevel: 'red' },
                provider: { status: 'active', emtLevel: 'first_responder' },
            });
            expectFail(plan, 'failed-precondition');
            expect(plan.message).toContain('not suitable');
        });

        it('rejects emt_basic for red calls (intermediate required)', () => {
            const plan = planAssignMedicalProvider({
                callerUid: PROVIDER,
                providerId: PROVIDER,
                request: { status: 'pending', triageLevel: 'red' },
                provider: { status: 'active', emtLevel: 'emt_basic' },
            });
            expectFail(plan, 'failed-precondition');
        });

        it('accepts emt_intermediate for red calls (boundary)', () => {
            const plan = planAssignMedicalProvider({
                callerUid: PROVIDER,
                providerId: PROVIDER,
                request: { status: 'pending', triageLevel: 'red' },
                provider: { status: 'active', emtLevel: 'emt_intermediate' },
            });
            expectOk(plan);
        });

        it('accepts emt_paramedic for red calls', () => {
            const plan = planAssignMedicalProvider({
                callerUid: PROVIDER,
                providerId: PROVIDER,
                request: { status: 'pending', triageLevel: 'red' },
                provider: { status: 'active', emtLevel: 'emt_paramedic' },
            });
            expectOk(plan);
        });

        it('accepts emt_basic for yellow calls (boundary)', () => {
            const plan = planAssignMedicalProvider({
                callerUid: PROVIDER,
                providerId: PROVIDER,
                request: { status: 'pending', triageLevel: 'yellow' },
                provider: { status: 'active', emtLevel: 'emt_basic' },
            });
            expectOk(plan);
        });

        it('accepts first_responder for green calls', () => {
            const plan = planAssignMedicalProvider({
                callerUid: PROVIDER,
                providerId: PROVIDER,
                request: { status: 'pending', triageLevel: 'green' },
                provider: { status: 'active', emtLevel: 'first_responder' },
            });
            expectOk(plan);
        });
    });

    describe('happy path', () => {
        it('returns ok when all invariants pass', () => {
            const plan = planAssignMedicalProvider({
                callerUid: PROVIDER,
                providerId: PROVIDER,
                request: { status: 'pending', triageLevel: 'green' },
                provider: { status: 'active', emtLevel: 'first_responder' },
            });
            expectOk(plan);
        });
    });
});

describe('isProviderSuitableForTriage (audit-v2 §N-CRIT-4)', () => {
    it('returns false for unknown emt level', () => {
        expect(isProviderSuitableForTriage('rookie', 'green')).toBe(false);
    });

    it('returns true for paramedic on any triage', () => {
        expect(isProviderSuitableForTriage('emt_paramedic', 'red')).toBe(true);
        expect(isProviderSuitableForTriage('emt_paramedic', 'yellow')).toBe(true);
        expect(isProviderSuitableForTriage('emt_paramedic', 'green')).toBe(true);
    });
});

describe('shouldReleaseMedicalProvider (audit-v2 §N-CRIT-4 release path)', () => {
    it('releases when transitioning into completed with a provider assigned', () => {
        expect(shouldReleaseMedicalProvider('accepted', 'completed', 'provider-1')).toBe(true);
    });

    it('releases when transitioning into cancelled with a provider assigned', () => {
        expect(shouldReleaseMedicalProvider('accepted', 'cancelled', 'provider-1')).toBe(true);
    });

    it('does not release when no provider was assigned yet', () => {
        expect(shouldReleaseMedicalProvider('pending', 'cancelled', undefined)).toBe(false);
    });

    it('does not release on intermediate transitions', () => {
        expect(shouldReleaseMedicalProvider('accepted', 'enroute', 'provider-1')).toBe(false);
        expect(shouldReleaseMedicalProvider('enroute', 'arrived', 'provider-1')).toBe(false);
    });

    it('does not release when status did not actually change', () => {
        expect(shouldReleaseMedicalProvider('completed', 'completed', 'provider-1')).toBe(false);
    });
});
