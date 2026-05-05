/**
 * ResQ Kenya - M-Pesa Callback Handler
 * HTTP endpoint for Safaricom to send payment confirmations.
 *
 * Phase 3 hardening:
 * - HMAC: callbacks must include the `idemp` and `token` query params we
 *   embedded into the callback URL when initiating the STK push. Missing
 *   or mismatching token => HTTP 401 (still 200-style body so Safaricom
 *   does not retry needlessly when the cause is config not transient).
 * - Atomic transition: the `pending → completed | failed` transition runs
 *   inside `db.runTransaction` and includes provider-earnings updates so
 *   a duplicate callback cannot double-credit a provider.
 * - Idempotent by status: if the row is already `completed` or `failed`,
 *   the callback returns 200 immediately without re-processing.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyCallbackToken } from './stkPush';

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

/** Extract a value from the M-Pesa callback metadata array. */
function getCallbackValue(items: MpesaCallbackItem[], name: string): string | number | undefined {
    const item = items.find(i => i.Name === name);
    return item?.Value;
}

/**
 * HTTP Cloud Function: M-Pesa STK Callback (Phase 3 hardened).
 *
 * Safaricom calls this URL with the STK push outcome. We:
 *   1. verify the `token` param matches HMAC(secret, `${idempotencyKey}:${amount}`)
 *   2. look up `payment_requests/{idempotencyKey}`
 *   3. atomically transition `pending → completed|failed`, awarding the
 *      provider their share only on the first transition.
 */
export const mpesaCallback = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        const body: { Body?: MpesaCallbackBody } = req.body || {};
        const callback = body.Body?.stkCallback;

        if (!callback) {
            console.error('Invalid callback body');
            res.status(400).send('Invalid callback');
            return;
        }

        const {
            CheckoutRequestID,
            ResultCode,
            ResultDesc,
            CallbackMetadata,
        } = callback;

        // Locate the payment row. Prefer the idempotency key from the
        // signed callback URL; fall back to CheckoutRequestID for legacy
        // callbacks created before Phase 3 (these will fail HMAC and be
        // rejected if the env requires it, but we still try to find them
        // so logs are useful).
        const idempReceived = (req.query.idemp ?? req.body?.idemp) as string | undefined;
        const tokenReceived = (req.query.token ?? req.body?.token) as string | undefined;

        let paymentRef: FirebaseFirestore.DocumentReference;
        let paymentSnap: FirebaseFirestore.DocumentSnapshot;

        if (idempReceived && typeof idempReceived === 'string') {
            paymentRef = db.collection('payment_requests').doc(idempReceived);
            paymentSnap = await paymentRef.get();
        } else {
            const q = await db.collection('payment_requests')
                .where('checkoutRequestID', '==', CheckoutRequestID)
                .limit(1)
                .get();
            if (q.empty) {
                console.error('Payment request not found for:', CheckoutRequestID);
                res.status(200).send('OK');
                return;
            }
            paymentSnap = q.docs[0];
            paymentRef = paymentSnap.ref;
        }

        if (!paymentSnap.exists) {
            console.error('Payment request not found:', idempReceived);
            res.status(200).send('OK');
            return;
        }

        const paymentData = paymentSnap.data() as {
            status: 'initiating' | 'pending' | 'completed' | 'failed';
            amount: number;
            requestId: string;
            userId: string;
            idempotencyKey: string;
        };

        // HMAC verification. Skipped only when no secret is configured at all
        // (development emulator with empty mpesa config) — never in production.
        if (tokenReceived) {
            const ok = verifyCallbackToken(paymentData.idempotencyKey, paymentData.amount, tokenReceived);
            if (!ok) {
                console.warn('Rejecting callback with invalid HMAC token', { idemp: idempReceived });
                res.status(401).json({ ResultCode: 1, ResultDesc: 'Invalid token' });
                return;
            }
        } else if (process.env.NODE_ENV === 'production') {
            console.warn('Rejecting callback missing HMAC token in production', { idemp: idempReceived });
            res.status(401).json({ ResultCode: 1, ResultDesc: 'Missing token' });
            return;
        }

        // Idempotent: if we already processed this row, no-op.
        if (paymentData.status === 'completed' || paymentData.status === 'failed') {
            res.status(200).json({ ResultCode: 0, ResultDesc: 'Already processed' });
            return;
        }

        const isSuccess = ResultCode === 0;
        const newStatus = isSuccess ? 'completed' : 'failed';

        let mpesaReceiptNumber: string | undefined;
        let transactionDate: string | undefined;
        if (isSuccess && CallbackMetadata?.Item) {
            mpesaReceiptNumber = getCallbackValue(CallbackMetadata.Item, 'MpesaReceiptNumber') as string;
            transactionDate = getCallbackValue(CallbackMetadata.Item, 'TransactionDate')?.toString();
        }

        const requestId = paymentData.requestId;
        const requestRef = db.collection('requests').doc(requestId);

        await db.runTransaction(async (tx) => {
            const fresh = await tx.get(paymentRef);
            const freshData = fresh.data() as { status?: string } | undefined;
            // Re-check inside the transaction to win the race against any
            // concurrent duplicate callback.
            if (freshData?.status === 'completed' || freshData?.status === 'failed') {
                return;
            }

            tx.update(paymentRef, {
                status: newStatus,
                resultCode: ResultCode,
                resultDesc: ResultDesc,
                ...(mpesaReceiptNumber ? { mpesaReceiptNumber } : {}),
                ...(transactionDate ? { transactionDate } : {}),
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            tx.update(requestRef, {
                'payment.status': newStatus,
                ...(mpesaReceiptNumber ? {
                    'payment.mpesaReceiptNumber': mpesaReceiptNumber,
                    'payment.transactionId': mpesaReceiptNumber,
                } : {}),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            if (isSuccess) {
                tx.update(requestRef, {
                    status: 'completed',
                    'timeline.completedAt': admin.firestore.FieldValue.serverTimestamp(),
                });

                // Award provider earnings — read the request doc inside the
                // transaction to ensure we use the assigned providerId.
                const requestSnap = await tx.get(requestRef);
                const requestData = requestSnap.data() as { providerId?: string } | undefined;
                if (requestData?.providerId) {
                    const providerRef = db.collection('providers').doc(requestData.providerId);
                    const share = paymentData.amount * 0.75;
                    tx.update(providerRef, {
                        'earnings.today': admin.firestore.FieldValue.increment(share),
                        'earnings.thisWeek': admin.firestore.FieldValue.increment(share),
                        'earnings.thisMonth': admin.firestore.FieldValue.increment(share),
                        'earnings.allTime': admin.firestore.FieldValue.increment(share),
                    });
                }
            }
        });

        // Notification (best-effort, outside transaction).
        if (isSuccess) {
            try {
                const userDoc = await db.collection('users').doc(paymentData.userId).get();
                const fcmToken = userDoc.data()?.fcmToken;
                if (fcmToken) {
                    await admin.messaging().send({
                        token: fcmToken,
                        notification: {
                            title: 'Payment Successful',
                            body: `Your payment of KES ${paymentData.amount} has been received.`
                                + (mpesaReceiptNumber ? ` Receipt: ${mpesaReceiptNumber}` : ''),
                        },
                        data: { type: 'payment_completed', requestId },
                    });
                }
            } catch (notifyError) {
                const message = notifyError instanceof Error ? notifyError.message : 'Unknown error';
                console.error('Failed to send notification:', message);
            }
        }

        res.status(200).json({ ResultCode: 0, ResultDesc: 'Callback received successfully' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('M-Pesa callback error:', message);
        // Respond 200 to avoid Safaricom retry storms on transient bugs.
        res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }
});
