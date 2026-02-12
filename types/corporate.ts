// ResQ Kenya - Corporate/B2B Types
// For fleet management and corporate accounts in Kenya

// ============================================================================
// CORPORATE ACCOUNT
// ============================================================================

export type SubscriptionTier = 'starter' | 'business' | 'enterprise';
export type SubscriptionStatus = 'active' | 'pending' | 'suspended' | 'cancelled';
export type IndustryType = 'logistics' | 'transport' | 'manufacturing' | 'retail' | 'insurance' | 'government' | 'other';

export interface CorporateAccount {
    id: string;
    companyName: string;
    kraPin: string;
    registrationNumber: string;
    industry: IndustryType;
    contactPerson: { name: string; email: string; phone: string; position: string };
    billingEmail: string;
    billingAddress: { street: string; city: string; county: string; postalCode: string };
    subscription: {
        tier: SubscriptionTier;
        status: SubscriptionStatus;
        startDate: Date;
        nextBillingDate: Date;
        monthlyRate: number;
        vehicleLimit: number;
        usageThisMonth: number;
    };
    vehicles: string[];
    employees: string[];
    primaryAdminId: string;
    settings: {
        autoApproveRequests: boolean;
        requireManagerApproval: boolean;
        spendingLimitPerRequest: number;
        monthlyBudget: number;
        allowedServiceTypes: string[];
        notificationEmails: string[];
    };
    stats: {
        totalRequests: number;
        totalSpend: number;
        monthlySpend: number;
        activeVehicles: number;
        averageResponseTime: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================================
// CORPORATE VEHICLE
// ============================================================================

export type VehicleStatus = 'active' | 'maintenance' | 'inactive' | 'decommissioned';
export type VehicleType = 'sedan' | 'suv' | 'pickup' | 'van' | 'truck' | 'bus' | 'motorcycle' | 'other';

export interface CorporateVehicle {
    id: string;
    corporateId: string;
    registrationNumber: string;
    make: string;
    model: string;
    year: number;
    vehicleType: VehicleType;
    color: string;
    fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
    assignedDriverId?: string;
    department?: string;
    costCenter?: string;
    status: VehicleStatus;
    insurance: { provider: string; policyNumber: string; expiryDate: Date };
    serviceHistory: Array<{ requestId: string; date: Date; serviceType: string; cost: number }>;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================================
// CORPORATE EMPLOYEE
// ============================================================================

export type EmployeeRole = 'admin' | 'fleet_manager' | 'driver' | 'viewer';

export interface CorporateEmployee {
    id: string;
    corporateId: string;
    userId: string;
    name: string;
    email: string;
    phone: string;
    department?: string;
    role: EmployeeRole;
    permissions: {
        canRequestService: boolean;
        canApproveRequests: boolean;
        canViewAllRequests: boolean;
        canManageVehicles: boolean;
        canManageEmployees: boolean;
        canViewBilling: boolean;
        canExportReports: boolean;
    };
    spendingLimit?: number;
    monthlyLimit?: number;
    assignedVehicles: string[];
    status: 'active' | 'suspended' | 'removed';
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================================
// CORPORATE INVOICE
// ============================================================================

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface CorporateInvoice {
    id: string;
    invoiceNumber: string;
    corporateId: string;
    billingPeriod: { start: Date; end: Date };
    lineItems: Array<{ description: string; quantity: number; unitPrice: number; amount: number }>;
    subtotal: number;
    vatAmount: number;
    totalAmount: number;
    amountPaid: number;
    amountDue: number;
    status: InvoiceStatus;
    dueDate: Date;
    paidDate?: Date;
    payments: Array<{ date: Date; amount: number; method: string; reference: string }>;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate Kenya vehicle registration format
 * Format: KXX 123X or KXX 123 (older format)
 */
export function isValidKenyaPlate(plate: string): boolean {
    if (!plate || typeof plate !== 'string') return false;
    const modernFormat = /^K[A-Z]{2}\s?\d{3}[A-Z]$/i;
    const oldFormat = /^K[A-Z]{2}\s?\d{3}$/i;
    const cleanPlate = plate.replace(/\s+/g, '').toUpperCase();
    return modernFormat.test(cleanPlate) || oldFormat.test(cleanPlate);
}

/**
 * Validate KRA PIN format
 * Format: P or A followed by 9 digits and a letter
 */
export function isValidKraPin(pin: string): boolean {
    if (!pin || typeof pin !== 'string') return false;
    const kraFormat = /^[PA]\d{9}[A-Z]$/i;
    return kraFormat.test(pin);
}

/**
 * Get default permissions for a role
 */
export function getDefaultPermissions(role: EmployeeRole): CorporateEmployee['permissions'] {
    const permissions = {
        admin: {
            canRequestService: true,
            canApproveRequests: true,
            canViewAllRequests: true,
            canManageVehicles: true,
            canManageEmployees: true,
            canViewBilling: true,
            canExportReports: true,
        },
        fleet_manager: {
            canRequestService: true,
            canApproveRequests: true,
            canViewAllRequests: true,
            canManageVehicles: true,
            canManageEmployees: false,
            canViewBilling: true,
            canExportReports: true,
        },
        driver: {
            canRequestService: true,
            canApproveRequests: false,
            canViewAllRequests: false,
            canManageVehicles: false,
            canManageEmployees: false,
            canViewBilling: false,
            canExportReports: false,
        },
        viewer: {
            canRequestService: false,
            canApproveRequests: false,
            canViewAllRequests: true,
            canManageVehicles: false,
            canManageEmployees: false,
            canViewBilling: true,
            canExportReports: true,
        },
    };
    return permissions[role];
}

/**
 * Calculate subscription pricing (KES)
 */
export function getSubscriptionPrice(tier: SubscriptionTier): {
    monthly: number;
    vehicleLimit: number;
    features: string[];
} {
    const pricing = {
        starter: {
            monthly: 50000,
            vehicleLimit: 10,
            features: ['Up to 10 vehicles', 'Basic fleet tracking', 'Email support', 'Monthly reports'],
        },
        business: {
            monthly: 150000,
            vehicleLimit: 50,
            features: ['Up to 50 vehicles', 'Priority response (15 min)', 'Dedicated account manager', 'Real-time analytics', 'API access'],
        },
        enterprise: {
            monthly: 250000,
            vehicleLimit: 9999,
            features: ['Unlimited vehicles', 'Guaranteed 10 min response', 'Custom SLA', '24/7 phone support', 'White-label options', 'Custom integrations'],
        },
    };
    return pricing[tier];
}
