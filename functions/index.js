// ResQ Kenya - Firebase Cloud Functions for M-Pesa
// Deploy these to Firebase Cloud Functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

// M-Pesa Configuration (from Firebase environment)
const MPESA_CONFIG = {
    consumerKey: functions.config().mpesa?.consumer_key,
    consumerSecret: functions.config().mpesa?.consumer_secret,
    shortcode: functions.config().mpesa?.shortcode || '174379', // Sandbox shortcode
    passkey: functions.config().mpesa?.passkey,
    callbackUrl: functions.config().mpesa?.callback_url,
    environment: functions.config().mpesa?.environment || 'sandbox', // 'sandbox' or 'production'
};

// M-Pesa API URLs
const MPESA_URLS = {
    sandbox: {
        auth: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        stkPush: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        stkQuery: 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
    },
    production: {
        auth: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        stkPush: 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        stkQuery: 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query',
    },
};

/**
 * Get OAuth token from M-Pesa
 */
async function getMpesaToken() {
    const env = MPESA_CONFIG.environment;
    const url = MPESA_URLS[env].auth;

    const auth = Buffer.from(
        `${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`
    ).toString('base64');

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });
        return response.data.access_token;
    } catch (error) {
        console.error('M-Pesa auth error:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with M-Pesa');
    }
}

/**
 * Generate password for STK Push
 */
function generatePassword() {
    const timestamp = getTimestamp();
    const data = MPESA_CONFIG.shortcode + MPESA_CONFIG.passkey + timestamp;
    return Buffer.from(data).toString('base64');
}

/**
 * Get current timestamp in M-Pesa format
 */
function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hour}${minute}${second}`;
}

/**
 * Initiate STK Push (Lipa Na M-Pesa)
 */
exports.initiateStkPush = functions.https.onCall(async (data, context) => {
    // Verify user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }

    const { phoneNumber, amount, requestId, description } = data;

    // Validate inputs
    if (!phoneNumber || !amount || !requestId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Format phone number (remove + and ensure it starts with 254)
    let formattedPhone = phoneNumber.replace(/\+/g, '');
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
    }

    try {
        const token = await getMpesaToken();
        const timestamp = getTimestamp();
        const password = generatePassword();
        const env = MPESA_CONFIG.environment;

        const stkPayload = {
            BusinessShortCode: MPESA_CONFIG.shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(amount),
            PartyA: formattedPhone,
            PartyB: MPESA_CONFIG.shortcode,
            PhoneNumber: formattedPhone,
            CallBackURL: MPESA_CONFIG.callbackUrl,
            AccountReference: `ResQ-${requestId.substring(0, 8)}`,
            TransactionDesc: description || 'ResQ Service Payment',
        };

        const response = await axios.post(MPESA_URLS[env].stkPush, stkPayload, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        // Store the checkout request in Firestore for tracking
        await admin.firestore().collection('payment_requests').doc(requestId).set({
            userId: context.auth.uid,
            requestId,
            amount,
            phoneNumber: formattedPhone,
            checkoutRequestID: response.data.CheckoutRequestID,
            merchantRequestID: response.data.MerchantRequestID,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
            success: true,
            checkoutRequestID: response.data.CheckoutRequestID,
            merchantRequestID: response.data.MerchantRequestID,
            responseDescription: response.data.ResponseDescription,
        };
    } catch (error) {
        console.error('STK Push error:', error.response?.data || error.message);
        throw new functions.https.HttpsError('internal', 'Failed to initiate payment');
    }
});

/**
 * M-Pesa callback handler (webhook)
 */
exports.mpesaCallback = functions.https.onRequest(async (req, res) => {
    console.log('M-Pesa callback received:', JSON.stringify(req.body));

    try {
        const { Body } = req.body;

        if (!Body || !Body.stkCallback) {
            return res.status(400).json({ error: 'Invalid callback data' });
        }

        const callback = Body.stkCallback;
        const checkoutRequestID = callback.CheckoutRequestID;
        const resultCode = callback.ResultCode;

        // Find the payment request
        const snapshot = await admin.firestore()
            .collection('payment_requests')
            .where('checkoutRequestID', '==', checkoutRequestID)
            .limit(1)
            .get();

        if (snapshot.empty) {
            console.error('Payment request not found:', checkoutRequestID);
            return res.status(404).json({ error: 'Payment request not found' });
        }

        const paymentDoc = snapshot.docs[0];
        const paymentData = paymentDoc.data();

        if (resultCode === 0) {
            // Payment successful
            const callbackMetadata = callback.CallbackMetadata?.Item || [];
            const mpesaReceiptNumber = callbackMetadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
            const transactionDate = callbackMetadata.find(i => i.Name === 'TransactionDate')?.Value;
            const phoneNumber = callbackMetadata.find(i => i.Name === 'PhoneNumber')?.Value;

            // Update payment request
            await paymentDoc.ref.update({
                status: 'completed',
                mpesaReceiptNumber,
                transactionDate,
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Update the service request payment status
            await admin.firestore().collection('requests').doc(paymentData.requestId).update({
                'payment.status': 'completed',
                'payment.mpesaReceiptNumber': mpesaReceiptNumber,
                'payment.transactionId': mpesaReceiptNumber,
            });

            console.log('Payment completed:', mpesaReceiptNumber);
        } else {
            // Payment failed or cancelled
            await paymentDoc.ref.update({
                status: 'failed',
                resultCode,
                resultDescription: callback.ResultDesc,
                failedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log('Payment failed:', callback.ResultDesc);
        }

        res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    } catch (error) {
        console.error('Callback processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Query STK Push status
 */
exports.queryStkStatus = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }

    const { checkoutRequestID } = data;

    if (!checkoutRequestID) {
        throw new functions.https.HttpsError('invalid-argument', 'CheckoutRequestID required');
    }

    try {
        const token = await getMpesaToken();
        const timestamp = getTimestamp();
        const password = generatePassword();
        const env = MPESA_CONFIG.environment;

        const queryPayload = {
            BusinessShortCode: MPESA_CONFIG.shortcode,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: checkoutRequestID,
        };

        const response = await axios.post(MPESA_URLS[env].stkQuery, queryPayload, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        return {
            success: true,
            resultCode: response.data.ResultCode,
            resultDescription: response.data.ResultDesc,
        };
    } catch (error) {
        console.error('STK query error:', error.response?.data || error.message);
        throw new functions.https.HttpsError('internal', 'Failed to query payment status');
    }
});

// ============================================
// PUSH NOTIFICATION FUNCTIONS
// ============================================

/**
 * Send push notification to a specific user
 */
async function sendPushNotification(token, title, body, data = {}) {
    const message = {
        notification: {
            title,
            body,
        },
        data: {
            ...data,
            timestamp: new Date().toISOString(),
        },
        token,
    };

    try {
        await admin.messaging().send(message);
        console.log('Push notification sent:', title);
        return true;
    } catch (error) {
        console.error('Push notification error:', error);
        return false;
    }
}

/**
 * Triggered when a new service request is created
 * Notifies nearby providers
 */
exports.onNewRequest = functions.firestore
    .document('requests/{requestId}')
    .onCreate(async (snap, context) => {
        const request = snap.data();
        const { serviceType, customerLocation } = request;

        console.log('New request created:', context.params.requestId);

        // Find online providers for this service type
        // In a real implementation, you'd filter by geohash for nearby providers
        const providersSnapshot = await admin.firestore()
            .collection('providers')
            .where('serviceTypes', 'array-contains', serviceType)
            .where('availability.isOnline', '==', true)
            .where('verificationStatus', '==', 'verified')
            .limit(10)
            .get();

        const notificationPromises = [];

        providersSnapshot.forEach(doc => {
            const provider = doc.data();
            if (provider.fcmToken) {
                notificationPromises.push(
                    sendPushNotification(
                        provider.fcmToken,
                        '🔔 New Request Nearby!',
                        `${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} service needed`,
                        {
                            type: 'new_request',
                            requestId: context.params.requestId,
                            serviceType,
                        }
                    )
                );
            }
        });

        await Promise.all(notificationPromises);
        console.log(`Notified ${notificationPromises.length} providers`);
    });

/**
 * Triggered when request status changes
 * Notifies the customer
 */
exports.onRequestStatusChange = functions.firestore
    .document('requests/{requestId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        // Only proceed if status changed
        if (before.status === after.status) return;

        console.log(`Request ${context.params.requestId} status: ${before.status} -> ${after.status}`);

        // Get customer FCM token
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(after.userId)
            .get();

        if (!userDoc.exists) return;

        const user = userDoc.data();
        if (!user.fcmToken) return;

        // Notification content based on status
        const notifications = {
            accepted: {
                title: '🚗 Provider Found!',
                body: 'A service provider has accepted your request',
            },
            enroute: {
                title: '🚛 Provider En Route',
                body: 'Your service provider is on the way',
            },
            arrived: {
                title: '📍 Provider Arrived',
                body: 'Your service provider has arrived at your location',
            },
            completed: {
                title: '✅ Service Completed',
                body: 'Your service has been completed. Rate your experience!',
            },
            cancelled: {
                title: '❌ Request Cancelled',
                body: 'Your service request has been cancelled',
            },
        };

        const notification = notifications[after.status];
        if (!notification) return;

        await sendPushNotification(
            user.fcmToken,
            notification.title,
            notification.body,
            {
                type: `request_${after.status}`,
                requestId: context.params.requestId,
            }
        );
    });

/**
 * Triggered when payment is completed
 * Notifies both customer and provider
 */
exports.onPaymentComplete = functions.firestore
    .document('payment_requests/{paymentId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        // Only proceed if status changed to completed
        if (before.status === 'completed' || after.status !== 'completed') return;

        console.log(`Payment completed for request ${after.requestId}`);

        // Notify customer
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(after.userId)
            .get();

        if (userDoc.exists && userDoc.data().fcmToken) {
            await sendPushNotification(
                userDoc.data().fcmToken,
                '💰 Payment Received',
                `Your payment of KES ${after.amount.toLocaleString()} has been received`,
                {
                    type: 'payment_received',
                    requestId: after.requestId,
                    amount: String(after.amount),
                }
            );
        }

        // Notify provider
        const requestDoc = await admin.firestore()
            .collection('requests')
            .doc(after.requestId)
            .get();

        if (requestDoc.exists && requestDoc.data().providerId) {
            const providerDoc = await admin.firestore()
                .collection('providers')
                .doc(requestDoc.data().providerId)
                .get();

            if (providerDoc.exists && providerDoc.data().fcmToken) {
                await sendPushNotification(
                    providerDoc.data().fcmToken,
                    '💵 Payment Received',
                    `You received KES ${after.amount.toLocaleString()} for your service`,
                    {
                        type: 'payment_received',
                        requestId: after.requestId,
                        amount: String(after.amount),
                    }
                );
            }
        }
    });

/**
 * Manual push notification (for testing or admin use)
 */
exports.sendNotification = functions.https.onCall(async (data, context) => {
    // Only allow authenticated users (add admin check for production)
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }

    const { userId, title, body, notificationData } = data;

    // Get user's FCM token
    const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();

    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const user = userDoc.data();
    if (!user.fcmToken) {
        throw new functions.https.HttpsError('failed-precondition', 'User has no FCM token');
    }

    const success = await sendPushNotification(
        user.fcmToken,
        title,
        body,
        notificationData || {}
    );

    return { success };
});
