/**
 * Phase 4 (audit-v2 §N-MED-3 + §N-MED-9) — dispatch radius policy.
 *
 * Pre-fix:
 *   - `notifyNearbyProviders` had a hardcoded `radiusKm = 15` for
 *     EVERY service type (N-MED-3). A medical request needs a much
 *     wider net than a fuel-delivery request, but they got the same
 *     bucket.
 *   - The retry worker (N-HIGH-7) used the same fixed radius on each
 *     attempt (N-MED-9). Real-world dispatch widens progressively
 *     until it either finds someone or declares "no providers".
 *
 * This module owns the per-service base radius and the widening
 * schedule. The dispatch caller passes the request's `serviceType`
 * and `retryCount`, and gets back the radius for THIS attempt.
 *
 * Skills: API-and-Interface-Design (single source of truth for the
 * radius policy; never derive radii ad-hoc at call sites),
 * Trustless-System-Auditor (medical = personal safety = the audit's
 * highest weight; medical baseline + ceiling are higher), Code-
 * Simplification (one function, pure, easily unit-testable).
 */

import type { ServiceType } from './api';

/**
 * Baseline radius (first attempt) per service type.
 *
 * Ambulance: 20 km — ambulances are sparse; bias toward catching one
 * even if the trip is longer. (Personal safety.)
 *
 * Towing: 15 km — the original default; moderate density.
 *
 * Fuel / battery / tire / diagnostics: 10 km — the provider needs
 * to be local enough that the trip is economical for them;
 * otherwise they ignore the FCM and the customer waits.
 */
const BASE_RADIUS_KM: Record<ServiceType, number> = {
    ambulance: 20,
    towing: 15,
    fuel: 10,
    battery: 10,
    tire: 10,
    diagnostics: 10,
};

/** Fall-back when an unknown service type sneaks in. */
const FALLBACK_BASE_RADIUS_KM = 15;

/**
 * Widening step per retry, additive (not multiplicative — multiplicative
 * gets huge fast on a phone-data-sized FCM radius).
 *
 * Retry 1: +10 km
 * Retry 2: +20 km
 * Retry 3+: +30 km (capped by `MAX_RADIUS_KM`)
 */
const RETRY_WIDENING_KM = [0, 10, 20, 30] as const;

/**
 * Hard ceiling. A 90 km dispatch on Nairobi traffic is already
 * unrealistic; widening past this is moot.
 */
export const MAX_RADIUS_KM = 90;

/**
 * Resolve the radius for a single dispatch attempt.
 *
 * @param serviceType - request's service type
 * @param retryCount - 0 for first attempt, 1+ for retries (the
 *                     N-HIGH-7 retry worker increments this)
 */
export function resolveDispatchRadiusKm(
    serviceType: string,
    retryCount: number
): number {
    const base = (BASE_RADIUS_KM as Record<string, number>)[serviceType]
        ?? FALLBACK_BASE_RADIUS_KM;

    const safeRetry = Number.isFinite(retryCount) && retryCount > 0
        ? Math.floor(retryCount)
        : 0;
    const step = RETRY_WIDENING_KM[Math.min(safeRetry, RETRY_WIDENING_KM.length - 1)];

    return Math.min(MAX_RADIUS_KM, base + step);
}
