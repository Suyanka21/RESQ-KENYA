// ResQ Kenya - Emergency Medical Dispatch Cloud Functions
// Kenya triage-based emergency dispatch system

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// ============================================================================
// TYPES
// ============================================================================

type TriageLevel = 'red' | 'yellow' | 'green';
type DispatchPriority = 'emergency' | 'urgent' | 'scheduled';
type EmergencyType = 'medical' | 'trauma' | 'cardiac' | 'respiratory' | 'burn' | 'poisoning' | 'obstetric' | 'other';

interface EmergencyRequestInput {
    customerLocation: {
        latitude: number;
        longitude: number;
        address: string;
        landmark?: string;
    };
    emergencyType: EmergencyType;
    triageLevel: TriageLevel;
    patientCount: number;
    patientCondition: {
        consciousness: 'alert' | 'voice' | 'pain' | 'unresponsive';
        breathing: 'normal' | 'difficulty' | 'not_breathing';
        bleeding: 'none' | 'minor' | 'major' | 'life_threatening';
        isBreathing: boolean;
        hasPulse: boolean;
    };
    additionalInfo?: string;
    preferredHospital?: string;
}

// ============================================================================
// CREATE EMERGENCY REQUEST
// ============================================================================

export const createEmergencyRequest = functions.https.onCall(async (data: EmergencyRequestInput, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const userId = context.auth.uid;
    const { customerLocation, emergencyType, triageLevel, patientCount, patientCondition } = data;

    // Validate location
    if (!customerLocation?.latitude || !customerLocation?.longitude) {
        throw new functions.https.HttpsError('invalid-argument', 'Location coordinates required');
    }

    try {
        const now = admin.firestore.FieldValue.serverTimestamp();

        // Determine dispatch priority based on triage
        const dispatchPriority = getDispatchPriority(triageLevel, patientCondition);

        // Find nearby hospitals
        const nearbyHospitals = await findNearbyHospitals(
            customerLocation.latitude,
            customerLocation.longitude,
            emergencyType
        );

        // Create emergency request
        const requestData = {
            userId,
            serviceType: 'ambulance',
            emergencyType,
            triageLevel,
            dispatchPriority,
            status: 'pending',

            customerLocation: {
                coordinates: {
                    latitude: customerLocation.latitude,
                    longitude: customerLocation.longitude,
                },
                address: customerLocation.address,
                landmark: customerLocation.landmark || null,
            },

            patientCount,
            patientCondition,
            patientConditionSummary: summarizePatientCondition(patientCondition),

            nearbyHospitals,
            selectedHospital: data.preferredHospital || nearbyHospitals[0]?.hospitalId || null,
            hospitalNotified: false,

            providerId: null,
            providerAssignedAt: null,

            timeline: {
                requestedAt: now,
            },

            additionalInfo: data.additionalInfo || null,
            createdAt: now,
            updatedAt: now,
        };

        const requestRef = await db.collection('emergency_requests').add(requestData);

        // Find and notify nearby medical providers
        const nearbyProviders = await findNearbyMedicalProviders(
            customerLocation.latitude,
            customerLocation.longitude,
            emergencyType,
            triageLevel
        );

        // Notify providers (broadcast to all nearby)
        await notifyMedicalProviders(requestRef.id, nearbyProviders, triageLevel);

        // If critical (red), also notify hospitals
        if (triageLevel === 'red' && nearbyHospitals.length > 0) {
            await notifyHospitals(requestRef.id, nearbyHospitals.slice(0, 2), patientCondition);
        }

        // Log for audit
        await logMedicalDataAccess({
            requestId: requestRef.id,
            accessedBy: userId,
            accessReason: 'dispatch',
            dataFields: ['emergency_request_creation'],
            actionTaken: 'create',
        });

        return {
            success: true,
            requestId: requestRef.id,
            triageLevel,
            dispatchPriority,
            nearbyProviders: nearbyProviders.length,
            nearbyHospitals: nearbyHospitals.slice(0, 3),
            estimatedResponseTime: getEstimatedResponseTime(triageLevel),
            message: `Emergency request created. ${nearbyProviders.length} providers notified.`,
        };
    } catch (error) {
        console.error('Create emergency request error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create emergency request');
    }
});

// ============================================================================
// FIND NEAREST MEDICAL PROVIDERS
// ============================================================================

export const findNearestMedicalProviders = functions.https.onCall(async (data: {
    latitude: number;
    longitude: number;
    emergencyType: EmergencyType;
    triageLevel: TriageLevel;
    maxDistance?: number;
}, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { latitude, longitude, emergencyType, triageLevel, maxDistance = 15 } = data;

    try {
        const providers = await findNearbyMedicalProviders(
            latitude,
            longitude,
            emergencyType,
            triageLevel,
            maxDistance
        );

        return {
            success: true,
            providers: providers.map(p => ({
                providerId: p.providerId,
                name: p.name,
                emtLevel: p.emtLevel,
                distance: p.distance,
                estimatedTime: p.estimatedTime,
                rating: p.rating,
            })),
        };
    } catch (error) {
        console.error('Find medical providers error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to find medical providers');
    }
});

// ============================================================================
// ASSIGN MEDICAL PROVIDER
// ============================================================================

export const assignMedicalProvider = functions.https.onCall(async (data: {
    requestId: string;
    providerId: string;
}, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { requestId, providerId } = data;

    try {
        const requestRef = db.collection('emergency_requests').doc(requestId);
        const requestDoc = await requestRef.get();

        if (!requestDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Emergency request not found');
        }

        const requestData = requestDoc.data()!;

        if (requestData.status !== 'pending') {
            throw new functions.https.HttpsError(
                'failed-precondition',
                `Request already ${requestData.status}`
            );
        }

        // Verify provider is active
        const providerDoc = await db.collection('medical_providers').doc(providerId).get();
        if (!providerDoc.exists || providerDoc.data()!.status !== 'active') {
            throw new functions.https.HttpsError(
                'failed-precondition',
                'Provider not available'
            );
        }

        const now = admin.firestore.FieldValue.serverTimestamp();

        // Update request
        await requestRef.update({
            providerId,
            status: 'accepted',
            providerAssignedAt: now,
            'timeline.acceptedAt': now,
            updatedAt: now,
        });

        // Update provider availability
        await db.collection('medical_providers').doc(providerId).update({
            currentRequestId: requestId,
            isAvailable: false,
            updatedAt: now,
        });

        // Notify customer
        await db.collection('notifications').add({
            userId: requestData.userId,
            title: 'Ambulance Dispatched',
            body: 'A medical responder is on the way to your location',
            type: 'emergency_update',
            data: { requestId, providerId },
            createdAt: now,
        });

        return {
            success: true,
            message: 'Medical provider assigned successfully',
        };
    } catch (error) {
        console.error('Assign provider error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to assign provider');
    }
});

// ============================================================================
// NOTIFY NEARBY HOSPITALS
// ============================================================================

export const notifyNearbyHospitals = functions.https.onCall(async (data: {
    requestId: string;
    selectedHospitalId: string;
    estimatedArrival: number;
}, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { requestId, selectedHospitalId, estimatedArrival } = data;

    try {
        const requestDoc = await db.collection('emergency_requests').doc(requestId).get();
        if (!requestDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Request not found');
        }

        const requestData = requestDoc.data()!;
        const now = admin.firestore.FieldValue.serverTimestamp();

        // Create hospital notification
        await db.collection('hospital_alerts').add({
            hospitalId: selectedHospitalId,
            requestId,
            triageLevel: requestData.triageLevel,
            emergencyType: requestData.emergencyType,
            patientCount: requestData.patientCount,
            patientConditionSummary: requestData.patientConditionSummary,
            estimatedArrival,
            status: 'pending',
            createdAt: now,
        });

        // Update request
        await db.collection('emergency_requests').doc(requestId).update({
            hospitalNotified: true,
            selectedHospital: selectedHospitalId,
            'timeline.hospitalNotifiedAt': now,
            updatedAt: now,
        });

        return {
            success: true,
            message: 'Hospital notified of incoming patient',
        };
    } catch (error) {
        console.error('Notify hospital error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to notify hospital');
    }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDispatchPriority(
    triageLevel: TriageLevel,
    patientCondition: any
): DispatchPriority {
    // Critical conditions always emergency
    if (
        !patientCondition.isBreathing ||
        !patientCondition.hasPulse ||
        patientCondition.consciousness === 'unresponsive' ||
        patientCondition.bleeding === 'life_threatening'
    ) {
        return 'emergency';
    }

    // Use triage level
    switch (triageLevel) {
        case 'red':
            return 'emergency';
        case 'yellow':
            return 'urgent';
        case 'green':
        default:
            return 'scheduled';
    }
}

function summarizePatientCondition(condition: any): string {
    const parts: string[] = [];

    if (condition.consciousness !== 'alert') {
        parts.push(`Consciousness: ${condition.consciousness}`);
    }
    if (condition.breathing !== 'normal') {
        parts.push(`Breathing: ${condition.breathing}`);
    }
    if (condition.bleeding !== 'none') {
        parts.push(`Bleeding: ${condition.bleeding}`);
    }
    if (!condition.hasPulse) {
        parts.push('No pulse detected');
    }

    return parts.length > 0 ? parts.join(', ') : 'Stable condition';
}

function getEstimatedResponseTime(triageLevel: TriageLevel): number {
    // Kenya target response times (minutes)
    switch (triageLevel) {
        case 'red':
            return 8;   // 8 minutes for life-threatening
        case 'yellow':
            return 15;  // 15 minutes for urgent
        case 'green':
        default:
            return 30;  // 30 minutes for non-urgent
    }
}

async function findNearbyMedicalProviders(
    lat: number,
    lng: number,
    emergencyType: EmergencyType,
    triageLevel: TriageLevel,
    maxDistance: number = 15
): Promise<any[]> {
    // Get all active medical providers
    const providersSnapshot = await db.collection('medical_providers')
        .where('status', '==', 'active')
        .where('isAvailable', '==', true)
        .get();

    const providers: any[] = [];

    for (const doc of providersSnapshot.docs) {
        const provider = doc.data();

        // Get provider's current location
        const locationDoc = await db.collection('provider_locations').doc(provider.userId).get();
        if (!locationDoc.exists) continue;

        const location = locationDoc.data()!;
        const distance = calculateDistance(lat, lng, location.latitude, location.longitude);

        if (distance <= maxDistance) {
            // Check if provider's EMT level is suitable for triage
            if (isProviderSuitableForTriage(provider.emtLevel, triageLevel)) {
                providers.push({
                    providerId: doc.id,
                    userId: provider.userId,
                    name: provider.displayName || 'Medical Responder',
                    emtLevel: provider.emtLevel,
                    distance: Math.round(distance * 10) / 10,
                    estimatedTime: Math.round(distance * 3), // ~3 min per km estimate
                    rating: provider.rating || 0,
                    specializations: provider.specializations || [],
                });
            }
        }
    }

    // Sort by distance (closest first)
    return providers.sort((a, b) => a.distance - b.distance);
}

async function findNearbyHospitals(
    lat: number,
    lng: number,
    emergencyType: EmergencyType
): Promise<any[]> {
    const hospitalsSnapshot = await db.collection('hospitals')
        .where('hasEmergency', '==', true)
        .where('acceptsAmbulance', '==', true)
        .get();

    const hospitals: any[] = [];

    for (const doc of hospitalsSnapshot.docs) {
        const hospital = doc.data();
        const distance = calculateDistance(
            lat, lng,
            hospital.location.latitude,
            hospital.location.longitude
        );

        hospitals.push({
            hospitalId: doc.id,
            name: hospital.name,
            distance: Math.round(distance * 10) / 10,
            estimatedTime: Math.round(distance * 3),
            hasEmergency: hospital.hasEmergency,
            hasICU: hospital.hasICU,
            nhifAccredited: hospital.nhifAccredited,
            level: hospital.level,
        });
    }

    return hospitals.sort((a, b) => a.distance - b.distance);
}

function isProviderSuitableForTriage(emtLevel: string, triageLevel: TriageLevel): boolean {
    const levelRanks: Record<string, number> = {
        first_responder: 1,
        emt_basic: 2,
        emt_intermediate: 3,
        emt_paramedic: 4,
    };

    const requiredLevel: Record<TriageLevel, number> = {
        red: 3,     // Red needs at least intermediate
        yellow: 2,  // Yellow needs at least basic
        green: 1,   // Green can be first responder
    };

    return (levelRanks[emtLevel] || 0) >= requiredLevel[triageLevel];
}

async function notifyMedicalProviders(
    requestId: string,
    providers: any[],
    triageLevel: TriageLevel
): Promise<void> {
    const batch = db.batch();
    const now = admin.firestore.FieldValue.serverTimestamp();

    const priority = triageLevel === 'red' ? 'CRITICAL' : triageLevel === 'yellow' ? 'URGENT' : 'Normal';

    for (const provider of providers.slice(0, 10)) { // Notify up to 10 providers
        const notificationRef = db.collection('notifications').doc();
        batch.set(notificationRef, {
            userId: provider.userId,
            title: `${priority} Emergency Request`,
            body: `Emergency within ${provider.distance}km. Tap to respond.`,
            type: 'emergency_request',
            priority: triageLevel,
            data: { requestId, distance: provider.distance },
            createdAt: now,
        });
    }

    await batch.commit();
}

async function notifyHospitals(
    requestId: string,
    hospitals: any[],
    patientCondition: any
): Promise<void> {
    const batch = db.batch();
    const now = admin.firestore.FieldValue.serverTimestamp();

    for (const hospital of hospitals) {
        const alertRef = db.collection('hospital_alerts').doc();
        batch.set(alertRef, {
            hospitalId: hospital.hospitalId,
            requestId,
            status: 'incoming',
            patientConditionSummary: summarizePatientCondition(patientCondition),
            estimatedArrival: hospital.estimatedTime,
            createdAt: now,
        });
    }

    await batch.commit();
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

async function logMedicalDataAccess(data: {
    requestId: string;
    accessedBy: string;
    accessReason: string;
    dataFields: string[];
    actionTaken: string;
}): Promise<void> {
    await db.collection('medical_audit_logs').add({
        ...data,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
}
