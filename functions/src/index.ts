/**
 * ResQ Kenya - Cloud Functions Entry Point
 * Exports all Firebase Cloud Functions
 */

// M-Pesa Payment Functions
export {
    initiateStkPush,
    queryStkStatus,
    cleanupStaleInitiatingPayments,
} from './mpesa/stkPush';
export { mpesaCallback } from './mpesa/callback';

// Service Request Functions
export {
    createServiceRequest,
    acceptServiceRequest,
    updateRequestStatus,
} from './services/requests';

// Phase 3: Real-time tracking trigger + daily earnings reset
export { onRequestStatusChange, resetDailyEarnings } from './services/triggers';

// Phase 5: Vehicles, emergency contacts, wallet
export { addVehicle, updateVehicle, deleteVehicle } from './users/vehicles';
export {
    addEmergencyContact,
    updateEmergencyContact,
    deleteEmergencyContact,
} from './users/emergencyContacts';
export { topupWallet, deductWallet, getWalletBalance } from './wallet/wallet';

// Provider Functions
export {
    updateProviderLocation,
    setProviderAvailability,
    autoOfflineCheck
} from './providers/location';

// Medical Functions (Phase 3)
export {
    registerMedicalProvider,
    verifyMedicalCertification,
    updateMedicalProviderStatus,
    checkCertificationExpiry
} from './medical/providers';

export {
    createEmergencyRequest,
    findNearestMedicalProviders,
    assignMedicalProvider,
    notifyNearbyHospitals
} from './medical/dispatch';

export {
    registerHospital,
    findNearestHospitals,
    sendHospitalPreAlert,
    updateHospitalCapacity,
    cleanupStalePreAlerts
} from './medical/hospitals';

// AI Dispatch Functions (Phase 4)
export {
    findOptimalProvider,
    recordDispatchOutcome,
    getDispatchMetrics
} from './ai/dispatch';

// Dynamic Pricing Functions (Phase 4)
export {
    getPriceQuote,
    updateZoneSurge,
    getDemandZones,
    scheduledSurgeUpdate
} from './ai/pricing';
