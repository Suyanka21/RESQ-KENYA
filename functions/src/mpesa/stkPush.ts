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
 * Detect the Firebase Cloud Functions emulator the way the official docs
 * recommend: the runtime injects `FUNCTIONS_EMULATOR='true'` in the function
 * process. Production runtimes never set this.
 * https://firebase.google.com/docs/emulator-suite/connect_functions
 */
function isEmulator(): boolean {
    return process.env['FUNCTIONS_EMULATOR'] === 'true';
}

/**
 * Read the HMAC secret used to sign callback URL tokens.
 *
 * Phase 4 (audit-v2 §N-MED-2) — REMOVED the production fallback that
 * derived `${consumerSecret}|${passkey}` because both components are
 * sent on the wire to Safaricom on every STK push. A leaked Daraja
 * sandbox log or Safaricom log line would also leak the HMAC key,
 * defeating the entire point of using a separate signing key.
 *
 * Fails CLOSED in production: if `callback_secret` is unset, the
 * function throws on first call and the STK push never goes out.
 * The emulator path is preserved so local sandbox flows keep working
 * without a real secret.
 *
 * Skills: Security-and-Hardening (least privilege; signing material
 * MUST NOT be derivable from over-the-wire components),
 * API-and-Interface-Design (fail-closed on missing config rather
 * than silently degrading), TRUSTLESS-AUDITOR (assumes Daraja
 * logs/sandbox dumps will eventually leak — design for the leak).
 */
export function getCallbackHmacSecret(): string {
    const config = functions.config().mpesa;
    const explicit = config?.callback_secret || process.env['MPESA_CALLBACK_SECRET'];
    if (explicit && typeof explicit === 'string' && explicit.length > 0) {
        return explicit;
    }
    if (isEmulator()) {
        // Emulator without secrets: stable but obviously-non-secret value
        // so dev tooling keeps working without HMAC verification.
        return 'emulator-callback-secret';
    }
    throw new Error(
        'M-Pesa callback HMAC secret is not configured. Set '
        + 'functions:config:mpesa.callback_secret (or env '
        + 'MPESA_CALLBACK_SECRET) to a fresh random value before '
        + 'deploying. The previous consumer_secret+passkey '
        + 'derivation has been removed (audit-v2 N-MED-2) because '
        + 'both fields are sent on the wire to Safaricom on every '
        + 'STK push.'
    );
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

    // Phase 3 (B-MED-8): explicit timeout. Without it Cloud Functions
    // wait forever on a hung Safaricom OAuth socket and burn the whole
    // function timeout, blocking the caller (and idempotency row).
    const response = await axios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
            'Authorization': `Basic ${auth}`,
        },
        timeout: 10_000,
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
            // Phase 4 (audit-v2 §N-MED-10) — the two writes below MUST
            // land atomically. Pre-fix: paymentRef.update ran first,
            // then requestRef.update ran with a `.catch(swallow)`. If
            // the mirror failed, `payment_requests/{key}` said
            // `pending` while `requests/{id}.payment.status` stayed at
            // its initial value (`failed`/unset), the customer's
            // tracking screen drifted from the source of truth, and
            // the next dispatch decision read a stale payment state.
            //
            // Using a Firestore WriteBatch makes the two writes
            // atomic per the SDK's guarantees: either both succeed or
            // both fail. If the batch fails after the STK push
            // already went out, the customer sees a clear error and
            // can retry — the next attempt's idempotency key gates
            // the duplicate (audit-v2 §X-1) and the stale-payment
            // sweeper (audit-v2 §N-HIGH-6) clears the orphan row.
            const batch = db.batch();
            batch.update(paymentRef, {
                merchantRequestID: MerchantRequestID,
                checkoutRequestID: CheckoutRequestID,
                status: 'pending',
                pendingAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            batch.update(db.collection('requests').doc(requestId), {
                'payment.checkoutRequestID': CheckoutRequestID,
                'payment.idempotencyKey': idempotencyKey,
                'payment.status': 'processing',
            });
            await batch.commit();

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
 *
 * Phase 4 (audit-v2 §N-HIGH-6) — pagination.
 *
 * The pre-fix version capped the run at the first 500 stale rows. If a
 * Safaricom outage stalled more than 500 payments overnight, the surplus
 * stayed in `initiating` forever and continued to short-circuit fresh
 * idempotency keys with `duplicate: true, status: 'initiating'` —
 * customers retrying after the outage would silently keep getting "in
 * progress" for a key that would never resolve. The audit recommended
 * paginating with a stable cursor (createdAt < cutoff) until the page
 * is empty, capped at N pages per run so a runaway loop can't burn the
 * cron's wall-clock budget. Mirrors the pagination pattern in
 * `functions/src/services/triggers.ts:107-117` (resetDailyEarnings).
 *
 * Skills: Source-Driven-Development (Firestore paginated queries —
 * https://firebase.google.com/docs/firestore/query-data/query-cursors),
 * Security-and-Hardening (cap + metric so a runaway never blocks the
 * function host's other scheduled work).
 */
// CodeRabbit feedback (PR #9): 500 sits exactly on Firestore's
// batched-writes ceiling. Today we issue one update per doc per loop
// (well within limits), but a future contributor adding any
// secondary write inside the page-loop would silently break. Match
// the sibling `resetDailyEarnings` worker (PAGE_SIZE = 400) so the
// headroom is uniform across scheduled cleanups.
const STALE_PAYMENT_PAGE_SIZE = 400;
const STALE_PAYMENT_MAX_PAGES = 60; // 24k rows / run hard cap (~ unchanged)

export const cleanupStaleInitiatingPayments = functions.pubsub
    .schedule('every day 02:00')
    .timeZone('Africa/Nairobi')
    .onRun(async () => {
        const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - 60 * 60 * 1000);

        let totalFailed = 0;
        let pages = 0;
        // Order by createdAt so the cursor is stable across pages.
        // Each batch updates `status='failed'`, which removes it from the
        // `where status='initiating'` filter — so the next page's first
        // row is always genuinely older than the cursor, never the same
        // doc twice.
        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (pages >= STALE_PAYMENT_MAX_PAGES) {
                console.warn(
                    `[cleanupStaleInitiatingPayments] hit max pages (${STALE_PAYMENT_MAX_PAGES}); ` +
                    `failed=${totalFailed} so far, remaining will be picked up on the next run`
                );
                break;
            }

            const page = await db.collection('payment_requests')
                .where('status', '==', 'initiating')
                .where('createdAt', '<', cutoff)
                .orderBy('createdAt', 'asc')
                .limit(STALE_PAYMENT_PAGE_SIZE)
                .get();

            if (page.empty) break;

            const batch = db.batch();
            page.docs.forEach((doc) => {
                batch.update(doc.ref, {
                    status: 'failed',
                    failureReason: 'Stuck in initiating; auto-failed by cron',
                    failedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            });
            await batch.commit();

            totalFailed += page.size;
            pages += 1;

            // Defensive: if a page was short (< PAGE_SIZE), there are no
            // more matching rows. Break early instead of issuing one more
            // round-trip just to confirm `empty`.
            if (page.size < STALE_PAYMENT_PAGE_SIZE) break;
        }

        console.log(
            `cleanupStaleInitiatingPayments: failed ${totalFailed} stuck rows across ${pages} page(s)`
        );
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

        // Phase 3 (B-MED-8): explicit timeout — same rationale as
        // `getAccessToken`. The query endpoint can stall under load.
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
                timeout: 10_000,
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
