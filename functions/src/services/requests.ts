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

/** Allowed status transitions; reject anything outside this graph. */
export const VALID_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
    pending: ['accepted', 'cancelled'],
    accepted: ['enroute', 'cancelled'],
    enroute: ['arrived', 'cancelled'],
    arrived: ['inProgress', 'cancelled'],
    inProgress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
};

export function isAllowedStatusTransition(from: string, to: string): boolean {
    const allowed = VALID_STATUS_TRANSITIONS[from];
    return Array.isArray(allowed) && allowed.includes(to);
}

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
    // safe for any input.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto') as typeof import('crypto');
    return crypto
        .createHash('sha256')
        .update(`${userId}:${idempotencyKey}`)
        .digest('hex')
        .slice(0, 32);
}

/**
 * Find and notify nearby available providers
 */
async function notifyNearbyProviders(
    requestId: string,
    serviceType: string,
    latitude: number,
    longitude: number,
    radiusKm: number = 15
): Promise<void> {
    const center = [latitude, longitude] as [number, number];
    const radiusM = radiusKm * 1000;
    const bounds = geofire.geohashQueryBounds(center, radiusM);

    const providerTokens: string[] = [];

    // Query each geohash bound
    for (const bound of bounds) {
        const q = db.collection('providers')
            .where('serviceTypes', 'array-contains', serviceType)
            .where('availability.isOnline', '==', true)
            .where('verificationStatus', '==', 'verified')
            .orderBy('geohash')
            .startAt(bound[0])
            .endAt(bound[1]);

        const snapshot = await q.get();

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const providerLocation = data.availability?.currentLocation;

            if (providerLocation) {
                const distance = geofire.distanceBetween(
                    center,
                    [providerLocation.latitude, providerLocation.longitude]
                );

                // Only notify providers within actual radius
                if (distance <= radiusKm && data.fcmToken) {
                    providerTokens.push(data.fcmToken);
                }
            }
        }
    }

    // Send push notifications to nearby providers
    if (providerTokens.length > 0) {
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

        // Send to all providers (max 500 per batch)
        const batches = [];
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
        console.log(`Notified ${providerTokens.length} providers for request ${requestId}`);
    } else {
        console.log(`No available providers found for ${serviceType} near ${latitude}, ${longitude}`);
    }
}

/**
 * Cloud Function: Accept Service Request
 * Called when a provider accepts a pending request
 */
export const acceptServiceRequest = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { requestId } = data;
    const providerId = context.auth.uid;

    if (!requestId) {
        throw new functions.https.HttpsError('invalid-argument', 'requestId is required');
    }

    try {
        const requestRef = db.collection('requests').doc(requestId);

        // Use transaction to prevent race conditions
        await db.runTransaction(async (transaction) => {
            const requestDoc = await transaction.get(requestRef);

            if (!requestDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Request not found');
            }

            const requestData = requestDoc.data()!;

            if (requestData.status !== 'pending') {
                throw new functions.https.HttpsError('failed-precondition', 'Request already assigned');
            }

            // Assign provider to request
            transaction.update(requestRef, {
                providerId,
                status: 'accepted',
                'timeline.acceptedAt': admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Update provider status
            transaction.update(db.collection('providers').doc(providerId), {
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

            // Authorization: provider for non-cancel transitions; customer
            // may only cancel their own request.
            if (status === 'cancelled') {
                if (current.userId !== callerUid && current.providerId !== callerUid) {
                    throw new functions.https.HttpsError('permission-denied', 'Not your request');
                }
            } else {
                if (current.providerId !== callerUid) {
                    throw new functions.https.HttpsError('permission-denied', 'Only the assigned provider may update status');
                }
            }

            if (!isAllowedStatusTransition(current.status, status)) {
                throw new functions.https.HttpsError(
                    'failed-precondition',
                    `Cannot transition from ${current.status} to ${status}`
                );
            }

            transaction.update(requestRef, {
                status,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                [`timeline.${status}At`]: admin.firestore.FieldValue.serverTimestamp(),
            });
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
    } catch (error: any) {
        console.error('Update status error:', error);
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
