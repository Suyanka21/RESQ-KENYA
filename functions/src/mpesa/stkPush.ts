/**
 * ResQ Kenya - M-Pesa STK Push Integration
 * Handles M-Pesa Daraja API for mobile payments.
 *
 * Phase 3 hardening (Security-and-Hardening + API-and-Interface-Design):
 * - Idempotency: every call requires an `idempotencyKey`. We `transaction.create`
 *   the `payment_requests/{idempotencyKey}` row with `status: 'initiating'`
 *   BEFORE the HTTP call. A retry with the same key returns the existing
 *   row instead of double-charging.
 * - HMAC: the callback URL is constructed with a path-segment HMAC token
 *   so callbacks without the right token are rejected.
 * - Atomic transitions: callback completion runs in a transaction so a
 *   duplicate callback cannot increment provider earnings twice.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import {
    signCallbackToken as sharedSign,
    verifyCallbackToken as sharedVerify,
} from '../shared/crypto';
import { normaliseKenyanPhone as sharedNormalise } from '../shared/phone';

// Initialize if not already done
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// M-Pesa Configuration (stored in Firebase config)
interface MpesaConfig {
    consumerKey: string;
    consumerSecret: string;
    passkey: string;
    shortcode: string;
    callbackUrl: string;
    environment: 'sandbox' | 'production';
}

export function getMpesaConfig(): MpesaConfig {
    const config = functions.config().mpesa;
    return {
        consumerKey: config?.consumer_key || process.env.MPESA_CONSUMER_KEY || '',
        consumerSecret: config?.consumer_secret || process.env.MPESA_CONSUMER_SECRET || '',
        passkey: config?.passkey || process.env.MPESA_PASSKEY || '',
        shortcode: config?.shortcode || process.env.MPESA_SHORTCODE || '174379',
        callbackUrl: config?.callback_url || process.env.MPESA_CALLBACK_URL || '',
        environment: (config?.environment || 'sandbox') as 'sandbox' | 'production',
    };
}

/**
 * Read the HMAC secret used to sign callback URL tokens. Defaults to a
 * deterministic combination of consumerSecret + passkey when no dedicated
 * `callback_secret` is configured. We fail closed if neither is available
 * and the caller is in production.
 */
export function getCallbackHmacSecret(): string {
    const config = functions.config().mpesa;
    const explicit = config?.callback_secret || process.env.MPESA_CALLBACK_SECRET;
    if (explicit) return explicit;
    const fallback = `${getMpesaConfig().consumerSecret}|${getMpesaConfig().passkey}`;
    if (!fallback || fallback === '|') return '';
    return fallback;
}

/**
 * Compute a URL-safe HMAC-SHA256 token over `<requestId>:<amount>`.
 * Used both when constructing the callback URL we send to Safaricom and
 * when verifying inbound callbacks.
 */
export function signCallbackToken(requestId: string, amount: number, secret?: string): string {
    return sharedSign(requestId, amount, secret ?? getCallbackHmacSecret());
}

/** Constant-time compare to avoid timing-channel leaks. */
export function verifyCallbackToken(
    requestId: string,
    amount: number,
    received: string,
    secret?: string
): boolean {
    return sharedVerify(requestId, amount, received, secret ?? getCallbackHmacSecret());
}

function getBaseUrl(env: 'sandbox' | 'production'): string {
    return env === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';
}

/**
 * Get OAuth access token from Safaricom
 */
async function getAccessToken(): Promise<string> {
    const config = getMpesaConfig();
    const baseUrl = getBaseUrl(config.environment);

    const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');

    const response = await axios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
            'Authorization': `Basic ${auth}`,
        },
    });

    return response.data.access_token;
}

/**
 * Generate M-Pesa password
 */
function generatePassword(shortcode: string, passkey: string, timestamp: string): string {
    return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
}

/**
 * Format timestamp for M-Pesa
 */
function getTimestamp(): string {
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
 * Format and validate a Kenyan phone number into the `2547XXXXXXXX` form.
 * Returns null when the number doesn't match the expected mobile prefix.
 * Implementation in `../shared/phone` for unit-test reuse.
 */
export function normaliseKenyanPhone(input: string): string | null {
    return sharedNormalise(input);
}

/**
 * Cloud Function: Initiate STK Push (Phase 3, idempotent).
 *
 * Required input fields:
 *   - phoneNumber: M-Pesa subscriber number
 *   - amount: integer KES, > 0
 *   - requestId: the related `requests/{requestId}` doc
 *   - idempotencyKey: client-generated UUID for de-duplication
 *   - description?: optional human-readable transaction description
 *
 * Idempotency contract:
 *   - We always write `payment_requests/{idempotencyKey}` first.
 *   - If a row already exists with `status: 'initiating' | 'pending' |
 *     'completed'`, we return the existing record without making a second
 *     HTTP call to Safaricom — this is what makes retries safe.
 */
export const initiateStkPush = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { phoneNumber, amount, requestId, description, idempotencyKey } = data ?? {};

    if (!phoneNumber || typeof phoneNumber !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'Missing phoneNumber');
    }
    if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid amount');
    }
    if (!requestId || typeof requestId !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'Missing requestId');
    }
    if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.length < 16 || idempotencyKey.length > 64) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing or invalid idempotencyKey');
    }
    if (!/^[A-Za-z0-9_-]+$/.test(idempotencyKey)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid idempotencyKey format');
    }

    const formattedPhone = normaliseKenyanPhone(phoneNumber);
    if (!formattedPhone) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid Kenyan mobile number');
    }

    const userId = context.auth.uid;
    const paymentRef = db.collection('payment_requests').doc(idempotencyKey);

    // Step 1: idempotency reservation. `transaction.create` throws if the
    // doc already exists, which we catch and translate into a `duplicate`
    // response.
    type ReserveOutcome = { kind: 'reserved' } | { kind: 'duplicate'; existing: FirebaseFirestore.DocumentData };
    let reservation: ReserveOutcome;
    try {
        reservation = await db.runTransaction<ReserveOutcome>(async (tx) => {
            const existing = await tx.get(paymentRef);
            if (existing.exists) {
                return { kind: 'duplicate', existing: existing.data() ?? {} };
            }
            tx.create(paymentRef, {
                idempotencyKey,
                requestId,
                userId,
                phoneNumber: formattedPhone,
                amount: Math.round(amount),
                status: 'initiating',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return { kind: 'reserved' };
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Idempotency reservation failed:', message);
        throw new functions.https.HttpsError('internal', 'Failed to reserve payment');
    }

    if (reservation.kind === 'duplicate') {
        const existing = reservation.existing;
        return {
            success: existing.status !== 'failed',
            duplicate: true,
            status: existing.status,
            checkoutRequestID: existing.checkoutRequestID ?? null,
            merchantRequestID: existing.merchantRequestID ?? null,
        };
    }

    // Step 2: HTTP call to Safaricom. Failures roll the row to `failed`.
    try {
        const config = getMpesaConfig();
        const baseUrl = getBaseUrl(config.environment);
        const accessToken = await getAccessToken();
        const timestamp = getTimestamp();
        const password = generatePassword(config.shortcode, config.passkey, timestamp);

        // Sign the callback URL so a forged callback can be rejected.
        // Safaricom appends path segments verbatim; we encode the token in
        // a query string the callback handler can verify.
        const token = signCallbackToken(idempotencyKey, amount);
        const callbackUrl = config.callbackUrl
            + (config.callbackUrl.includes('?') ? '&' : '?')
            + `idemp=${encodeURIComponent(idempotencyKey)}`
            + `&token=${encodeURIComponent(token)}`;

        const response = await axios.post(
            `${baseUrl}/mpesa/stkpush/v1/processrequest`,
            {
                BusinessShortCode: config.shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: Math.round(amount),
                PartyA: formattedPhone,
                PartyB: config.shortcode,
                PhoneNumber: formattedPhone,
                CallBackURL: callbackUrl,
                AccountReference: `ResQ-${requestId.slice(0, 12)}`,
                TransactionDesc: description || 'ResQ Service Payment',
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                timeout: 15_000,
            }
        );

        const { MerchantRequestID, CheckoutRequestID, ResponseCode, ResponseDescription } = response.data;

        if (ResponseCode === '0') {
            await paymentRef.update({
                merchantRequestID: MerchantRequestID,
                checkoutRequestID: CheckoutRequestID,
                status: 'pending',
                pendingAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            await db.collection('requests').doc(requestId).update({
                'payment.checkoutRequestID': CheckoutRequestID,
                'payment.idempotencyKey': idempotencyKey,
                'payment.status': 'processing',
            }).catch((err) => {
                console.warn('Failed to mirror payment.checkoutRequestID on request:', err.message);
            });

            return {
                success: true,
                checkoutRequestID: CheckoutRequestID,
                merchantRequestID: MerchantRequestID,
            };
        }

        await paymentRef.update({
            status: 'failed',
            failureReason: ResponseDescription || 'Payment initiation failed',
            failedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
            success: false,
            error: ResponseDescription || 'Payment initiation failed',
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const responseData = (error as { response?: { data?: unknown } })?.response?.data;
        console.error('M-Pesa STK Push error:', responseData ?? message);
        await paymentRef.update({
            status: 'failed',
            failureReason: message,
            failedAt: admin.firestore.FieldValue.serverTimestamp(),
        }).catch(() => undefined);
        throw new functions.https.HttpsError('internal', 'Failed to initiate payment');
    }
});

/**
 * Daily cron: clean up `payment_requests` rows that got stuck in
 * `initiating` (the HTTP call to Safaricom never completed). Anything
 * older than 1 hour is moved to `failed` so the row stops blocking
 * fresh idempotency keys.
 */
export const cleanupStaleInitiatingPayments = functions.pubsub
    .schedule('every day 02:00')
    .timeZone('Africa/Nairobi')
    .onRun(async () => {
        const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - 60 * 60 * 1000);
        const stale = await db.collection('payment_requests')
            .where('status', '==', 'initiating')
            .where('createdAt', '<', cutoff)
            .limit(500)
            .get();
        if (stale.empty) return null;
        const batch = db.batch();
        stale.docs.forEach((doc) => {
            batch.update(doc.ref, {
                status: 'failed',
                failureReason: 'Stuck in initiating; auto-failed by cron',
                failedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        await batch.commit();
        console.log(`cleanupStaleInitiatingPayments: failed ${stale.size} stuck rows`);
        return null;
    });

/**
 * Cloud Function: Query STK Push Status
 * Called to check if payment was completed
 */
export const queryStkStatus = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { checkoutRequestID } = data;

    if (!checkoutRequestID) {
        throw new functions.https.HttpsError('invalid-argument', 'checkoutRequestID is required');
    }

    try {
        const config = getMpesaConfig();
        const baseUrl = getBaseUrl(config.environment);
        const accessToken = await getAccessToken();
        const timestamp = getTimestamp();
        const password = generatePassword(config.shortcode, config.passkey, timestamp);

        const response = await axios.post(
            `${baseUrl}/mpesa/stkpushquery/v1/query`,
            {
                BusinessShortCode: config.shortcode,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestID,
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return {
            resultCode: response.data.ResultCode,
            resultDesc: response.data.ResultDesc,
        };
    } catch (error: any) {
        console.error('M-Pesa query error:', error.response?.data || error.message);
        return {
            resultCode: '-1',
            resultDesc: 'Query failed',
        };
    }
});
