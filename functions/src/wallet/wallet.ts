/**
 * ResQ Kenya - Wallet & Ledger callables (Phase 5).
 *
 * Skills: Security-and-Hardening (atomic balance updates with idempotent
 * ledger entries; double-entry style — every credit/debit is logged so
 * the audit trail can be reconstructed), API-and-Interface-Design (typed
 * CallResult contracts), Trustless-System-Auditor (race-safe topup +
 * deduct, fail closed on insufficient funds).
 *
 * Layout:
 *   wallets/{uid}
 *     {
 *       balance: number (KES integer minor units NOT used; we keep KES whole),
 *       currency: 'KES',
 *       updatedAt: Timestamp,
 *     }
 *
 *   wallets/{uid}/ledger/{entryId}
 *     {
 *       kind: 'credit' | 'debit',
 *       amount: number, // positive integer
 *       reason: 'topup' | 'service_payment' | 'refund' | 'adjustment',
 *       refId?: string, // e.g. requestId or M-Pesa receipt
 *       idempotencyKey: string, // doc id IS the idempotency key
 *       balanceAfter: number,
 *       createdAt: Timestamp,
 *     }
 *
 * Idempotency: callers supply `idempotencyKey`; we use it as the ledger
 * doc id so a retry creates the same entry with no balance double-update.
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { ok, err, CallResult, isValidIdempotencyKey } from '../shared/api';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

type WalletErrorCode =
    | 'unauthenticated'
    | 'invalid_input'
    | 'insufficient_funds'
    | 'duplicate'
    | 'internal';

interface TopupInput {
    amount: number;
    idempotencyKey: string;
    refId?: string;
    reason?: 'topup' | 'refund' | 'adjustment';
}

interface DeductInput {
    amount: number;
    idempotencyKey: string;
    refId?: string;
    reason?: 'service_payment' | 'adjustment';
}

function validateAmount(amount: unknown): amount is number {
    return typeof amount === 'number' && Number.isFinite(amount) && amount > 0 && amount < 10_000_000;
}

/**
 * Pure helper. Given the current balance and a delta, return the new
 * balance or `null` if the operation would overdraw.
 */
export function applyDelta(currentBalance: number, delta: number): number | null {
    const next = currentBalance + delta;
    if (next < 0) return null;
    return next;
}

export const topupWallet = functions.https.onCall(
    async (data: unknown, context): Promise<CallResult<{ balance: number; entryId: string }, WalletErrorCode>> => {
        if (!context.auth) return err('unauthenticated', 'Sign in required');
        if (!data || typeof data !== 'object') return err('invalid_input', 'Topup data is required');
        const input = data as Partial<TopupInput>;
        if (!validateAmount(input.amount)) return err('invalid_input', 'amount must be a positive number');
        if (!isValidIdempotencyKey(input.idempotencyKey)) {
            return err('invalid_input', 'idempotencyKey must be 16-64 chars [A-Za-z0-9_-]');
        }
        const uid = context.auth.uid;
        const reason = input.reason ?? 'topup';
        try {
            const walletRef = db.collection('wallets').doc(uid);
            const ledgerRef = walletRef.collection('ledger').doc(input.idempotencyKey);

            const result = await db.runTransaction<
                | { kind: 'created'; balance: number }
                | { kind: 'duplicate'; balance: number }
            >(async (tx) => {
                const [walletSnap, ledgerSnap] = await Promise.all([
                    tx.get(walletRef),
                    tx.get(ledgerRef),
                ]);
                if (ledgerSnap.exists) {
                    const balance = (walletSnap.data()?.balance as number | undefined) ?? 0;
                    return { kind: 'duplicate', balance };
                }
                const currentBalance = (walletSnap.data()?.balance as number | undefined) ?? 0;
                const newBalance = applyDelta(currentBalance, input.amount as number);
                if (newBalance === null) {
                    // applyDelta only returns null on overdraft; topup deltas are
                    // always positive, so this branch is defensive only.
                    throw new Error('insufficient_funds');
                }
                tx.set(walletRef, {
                    balance: newBalance,
                    currency: 'KES',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
                tx.create(ledgerRef, {
                    kind: 'credit',
                    amount: input.amount as number,
                    reason,
                    refId: input.refId ?? null,
                    idempotencyKey: input.idempotencyKey,
                    balanceAfter: newBalance,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                return { kind: 'created', balance: newBalance };
            });

            return ok({ balance: result.balance, entryId: input.idempotencyKey as string });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('topupWallet error:', message);
            return err('internal', 'Failed to topup wallet');
        }
    }
);

export const deductWallet = functions.https.onCall(
    async (data: unknown, context): Promise<CallResult<{ balance: number; entryId: string }, WalletErrorCode>> => {
        if (!context.auth) return err('unauthenticated', 'Sign in required');
        if (!data || typeof data !== 'object') return err('invalid_input', 'Deduct data is required');
        const input = data as Partial<DeductInput>;
        if (!validateAmount(input.amount)) return err('invalid_input', 'amount must be a positive number');
        if (!isValidIdempotencyKey(input.idempotencyKey)) {
            return err('invalid_input', 'idempotencyKey must be 16-64 chars [A-Za-z0-9_-]');
        }
        const uid = context.auth.uid;
        const reason = input.reason ?? 'service_payment';
        try {
            const walletRef = db.collection('wallets').doc(uid);
            const ledgerRef = walletRef.collection('ledger').doc(input.idempotencyKey);

            const result = await db.runTransaction<
                | { kind: 'created'; balance: number }
                | { kind: 'duplicate'; balance: number }
                | { kind: 'insufficient_funds'; balance: number }
            >(async (tx) => {
                const [walletSnap, ledgerSnap] = await Promise.all([
                    tx.get(walletRef),
                    tx.get(ledgerRef),
                ]);
                if (ledgerSnap.exists) {
                    const balance = (walletSnap.data()?.balance as number | undefined) ?? 0;
                    return { kind: 'duplicate', balance };
                }
                const currentBalance = (walletSnap.data()?.balance as number | undefined) ?? 0;
                const newBalance = applyDelta(currentBalance, -(input.amount as number));
                if (newBalance === null) {
                    return { kind: 'insufficient_funds', balance: currentBalance };
                }
                tx.set(walletRef, {
                    balance: newBalance,
                    currency: 'KES',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
                tx.create(ledgerRef, {
                    kind: 'debit',
                    amount: input.amount as number,
                    reason,
                    refId: input.refId ?? null,
                    idempotencyKey: input.idempotencyKey,
                    balanceAfter: newBalance,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                return { kind: 'created', balance: newBalance };
            });

            if (result.kind === 'insufficient_funds') {
                return err('insufficient_funds', 'Wallet balance is too low');
            }
            return ok({ balance: result.balance, entryId: input.idempotencyKey as string });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('deductWallet error:', message);
            return err('internal', 'Failed to deduct from wallet');
        }
    }
);

export const getWalletBalance = functions.https.onCall(
    async (_data: unknown, context): Promise<CallResult<{ balance: number; currency: string }, WalletErrorCode>> => {
        if (!context.auth) return err('unauthenticated', 'Sign in required');
        try {
            const snap = await db.collection('wallets').doc(context.auth.uid).get();
            const balance = (snap.data()?.balance as number | undefined) ?? 0;
            return ok({ balance, currency: 'KES' });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('getWalletBalance error:', message);
            return err('internal', 'Failed to read wallet');
        }
    }
);
