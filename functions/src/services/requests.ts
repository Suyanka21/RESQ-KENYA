/**
 * ResQ Kenya - Service Request Cloud Functions
 * Handles service request creation, matching, and lifecycle
 *
 * Phase 2: Contract Stabilization. `createServiceRequest` now validates the
 * shared `CreateServiceRequestInput` contract, enforces an `idempotencyKey`
 * for de-duplication, and consumes `quoteId` (when provided) atomically so
 * pricing cannot drift.
 *
 * Skills: API-and-Interface-Design (single canonical write path,
 * `CallResult` envelope), Security-and-Hardening (boundary validation,
 * authorization on status transitions), Test-Driven Development (helpers
 * are pure and unit-testable).
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as geofire from 'geofire-common';
import {
    type CreateServiceRequestInput,
    type CreateServiceRequestOutput,
    err,
    isValidCoordinates,
    isValidIdempotencyKey,
    isValidServiceType,
    ok,
} from '../shared/api';

// Initialize if not already done
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

/* ───────────────────── Pure validation helpers ───────────────────── */

export { VALID_STATUS_TRANSITIONS, isAllowedStatusTransition } from '../shared/status';
import { planRequestStatusUpdate } from '../shared/status';
import { idempotencyDocId as sharedIdempotencyDocId } from '../shared/crypto';
import { estimateETA } from '../shared/eta';
import {
    planAcceptServiceRequest,
    type AcceptRequestRejectionCode,
} from '../shared/acceptRequestPlanner';
import { resolveDispatchRadiusKm } from '../shared/dispatchRadius';

/** Shape-check the create-request input. Returns null if valid. */
export function validateCreateRequestInput(
    data: unknown
): null | { errorCode: 'invalid_argument'; message: string } {
    if (!data || typeof data !== 'object') {
        return { errorCode: 'invalid_argument', message: 'Missing payload' };
    }
    const input = data as Partial<CreateServiceRequestInput>;
    if (!isValidServiceType(input.serviceType)) {
        return { errorCode: 'invalid_argument', message: 'Invalid serviceType' };
    }
    if (!input.customerLocation || typeof input.customerLocation !== 'object') {
        return { errorCode: 'invalid_argument', message: 'Missing customerLocation' };
    }
    if (!isValidCoordinates(input.customerLocation.coordinates)) {
        return { errorCode: 'invalid_argument', message: 'Invalid coordinates' };
    }
    if (typeof input.customerLocation.address !== 'string' || input.customerLocation.address.length === 0) {
        return { errorCode: 'invalid_argument', message: 'Missing address' };
    }
    if (!isValidIdempotencyKey(input.idempotencyKey)) {
        return { errorCode: 'invalid_argument', message: 'Invalid or missing idempotencyKey' };
    }
    if (input.quoteId !== undefined && (typeof input.quoteId !== 'string' || input.quoteId.length === 0)) {
        return { errorCode: 'invalid_argument', message: 'Invalid quoteId' };
    }
    return null;
}

/**
 * Cloud Function: Create Service Request
 *
 * Single canonical write path for service requests. Returns a discriminated
 * `CallResult<T,E>` envelope (Phase 2 contract). Enforces an
 * `idempotencyKey` so client retries cannot create duplicate requests, and
 * consumes `price_quotes/{quoteId}` atomically when supplied so pricing
 * cannot drift from the server quote.
 *
 * @returns {Promise<CreateServiceRequestOutput>} `{ ok: true, data: { requestId } }`
 *   on success, or `{ ok: false, errorCode, message }` on rejection.
 */
export const createServiceRequest = functions.https.onCall(
    async (data: unknown, context): Promise<CreateServiceRequestOutput> => {
        if (!context.auth) {
            return err('unauthenticated', 'User must be authenticated');
        }

        const validationError = validateCreateRequestInput(data);
        if (validationError) {
            return err(validationError.errorCode, validationError.message);
        }

        const input = data as CreateServiceRequestInput;
        const userId = context.auth.uid;

        try {
            const { latitude, longitude } = input.customerLocation.coordinates;
            const geohash = geofire.geohashForLocation([latitude, longitude]);

            // Idempotency: hash of (idempotencyKey, uid) becomes the document id
            // so retries return the same request rather than creating a new one.
            const requestId = idempotencyDocId(userId, input.idempotencyKey);
            const requestRef = db.collection('requests').doc(requestId);
            const quoteRef = input.quoteId
                ? db.collection('price_quotes').doc(input.quoteId)
                : null;

            const txResult = await db.runTransaction<
                | { kind: 'created' }
                | { kind: 'duplicate' }
                | { kind: 'invalid_quote' }
                | { kind: 'quote_expired' }
            >(async (transaction) => {
                const existing = await transaction.get(requestRef);
                if (existing.exists) {
                    return { kind: 'duplicate' };
                }

                let resolvedPricing = input.pricing ?? {};
                if (quoteRef) {
                    const quoteSnap = await transaction.get(quoteRef);
                    if (!quoteSnap.exists) {
                        return { kind: 'invalid_quote' };
                    }
                    const quote = quoteSnap.data() as {
                        used?: boolean;
                        validUntil?: admin.firestore.Timestamp;
                        breakdown?: Record<string, unknown>;
                        userId?: string;
                    };
                    if (quote.used) {
                        return { kind: 'invalid_quote' };
                    }
                    if (quote.userId && quote.userId !== userId) {
                        return { kind: 'invalid_quote' };
                    }
                    if (quote.validUntil && quote.validUntil.toMillis() < Date.now()) {
                        return { kind: 'quote_expired' };
                    }
                    if (quote.breakdown) {
                        resolvedPricing = quote.breakdown as Record<string, unknown>;
                    }
                    transaction.update(quoteRef, {
                        used: true,
                        usedAt: admin.firestore.FieldValue.serverTimestamp(),
                        usedBy: requestId,
                    });
                }

                transaction.set(requestRef, {
                    id: requestId,
                    userId,
                    serviceType: input.serviceType,
                    status: 'pending',
                    customerLocation: input.customerLocation,
                    serviceDetails: input.serviceDetails ?? {},
                    pricing: resolvedPricing,
                    quoteId: input.quoteId ?? null,
                    idempotencyKey: input.idempotencyKey,
                    geohash,
                    payment: { method: 'mpesa', status: 'pending' },
                    timeline: {
                        requestedAt: admin.firestore.FieldValue.serverTimestamp(),
                    },
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                return { kind: 'created' };
            });

            if (txResult.kind === 'duplicate') {
                // Idempotent retry: return the same id without re-notifying.
                return ok({ requestId });
            }
            if (txResult.kind === 'invalid_quote') {
                return err('invalid_quote', 'Quote is invalid, used, or not yours');
            }
            if (txResult.kind === 'quote_expired') {
                return err('quote_expired', 'Quote has expired; request a new one');
            }

            await notifyNearbyProviders(requestId, input.serviceType, latitude, longitude);

            return ok({ requestId });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('Create request error:', message);
            return err('internal', 'Failed to create request');
        }
    }
);

/**
 * Build a deterministic doc id from a per-user idempotency key.
 *
 * Using a deterministic id means two concurrent callers with the same key
 * race on `transaction.set()` rather than producing two distinct docs.
 */
export function idempotencyDocId(userId: string, idempotencyKey: string): string {
    // Firestore doc ids cannot contain `/` and have a 1500-byte limit. We
    // hash here using a stable hex digest so the resulting id is short and
    // safe for any input. Implementation lives in `../shared/crypto` so it
    // can be unit-tested without firebase imports.
    return sharedIdempotencyDocId(userId, idempotencyKey);
}

/**
 * Maximum number of provider docs to consider per dispatch attempt. Caps
 * Firestore reads (B-HIGH-5) and bounds memory growth in cities with
 * dense provider coverage. Sized so we can still saturate FCM batches
 * (≤500 per `sendEachForMulticast` call) while leaving headroom.
 */
const NEARBY_PROVIDER_LIMIT = 50;

/**
 * Possible values for `requests.{id}.dispatch.status`. Surfaced as a
 * value-typed const + `as const` tuple so the trigger that resumes a
 * stuck dispatch (future Cloud Tasks worker) can pattern-match.
 */
export const DISPATCH_STATUS = {
    Pending: 'pending',
    Notified: 'notified',
    NoProviders: 'no_providers',
    Failed: 'failed',
} as const;
export type DispatchStatus = typeof DISPATCH_STATUS[keyof typeof DISPATCH_STATUS];

/**
 * Phase 3 (B-HIGH-4 / B-HIGH-5) — bounded dispatcher with explicit state.
 *
 * Persists `requests/{id}.dispatch = { status, retryCount, lastAttemptAt,
 * notifiedCount }` so a future scheduled worker can pick up rows in
 * `pending` / `failed` states for retry. Read budget is capped via
 * `NEARBY_PROVIDER_LIMIT`. Errors are no longer silently swallowed —
 * we mark `failed` and bump `retryCount` so the request is observable.
 *
 * Skills: API-and-Interface-Design (explicit state model rather than
 * implicit silence), Security-and-Hardening (all server writes,
 * never trust client to seed dispatch fields).
 */
async function notifyNearbyProviders(
    requestId: string,
    serviceType: string,
    latitude: number,
    longitude: number,
    /**
     * Phase 4 (audit-v2 §N-MED-3 + §N-MED-9) — `retryCount` defaults
     * to 0 (first attempt). The retry worker passes the request's
     * `dispatch.retryCount` so the radius widens on each attempt.
     * The PER-SERVICE baseline + widening schedule lives in
     * `../shared/dispatchRadius.ts`. Do not hardcode radii here.
     */
    retryCount: number = 0
): Promise<void> {
    const requestRef = db.collection('requests').doc(requestId);
    const now = admin.firestore.FieldValue.serverTimestamp();
    const radiusKm = resolveDispatchRadiusKm(serviceType, retryCount);

    try {
        const center = [latitude, longitude] as [number, number];
        const radiusM = radiusKm * 1000;
        const bounds = geofire.geohashQueryBounds(center, radiusM);

        const providerTokens: string[] = [];
        const seenDocIds = new Set<string>();

        for (const bound of bounds) {
            if (providerTokens.length >= NEARBY_PROVIDER_LIMIT) break;

            const q = db.collection('providers')
                .where('serviceTypes', 'array-contains', serviceType)
                .where('availability.isOnline', '==', true)
                .where('verificationStatus', '==', 'verified')
                .orderBy('geohash')
                .startAt(bound[0])
                .endAt(bound[1])
                .limit(NEARBY_PROVIDER_LIMIT);

            const snapshot = await q.get();

            for (const doc of snapshot.docs) {
                if (seenDocIds.has(doc.id)) continue;
                seenDocIds.add(doc.id);

                const data = doc.data();
                const providerLocation = data.availability?.currentLocation;
                if (!providerLocation || typeof data.fcmToken !== 'string') continue;

                const distance = geofire.distanceBetween(
                    center,
                    [providerLocation.latitude, providerLocation.longitude]
                );
                if (distance <= radiusKm) {
                    providerTokens.push(data.fcmToken);
                    if (providerTokens.length >= NEARBY_PROVIDER_LIMIT) break;
                }
            }
        }

        if (providerTokens.length === 0) {
            // CodeRabbit feedback (PR #9): incrementing retryCount by 0
            // was a no-op that left stuck rows churning forever at the
            // same radius. Increment by 1 so the retry worker can
            // observe progress and eventually flip the row to
            // `cancelled` once DISPATCH_MAX_RETRIES is reached.
            await requestRef.update({
                'dispatch.status': DISPATCH_STATUS.NoProviders,
                'dispatch.notifiedCount': 0,
                'dispatch.lastAttemptAt': now,
                'dispatch.radiusKm': radiusKm,
                'dispatch.retryCount': admin.firestore.FieldValue.increment(1),
            });
            console.log(
                `[dispatch] no_providers requestId=${requestId} ` +
                `serviceType=${serviceType} radiusKm=${radiusKm}`
            );
            return;
        }

        const message = {
            notification: {
                title: 'New Service Request! 🚗',
                body: `A customer needs ${serviceType} assistance nearby`,
            },
            data: {
                type: 'new_request',
                requestId,
                serviceType,
            },
        };

        // FCM cap is 500 tokens per multicast; we already cap at
        // NEARBY_PROVIDER_LIMIT, but keep the chunking for safety.
        const batches: Promise<unknown>[] = [];
        for (let i = 0; i < providerTokens.length; i += 500) {
            const batch = providerTokens.slice(i, i + 500);
            batches.push(
                admin.messaging().sendEachForMulticast({
                    tokens: batch,
                    ...message,
                })
            );
        }
        await Promise.all(batches);

        await requestRef.update({
            'dispatch.status': DISPATCH_STATUS.Notified,
            'dispatch.notifiedCount': providerTokens.length,
            'dispatch.lastAttemptAt': now,
            'dispatch.radiusKm': radiusKm,
            'dispatch.retryCount': admin.firestore.FieldValue.increment(0),
        });
        console.log(
            `[dispatch] notified=${providerTokens.length} ` +
            `requestId=${requestId} radiusKm=${radiusKm}`
        );
    } catch (dispatchError: unknown) {
        const message = dispatchError instanceof Error ? dispatchError.message : 'unknown';
        console.error(
            `[dispatch] failed requestId=${requestId} reason=${message}`
        );
        // Best-effort: persist the failure so a retry worker can pick it
        // up. Do not re-throw — a failed dispatch must not undo the
        // already-committed `requests/{id}` create.
        try {
            await requestRef.update({
                'dispatch.status': DISPATCH_STATUS.Failed,
                'dispatch.lastAttemptAt': now,
                'dispatch.retryCount': admin.firestore.FieldValue.increment(1),
                'dispatch.lastError': message.slice(0, 500),
            });
        } catch (persistError) {
            console.error('[dispatch] failed to persist failure marker', persistError);
        }
    }
}

/**
 * Phase 4 (audit-v2 §N-HIGH-7) — dispatch retry worker.
 *
 * `notifyNearbyProviders` already persists a structured failure
 * marker (`dispatch.status = 'failed' | 'no_providers'`,
 * `dispatch.retryCount`, `dispatch.lastError`) so a future scheduled
 * worker can pick up the row and try again. The pre-fix audit found
 * NO such worker — a request that landed in `dispatch.status='failed'`
 * was permanently stuck, visible only as "still searching" forever
 * to the customer, with no notification, no retry, no surfaced error.
 *
 * This worker:
 *   - runs every 2 minutes (Firebase Scheduler minimum granularity)
 *   - scans `requests` where `dispatch.status in ['failed','no_providers']`
 *     AND `dispatch.retryCount < DISPATCH_MAX_RETRIES` AND request
 *     `status === 'pending'` (still un-accepted)
 *   - re-runs `notifyNearbyProviders` for each row, which will either
 *     succeed (status → 'notified') or bump `retryCount` again
 *   - after `DISPATCH_MAX_RETRIES`, transitions the request to a
 *     terminal `cancelled` status with a customer-facing notification
 *     so the user is no longer left stranded
 *   - paginates so a backlog cannot exceed Firestore's per-query cost
 *
 * Limit: this is a *retry* worker, not a Cloud Tasks queue. Per-row
 * backoff is implicit (the worker only re-runs once per 2-minute tick).
 * A future Cloud Tasks implementation can extend `DISPATCH_STATUS`
 * with a `pending_retry` state and use scheduled-time queueing.
 *
 * Skills: Source-Driven-Development (Firebase Scheduled Functions
 * docs: https://firebase.google.com/docs/functions/schedule-functions),
 * Security-and-Hardening (bounded retries + terminal cancellation so
 * a request never silently hangs), Code-Review-and-Quality (single
 * source of truth for max retries + customer-facing terminal state).
 */
const DISPATCH_MAX_RETRIES = 3;
const DISPATCH_RETRY_PAGE_SIZE = 20;
const DISPATCH_RETRY_MAX_PAGES = 10;

export const retryFailedDispatches = functions.pubsub
    .schedule('every 2 minutes')
    .onRun(async () => {
        // Query for rows that still need a provider, where the
        // dispatcher previously failed (or simply found nobody) AND
        // we haven't burnt our retry budget yet.
        //
        // We scan 'failed' and 'no_providers' separately because
        // Firestore's `in` operator is fine but combining with another
        // `<` requires the right composite index; doing two simple
        // queries keeps the deploy path index-free.
        const retryableStatuses = [
            DISPATCH_STATUS.Failed,
            DISPATCH_STATUS.NoProviders,
        ];

        let totalRetried = 0;
        let totalCancelled = 0;

        for (const status of retryableStatuses) {
            let pages = 0;
            // CodeRabbit feedback (PR #9): the loop previously kept
            // re-fetching the same 20 rows because there was no
            // pagination cursor. With the retryCount-increment fix
            // above the rows do eventually drain (rolling off the
            // status filter once they hit MAX_RETRIES and flip to
            // 'cancelled'), but driving pagination via `startAfter`
            // is the canonical Firestore pattern and guarantees
            // forward progress even before retryCount changes
            // propagate.
            //
            // Skills: Source-Driven Development (Firestore pagination
            // docs), TRUSTLESS-AUDITOR (a worker that re-processes
            // the same rows is the textbook DoS-on-self pattern).
            let cursor: FirebaseFirestore.QueryDocumentSnapshot | null = null;
            while (pages < DISPATCH_RETRY_MAX_PAGES) {
                let query = db.collection('requests')
                    .where('status', '==', 'pending')
                    .where('dispatch.status', '==', status)
                    .orderBy('createdAt', 'asc')
                    .limit(DISPATCH_RETRY_PAGE_SIZE);
                if (cursor) {
                    query = query.startAfter(cursor);
                }
                const page = await query.get();

                if (page.empty) break;

                cursor = page.docs[page.docs.length - 1];

                // CodeRabbit feedback (post-merge PR #9): the inner
                // loop previously processed each row sequentially via
                // a series of `await`s, so a busy 2-minute tick (20
                // rows/page × 2 status buckets × ~hundreds of ms per
                // dispatch including Firestore reads + FCM multicast)
                // could blow past the function's wall-clock budget.
                // Drive each row through `processRetryDoc` and run
                // them in bounded chunks of `RETRY_CONCURRENCY` so we
                // get parallelism without thundering Firestore /
                // exhausting FCM quota.
                //
                // The per-row work is independent (no shared mutable
                // state besides the two integer counters, which we
                // fold-back outside the chunk), so this is safe.
                //
                // Skills: Performance-Optimization (bounded
                // parallelism instead of premature serialisation),
                // API-and-Interface-Design (per-row helper has a
                // small, testable signature).
                const chunked: Array<FirebaseFirestore.QueryDocumentSnapshot[]> = [];
                for (let i = 0; i < page.docs.length; i += RETRY_CONCURRENCY) {
                    chunked.push(page.docs.slice(i, i + RETRY_CONCURRENCY));
                }
                for (const chunk of chunked) {
                    const results = await Promise.all(
                        chunk.map((doc) => processRetryDoc(doc))
                    );
                    for (const result of results) {
                        if (result === 'retried') totalRetried += 1;
                        else if (result === 'cancelled') totalCancelled += 1;
                    }
                }

                pages += 1;
                if (page.size < DISPATCH_RETRY_PAGE_SIZE) break;
            }
        }

        if (totalRetried > 0 || totalCancelled > 0) {
            // CodeRabbit feedback (post-merge PR #9): structured
            // single-line log so the Cloud Logging filter
            // `[dispatch.retry]` surfaces this worker's behaviour
            // without parsing free text. A future operator can grep
            // / build a Cloud Monitoring alert on `cancelled` > 0.
            console.log(
                `[dispatch.retry] tick complete retried=${totalRetried} cancelled=${totalCancelled}`
            );
        }
        return null;
    });

/**
 * Bounded concurrency for the retry worker's per-row work. Sized so
 * the function fits comfortably inside the 60s default Cloud
 * Functions timeout even when each row needs Firestore reads + FCM
 * multicast. See CodeRabbit post-merge feedback on PR #9.
 */
const RETRY_CONCURRENCY = 5;

/**
 * Per-row handler for `retryFailedDispatches`. Returns a tag
 * describing the outcome so the caller can accumulate counters
 * without sharing mutable state across the parallel branch.
 *
 * Extracted from the inner page-loop so we can drive it through a
 * bounded `Promise.all` instead of awaiting one row at a time.
 */
async function processRetryDoc(
    doc: FirebaseFirestore.QueryDocumentSnapshot
): Promise<'retried' | 'cancelled' | 'skipped'> {
    const data = doc.data();
    const retryCount = (data.dispatch?.retryCount ?? 0) as number;
    const requestId = doc.id;
    const serviceType =
        typeof data.serviceType === 'string' ? data.serviceType : 'unknown';

    if (retryCount >= DISPATCH_MAX_RETRIES) {
        // Terminal: transition to 'cancelled' so the customer's
        // listener can flip the UI to a recoverable error state
        // rather than "still searching" forever.
        try {
            // CodeRabbit feedback (post-merge PR #9): every other
            // transition in this file stamps `timeline.${status}At`
            // (see updateRequestStatus, planRequestStatusUpdate,
            // acceptServiceRequest). Writing a root-level
            // `cancelledAt` here would diverge the schema between
            // customer- and retry-worker-cancelled rows. Stamp
            // `timeline.cancelledAt` + `updatedAt` so UI code
            // reading `request.timeline.*` sees one consistent
            // contract.
            await doc.ref.update({
                status: 'cancelled',
                'dispatch.status': DISPATCH_STATUS.Failed,
                cancellationReason: 'no_provider_found',
                'timeline.cancelledAt':
                    admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Structured log so a future Cloud Monitoring alert
            // can target `dispatch.retry cancelled` directly.
            console.log(
                `[dispatch.retry] cancelled reason=max_retries ` +
                `requestId=${requestId} serviceType=${serviceType}`
            );

            // Best-effort customer notification. Wrapped so a
            // missing/stale FCM token does not block other rows.
            try {
                const userDoc = await db.collection('users')
                    .doc(data.userId)
                    .get();
                const fcmToken = userDoc.data()?.fcmToken;
                if (fcmToken) {
                    await admin.messaging().send({
                        token: fcmToken,
                        notification: {
                            title: 'No provider available',
                            body:
                                'We could not find a provider for your request. ' +
                                'Please try again or contact support.',
                        },
                        data: {
                            type: 'request_cancelled',
                            requestId,
                            reason: 'no_provider_found',
                        },
                    });
                }
            } catch (notifyError) {
                // CodeRabbit feedback (post-merge PR #9): catch
                // `messaging/registration-token-not-registered` so a
                // dead token clears itself on first cancellation
                // instead of generating one noisy warn per tick.
                // Using `set({...}, {merge:true})` mirrors the
                // upsert convention from fcmToken.ts so it never
                // throws on a missing user doc.
                const code = (notifyError as { code?: string } | null)?.code;
                if (code === 'messaging/registration-token-not-registered') {
                    try {
                        await db.collection('users').doc(data.userId).set(
                            {
                                fcmToken: admin.firestore.FieldValue.delete(),
                                fcmTokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
                            },
                            { merge: true }
                        );
                        console.log(
                            `[dispatch.retry] cleared stale FCM token ` +
                            `userId=${data.userId} requestId=${requestId}`
                        );
                    } catch (clearError) {
                        console.warn(
                            `[dispatch.retry] failed to clear stale FCM token ` +
                            `userId=${data.userId}`,
                            clearError
                        );
                    }
                } else {
                    console.warn(
                        `[dispatch.retry] notify failed requestId=${requestId} code=${code ?? 'unknown'}`,
                        notifyError
                    );
                }
            }
        } catch (cancelError) {
            console.error(
                `[dispatch.retry] cancel failed requestId=${requestId}`,
                cancelError
            );
        }
        return 'cancelled';
    }

    // Retry path: re-run the dispatcher. It will bump retryCount
    // via FieldValue.increment(1) on its own failure path, or flip
    // status → 'notified' on success.
    const coords = data.customerLocation?.coordinates;
    if (
        !coords ||
        typeof coords.latitude !== 'number' ||
        typeof coords.longitude !== 'number' ||
        typeof data.serviceType !== 'string'
    ) {
        console.warn(
            `[dispatch.retry] skipped reason=missing_coords requestId=${requestId}`
        );
        return 'skipped';
    }
    // Phase 4 (audit-v2 §N-MED-9) — pass the row's current
    // retryCount so dispatch widens its radius on each attempt per
    // the policy in `../shared/dispatchRadius.ts`.
    const currentRetryCount = typeof data.dispatch?.retryCount === 'number'
        ? data.dispatch.retryCount
        : 0;
    console.log(
        `[dispatch.retry] attempted requestId=${requestId} ` +
        `serviceType=${serviceType} attemptNo=${currentRetryCount + 1}`
    );
    await notifyNearbyProviders(
        requestId,
        data.serviceType,
        coords.latitude,
        coords.longitude,
        currentRetryCount
    );
    return 'retried';
}

/**
 * Cloud Function: Accept Service Request.
 *
 * Phase 3 (B-CRIT-5) hardening: the transaction now reads the calling
 * provider's doc and rejects unless ALL of the following invariants
 * hold:
 *   1. provider is `verificationStatus: 'verified'`
 *   2. provider is `availability.isOnline === true`
 *   3. provider's `serviceTypes` includes the request's `serviceType`
 *   4. provider has no other active request
 *      (`availability.currentRequestId` is unset)
 *   5. request is still `status: 'pending'` (existing check)
 *
 * Skills: Security-and-Hardening (boundary auth + invariant
 * enforcement), API-and-Interface-Design (clear failure codes per
 * invariant via HttpsError so client can react sensibly).
 */
/**
 * Map planner rejection codes back to the canonical `HttpsError` code
 * the live callable used before extraction. Keeping this mapping in
 * the callable (not the planner) means the planner stays free of any
 * firebase-functions / admin SDK coupling — TDD-friendly.
 */
function rejectionCodeToHttpsErrorCode(code: AcceptRequestRejectionCode):
    functions.https.FunctionsErrorCode {
    switch (code) {
        case 'unauthenticated':
            return 'unauthenticated';
        case 'invalid-argument':
            return 'invalid-argument';
        case 'not-found':
            return 'not-found';
        case 'permission-denied':
        case 'not-verified':
            return 'permission-denied';
        case 'already-assigned':
        case 'not-online':
        case 'service-type-mismatch':
        case 'already-busy':
            return 'failed-precondition';
    }
}

export const acceptServiceRequest = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { requestId } = (data ?? {}) as { requestId?: unknown };
    const providerId = context.auth.uid;

    if (typeof requestId !== 'string' || requestId.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'requestId is required');
    }

    try {
        const requestRef = db.collection('requests').doc(requestId);
        const providerRef = db.collection('providers').doc(providerId);

        // Use transaction to prevent race conditions and to enforce the
        // five invariants atomically with the assignment write. The
        // invariant decisions themselves live in the pure planner
        // `planAcceptServiceRequest` (functions/src/shared/...) so they
        // can be unit-tested without an emulator (audit-v2 §N-HIGH-9).
        await db.runTransaction(async (transaction) => {
            const [requestDoc, providerDoc] = await Promise.all([
                transaction.get(requestRef),
                transaction.get(providerRef),
            ]);

            const plan = planAcceptServiceRequest({
                requestId,
                providerId,
                request: requestDoc.exists ? (requestDoc.data() ?? null) : null,
                provider: providerDoc.exists ? (providerDoc.data() ?? null) : null,
            });

            if (plan.kind === 'reject') {
                throw new functions.https.HttpsError(
                    rejectionCodeToHttpsErrorCode(plan.code),
                    plan.message
                );
            }

            // Apply the planner's accept patches inside the same txn.
            transaction.update(requestRef, {
                providerId: plan.requestUpdate.providerId,
                status: plan.requestUpdate.status,
                'timeline.acceptedAt': admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            transaction.update(providerRef, plan.providerUpdate);
        });

        // Get customer FCM token and notify
        const requestDoc = await requestRef.get();
        const requestData = requestDoc.data()!;
        const userDoc = await db.collection('users').doc(requestData.userId).get();
        const fcmToken = userDoc.data()?.fcmToken;

        if (fcmToken) {
            // Get provider info for notification
            const providerDoc = await db.collection('providers').doc(providerId).get();
            const providerData = providerDoc.data();

            // Phase 4 (audit-v2 §N-HIGH-4) — derive ETA from real
            // distance (geohash-driven) plus a configurable urban
            // average speed, instead of a uniformly-random 8-20 min
            // integer. The earlier `estimateETA()` had ZERO correlation
            // with provider distance and was the audit's textbook
            // "fake number, trust collapses on first mismatch" finding.
            //
            // We also persist the result to `requests/{id}.eta.{minutes,
            // distanceKm, computedAt}` so the customer's live
            // subscription can render the same number that goes into
            // the FCM body — single source of truth, no drift between
            // notification text and tracking screen.
            const providerLoc = providerData?.availability?.currentLocation;
            const customerLoc = requestData.customerLocation?.coordinates;
            const distanceKm = (
                providerLoc &&
                typeof providerLoc.latitude === 'number' &&
                typeof providerLoc.longitude === 'number' &&
                customerLoc &&
                typeof customerLoc.latitude === 'number' &&
                typeof customerLoc.longitude === 'number'
            )
                ? geofire.distanceBetween(
                    [providerLoc.latitude, providerLoc.longitude],
                    [customerLoc.latitude, customerLoc.longitude]
                )
                : null;
            if (distanceKm === null) {
                console.warn(
                    `[eta] distance unknown for requestId=${requestId} ` +
                    'provider/customer coords missing; using fallback ETA'
                );
            }
            const etaMinutes = estimateETA(distanceKm);

            try {
                await requestRef.update({
                    eta: {
                        minutes: etaMinutes,
                        distanceKm: distanceKm,
                        computedAt: admin.firestore.FieldValue.serverTimestamp(),
                    },
                });
            } catch (etaPersistError) {
                // Non-fatal: the FCM message still goes out with the
                // ETA value the function used. Worst case the live
                // subscription shows nothing until the next status
                // change writes again.
                const message = etaPersistError instanceof Error
                    ? etaPersistError.message
                    : 'unknown';
                console.warn('[eta] persist failed (non-fatal):', message);
            }

            await admin.messaging().send({
                token: fcmToken,
                notification: {
                    title: 'Provider Found! 🎉',
                    body: `${providerData?.displayName || 'A provider'} is on the way. ETA: ~${etaMinutes} mins`,
                },
                data: {
                    type: 'request_accepted',
                    requestId,
                    providerId,
                },
            });
        }

        return { success: true };
    } catch (error: any) {
        console.error('Accept request error:', error);
        throw error;
    }
});

/**
 * Cloud Function: Update Request Status
 * Called by provider to update request lifecycle.
 *
 * Phase 3 hardening:
 * - Authorize: only the assigned provider (or the customer for `cancelled`)
 *   may transition the request.
 * - Validate the transition graph via `VALID_STATUS_TRANSITIONS`.
 * - Run the read+update in a transaction so concurrent transitions cannot
 *   skip states.
 */
export const updateRequestStatus = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { requestId, status } = data ?? {};
    const callerUid = context.auth.uid;

    if (!requestId || !status) {
        throw new functions.https.HttpsError('invalid-argument', 'requestId and status are required');
    }

    const validStatuses = ['enroute', 'arrived', 'inProgress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid status');
    }

    try {
        const requestRef = db.collection('requests').doc(requestId);

        await db.runTransaction(async (transaction) => {
            const snap = await transaction.get(requestRef);
            if (!snap.exists) {
                throw new functions.https.HttpsError('not-found', 'Request not found');
            }
            const current = snap.data() as { status: string; providerId?: string; userId?: string };

            // Pure decision helper — runs auth, transition graph, and
            // (audit-v2 §N-CRIT-1) decides whether to release the
            // provider on terminal transitions. Tests live next to the
            // helper, not the wiring.
            const plan = planRequestStatusUpdate(current, status, callerUid);
            if (!plan.ok) {
                throw new functions.https.HttpsError(plan.code, plan.message);
            }

            transaction.update(requestRef, {
                status,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                [`timeline.${status}At`]: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Release the provider on terminal transitions so the dispatch
            // pool isn't single-use per provider (audit-v2 §N-CRIT-1).
            // Without this, the idle invariant in `acceptServiceRequest`
            // rejects the same provider's next accept forever.
            if (plan.releaseProvider && current.providerId) {
                const providerRef = db.collection('providers').doc(current.providerId);
                transaction.update(providerRef, {
                    'availability.currentRequestId': admin.firestore.FieldValue.delete(),
                });
            }
        });

        // Notify customer of status change
        const requestDoc = await db.collection('requests').doc(requestId).get();
        const requestData = requestDoc.data()!;
        const userDoc = await db.collection('users').doc(requestData.userId).get();
        const fcmToken = userDoc.data()?.fcmToken;

        if (fcmToken) {
            const statusMessages: Record<string, { title: string; body: string }> = {
                enroute: { title: 'Provider En Route 🚗', body: 'Your provider is on the way!' },
                arrived: { title: 'Provider Arrived! 📍', body: 'Your provider has arrived at your location' },
                inProgress: { title: 'Service In Progress 🔧', body: 'Your service is being performed' },
                completed: { title: 'Service Complete ✅', body: 'Your service has been completed' },
                cancelled: { title: 'Request Cancelled ❌', body: 'Your service request has been cancelled' },
            };

            const msg = statusMessages[status];
            if (msg) {
                await admin.messaging().send({
                    token: fcmToken,
                    notification: msg,
                    data: { type: 'status_update', requestId, status },
                });
            }
        }

        return { success: true };
    } catch (error: unknown) {
        // Preserve specific HttpsError codes raised inside the transaction
        // (not-found, permission-denied, failed-precondition) so the
        // client can branch on them. Only mask truly-unknown errors as
        // 'internal' (CodeRabbit PR #3, review comment).
        if (error instanceof functions.https.HttpsError) {
            console.error('Update status error:', error.code, error.message);
            throw error;
        }
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Update status error:', message);
        throw new functions.https.HttpsError('internal', 'Failed to update status');
    }
});

// Phase 4 (audit-v2 §N-HIGH-4) — `estimateETA` extracted to
// `../shared/eta.ts` so it can be unit-tested without bootstrapping the
// firebase-admin SDK. Imported at the top of this file.
