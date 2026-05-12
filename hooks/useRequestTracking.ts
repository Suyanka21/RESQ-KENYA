// ResQ Kenya — useRequestTracking
//
// Phase 4 (audit-v2 §F-CRIT-2) — single source of truth for the
// customer-side tracking screens. Pre-fix each screen ran its own
// setTimeout and "auto-advanced" without ever talking to the
// backend, so the displayed status had no relation to the actual
// request row. This hook owns:
//
//   1. The Firestore subscription to `requests/{requestId}` via
//      `subscribeToRequest` (returns the canonical row).
//   2. The RTDB subscription to `activeRequests/{requestId}` via
//      `subscribeToProviderLocation` (returns provider GPS + ETA
//      once dispatch has assigned someone).
//   3. A `status` field that screens use to auto-navigate forward
//      when the backend transitions the row (see
//      `useStatusNavigation` below).
//
// Skills: Frontend-UI-Engineering (centralised state for a flow
// that spans 5 screens), API-and-Interface-Design (one hook
// contract; screens don't re-implement subscription logic),
// Code-Simplification (one cleanup path; no duplicate teardown
// bugs), TRUSTLESS-AUDITOR (assumes the backend may never write
// `accepted` — `useStatusNavigation` therefore stays on
// `searching` indefinitely instead of advancing on a timer).

import { useEffect, useState, useRef } from 'react';
import { router } from 'expo-router';
import type { ServiceRequest, GeoLocation } from '../types';
import { subscribeToRequest } from '../services/customer.service';
import { subscribeToProviderLocation } from '../services/realtime.service';

/**
 * Phase 4 (audit-v2 §N-MED-1) — `providerLocation` may be null
 * until the provider's first GPS push. The screen MUST render a
 * "locating provider…" placeholder rather than dereferencing
 * `.latitude` / `.longitude`.
 */
export interface RequestTrackingState {
    /** The Firestore source-of-truth row, or null while loading. */
    request: ServiceRequest | null;
    /** Provider's most recent GPS push, or null pre-first-push. */
    providerLocation: GeoLocation | null;
    /** ETA in seconds (RTDB seed value), or null if no provider. */
    eta: number | null;
    /** Distance in km from provider to customer, or null. */
    distance: number | null;
    /** True while the initial Firestore subscription is loading. */
    isLoading: boolean;
    /** Non-null if the subscription couldn't be established. */
    error: string | null;
}

export function useRequestTracking(requestId: string | undefined): RequestTrackingState {
    const [request, setRequest] = useState<ServiceRequest | null>(null);
    const [providerLocation, setProviderLocation] = useState<GeoLocation | null>(null);
    const [eta, setEta] = useState<number | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!requestId) {
            setError('Missing requestId — cannot subscribe to tracking.');
            setIsLoading(false);
            return;
        }

        let unsubRequest: (() => void) | undefined;
        let unsubLocation: (() => void) | undefined;

        try {
            unsubRequest = subscribeToRequest(requestId, (r) => {
                setRequest(r);
                setIsLoading(false);
            });
            unsubLocation = subscribeToProviderLocation(requestId, (data) => {
                if (data) {
                    setProviderLocation(data.location);
                    setEta(typeof data.eta === 'number' ? data.eta : null);
                    setDistance(typeof data.distance === 'number' ? data.distance : null);
                } else {
                    setProviderLocation(null);
                    setEta(null);
                    setDistance(null);
                }
            });
        } catch (e: any) {
            setError(e?.message || 'Failed to subscribe to tracking.');
            setIsLoading(false);
        }

        return () => {
            if (unsubRequest) unsubRequest();
            if (unsubLocation) unsubLocation();
        };
    }, [requestId]);

    return { request, providerLocation, eta, distance, isLoading, error };
}

/**
 * Phase 4 (audit-v2 §F-CRIT-2) — status-driven navigation. Each
 * tracking screen calls this with its own `expectedStatus` and the
 * route to advance to when the backend transitions PAST that
 * status. Replaces the pre-fix setTimeout-based "auto-advance".
 *
 * Status mapping (canonical):
 *   pending   → searching screen
 *   accepted  → en-route screen
 *   enroute   → en-route screen
 *   arrived   → arriving screen
 *   inProgress→ in-progress screen
 *   completed → complete screen
 *
 * The hook compares the live `request.status` against each
 * destination's threshold and replaces the route exactly once.
 * If the backend skips a state (e.g. provider goes accepted →
 * arrived without an enroute write), the screen still advances.
 */
const STATUS_TO_SCREEN: Record<string, string> = {
    pending: '/(customer)/request/tracking/searching',
    accepted: '/(customer)/request/tracking/en-route',
    enroute: '/(customer)/request/tracking/en-route',
    arrived: '/(customer)/request/tracking/arriving',
    inProgress: '/(customer)/request/tracking/in-progress',
    completed: '/(customer)/request/tracking/complete',
    cancelled: '/(customer)/request/tracking/complete',
};

export function useStatusNavigation(
    status: string | undefined,
    currentScreen: keyof typeof SCREEN_ORDER,
    requestId: string | undefined,
    extraParams: Record<string, string> = {}
): void {
    const navigated = useRef(false);

    useEffect(() => {
        if (!status || !requestId || navigated.current) return;
        const target = STATUS_TO_SCREEN[status];
        if (!target) return;

        // Only advance forward — never bounce backward (e.g. if the
        // user navigated manually).
        const currentOrder = SCREEN_ORDER[currentScreen] ?? 0;
        const targetOrder = SCREEN_ORDER[
            target.replace('/(customer)/request/tracking/', '') as keyof typeof SCREEN_ORDER
        ] ?? 0;
        if (targetOrder <= currentOrder) return;

        navigated.current = true;
        router.replace({
            pathname: target as any,
            params: { ...extraParams, requestId },
        });
    }, [status, requestId, currentScreen, extraParams]);
}

const SCREEN_ORDER = {
    searching: 1,
    'en-route': 2,
    arriving: 3,
    'in-progress': 4,
    complete: 5,
} as const;
