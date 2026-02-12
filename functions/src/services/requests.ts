/**
 * ResQ Kenya - Service Request Cloud Functions
 * Handles service request creation, matching, and lifecycle
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as geofire from 'geofire-common';

// Initialize if not already done
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

/**
 * Cloud Function: Create Service Request
 * Called when a customer submits a new service request
 */
export const createServiceRequest = functions.https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const {
        serviceType,
        customerLocation,
        serviceDetails,
        pricing,
    } = data;

    // Validate required fields
    if (!serviceType || !customerLocation) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
        const userId = context.auth.uid;

        // Generate geohash for location
        const { latitude, longitude } = customerLocation.coordinates;
        const geohash = geofire.geohashForLocation([latitude, longitude]);

        // Create the request document
        const requestRef = db.collection('requests').doc();

        await requestRef.set({
            id: requestRef.id,
            userId,
            serviceType,
            status: 'pending',
            customerLocation,
            serviceDetails: serviceDetails || {},
            pricing: pricing || {},
            geohash,
            payment: {
                method: 'mpesa',
                status: 'pending',
            },
            timeline: {
                requestedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Find and notify nearby providers
        await notifyNearbyProviders(requestRef.id, serviceType, latitude, longitude);

        return {
            success: true,
            requestId: requestRef.id,
        };
    } catch (error: any) {
        console.error('Create request error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create request');
    }
});

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
 * Called by provider to update request lifecycle
 */
export const updateRequestStatus = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { requestId, status } = data;

    if (!requestId || !status) {
        throw new functions.https.HttpsError('invalid-argument', 'requestId and status are required');
    }

    const validStatuses = ['enroute', 'arrived', 'inProgress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid status');
    }

    try {
        const updates: Record<string, any> = {
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Add timeline updates
        const timelineKey = `timeline.${status}At`;
        updates[timelineKey] = admin.firestore.FieldValue.serverTimestamp();

        await db.collection('requests').doc(requestId).update(updates);

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
