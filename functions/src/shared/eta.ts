/**
 * Phase 4 (audit-v2 §N-HIGH-4) — distance-aware ETA.
 *
 * Pure helper: takes a real distance in km and returns an integer
 * minute estimate. Extracted from `functions/src/services/requests.ts`
 * into a standalone module so it can be unit-tested without spinning
 * up the Firebase admin SDK.
 *
 * The pre-fix helper returned `Math.floor(Math.random() * 12) + 8` —
 * a uniformly-distributed 8-20 minute integer with ZERO correlation to
 * provider distance, time of day, or traffic. The audit's documented
 * failure: a customer waiting at night is told "ETA 14 min" while the
 * provider is 40 km away. Trust collapses on the first observed
 * mismatch.
 *
 * Constants:
 *   URBAN_AVG_SPEED_KMH  — matches `functions/src/ai/dispatch.ts:115`.
 *   PICKUP_OVERHEAD_MIN  — minimum non-zero ETA even when the provider
 *                          is on top of the customer (engage time).
 *   MIN_ETA_MIN          — never display a sub-2-minute promise.
 *   MAX_ETA_MIN          — clamp so a GPS spike can't produce 9000 min.
 *
 * Skills: Source-Driven-Development (`geofire-common.distanceBetween`
 * docs), Test-Driven-Development (pure function → trivial unit tests),
 * Code-Review-and-Quality (named constants, clamp, traced fallback).
 */

export const URBAN_AVG_SPEED_KMH = 30;
export const PICKUP_OVERHEAD_MIN = 1;
export const MIN_ETA_MIN = 2;
export const MAX_ETA_MIN = 90;
export const FALLBACK_ETA_MIN = 12;

export function estimateETA(distanceKm: number | null): number {
    if (distanceKm === null || !Number.isFinite(distanceKm) || distanceKm < 0) {
        // Provider location not yet known. Use a stable midpoint of the
        // legacy 8-20 range so the caller gets a traceable fallback
        // rather than noise.
        return FALLBACK_ETA_MIN;
    }
    const travelMin = (distanceKm / URBAN_AVG_SPEED_KMH) * 60;
    const raw = Math.round(travelMin + PICKUP_OVERHEAD_MIN);
    return Math.min(MAX_ETA_MIN, Math.max(MIN_ETA_MIN, raw));
}
