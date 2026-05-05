/**
 * ResQ Kenya - Firestore triggers for live request lifecycle.
 *
 * Phase 3 (Real-time tracking): wires the `requests` collection into the
 * Realtime Database so the customer can subscribe to a single tight
 * `activeRequests/{id}` node instead of polling Firestore for the
 * provider's location.
 *
 * Lifecycle:
 *   - On `pending → accepted`: copy the assigned provider's last known
 *     location into RTDB.
 *   - On `*  → completed | cancelled`: remove the RTDB node so the
 *     customer's listener cleans up.
 *
 * Skills: Security-and-Hardening (server-authoritative writes), API-and-
 * Interface-Design (single tight contract for the customer subscription),
 * Test-Driven Development (the helper `summariseStatusChange` is pure and
 * unit-testable).
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp();
}

type StatusChangeKind =
    | 'accepted'
    | 'completed'
    | 'cancelled'
    | 'no-op';

/**
 * Pure helper. Given the previous and current status of a request,
 * return what side-effect should run (or `'no-op'`).
 */
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
 * Firestore trigger on `requests/{requestId}` writes. Mirrors lifecycle
 * transitions into RTDB at `activeRequests/{requestId}`.
 */
export const onRequestStatusChange = functions.firestore
    .document('requests/{requestId}')
    .onUpdate(async (change, context) => {
        const requestId = context.params.requestId as string;
        const before = change.before.data() as { status?: string; providerId?: string } | undefined;
        const after = change.after.data() as {
            status?: string;
            providerId?: string;
            providerLocation?: { latitude: number; longitude: number };
            customerLocation?: { coordinates?: { latitude: number; longitude: number } };
        } | undefined;

        const kind = summariseStatusChange(before?.status, after?.status);
        if (kind === 'no-op') return null;

        const rtdb = admin.database();
        const rtdbRef = rtdb.ref(`activeRequests/${requestId}`);

        if (kind === 'completed' || kind === 'cancelled') {
            await rtdbRef.remove();
            return null;
        }

        // kind === 'accepted'
        let providerLocation: { latitude: number; longitude: number } | null = null;
        if (after?.providerId) {
            const providerSnap = await admin.firestore()
                .collection('providers').doc(after.providerId).get();
            const loc = providerSnap.data()?.availability?.currentLocation as
                | { latitude: number; longitude: number }
                | undefined;
            if (loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
                providerLocation = { latitude: loc.latitude, longitude: loc.longitude };
            }
        }

        await rtdbRef.set({
            requestId,
            providerId: after?.providerId ?? null,
            status: after?.status ?? null,
            providerLocation,
            customerLocation: after?.customerLocation?.coordinates ?? null,
            providerStale: false,
            updatedAt: admin.database.ServerValue.TIMESTAMP,
        });
        return null;
    });

/**
 * Daily cron: zero-out provider `earnings.today`. Runs at 00:05 Africa
 * /Nairobi so the day-boundary aligns with local time. Does NOT touch
 * weekly/monthly/all-time aggregates — those reset on their own
 * boundaries.
 */
export const resetDailyEarnings = functions.pubsub
    .schedule('every day 00:05')
    .timeZone('Africa/Nairobi')
    .onRun(async () => {
        const db = admin.firestore();
        const providers = await db.collection('providers')
            .where('earnings.today', '>', 0)
            .limit(500)
            .get();
        if (providers.empty) return null;
        const batch = db.batch();
        providers.docs.forEach((doc) => {
            batch.update(doc.ref, { 'earnings.today': 0 });
        });
        await batch.commit();
        console.log(`resetDailyEarnings: zeroed ${providers.size} providers`);
        return null;
    });
