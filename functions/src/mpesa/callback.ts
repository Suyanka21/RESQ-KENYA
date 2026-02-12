/**
 * ResQ Kenya - M-Pesa Callback Handler
 * HTTP endpoint for Safaricom to send payment confirmations
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize if not already done
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

interface MpesaCallbackItem {
    Name: string;
    Value: string | number;
}

interface MpesaCallbackBody {
    stkCallback: {
        MerchantRequestID: string;
        CheckoutRequestID: string;
        ResultCode: number;
        ResultDesc: string;
        CallbackMetadata?: {
            Item: MpesaCallbackItem[];
        };
    };
}

/**
 * Extract value from callback metadata
 */
function getCallbackValue(items: MpesaCallbackItem[], name: string): string | number | undefined {
    const item = items.find(i => i.Name === name);
    return item?.Value;
}

/**
 * HTTP Cloud Function: M-Pesa STK Callback
 * Called by Safaricom when payment is completed/failed
 */
export const mpesaCallback = functions.https.onRequest(async (req, res) => {
    // Only accept POST requests
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    console.log('M-Pesa Callback received:', JSON.stringify(req.body));

    try {
        const body: { Body: MpesaCallbackBody } = req.body;
        const callback = body.Body?.stkCallback;

        if (!callback) {
            console.error('Invalid callback body');
            res.status(400).send('Invalid callback');
            return;
        }

        const {
            MerchantRequestID: _MerchantRequestID,
            CheckoutRequestID,
            ResultCode,
            ResultDesc,
            CallbackMetadata,
        } = callback;

        console.log(`Payment callback: ${CheckoutRequestID}, Result: ${ResultCode} - ${ResultDesc}`);

        // Find the payment request by CheckoutRequestID
        const paymentQuery = await db.collection('payment_requests')
            .where('checkoutRequestID', '==', CheckoutRequestID)
            .limit(1)
            .get();

        if (paymentQuery.empty) {
            console.error('Payment request not found for:', CheckoutRequestID);
            res.status(200).send('OK'); // Always respond 200 to Safaricom
            return;
        }

        const paymentDoc = paymentQuery.docs[0];
        const paymentData = paymentDoc.data();
        const requestId = paymentDoc.id;

        // Determine payment status
        const isSuccess = ResultCode === 0;
        const newStatus = isSuccess ? 'completed' : 'failed';

        // Extract metadata if successful
        let mpesaReceiptNumber: string | undefined;
        let transactionDate: string | undefined;

        if (isSuccess && CallbackMetadata?.Item) {
            mpesaReceiptNumber = getCallbackValue(CallbackMetadata.Item, 'MpesaReceiptNumber') as string;
            transactionDate = getCallbackValue(CallbackMetadata.Item, 'TransactionDate')?.toString();
            // phoneNumber available for logging if needed
            void getCallbackValue(CallbackMetadata.Item, 'PhoneNumber');
        }

        // Update payment request
        await paymentDoc.ref.update({
            status: newStatus,
            resultCode: ResultCode,
            resultDesc: ResultDesc,
            mpesaReceiptNumber,
            transactionDate,
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update the service request
        await db.collection('requests').doc(requestId).update({
            'payment.status': newStatus,
            'payment.mpesaReceiptNumber': mpesaReceiptNumber || null,
            'payment.transactionId': mpesaReceiptNumber || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // If successful, update request status to completed and notify
        if (isSuccess) {
            await db.collection('requests').doc(requestId).update({
                status: 'completed',
                'timeline.completedAt': admin.firestore.FieldValue.serverTimestamp(),
            });

            // Send push notification to user
            const request = await db.collection('requests').doc(requestId).get();
            const requestData = request.data();

            if (requestData?.userId) {
                const userDoc = await db.collection('users').doc(requestData.userId).get();
                const fcmToken = userDoc.data()?.fcmToken;

                if (fcmToken) {
                    try {
                        await admin.messaging().send({
                            token: fcmToken,
                            notification: {
                                title: 'Payment Successful! ✅',
                                body: `Your payment of KES ${paymentData.amount} has been received. Receipt: ${mpesaReceiptNumber}`,
                            },
                            data: {
                                type: 'payment_completed',
                                requestId,
                            },
                        });
                    } catch (notifyError) {
                        console.error('Failed to send notification:', notifyError);
                    }
                }
            }

            // Update provider earnings if applicable
            if (requestData?.providerId) {
                const providerRef = db.collection('providers').doc(requestData.providerId);
                const amount = paymentData.amount * 0.75; // 75% to provider

                await providerRef.update({
                    'earnings.today': admin.firestore.FieldValue.increment(amount),
                    'earnings.thisWeek': admin.firestore.FieldValue.increment(amount),
                    'earnings.thisMonth': admin.firestore.FieldValue.increment(amount),
                    'earnings.allTime': admin.firestore.FieldValue.increment(amount),
                });
            }
        }

        // Always respond 200 to Safaricom
        res.status(200).json({
            ResultCode: 0,
            ResultDesc: 'Callback received successfully',
        });

    } catch (error) {
        console.error('M-Pesa callback error:', error);
        // Still respond 200 to prevent Safaricom retries
        res.status(200).json({
            ResultCode: 0,
            ResultDesc: 'Accepted',
        });
    }
});
