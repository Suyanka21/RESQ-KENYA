// ResQ Kenya - Corporate Service (Client-side)
// Handles corporate account operations via Firebase Cloud Functions

import { httpsCallable, getFunctions } from 'firebase/functions';
import { doc, onSnapshot, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import app from '../config/firebase';
import type {
    CorporateAccount,
    CorporateVehicle,
    CorporateEmployee,
    CorporateInvoice,
    SubscriptionTier,
    IndustryType,
    EmployeeRole,
} from '../types/corporate';

// Re-export validation functions from types
export { isValidKenyaPlate, isValidKraPin, getSubscriptionPrice } from '../types/corporate';

// Initialize Firebase Functions
const functions = getFunctions(app, 'us-central1');

// ============================================================================
// CORPORATE ACCOUNT OPERATIONS
// ============================================================================

export async function createCorporateAccount(data: {
    companyName: string;
    kraPin: string;
    registrationNumber?: string;
    industry?: IndustryType;
    contactPerson: { name: string; email: string; phone: string; position?: string };
    billingEmail?: string;
    billingAddress?: { street: string; city: string; county: string; postalCode: string };
    subscriptionTier?: SubscriptionTier;
}): Promise<{ success: boolean; accountId?: string; error?: string }> {
    try {
        const createAccount = httpsCallable(functions, 'createCorporateAccount');
        const result = await createAccount(data);
        return result.data as { success: boolean; accountId?: string };
    } catch (error: any) {
        console.error('Create corporate account error:', error);
        return { success: false, error: error.message };
    }
}

export async function getCorporateStats(corporateId: string): Promise<{
    success: boolean;
    stats?: {
        activeVehicles: number;
        totalEmployees: number;
        requestsThisMonth: number;
        completedThisMonth: number;
        monthlySpend: number;
        monthlyBudget: number;
        budgetUsagePercent: number;
    };
    error?: string;
}> {
    try {
        const getStats = httpsCallable(functions, 'getCorporateStats');
        const result = await getStats({ corporateId });
        return result.data as any;
    } catch (error: any) {
        console.error('Get corporate stats error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// VEHICLE OPERATIONS
// ============================================================================

export async function addCorporateVehicle(data: {
    corporateId: string;
    registrationNumber: string;
    make: string;
    model: string;
    year?: number;
    vehicleType?: string;
    color?: string;
    fuelType?: 'petrol' | 'diesel' | 'electric' | 'hybrid';
}): Promise<{ success: boolean; vehicleId?: string; error?: string }> {
    try {
        const addVehicle = httpsCallable(functions, 'addCorporateVehicle');
        const result = await addVehicle(data);
        return result.data as { success: boolean; vehicleId?: string };
    } catch (error: any) {
        console.error('Add vehicle error:', error);
        return { success: false, error: error.message };
    }
}

export async function getCorporateVehicles(corporateId: string): Promise<CorporateVehicle[]> {
    try {
        const q = query(
            collection(db, 'corporate_vehicles'),
            where('corporateId', '==', corporateId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CorporateVehicle));
    } catch (error) {
        console.error('Get vehicles error:', error);
        return [];
    }
}

export function subscribeToVehicles(
    corporateId: string,
    callback: (vehicles: CorporateVehicle[]) => void
): () => void {
    const q = query(
        collection(db, 'corporate_vehicles'),
        where('corporateId', '==', corporateId)
    );
    return onSnapshot(q, (snapshot) => {
        const vehicles = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CorporateVehicle));
        callback(vehicles);
    });
}

// ============================================================================
// EMPLOYEE OPERATIONS
// ============================================================================

export async function addCorporateEmployee(data: {
    corporateId: string;
    name: string;
    email: string;
    phone?: string;
    role?: EmployeeRole;
    department?: string;
    assignedVehicles?: string[];
    spendingLimit?: number;
}): Promise<{ success: boolean; employeeId?: string; error?: string }> {
    try {
        const addEmployee = httpsCallable(functions, 'addCorporateEmployee');
        const result = await addEmployee(data);
        return result.data as { success: boolean; employeeId?: string };
    } catch (error: any) {
        console.error('Add employee error:', error);
        return { success: false, error: error.message };
    }
}

export async function getCorporateEmployees(corporateId: string): Promise<CorporateEmployee[]> {
    try {
        const q = query(
            collection(db, 'corporate_employees'),
            where('corporateId', '==', corporateId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CorporateEmployee));
    } catch (error) {
        console.error('Get employees error:', error);
        return [];
    }
}

// ============================================================================
// BILLING OPERATIONS
// ============================================================================

export async function getPaymentHistory(corporateId: string): Promise<{
    success: boolean;
    invoices?: CorporateInvoice[];
    error?: string;
}> {
    try {
        const getHistory = httpsCallable(functions, 'getPaymentHistory');
        const result = await getHistory({ corporateId });
        return result.data as any;
    } catch (error: any) {
        console.error('Get payment history error:', error);
        return { success: false, error: error.message };
    }
}

export async function recordPayment(data: {
    invoiceId: string;
    amount: number;
    method: 'mpesa_b2b' | 'bank_transfer' | 'cheque';
    reference: string;
}): Promise<{ success: boolean; newStatus?: string; amountDue?: number; error?: string }> {
    try {
        const recordPmt = httpsCallable(functions, 'recordPayment');
        const result = await recordPmt(data);
        return result.data as any;
    } catch (error: any) {
        console.error('Record payment error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// SERVICE REQUEST FOR CORPORATE
// ============================================================================

export async function createCorporateServiceRequest(data: {
    corporateId: string;
    vehicleId: string;
    serviceType: string;
    customerLocation: {
        coordinates: { latitude: number; longitude: number };
        address: string;
    };
    notes?: string;
}): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
        const createRequest = httpsCallable(functions, 'createServiceRequest');
        const result = await createRequest({ ...data, isCorporate: true });
        return result.data as { success: boolean; requestId?: string };
    } catch (error: any) {
        console.error('Create corporate request error:', error);
        return { success: false, error: error.message };
    }
}

export async function getCorporateRequests(corporateId: string): Promise<any[]> {
    try {
        const q = query(
            collection(db, 'requests'),
            where('corporateId', '==', corporateId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error('Get corporate requests error:', error);
        return [];
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format KES currency
 */
export function formatKES(amount: number): string {
    return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
}

/**
 * Calculate VAT (16%)
 */
export function calculateVAT(amount: number): { subtotal: number; vat: number; total: number } {
    const vat = Math.round(amount * 0.16);
    return { subtotal: amount, vat, total: amount + vat };
}

/**
 * Format Kenya vehicle plate for display (add space)
 */
export function formatKenyaPlate(plate: string): string {
    const clean = plate.replace(/\s+/g, '').toUpperCase();
    if (clean.length >= 6) {
        return `${clean.slice(0, 3)} ${clean.slice(3)}`;
    }
    return clean;
}
