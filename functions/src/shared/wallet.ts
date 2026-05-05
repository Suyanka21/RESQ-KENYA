/**
 * Pure wallet math helper. No firebase imports so it can be unit tested.
 * Returns the new balance, or `null` when the delta would overdraw.
 */
export function applyDelta(currentBalance: number, delta: number): number | null {
    const next = currentBalance + delta;
    if (next < 0) return null;
    return next;
}
