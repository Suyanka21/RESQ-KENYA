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

export { summariseStatusChange } from '../shared/status';
import { summariseStatusChange } from '../shared/status';

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

        // Only fire on the `pending → accepted` transition (kind === 'accepted').
        // Use update() with explicit paths instead of set() so we never
        // stomp the live `providerLocation` / `updatedAt` that
        // `updateProviderLocation` writes continuously between status
        // transitions (CodeRabbit PR #3, comment 10).
        const seedNode: Record<string, unknown> = {
            requestId,
            providerId: after?.providerId ?? null,
            status: after?.status ?? null,
            customerLocation: after?.customerLocation?.coordinates ?? null,
            providerStale: false,
            updatedAt: admin.database.ServerValue.TIMESTAMP,
        };
        // Only seed providerLocation if the RTDB node doesn't already
        // have a fresher one written by updateProviderLocation. We do
        // this with a transaction so the read+write is atomic.
        await rtdbRef.transaction((current: unknown) => {
            if (!current || typeof current !== 'object') {
                return { ...seedNode, providerLocation };
            }
            const existing = current as { providerLocation?: unknown };
            if (existing.providerLocation) {
                // Keep the live location written by updateProviderLocation.
                return { ...(current as object), ...seedNode };
            }
            return { ...(current as object), ...seedNode, providerLocation };
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
        // Paginate so we cover ALL providers with non-zero earnings,
        // not just the first 500. Firestore batched writes have a
        // 500-write limit, so we commit each page and then advance the
        // cursor (CodeRabbit PR #3, comment 11).
        const PAGE_SIZE = 400;
        const db = admin.firestore();
        let totalZeroed = 0;
        let cursor: FirebaseFirestore.QueryDocumentSnapshot | null = null;
        for (let safety = 0; safety < 1000; safety++) {
            let q = db.collection('providers')
                .where('earnings.today', '>', 0)
                .orderBy('earnings.today')
                .limit(PAGE_SIZE);
            if (cursor) q = q.startAfter(cursor);
            const page = await q.get();
            if (page.empty) break;
            const batch = db.batch();
            page.docs.forEach((doc) => batch.update(doc.ref, { 'earnings.today': 0 }));
            await batch.commit();
            totalZeroed += page.size;
            if (page.size < PAGE_SIZE) break;
            cursor = page.docs[page.size - 1] ?? null;
        }
        console.log(`resetDailyEarnings: zeroed ${totalZeroed} providers`);
        return null;
    });
