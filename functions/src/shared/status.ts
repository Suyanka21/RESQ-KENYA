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
