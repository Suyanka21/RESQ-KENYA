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

/**
 * Minimum interval between two SOS events from the same authenticated
 * user. Below this threshold the second call is rejected with
 * `resource-exhausted` so a compromised client cannot flood
 * `sos_events`, the future contact-fanout worker, or downstream
 * pagers. The threshold is intentionally generous (real users tap
 * SOS once per genuine incident; 30s covers accidental double-taps
 * and post-failure retries without throttling legitimate use).
 *
 * Skills: Security-and-Hardening (least-rate-limit needed to defeat
 * an authenticated abuse vector), TRUSTLESS-AUDITOR (every
 * authenticated callable that writes user-visible state is rate-
 * limited per uid).
 */
const SOS_MIN_INTERVAL_MS = 30_000;

/**
 * Type guard for client-supplied location. Beyond the basic
 * `Number.isFinite` check, this rejects:
 *   - latitudes outside [-90, 90]
 *   - longitudes outside [-180, 180]
 *   - negative or non-finite `accuracy`
 *   - non-finite `capturedAt` (rejects NaN / Infinity / parsed-as-NaN
 *     ISO strings)
 *
 * The audit (CodeRabbit nitpick on lines 61-71) flagged the previous
 * `isFinite`-only validator as accepting out-of-range coordinates,
 * which would poison the downstream geohash + contact-fanout
 * pipelines.
 */
function isValidLocation(loc: unknown): loc is SosEventLocation {
    if (!loc || typeof loc !== 'object') return false;
    const l = loc as Record<string, unknown>;
    const lat = l['latitude'];
    const lng = l['longitude'];
    if (typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90) return false;
    if (typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180) return false;

    if ('accuracy' in l) {
        const acc = l['accuracy'];
        if (typeof acc !== 'number' || !Number.isFinite(acc) || acc < 0) return false;
    }
    if ('capturedAt' in l) {
        const captured = l['capturedAt'];
        if (typeof captured !== 'number' || !Number.isFinite(captured)) return false;
    }
    return true;
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

        // Per-user rate limit: reject if this user fired an SOS within
        // the last `SOS_MIN_INTERVAL_MS`. Real incidents do not repeat
        // sub-30s; anything that does is either accidental double-tap
        // or abuse. We rely on the `sos_events` write rules (server-
        // only) so this query is the authoritative gate.
        //
        // Skills: Security-and-Hardening (rate limit on auth'd state-
        // writing callable), TRUSTLESS-AUDITOR (anything touching
        // personal safety also needs to defend against denial-of-
        // service of the very service it provides).
        const recent = await db.collection('sos_events')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();
        if (!recent.empty) {
            const last = recent.docs[0].data();
            const lastCreatedAt = last.createdAt as admin.firestore.Timestamp | undefined;
            const lastMs = lastCreatedAt?.toMillis?.() ?? 0;
            if (lastMs > 0 && Date.now() - lastMs < SOS_MIN_INTERVAL_MS) {
                throw new functions.https.HttpsError(
                    'resource-exhausted',
                    'SOS rate limit: please wait before sending another emergency'
                );
            }
        }

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
