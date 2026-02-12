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
 * Called frequently by provider app to stream location
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
        }

        return { success: true };
    } catch (error: any) {
        console.error('Update location error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update location');
    }
});

/**
 * Cloud Function: Set Provider Online/Offline
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
        const updates: Record<string, any> = {
            'availability.isOnline': isOnline,
            'availability.lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
        };

        if (isOnline && latitude && longitude) {
            const geohash = geofire.geohashForLocation([latitude, longitude]);
            updates['availability.currentLocation'] = { latitude, longitude };
            updates.geohash = geohash;
        }

        if (!isOnline) {
            // Clear current request if going offline
            updates['availability.currentRequestId'] = null;
        }

        await db.collection('providers').doc(providerId).update(updates);

        return { success: true, isOnline };
    } catch (error: any) {
        console.error('Set availability error:', error);
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
