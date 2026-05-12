/**
 * Phase 4 (audit-v2 §N-CRIT-4) — pure planner for medical dispatch.
 *
 * The previous `assignMedicalProvider` callable wrote the request and
 * the provider doc with two non-atomic updates and gated only on
 * `request.status === 'pending'` + `provider.status === 'active'`.
 * That left five invariants unchecked:
 *
 *   1. Caller authorization (anyone could call with any pair).
 *   2. Provider idleness (`currentRequestId` already set ⇒ provider
 *      could be assigned to two emergencies at once).
 *   3. Provider availability flag (`isAvailable === false` ignored).
 *   4. EMT-level vs triage-level suitability (a `first_responder`
 *      could be assigned to a `red` cardiac call).
 *   5. Atomicity: the second write could fail and the request would
 *      sit `accepted` with no provider tracking.
 *
 * Audit ranked CRITICAL on the safety override (medical, life-safety,
 * dispatch). This module owns the decision logic; the callable wires
 * the plan into a single Firestore transaction.
 *
 * Skills: TDD (the planner is the unit-test surface), Code-Review-and-
 * Quality (the five invariants are explicit, named, and individually
 * testable), API-and-Interface-Design (a single source of truth for
 * the dispatch contract).
 */

export type TriageLevel = 'red' | 'yellow' | 'green';

export interface AssignMedicalProviderRequest {
    status: string;
    triageLevel: TriageLevel;
}

export interface AssignMedicalProviderProvider {
    /** Provider verification status — only `active` is dispatchable. */
    status: string;
    emtLevel: string;
    /** `true` when the provider has toggled availability ON. */
    isAvailable?: boolean;
    /** Set when the provider is mid-emergency. Must be empty to assign. */
    currentRequestId?: string;
}

export interface AssignMedicalProviderInput {
    callerUid: string;
    providerId: string;
    request?: AssignMedicalProviderRequest;
    provider?: AssignMedicalProviderProvider;
}

export type AssignMedicalProviderPlan =
    | { ok: true }
    | {
          ok: false;
          code: 'permission-denied' | 'not-found' | 'failed-precondition';
          message: string;
      };

/**
 * EMT-level → triage-level suitability. Mirrored from
 * `dispatch.ts#isProviderSuitableForTriage` so the planner is
 * self-contained (no Firestore imports).
 */
const EMT_LEVEL_RANK: Readonly<Record<string, number>> = Object.freeze({
    first_responder: 1,
    emt_basic: 2,
    emt_intermediate: 3,
    emt_paramedic: 4,
});

const TRIAGE_REQUIRED_RANK: Readonly<Record<TriageLevel, number>> = Object.freeze({
    red: 3, // life-threatening — at least intermediate
    yellow: 2, // urgent — at least basic
    green: 1, // non-urgent — first responder OK
});

export function isProviderSuitableForTriage(emtLevel: string, triageLevel: TriageLevel): boolean {
    const have = EMT_LEVEL_RANK[emtLevel] ?? 0;
    const need = TRIAGE_REQUIRED_RANK[triageLevel];
    return have >= need;
}

export function planAssignMedicalProvider(input: AssignMedicalProviderInput): AssignMedicalProviderPlan {
    // (1) Caller must be the provider — providers self-accept. Admin
    // override is intentionally NOT here yet; if/when a dispatcher
    // role is introduced, gate on a custom claim, do not loosen this
    // function. (Audit-v2 §N-CRIT-4 invariant 1.)
    if (input.callerUid !== input.providerId) {
        return {
            ok: false,
            code: 'permission-denied',
            message: 'Only the provider may self-accept this emergency',
        };
    }

    // (2) Request must exist.
    if (!input.request) {
        return { ok: false, code: 'not-found', message: 'Emergency request not found' };
    }

    // (3) Request must still be pending (no double-assign races).
    // Audit-v2 §N-CRIT-4 invariant 5 (atomicity): outside the
    // transaction, two callers can both pass this check before
    // either writes. Inside the transaction, one of the two will
    // see status='accepted' on its retry.
    if (input.request.status !== 'pending') {
        return {
            ok: false,
            code: 'failed-precondition',
            message: `Request already ${input.request.status}`,
        };
    }

    // (4) Provider must exist.
    if (!input.provider) {
        return { ok: false, code: 'not-found', message: 'Medical provider not found' };
    }

    // (5) Provider must be verified/active. (Audit-v2 §N-CRIT-4
    // invariant 4 — verification gate.)
    if (input.provider.status !== 'active') {
        return {
            ok: false,
            code: 'failed-precondition',
            message: 'Medical provider is not verified',
        };
    }

    // (6) Provider must be idle — neither toggled-off nor mid-emergency.
    // Audit-v2 §N-CRIT-4 invariants 2 + 3.
    //
    // CodeRabbit feedback (PR #9): `isAvailable === false` was a
    // default-ALLOW check — a missing or `undefined` `isAvailable`
    // counted as available, which means a provider doc that never
    // wrote the field could be dispatched even though they never
    // toggled on. For a medical / life-safety dispatch the
    // invariant must be default-DENY: only an explicit `true`
    // permits dispatch.
    //
    // Skills: Security-and-Hardening (default-deny on safety-critical
    // gates), TRUSTLESS-AUDITOR (life-safety paths fail closed).
    const onAnotherEmergency =
        typeof input.provider.currentRequestId === 'string' &&
        input.provider.currentRequestId.length > 0;
    const toggledOff = input.provider.isAvailable !== true;
    if (onAnotherEmergency || toggledOff) {
        return {
            ok: false,
            code: 'failed-precondition',
            message: 'Medical provider already has an active emergency',
        };
    }

    // (7) EMT level must match the triage level. Audit-v2 §N-CRIT-4
    // invariant — first_responder must NOT be dispatched to a red call.
    if (!isProviderSuitableForTriage(input.provider.emtLevel, input.request.triageLevel)) {
        return {
            ok: false,
            code: 'failed-precondition',
            message: `Provider EMT level (${input.provider.emtLevel}) is not suitable for ${input.request.triageLevel} triage`,
        };
    }

    return { ok: true };
}

/**
 * Pure planner for the *release* path — clears the medical provider's
 * `currentRequestId` when an emergency_request transitions to a
 * terminal status. Parallels `planRequestStatusUpdate.releaseProvider`
 * in `functions/src/shared/status.ts` (audit-v2 §N-CRIT-1).
 */
export function shouldReleaseMedicalProvider(
    previousStatus: string | undefined,
    newStatus: string,
    providerId: string | undefined
): boolean {
    if (!providerId) return false;
    if (previousStatus === newStatus) return false;
    return newStatus === 'completed' || newStatus === 'cancelled';
}
