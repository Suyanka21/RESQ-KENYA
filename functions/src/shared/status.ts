/**
 * Pure status-machine helpers. No firebase imports.
 */

export const VALID_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
    pending: ['accepted', 'cancelled'],
    accepted: ['enroute', 'cancelled'],
    enroute: ['arrived', 'cancelled'],
    arrived: ['inProgress', 'cancelled'],
    inProgress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
};

export function isAllowedStatusTransition(from: string, to: string): boolean {
    const allowed = VALID_STATUS_TRANSITIONS[from];
    return Array.isArray(allowed) && allowed.includes(to);
}

/** Phase 3 helper: classify a request status change for the RTDB mirror. */
export type StatusChangeKind = 'accepted' | 'completed' | 'cancelled' | 'no-op';

export function summariseStatusChange(
    previous: string | undefined,
    current: string | undefined
): StatusChangeKind {
    if (previous === current) return 'no-op';
    if (current === 'accepted' && previous !== 'accepted') return 'accepted';
    if (current === 'completed') return 'completed';
    if (current === 'cancelled') return 'cancelled';
    return 'no-op';
}

/**
 * Phase 4 (audit-v2 §N-CRIT-1) — pure planner for the
 * `updateRequestStatus` callable.
 *
 * Given the request's current state and the requested new status, decide:
 *   - is the caller permitted to make the transition?
 *   - is the transition graph-valid?
 *   - on terminal transitions, must the assigned provider be released
 *     (clear `availability.currentRequestId`) so the provider can accept
 *     another job?
 *
 * Pure: no firebase / no IO, so it can be unit-tested against every
 * combination without standing up the emulator. The callable wires the
 * decision into a Firestore transaction (see
 * `functions/src/services/requests.ts:updateRequestStatus`).
 *
 * Skills: API-and-Interface-Design (single source of truth for transition
 * authorization + provider release), TDD (helper is the unit-test surface).
 */
export type RequestStatusUpdatePlan =
    | { ok: true; releaseProvider: boolean }
    | {
          ok: false;
          code: 'permission-denied' | 'failed-precondition';
          message: string;
      };

export function planRequestStatusUpdate(
    current: { status: string; providerId?: string; userId?: string },
    newStatus: string,
    callerUid: string
): RequestStatusUpdatePlan {
    if (newStatus === 'cancelled') {
        if (current.userId !== callerUid && current.providerId !== callerUid) {
            return {
                ok: false,
                code: 'permission-denied',
                message: 'Not your request',
            };
        }
    } else {
        if (current.providerId !== callerUid) {
            return {
                ok: false,
                code: 'permission-denied',
                message: 'Only the assigned provider may update status',
            };
        }
    }

    if (!isAllowedStatusTransition(current.status, newStatus)) {
        return {
            ok: false,
            code: 'failed-precondition',
            message: `Cannot transition from ${current.status} to ${newStatus}`,
        };
    }

    // Release the provider on terminal transitions only when there *is* an
    // assigned provider — a customer-cancelled `pending` request has no
    // provider to release.
    const releaseProvider =
        (newStatus === 'completed' || newStatus === 'cancelled') &&
        typeof current.providerId === 'string' &&
        current.providerId.length > 0;

    return { ok: true, releaseProvider };
}
