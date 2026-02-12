/**
 * ResQ Kenya - M-Pesa STK Push Integration
 * Handles M-Pesa Daraja API for mobile payments
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

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

function getMpesaConfig(): MpesaConfig {
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
 * Cloud Function: Initiate STK Push
 * Called by the mobile app to trigger M-Pesa payment prompt
 */
export const initiateStkPush = functions.https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { phoneNumber, amount, requestId, description } = data;

    // Validate inputs
    if (!phoneNumber || !amount || !requestId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Format phone number (254XXXXXXXXX)
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('254')) {
        formattedPhone = '254' + formattedPhone;
    }

    try {
        const config = getMpesaConfig();
        const baseUrl = getBaseUrl(config.environment);
        const accessToken = await getAccessToken();
        const timestamp = getTimestamp();
        const password = generatePassword(config.shortcode, config.passkey, timestamp);

        // Make STK Push request
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
                CallBackURL: config.callbackUrl,
                AccountReference: `ResQ-${requestId.slice(0, 12)}`,
                TransactionDesc: description || 'ResQ Service Payment',
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const { MerchantRequestID, CheckoutRequestID, ResponseCode, ResponseDescription } = response.data;

        if (ResponseCode === '0') {
            // Store payment request in Firestore
            await db.collection('payment_requests').doc(requestId).set({
                merchantRequestID: MerchantRequestID,
                checkoutRequestID: CheckoutRequestID,
                phoneNumber: formattedPhone,
                amount,
                status: 'pending',
                userId: context.auth.uid,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Update service request with payment info
            await db.collection('requests').doc(requestId).update({
                'payment.checkoutRequestID': CheckoutRequestID,
                'payment.status': 'processing',
            });

            return {
                success: true,
                checkoutRequestID: CheckoutRequestID,
                merchantRequestID: MerchantRequestID,
            };
        } else {
            console.error('M-Pesa STK Push failed:', ResponseDescription);
            return {
                success: false,
                error: ResponseDescription || 'Payment initiation failed',
            };
        }
    } catch (error: any) {
        console.error('M-Pesa STK Push error:', error.response?.data || error.message);
        throw new functions.https.HttpsError('internal', 'Failed to initiate payment');
    }
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
