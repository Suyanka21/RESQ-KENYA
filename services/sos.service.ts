/**
 * Phase 4 (audit-v2 §N-MED-7) — SOS event client wrapper.
 *
 * The customer-tabs `handleSosTrigger` calls this thin wrapper which
 * invokes the server callable `triggerEmergencySOS`. Failures are
 * logged but never thrown — the SOS dial path (Linking.openURL in
 * EmergencySOS.tsx) MUST work even when this function fails or the
 * network is down.
 *
 * Skills: API-and-Interface-Design (typed contract mirrored from
 * functions/src/users/sosEvents.ts), Security-and-Hardening (auth
 * required, never log raw GPS to the device console),
 * TRUSTLESS-AUDITOR (fail-open at the client so the dial works
 * regardless of server reachability).
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../config/firebase';

const functions = getFunctions(app, 'us-central1');

export type SosEventType = 'medical' | 'fire' | 'police';

export interface SosEventLocation {
    latitude: number;
    longitude: number;
    accuracy?: number;
    capturedAt?: number;
}

export interface RecordSosEventInput {
    type: SosEventType;
    location?: SosEventLocation | null;
}

export interface RecordSosEventResult {
    success: true;
    eventId: string;
}

const callable = httpsCallable<RecordSosEventInput, RecordSosEventResult>(
    functions,
    'triggerEmergencySOS'
);

/**
 * Record an SOS event server-side. Returns the event id on success.
 * On any failure, logs and returns null so the caller can still
 * dial the emergency line without blocking on the server.
 */
export async function recordSosEvent(
    type: SosEventType,
    location?: SosEventLocation | null
): Promise<RecordSosEventResult | null> {
    try {
        const result = await callable({
            type,
            ...(location ? { location } : {}),
        });
        return result.data;
    } catch (error) {
        // CodeRabbit feedback (PR #9): firebase/functions returns
        // FunctionsError objects with a `.code` (e.g.
        // `functions/unauthenticated`, `functions/resource-exhausted`
        // for the new SOS rate limit). Surfacing the code alongside
        // the message turns a generic "[sos] recordSosEvent failed"
        // log into actionable telemetry without leaking the GPS
        // payload.
        //
        // Skills: Debugging-and-Error-Recovery (preserve diagnostic
        // signal), TRUSTLESS-AUDITOR (silent SOS failures are exactly
        // the unrecoverable scenario).
        const message = error instanceof Error ? error.message : 'unknown';
        const code = (error as { code?: string } | null)?.code ?? 'unknown';
        console.warn(`[sos] recordSosEvent failed: code=${code} message=${message}`);
        return null;
    }
}
