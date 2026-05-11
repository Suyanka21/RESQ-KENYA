/**
 * Phase 4 (audit-v2 §N-MED-7) — Server-side SOS event logging.
 *
 * Pre-fix: the SOS modal's countdown completed → client
 * `onEmergencyTrigger(type)` handler was `console.log(...)` only.
 * There was no server record, no notification to emergency contacts,
 * no GPS pin sent anywhere, no escalation. The SOS button was a
 * glorified speed-dial.
 *
 * This callable is the FIRST tranche of the audit's recommended fix:
 *   (a) write a `sos_events/{id}` doc with the user's last GPS  ✓
 *   (b) [DEFERRED] FCM to listed emergency contacts
 *   (c) [DEFERRED] auto-create `requests/{id}` of type='ambulance'
 *       when `type==='medical'`
 *
 * The client still dials the configured emergency line via
 * `Linking.openURL` (that part is unchanged — it must work even when
 * the function call fails). The function call is fire-and-forget
 * from the client's perspective so a network blip never blocks the
 * dial.
 *
 * Skills: Security-and-Hardening (auth required; least privilege —
 * caller can only write the doc, never read others), TRUSTLESS-
 * AUDITOR (anything touching personal safety escalates to critical:
 * the function is fail-open at the client (call dialler regardless)
 * but fail-closed on the server (rejects unauthenticated callers)),
 * API-and-Interface-Design (typed input, typed result envelope),
 * Incremental-Implementation (event log first, contact-fanout next).
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();

export type SosEventType = 'medical' | 'fire' | 'police';

export interface SosEventLocation {
    latitude: number;
    longitude: number;
    accuracy?: number;
    /** Wall-clock at the device when the fix was taken. */
    capturedAt?: number;
}

export interface TriggerEmergencySosInput {
    type: SosEventType;
    location?: SosEventLocation;
}

export interface TriggerEmergencySosResult {
    success: true;
    eventId: string;
}

const VALID_TYPES: ReadonlySet<SosEventType> = new Set(['medical', 'fire', 'police']);

/** Type guard for client-supplied location. */
function isValidLocation(loc: unknown): loc is SosEventLocation {
    if (!loc || typeof loc !== 'object') return false;
    const l = loc as Record<string, unknown>;
    return (
        typeof l['latitude'] === 'number' &&
        Number.isFinite(l['latitude']) &&
        typeof l['longitude'] === 'number' &&
        Number.isFinite(l['longitude'])
    );
}

export const triggerEmergencySOS = functions.https.onCall(
    async (data: unknown, context): Promise<TriggerEmergencySosResult> => {
        // Boundary: must be authenticated. Unauthenticated SOS calls are
        // a spam vector (the doc would be ownerless and contact-fanout
        // would have no target).
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User must be authenticated to record an SOS event'
            );
        }

        const input = (data ?? {}) as Partial<TriggerEmergencySosInput>;

        if (typeof input.type !== 'string' || !VALID_TYPES.has(input.type as SosEventType)) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                `type must be one of ${[...VALID_TYPES].join(', ')}`
            );
        }

        // Location is OPTIONAL — the client may legitimately have no
        // GPS fix (permission denied, indoors). Server records what it
        // has; the deferred contact-fanout can degrade gracefully.
        const location = isValidLocation(input.location) ? input.location : null;

        const userId = context.auth.uid;
        const eventRef = db.collection('sos_events').doc();

        await eventRef.set({
            userId,
            type: input.type,
            location, // may be null
            // Server-stamped timestamp is authoritative for ordering /
            // analytics. The client's `capturedAt` (if any) lives
            // inside `location`.
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            // Status machine for the deferred contact-fanout worker.
            // Stays `pending` until a worker either dispatches FCM
            // to contacts (then `notified`) or skips (no contacts).
            status: 'pending',
        });

        console.log(
            `[sos] event=${eventRef.id} type=${input.type} userId=${userId} ` +
            `hasLocation=${location !== null}`
        );

        return { success: true, eventId: eventRef.id };
    }
);
