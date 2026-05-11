/**
 * Phase 4 (audit-v2 §N-HIGH-4) — distance-aware ETA regression tests.
 *
 * The pre-fix `estimateETA()` returned `Math.floor(Math.random() * 12) + 8`
 * — a uniformly-distributed 8-20 minute integer with zero correlation to
 * the real provider→customer distance. These tests lock in the new
 * distance-aware contract so a future refactor cannot silently re-introduce
 * the random behaviour.
 *
 * Skills: Test-Driven-Development (pure-function tests cover the four
 * meaningful branches: null/invalid input, very-close, mid-range,
 * out-of-range high), Source-Driven-Development (constants imported from
 * the same module that callers use, so a tuning change updates both
 * production and tests in one place).
 */

import {
    estimateETA,
    URBAN_AVG_SPEED_KMH,
    PICKUP_OVERHEAD_MIN,
    MIN_ETA_MIN,
    MAX_ETA_MIN,
    FALLBACK_ETA_MIN,
} from '../../functions/src/shared/eta';

describe('estimateETA (audit-v2 §N-HIGH-4)', () => {
    describe('fallback path (distance unknown)', () => {
        it('returns FALLBACK_ETA_MIN when distance is null', () => {
            expect(estimateETA(null)).toBe(FALLBACK_ETA_MIN);
        });

        it('returns FALLBACK_ETA_MIN when distance is NaN', () => {
            expect(estimateETA(NaN)).toBe(FALLBACK_ETA_MIN);
        });

        it('returns FALLBACK_ETA_MIN when distance is Infinity', () => {
            expect(estimateETA(Infinity)).toBe(FALLBACK_ETA_MIN);
        });

        it('returns FALLBACK_ETA_MIN when distance is negative (sensor noise)', () => {
            expect(estimateETA(-1)).toBe(FALLBACK_ETA_MIN);
        });
    });

    describe('happy path (real distance)', () => {
        it('clamps a 0 km distance to MIN_ETA_MIN (not 0 minutes)', () => {
            // A provider standing right on the customer still needs >=
            // PICKUP_OVERHEAD_MIN to engage, then we clamp to MIN_ETA_MIN.
            expect(estimateETA(0)).toBe(MIN_ETA_MIN);
        });

        it('returns a sane minute count for a typical urban 5 km trip', () => {
            // 5 km / 30 km/h = 10 min + 1 min overhead = 11 min
            const expected = Math.round(
                (5 / URBAN_AVG_SPEED_KMH) * 60 + PICKUP_OVERHEAD_MIN
            );
            expect(estimateETA(5)).toBe(expected);
            expect(estimateETA(5)).toBeGreaterThan(MIN_ETA_MIN);
            expect(estimateETA(5)).toBeLessThan(MAX_ETA_MIN);
        });

        it('returns a monotonically increasing value for longer distances', () => {
            // Trust collapses if "10 km away" gives a LOWER ETA than
            // "1 km away" — this lock-in test is the audit's primary
            // failure-mode guard.
            const e1 = estimateETA(1);
            const e2 = estimateETA(5);
            const e3 = estimateETA(15);
            expect(e2).toBeGreaterThan(e1);
            expect(e3).toBeGreaterThan(e2);
        });

        it('clamps an absurd 9999 km distance to MAX_ETA_MIN', () => {
            // GPS jumps / wrong-hemisphere sensor glitches must not turn
            // into a 20000-minute customer-facing promise.
            expect(estimateETA(9999)).toBe(MAX_ETA_MIN);
        });
    });

    describe('determinism', () => {
        it('returns the same value for the same input across calls', () => {
            // The pre-fix random implementation would fail this.
            const first = estimateETA(7.5);
            const second = estimateETA(7.5);
            const third = estimateETA(7.5);
            expect(first).toBe(second);
            expect(second).toBe(third);
        });
    });
});
