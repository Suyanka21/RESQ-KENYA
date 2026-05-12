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
 * Phase 4 (audit-v2 §N-CRIT-2 / §N-HIGH-8) — pure builder for the
 * `activeRequests/{requestId}` seed node.
 *
 * The RTDB rule at `database.rules.json:8` requires the node to expose
 * a `customerId` field so the customer's own read can be authorized
 * (`data.child('customerId').val() === auth.uid`). Before this commit
 * the trigger never wrote that field, so the customer's tracking
 * subscription was silently denied — an unrecoverable failure path
 * (audit-v2 §N-CRIT-2). The rules tests, in turn, seeded the node
 * via `withSecurityRulesDisabled` *with* a `customerId` — exercising
 * a state production never produced (audit-v2 §N-HIGH-8 / §X-2). The
 * fix on both is to flow the production seed shape through one
 * builder that is used by the trigger AND imported by the rules
 * tests.
 *
 * Source: Realtime Database security rules require `customerId` for
 * the per-user read, see
 * https://firebase.google.com/docs/database/security/rules-conditions
 *
 * Skills: Source-Driven Development (RTDB rule semantics from official
 * docs), API-and-Interface-Design (single source of truth for the
 * RTDB seed shape), TDD (helper is the unit-test surface).
 */
export interface ActiveRequestSeedInput {
    requestId: string;
    userId?: string | null;
    providerId?: string | null;
    status?: string | null;
    customerLocation?: { latitude: number; longitude: number } | null;
    providerLocation?: { latitude: number; longitude: number } | null;
}

export type ActiveRequestSeed = {
    requestId: string;
    customerId: string | null;
    providerId: string | null;
    status: string | null;
    customerLocation: { latitude: number; longitude: number } | null;
    providerLocation: { latitude: number; longitude: number } | null;
    providerStale: false;
};

export function buildActiveRequestSeed(input: ActiveRequestSeedInput): ActiveRequestSeed {
    const customerId =
        typeof input.userId === 'string' && input.userId.length > 0 ? input.userId : null;
    const providerId =
        typeof input.providerId === 'string' && input.providerId.length > 0 ? input.providerId : null;
    return {
        requestId: input.requestId,
        customerId,
        providerId,
        status: input.status ?? null,
        customerLocation: input.customerLocation ?? null,
        providerLocation: input.providerLocation ?? null,
        providerStale: false,
    };
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
            userId?: string;
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

        // (audit-v2 §N-CRIT-2) Build the seed node through the canonical
        // builder so it always carries the `customerId` field that the
        // RTDB rule predicates on. Server timestamp is appended after
        // the build because it's a sentinel value, not part of the
        // shape contract the rules tests assert.
        const seed = buildActiveRequestSeed({
            requestId,
            userId: after?.userId ?? null,
            providerId: after?.providerId ?? null,
            status: after?.status ?? null,
            customerLocation: after?.customerLocation?.coordinates ?? null,
            providerLocation,
        });
        const seedNode: Record<string, unknown> = {
            ...seed,
            updatedAt: admin.database.ServerValue.TIMESTAMP,
        };

        // Only fire on the `pending → accepted` transition (kind === 'accepted').
        // Use a transaction so we never stomp the live `providerLocation`
        // that `updateProviderLocation` writes continuously between
        // status transitions (CodeRabbit PR #3, comment 10).
        await rtdbRef.transaction((current: unknown) => {
            if (!current || typeof current !== 'object') {
                return seedNode;
            }
            const existing = current as { providerLocation?: unknown };
            if (existing.providerLocation) {
                // Keep the live location written by updateProviderLocation —
                // copy every field of seedNode except `providerLocation`.
                const merged: Record<string, unknown> = { ...(current as object) };
                for (const key of Object.keys(seedNode)) {
                    if (key !== 'providerLocation') {
                        merged[key] = seedNode[key];
                    }
                }
                return merged;
            }
            return { ...(current as object), ...seedNode };
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
