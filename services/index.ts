// ResQ Kenya - Services Index
// Re-export all services for easy imports

// Authentication
export * from './auth.service';
export { useAuth, AuthProvider } from './AuthContext';

// Database (core Firestore operations)
export * from './firestore.service';
export * from './realtime.service';

// Location
export * from './location.service';

// Payments
export * from './payment.service';

// Transaction & Reconciliation
export {
    createTransaction,
    updateTransactionStatus,
    getTransaction,
    getUserTransactions,
    getProviderTransactions,
    generateReconciliationReport,
    calculatePaymentBreakdown,
    validateMpesaReceipt,
    formatCurrency,
    getProviderEarningsSummary,
    getMockTransactions,
    type Transaction,
    type TransactionStatus,
    type TransactionType,
    type ReconciliationReport,
} from './transaction.service';

// Notifications
export * from './notification.service';

// Customer-specific (Cloud Functions integration)
export {
    createServiceRequest as createCustomerRequest,
    cancelServiceRequest,
    subscribeToRequest as subscribeToCustomerRequest,
    getRequestHistory as getCustomerRequestHistory,
    addRating,
    calculateServicePrice,
    formatETA as formatCustomerETA,
    calculateDistance as calculateCustomerDistance,
    setDemoMode,
} from './customer.service';

// Provider-specific (Cloud Functions integration)
export {
    updateLocation as updateProviderLocationCF,
    setAvailability as setProviderAvailability,
    acceptRequest,
    updateRequestStatus as updateProviderRequestStatus,
    getNearbyRequests,
    subscribeToRequest as subscribeToProviderRequest,
    subscribeToNearbyRequests,
    getRequestHistory as getProviderRequestHistory,
    getEarningsSummary,
    calculateDistance as calculateProviderDistance,
    estimateETA,
} from './provider.service';

// Error Handling & Logging
export {
    setLoggingUserId,
    logDebug,
    logInfo,
    logWarning,
    logError,
    logCritical,
    withErrorHandling,
    getUserFriendlyMessage,
    setupGlobalErrorHandler,
    isNetworkError,
    retryWithBackoff,
    captureComponentError,
    type ErrorSeverity,
    type ErrorCategory,
} from './error.service';

// Seeding (for development)
export * from './seed.service';
