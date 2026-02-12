// ResQ Kenya - Transaction & Reconciliation Service
// Handles payment tracking, reconciliation, and financial reporting

import {
    collection, query, where, orderBy, getDocs,
    doc, getDoc, setDoc, updateDoc, serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Transaction status types
export type TransactionStatus =
    | 'pending'      // Payment initiated
    | 'processing'   // M-Pesa STK push sent
    | 'completed'    // Payment confirmed
    | 'failed'       // Payment failed
    | 'refunded'     // Customer refunded
    | 'disputed';    // Under dispute

export type TransactionType =
    | 'service_payment'   // Customer pays for service
    | 'provider_payout'   // Platform pays provider
    | 'refund'            // Customer refund
    | 'wallet_topup'      // Customer adds to wallet
    | 'wallet_withdraw';  // Provider withdraws earnings

export interface Transaction {
    id: string;
    type: TransactionType;
    status: TransactionStatus;
    amount: number;
    currency: 'KES';

    // Related entities
    userId?: string;
    providerId?: string;
    requestId?: string;

    // M-Pesa specific
    mpesaReceiptNumber?: string;
    mpesaTransactionDate?: string;
    phoneNumber?: string;

    // Breakdown
    breakdown?: {
        serviceAmount: number;      // Total service cost
        providerShare: number;      // 75% to provider
        platformShare: number;      // 20% to platform
        processingFee: number;      // 5% M-Pesa fee
    };

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;

    // Metadata
    description?: string;
    metadata?: Record<string, any>;
}

export interface ReconciliationReport {
    period: { start: Date; end: Date };
    totalTransactions: number;
    totalVolume: number;

    // By status
    completed: { count: number; amount: number };
    pending: { count: number; amount: number };
    failed: { count: number; amount: number };
    refunded: { count: number; amount: number };

    // Revenue breakdown
    platformRevenue: number;
    providerPayouts: number;
    processingFees: number;

    // By service type
    byServiceType: Record<string, { count: number; amount: number }>;

    // Discrepancies (if any)
    discrepancies: Array<{
        transactionId: string;
        issue: string;
        expectedAmount: number;
        actualAmount: number;
    }>;
}

// ============================================================================
// TRANSACTION OPERATIONS
// ============================================================================

/**
 * Create a new transaction record
 */
export async function createTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const transactionRef = doc(collection(db, 'transactions'));

    await setDoc(transactionRef, {
        ...data,
        id: transactionRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    return transactionRef.id;
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus,
    additionalData?: Partial<Transaction>
): Promise<void> {
    const transactionRef = doc(db, 'transactions', transactionId);

    const updates: Record<string, any> = {
        status,
        updatedAt: serverTimestamp(),
        ...additionalData,
    };

    if (status === 'completed') {
        updates.completedAt = serverTimestamp();
    }

    await updateDoc(transactionRef, updates);
}

/**
 * Get transaction by ID
 */
export async function getTransaction(transactionId: string): Promise<Transaction | null> {
    const transactionRef = doc(db, 'transactions', transactionId);
    const snapshot = await getDoc(transactionRef);

    if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as Transaction;
    }
    return null;
}

/**
 * Get transactions for a user
 */
export async function getUserTransactions(
    userId: string,
    limitCount: number = 50
): Promise<Transaction[]> {
    const q = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
}

/**
 * Get transactions for a provider
 */
export async function getProviderTransactions(
    providerId: string,
    limitCount: number = 50
): Promise<Transaction[]> {
    const q = query(
        collection(db, 'transactions'),
        where('providerId', '==', providerId),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
}

// ============================================================================
// RECONCILIATION
// ============================================================================

/**
 * Generate reconciliation report for a date range
 */
export async function generateReconciliationReport(
    startDate: Date,
    endDate: Date
): Promise<ReconciliationReport> {
    const q = query(
        collection(db, 'transactions'),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));

    // Initialize report
    const report: ReconciliationReport = {
        period: { start: startDate, end: endDate },
        totalTransactions: transactions.length,
        totalVolume: 0,
        completed: { count: 0, amount: 0 },
        pending: { count: 0, amount: 0 },
        failed: { count: 0, amount: 0 },
        refunded: { count: 0, amount: 0 },
        platformRevenue: 0,
        providerPayouts: 0,
        processingFees: 0,
        byServiceType: {},
        discrepancies: [],
    };

    // Process each transaction
    for (const tx of transactions) {
        report.totalVolume += tx.amount;

        // By status
        switch (tx.status) {
            case 'completed':
                report.completed.count++;
                report.completed.amount += tx.amount;
                break;
            case 'pending':
            case 'processing':
                report.pending.count++;
                report.pending.amount += tx.amount;
                break;
            case 'failed':
                report.failed.count++;
                report.failed.amount += tx.amount;
                break;
            case 'refunded':
                report.refunded.count++;
                report.refunded.amount += tx.amount;
                break;
        }

        // Revenue breakdown (only for completed service payments)
        if (tx.status === 'completed' && tx.type === 'service_payment' && tx.breakdown) {
            report.platformRevenue += tx.breakdown.platformShare;
            report.providerPayouts += tx.breakdown.providerShare;
            report.processingFees += tx.breakdown.processingFee;

            // Check for discrepancies
            const expectedTotal = tx.breakdown.providerShare + tx.breakdown.platformShare + tx.breakdown.processingFee;
            if (Math.abs(expectedTotal - tx.amount) > 1) { // Allow KES 1 rounding difference
                report.discrepancies.push({
                    transactionId: tx.id,
                    issue: 'Amount mismatch',
                    expectedAmount: expectedTotal,
                    actualAmount: tx.amount,
                });
            }
        }

        // By service type (for service payments)
        if (tx.type === 'service_payment' && tx.requestId) {
            // In production, you'd look up the request to get service type
            // For now, use metadata if available
            const serviceType = (tx.metadata?.serviceType as string) || 'unknown';
            if (!report.byServiceType[serviceType]) {
                report.byServiceType[serviceType] = { count: 0, amount: 0 };
            }
            report.byServiceType[serviceType].count++;
            report.byServiceType[serviceType].amount += tx.amount;
        }
    }

    return report;
}

/**
 * Calculate payment breakdown (for creating transactions)
 */
export function calculatePaymentBreakdown(serviceAmount: number): {
    serviceAmount: number;
    providerShare: number;
    platformShare: number;
    processingFee: number;
} {
    // ResQ commission structure:
    // Provider gets 75%
    // Platform gets 20%
    // M-Pesa processing fee: 5%

    const providerShare = Math.round(serviceAmount * 0.75);
    const platformShare = Math.round(serviceAmount * 0.20);
    const processingFee = Math.round(serviceAmount * 0.05);

    return {
        serviceAmount,
        providerShare,
        platformShare,
        processingFee,
    };
}

/**
 * Verify M-Pesa transaction (check if valid)
 */
export function validateMpesaReceipt(receipt: string): boolean {
    // M-Pesa receipts usually follow pattern like: ABC123XYZ
    // 10 alphanumeric characters
    const mpesaReceiptPattern = /^[A-Z0-9]{10}$/i;
    return mpesaReceiptPattern.test(receipt);
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
    return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
}

/**
 * Get provider earnings summary
 */
export async function getProviderEarningsSummary(providerId: string): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    pending: number;
}> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay.getTime() - startOfDay.getDay() * 86400000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all completed payouts for provider
    const q = query(
        collection(db, 'transactions'),
        where('providerId', '==', providerId),
        where('type', '==', 'service_payment'),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => doc.data() as Transaction);

    let today = 0, thisWeek = 0, thisMonth = 0, pending = 0;

    for (const tx of transactions) {
        const txDate = tx.createdAt instanceof Date ? tx.createdAt : (tx.createdAt as any)?.toDate?.();
        const providerAmount = tx.breakdown?.providerShare || (tx.amount * 0.75);

        if (tx.status === 'pending' || tx.status === 'processing') {
            pending += providerAmount;
        } else if (tx.status === 'completed' && txDate) {
            if (txDate >= startOfDay) today += providerAmount;
            if (txDate >= startOfWeek) thisWeek += providerAmount;
            if (txDate >= startOfMonth) thisMonth += providerAmount;
        }
    }

    return { today, thisWeek, thisMonth, pending };
}

// ============================================================================
// DEMO/MOCK DATA
// ============================================================================

/**
 * Get mock transactions for demo mode
 */
export function getMockTransactions(userId: string): Transaction[] {
    const now = new Date();

    return [
        {
            id: 'tx_1',
            type: 'service_payment',
            status: 'completed',
            amount: 3500,
            currency: 'KES',
            userId,
            requestId: 'req_1',
            mpesaReceiptNumber: 'ABC123XYZ4',
            mpesaTransactionDate: new Date(now.getTime() - 86400000 * 2).toISOString(),
            phoneNumber: '254700123456',
            breakdown: {
                serviceAmount: 3500,
                providerShare: 2625,
                platformShare: 700,
                processingFee: 175,
            },
            createdAt: new Date(now.getTime() - 86400000 * 2),
            updatedAt: new Date(now.getTime() - 86400000 * 2),
            completedAt: new Date(now.getTime() - 86400000 * 2),
            description: 'Towing service payment',
        },
        {
            id: 'tx_2',
            type: 'service_payment',
            status: 'completed',
            amount: 2000,
            currency: 'KES',
            userId,
            requestId: 'req_2',
            mpesaReceiptNumber: 'DEF456GHI7',
            phoneNumber: '254700123456',
            breakdown: {
                serviceAmount: 2000,
                providerShare: 1500,
                platformShare: 400,
                processingFee: 100,
            },
            createdAt: new Date(now.getTime() - 86400000 * 5),
            updatedAt: new Date(now.getTime() - 86400000 * 5),
            completedAt: new Date(now.getTime() - 86400000 * 5),
            description: 'Battery jumpstart payment',
        },
    ];
}
