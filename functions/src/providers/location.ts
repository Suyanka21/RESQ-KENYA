/**
 * ResQ Kenya - Provider Location Cloud Functions
 * Handles real-time provider location updates
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
 * Cloud Function: Update Provider Location
 * Called frequently by provider app to stream location.
 *
 * Phase 3 (B-HIGH-3) hardening: the RTDB mirror used to do three
 * sequential `set()` calls, which races with the
 * `onRequestStatusChange` trigger and produces partial state. We now
 * issue a single `update({...})` so all three keys flip atomically.
 *
 * Skills: Source-Driven-Development (Firebase RTDB Admin SDK docs:
 * https://firebase.google.com/docs/database/admin/save-data#updating_or_deleting_data),
 * Security-and-Hardening (atomic state under concurrent writers).
 */
export const updateProviderLocation = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Provider must be authenticated');
    }

    const { latitude, longitude, heading, speed } = data;
    const providerId = context.auth.uid;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        throw new functions.https.HttpsError('invalid-argument', 'Valid coordinates required');
    }

    try {
        // Generate geohash for efficient geo queries
        const geohash = geofire.geohashForLocation([latitude, longitude]);

        // Update provider location
        await db.collection('providers').doc(providerId).update({
            'availability.currentLocation': {
                latitude,
                longitude,
                heading: heading || null,
                speed: speed || null,
            },
            'availability.lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
            geohash,
        });

        // If provider has an active request, update customer with location
        const providerDoc = await db.collection('providers').doc(providerId).get();
        const currentRequestId = providerDoc.data()?.availability?.currentRequestId;

        if (currentRequestId) {
            // Update the request with provider's current location
            await db.collection('requests').doc(currentRequestId).update({
                providerLocation: {
                    latitude,
                    longitude,
                    heading: heading || null,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
            });

            // Phase 3 (B-HIGH-3): atomic multi-path update — single round
            // trip, all keys flip together so listeners can never observe
            // a state with `providerLocation` updated but `providerStale`
            // still true (or vice-versa).
            try {
                await admin.database()
                    .ref(`activeRequests/${currentRequestId}`)
                    .update({
                        providerLocation: { latitude, longitude, heading: heading || null },
                        providerStale: false,
                        updatedAt: admin.database.ServerValue.TIMESTAMP,
                    });
            } catch (rtdbError) {
                const message = rtdbError instanceof Error ? rtdbError.message : 'Unknown error';
                console.warn('RTDB mirror failed (non-fatal):', message);
            }
        }

        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'unknown';
        console.error('Update location error:', message);
        throw new functions.https.HttpsError('internal', 'Failed to update location');
    }
});

/**
 * Cloud Function: Set Provider Online/Offline.
 *
 * Phase 3 (B-HIGH-7): only verified providers may flip themselves
 * online. Going offline (isOnline=false) is always permitted so a
 * provider whose verification has been revoked can still leave the
 * dispatch pool. The companion Firestore rules change (Phase 3.5)
 * blocks clients from writing `verificationStatus` directly so this
 * gate cannot be bypassed.
 *
 * Skills: Security-and-Hardening (server-authoritative invariants).
 */
export const setProviderAvailability = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Provider must be authenticated');
    }

    const { isOnline, latitude, longitude } = data;
    const providerId = context.auth.uid;

    if (typeof isOnline !== 'boolean') {
        throw new functions.https.HttpsError('invalid-argument', 'isOnline must be boolean');
    }

    try {
        const providerRef = db.collection('providers').doc(providerId);

        if (isOnline) {
            // Verification gate. Going offline doesn't need this check.
            const providerSnap = await providerRef.get();
            if (!providerSnap.exists) {
                throw new functions.https.HttpsError(
                    'permission-denied',
                    'Caller is not registered as a provider'
                );
            }
            if (providerSnap.data()?.verificationStatus !== 'verified') {
                throw new functions.https.HttpsError(
                    'permission-denied',
                    'Provider must be verified before going online'
                );
            }
        }

        const updates: Record<string, unknown> = {
            'availability.isOnline': isOnline,
            'availability.lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
        };

        if (isOnline && typeof latitude === 'number' && typeof longitude === 'number') {
            const geohash = geofire.geohashForLocation([latitude, longitude]);
            updates['availability.currentLocation'] = { latitude, longitude };
            updates.geohash = geohash;
        }

        if (!isOnline) {
            // Clear current request if going offline
            updates['availability.currentRequestId'] = null;
        }

        await providerRef.update(updates);

        return { success: true, isOnline };
    } catch (error: unknown) {
        if (error instanceof functions.https.HttpsError) throw error;
        const message = error instanceof Error ? error.message : 'unknown';
        console.error('Set availability error:', message);
        throw new functions.https.HttpsError('internal', 'Failed to update availability');
    }
});

/**
 * Firestore Trigger: Provider goes offline
 * Auto-cleanup when provider hasn't updated location in 5 mins
 */
export const autoOfflineCheck = functions.pubsub
    .schedule('every 5 minutes')
    .onRun(async (context) => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const staleProviders = await db.collection('providers')
            .where('availability.isOnline', '==', true)
            .where('availability.lastUpdated', '<', fiveMinutesAgo)
            .get();

        const batch = db.batch();

        staleProviders.docs.forEach((doc) => {
            batch.update(doc.ref, {
                'availability.isOnline': false,
                'availability.autoOfflineAt': admin.firestore.FieldValue.serverTimestamp(),
            });
        });

        if (!staleProviders.empty) {
            await batch.commit();
            console.log(`Set ${staleProviders.size} stale providers offline`);
        }

        return null;
    });
