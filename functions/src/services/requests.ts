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
    radiusKm: number = 15
): Promise<void> {
    const requestRef = db.collection('requests').doc(requestId);
    const now = admin.firestore.FieldValue.serverTimestamp();

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
            await requestRef.update({
                'dispatch.status': DISPATCH_STATUS.NoProviders,
                'dispatch.notifiedCount': 0,
                'dispatch.lastAttemptAt': now,
                'dispatch.retryCount': admin.firestore.FieldValue.increment(0),
            });
            console.log(
                `[dispatch] no_providers requestId=${requestId} serviceType=${serviceType}`
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
            'dispatch.retryCount': admin.firestore.FieldValue.increment(0),
        });
        console.log(
            `[dispatch] notified=${providerTokens.length} requestId=${requestId}`
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
        // five invariants atomically with the assignment write.
        await db.runTransaction(async (transaction) => {
            const [requestDoc, providerDoc] = await Promise.all([
                transaction.get(requestRef),
                transaction.get(providerRef),
            ]);

            if (!requestDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Request not found');
            }
            if (!providerDoc.exists) {
                throw new functions.https.HttpsError(
                    'permission-denied',
                    'Caller is not registered as a provider'
                );
            }

            const requestData = requestDoc.data()!;
            const providerData = providerDoc.data()!;

            // (5) Request must still be pending.
            if (requestData.status !== 'pending') {
                throw new functions.https.HttpsError('failed-precondition', 'Request already assigned');
            }

            // (1) Verification gate.
            if (providerData.verificationStatus !== 'verified') {
                throw new functions.https.HttpsError(
                    'permission-denied',
                    'Provider is not verified'
                );
            }

            // (2) Online gate.
            const availability = (providerData.availability ?? {}) as {
                isOnline?: boolean;
                currentRequestId?: string | null;
            };
            if (availability.isOnline !== true) {
                throw new functions.https.HttpsError(
                    'failed-precondition',
                    'Provider is not online'
                );
            }

            // (3) Service-type gate.
            const serviceTypes = Array.isArray(providerData.serviceTypes)
                ? (providerData.serviceTypes as unknown[])
                : [];
            if (!serviceTypes.includes(requestData.serviceType)) {
                throw new functions.https.HttpsError(
                    'failed-precondition',
                    'Provider does not offer this service type'
                );
            }

            // (4) Idle gate — reject if already on another job.
            if (
                typeof availability.currentRequestId === 'string' &&
                availability.currentRequestId.length > 0 &&
                availability.currentRequestId !== requestId
            ) {
                throw new functions.https.HttpsError(
                    'failed-precondition',
                    'Provider already has an active request'
                );
            }

            // Assign provider to request.
            transaction.update(requestRef, {
                providerId,
                status: 'accepted',
                'timeline.acceptedAt': admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Pin the provider to the request so a second concurrent
            // accept call observes invariant (4).
            transaction.update(providerRef, {
                'availability.currentRequestId': requestId,
            });
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

            await admin.messaging().send({
                token: fcmToken,
                notification: {
                    title: 'Provider Found! 🎉',
                    body: `${providerData?.displayName || 'A provider'} is on the way. ETA: ~${estimateETA()} mins`,
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

/**
 * Helper: Estimate ETA (simple version)
 */
function estimateETA(): number {
    // Random between 8-20 minutes for now
    // TODO: Calculate based on actual distance
    return Math.floor(Math.random() * 12) + 8;
}
