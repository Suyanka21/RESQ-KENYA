// ResQ Kenya - M-Pesa Payment Service (Client-side)
// Handles payment flow for the mobile app

import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import app from '../config/firebase';
import { generateIdempotencyKey, isValidIdempotencyKey } from '../types/api';

// Initialize Firebase Functions
const functions = getFunctions(app, 'us-central1'); // Adjust region as needed

// Payment status types
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface PaymentRequest {
    requestId: string;
    amount: number;
    phoneNumber: string;
    description?: string;
    /**
     * Phase 3 (B-CRIT-1): the `initiateStkPush` callable now requires this
     * field. Optional at the wrapper boundary so existing call-sites do not
     * break — `initiatePayment` auto-generates one via
     * `generateIdempotencyKey()` (from `types/api`) when omitted.
     */
    idempotencyKey?: string;
}

export interface PaymentResult {
    success: boolean;
    checkoutRequestID?: string;
    error?: string;
    /** True when the server short-circuited a duplicate request. */
    duplicate?: boolean;
    /** Echoed back so callers can persist it for retries. */
    idempotencyKey?: string;
}

export interface PaymentStatusResult {
    status: PaymentStatus;
    mpesaReceiptNumber?: string;
    transactionDate?: string;
}

/**
 * Demo mode toggle. Mirrors the `customer.service.ts` pattern: opt in via
 * `EXPO_PUBLIC_DEMO_MODE='true'` at build time. Default-OFF — production
 * builds talk to the real backend. Indirect access avoids
 * `babel-preset-expo`'s `process.env.EXPO_PUBLIC_*` constant-folding.
 */
const USE_DEMO_MODE: boolean = (() => {
    const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
    const flag = env ? env['EXPO_PUBLIC_DEMO_MODE'] : undefined;
    return flag === 'true' || flag === '1';
})();

/**
 * Initiate M-Pesa STK Push payment.
 *
 * Phase 3 (B-CRIT-1, X-1): payload now carries `idempotencyKey` to satisfy
 * the canonical `initiateStkPush` callable's validation (16-64 char
 * alphanumeric/underscore/dash). Auto-generated when callers omit it so
 * existing UI does not need to change. The key is echoed back on the
 * result so the UI can retry safely on transient failure.
 *
 * Demo mode (`EXPO_PUBLIC_DEMO_MODE=true`) routes through
 * `initiatePaymentDemo` for local development without M-Pesa credentials.
 */
export async function initiatePayment(payment: PaymentRequest): Promise<PaymentResult> {
    const idempotencyKey =
        payment.idempotencyKey && isValidIdempotencyKey(payment.idempotencyKey)
            ? payment.idempotencyKey
            : generateIdempotencyKey();

    if (USE_DEMO_MODE) {
        const demoResult = await initiatePaymentDemo(payment);
        return { ...demoResult, idempotencyKey };
    }

    try {
        const initiateStkPush = httpsCallable(functions, 'initiateStkPush');

        const result = await initiateStkPush({
            phoneNumber: payment.phoneNumber,
            amount: payment.amount,
            requestId: payment.requestId,
            description: payment.description || 'ResQ Service Payment',
            idempotencyKey,
        });

        const data = result.data as {
            success?: boolean;
            checkoutRequestID?: string | null;
            duplicate?: boolean;
            status?: string;
            error?: string;
        };

        if (data.success) {
            return {
                success: true,
                checkoutRequestID: data.checkoutRequestID ?? undefined,
                duplicate: data.duplicate === true,
                idempotencyKey,
            };
        }
        return {
            success: false,
            error: data.error || 'Payment initiation failed',
            idempotencyKey,
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to initiate payment';
        console.error('Payment initiation error:', message);
        return {
            success: false,
            error: message,
            idempotencyKey,
        };
    }
}

/**
 * Query payment status
 */
export async function queryPaymentStatus(checkoutRequestID: string): Promise<PaymentStatusResult> {
    try {
        const queryStkStatus = httpsCallable(functions, 'queryStkStatus');

        const result = await queryStkStatus({ checkoutRequestID });
        const data = result.data as any;

        if (data.resultCode === '0' || data.resultCode === 0) {
            return { status: 'completed' };
        } else if (data.resultCode === '1032') {
            return { status: 'cancelled' };
        } else {
            return { status: 'failed' };
        }
    } catch (error) {
        console.error('Payment status query error:', error);
        return { status: 'pending' };
    }
}

/**
 * Subscribe to payment status updates in real-time
 */
export function subscribeToPaymentStatus(
    requestId: string,
    callback: (status: PaymentStatusResult) => void
): () => void {
    const paymentRef = doc(db, 'payment_requests', requestId);

    return onSnapshot(paymentRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.data();
            callback({
                status: data.status as PaymentStatus,
                mpesaReceiptNumber: data.mpesaReceiptNumber,
                transactionDate: data.transactionDate,
            });
        }
    });
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number): string {
    return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
}

/**
 * Validate Kenyan phone number
 */
export function validatePhoneNumber(phone: string): boolean {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Check for valid Kenyan format
    if (cleaned.startsWith('254') && cleaned.length === 12) return true;
    if (cleaned.startsWith('0') && cleaned.length === 10) return true;
    if (cleaned.length === 9) return true;

    return false;
}

/**
 * Format phone number to international format
 */
export function formatPhoneForMpesa(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('254')) return cleaned;
    if (cleaned.startsWith('0')) return '254' + cleaned.slice(1);
    return '254' + cleaned;
}

// Demo mode payment (for testing without real M-Pesa)
export async function initiatePaymentDemo(payment: PaymentRequest): Promise<PaymentResult> {
    console.log('Demo payment initiated:', payment);

    // Simulate payment delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 80% success rate for demo
    const success = Math.random() > 0.2;

    return {
        success,
        checkoutRequestID: success ? `demo_${Date.now()}` : undefined,
        error: success ? undefined : 'Demo payment failed',
    };
}
