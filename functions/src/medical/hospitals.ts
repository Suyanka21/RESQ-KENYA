// ResQ Kenya - Hospital Integration Cloud Functions
// Kenya hospital network integration for emergency dispatch

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import type { Hospital, KenyaHospitalLevel, HospitalEmergencyCapability } from '../../../types/hospital';
import type { TriageLevel, EmergencyType } from '../../../types/medical';

const db = admin.firestore();

// ============================================================================
// HOSPITAL REGISTRATION & MANAGEMENT
// ============================================================================

interface RegisterHospitalInput {
    name: string;
    kenyaLevel: KenyaHospitalLevel;
    ownership: 'public' | 'private' | 'faith_based' | 'ngo';
    nhifAccredited: boolean;
    location: {
        address: string;
        county: string;
        latitude: number;
        longitude: number;
    };
    contactInfo: {
        emergencyPhone: string;
        mainPhone?: string;
        email?: string;
    };
    emergencyCapabilities: HospitalEmergencyCapability[];
    operatingHours: {
        emergency24h: boolean;
        generalHours?: string;
    };
    bedCapacity?: {
        total: number;
        icu?: number;
        emergency?: number;
    };
}

/**
 * Register a new hospital in the network
 * Only admin users can register hospitals
 */
export const registerHospital = functions.https.onCall(
    async (data: RegisterHospitalInput, context) => {
        // Verify admin authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
        }

        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        const userData = userDoc.data();

        if (!userData || userData.role !== 'admin') {
            throw new functions.https.HttpsError('permission-denied', 'Admin access required');
        }

        // Validate required fields
        if (!data.name || !data.kenyaLevel || !data.location) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required hospital data');
        }

        // Validate Kenya hospital level
        const validLevels: KenyaHospitalLevel[] = ['level_1', 'level_2', 'level_3', 'level_4', 'level_5', 'level_6'];
        if (!validLevels.includes(data.kenyaLevel)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid Kenya hospital level');
        }

        try {
            const hospitalRef = await db.collection('hospitals').add({
                ...data,
                geopoint: new admin.firestore.GeoPoint(
                    data.location.latitude,
                    data.location.longitude
                ),
                status: 'active',
                registeredAt: admin.firestore.FieldValue.serverTimestamp(),
                registeredBy: context.auth.uid,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            });

            return {
                success: true,
                hospitalId: hospitalRef.id,
            };
        } catch (error: any) {
            console.error('Register hospital error:', error);
            throw new functions.https.HttpsError('internal', 'Failed to register hospital');
        }
    }
);

// ============================================================================
// HOSPITAL SEARCH & MATCHING
// ============================================================================

interface FindNearestHospitalsInput {
    latitude: number;
    longitude: number;
    emergencyType?: EmergencyType;
    triageLevel?: TriageLevel;
    requiredCapabilities?: HospitalEmergencyCapability[];
    maxDistance?: number; // km
    limit?: number;
}

/**
 * Find nearest hospitals based on location and requirements
 */
export const findNearestHospitals = functions.https.onCall(
    async (data: FindNearestHospitalsInput, context) => {
        // Auth check
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
        }

        const { latitude, longitude, emergencyType, triageLevel, requiredCapabilities, maxDistance = 20, limit = 10 } = data;

        if (!latitude || !longitude) {
            throw new functions.https.HttpsError('invalid-argument', 'Location required');
        }

        try {
            // Get all active hospitals
            const hospitalsRef = db.collection('hospitals').where('status', '==', 'active');
            const snapshot = await hospitalsRef.get();

            const hospitals: Array<{
                id: string;
                data: any;
                distance: number;
            }> = [];

            snapshot.forEach(doc => {
                const hospital = doc.data();
                const hospitalLat = hospital.geopoint?.latitude || hospital.location?.latitude;
                const hospitalLng = hospital.geopoint?.longitude || hospital.location?.longitude;

                if (!hospitalLat || !hospitalLng) return;

                // Calculate distance using Haversine formula
                const distance = calculateDistance(latitude, longitude, hospitalLat, hospitalLng);

                if (distance <= maxDistance) {
                    hospitals.push({
                        id: doc.id,
                        data: hospital,
                        distance,
                    });
                }
            });

            // Filter by required capabilities
            let filteredHospitals = hospitals;

            if (requiredCapabilities && requiredCapabilities.length > 0) {
                filteredHospitals = hospitals.filter(h => {
                    const capabilities = h.data.emergencyCapabilities || [];
                    return requiredCapabilities.every((cap: HospitalEmergencyCapability) => capabilities.includes(cap));
                });
            }

            // Filter by minimum level for triage
            if (triageLevel) {
                const minLevel = getMinimumHospitalLevelForTriage(triageLevel);
                filteredHospitals = filteredHospitals.filter(h => {
                    const level = parseInt(h.data.kenyaLevel.replace('level_', ''));
                    const minLevelNum = parseInt(minLevel.replace('level_', ''));
                    return level >= minLevelNum;
                });
            }

            // Sort by distance and limit
            filteredHospitals.sort((a, b) => a.distance - b.distance);
            const results = filteredHospitals.slice(0, limit);

            return {
                success: true,
                hospitals: results.map(h => ({
                    id: h.id,
                    name: h.data.name,
                    level: h.data.kenyaLevel,
                    distance: Math.round(h.distance * 10) / 10, // Round to 1 decimal
                    distanceUnit: 'km',
                    address: h.data.location?.address,
                    emergencyPhone: h.data.contactInfo?.emergencyPhone,
                    capabilities: h.data.emergencyCapabilities,
                    nhifAccredited: h.data.nhifAccredited,
                    emergency24h: h.data.operatingHours?.emergency24h,
                })),
                searchRadius: maxDistance,
                totalFound: results.length,
            };
        } catch (error: any) {
            console.error('Find hospitals error:', error);
            throw new functions.https.HttpsError('internal', 'Failed to search hospitals');
        }
    }
);

// ============================================================================
// HOSPITAL PRE-ALERT SYSTEM
// ============================================================================

interface SendHospitalPreAlertInput {
    hospitalId: string;
    requestId: string;
    patientInfo: {
        age?: number;
        gender?: 'male' | 'female' | 'other';
        consciousness: 'alert' | 'voice' | 'pain' | 'unresponsive';
        breathing: 'normal' | 'labored' | 'absent';
        bleedingSeverity?: 'none' | 'minor' | 'moderate' | 'severe';
        suspectedConditions?: string[];
    };
    triageLevel: TriageLevel;
    estimatedArrivalMinutes: number;
    providerInfo: {
        providerId: string;
        vehicleType: string;
        emtLevel: string;
    };
}

/**
 * Send pre-alert notification to hospital
 * Notifies ER staff before patient arrival
 */
export const sendHospitalPreAlert = functions.https.onCall(
    async (data: SendHospitalPreAlertInput, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
        }

        const { hospitalId, requestId, patientInfo, triageLevel, estimatedArrivalMinutes, providerInfo } = data;

        if (!hospitalId || !requestId) {
            throw new functions.https.HttpsError('invalid-argument', 'Hospital and request ID required');
        }

        try {
            // Get hospital info
            const hospitalDoc = await db.collection('hospitals').doc(hospitalId).get();
            if (!hospitalDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Hospital not found');
            }

            // Create pre-alert record
            const preAlertRef = await db.collection('hospital_pre_alerts').add({
                hospitalId,
                requestId,
                patientInfo,
                triageLevel,
                estimatedArrivalMinutes,
                providerInfo,
                status: 'sent',
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                sentBy: context.auth.uid,
            });

            // Get hospital staff tokens for push notifications
            const staffQuery = await db.collection('hospital_staff')
                .where('hospitalId', '==', hospitalId)
                .where('role', 'in', ['er_nurse', 'er_doctor', 'charge_nurse'])
                .where('onDuty', '==', true)
                .get();

            const tokens: string[] = [];
            staffQuery.forEach(doc => {
                const staff = doc.data();
                if (staff.fcmToken) {
                    tokens.push(staff.fcmToken);
                }
            });

            // Send push notifications to hospital staff
            if (tokens.length > 0) {
                const triageColors: Record<TriageLevel, string> = {
                    red: '🔴 CRITICAL',
                    yellow: '🟡 URGENT',
                    green: '🟢 STABLE',
                };

                await admin.messaging().sendEachForMulticast({
                    tokens,
                    notification: {
                        title: `${triageColors[triageLevel]} - Incoming Patient`,
                        body: `ETA: ${estimatedArrivalMinutes} minutes. ${patientInfo.suspectedConditions?.join(', ') || 'Details pending'}`,
                    },
                    data: {
                        type: 'hospital_pre_alert',
                        preAlertId: preAlertRef.id,
                        requestId,
                        triageLevel,
                    },
                    android: {
                        priority: triageLevel === 'red' ? 'high' : 'normal',
                        notification: {
                            channelId: triageLevel === 'red' ? 'critical_alerts' : 'hospital_alerts',
                        },
                    },
                });
            }

            // Update request with hospital pre-alert status
            await db.collection('emergency_requests').doc(requestId).update({
                hospitalPreAlertSent: true,
                hospitalPreAlertId: preAlertRef.id,
                destinationHospitalId: hospitalId,
                estimatedArrival: admin.firestore.Timestamp.fromDate(
                    new Date(Date.now() + estimatedArrivalMinutes * 60 * 1000)
                ),
            });

            return {
                success: true,
                preAlertId: preAlertRef.id,
                notifiedStaff: tokens.length,
            };
        } catch (error: any) {
            console.error('Send pre-alert error:', error);
            throw new functions.https.HttpsError('internal', 'Failed to send hospital pre-alert');
        }
    }
);

// ============================================================================
// HOSPITAL CAPACITY MANAGEMENT
// ============================================================================

interface UpdateHospitalCapacityInput {
    hospitalId: string;
    emergencyBeds: {
        available: number;
        total: number;
    };
    icuBeds?: {
        available: number;
        total: number;
    };
    operatingRooms?: {
        available: number;
        total: number;
    };
    erWaitTime?: number; // minutes
    divertStatus?: 'accepting' | 'limited' | 'diverting';
}

/**
 * Update hospital capacity (called by hospital staff)
 */
export const updateHospitalCapacity = functions.https.onCall(
    async (data: UpdateHospitalCapacityInput, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
        }

        const { hospitalId, emergencyBeds, icuBeds, operatingRooms, erWaitTime, divertStatus } = data;

        // Verify user is hospital staff
        const staffDoc = await db.collection('hospital_staff')
            .where('userId', '==', context.auth.uid)
            .where('hospitalId', '==', hospitalId)
            .get();

        if (staffDoc.empty) {
            throw new functions.https.HttpsError('permission-denied', 'Not authorized for this hospital');
        }

        try {
            const updateData: any = {
                'capacity.emergencyBeds': emergencyBeds,
                'capacity.lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
                'capacity.updatedBy': context.auth.uid,
            };

            if (icuBeds) updateData['capacity.icuBeds'] = icuBeds;
            if (operatingRooms) updateData['capacity.operatingRooms'] = operatingRooms;
            if (erWaitTime !== undefined) updateData['capacity.erWaitTime'] = erWaitTime;
            if (divertStatus) updateData['capacity.divertStatus'] = divertStatus;

            await db.collection('hospitals').doc(hospitalId).update(updateData);

            // Log capacity update
            await db.collection('hospital_capacity_logs').add({
                ...data,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: context.auth.uid,
            });

            return { success: true };
        } catch (error: any) {
            console.error('Update capacity error:', error);
            throw new functions.https.HttpsError('internal', 'Failed to update capacity');
        }
    }
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Get minimum hospital level for triage severity
 */
function getMinimumHospitalLevelForTriage(triageLevel: TriageLevel): KenyaHospitalLevel {
    switch (triageLevel) {
        case 'red':
            return 'level_4'; // County referral hospital or higher
        case 'yellow':
            return 'level_3'; // Sub-county hospital
        case 'green':
        default:
            return 'level_2'; // Health centre
    }
}

/**
 * Get required capabilities for emergency type
 */
export function getRequiredCapabilitiesForEmergency(emergencyType: EmergencyType): HospitalEmergencyCapability[] {
    const capabilityMap: Record<EmergencyType, HospitalEmergencyCapability[]> = {
        cardiac: ['cardiac_care', 'icu'],
        trauma: ['trauma_center', 'surgery'],
        respiratory: ['icu', 'ventilator'],
        stroke: ['stroke_unit', 'ct_scan'],
        pediatric: ['pediatric', 'nicu'],
        obstetric: ['maternity', 'nicu'],
        burn: ['burn_unit', 'surgery'],
        poisoning: ['toxicology'],
        psychiatric: ['psychiatric'],
        medical: ['general_medicine'],
        other: [],
        general: [],
    };

    return capabilityMap[emergencyType] || [];
}

// ============================================================================
// SCHEDULED FUNCTIONS
// ============================================================================

/**
 * Clean up stale pre-alerts (run daily)
 */
export const cleanupStalePreAlerts = functions.pubsub
    .schedule('every 24 hours')
    .timeZone('Africa/Nairobi')
    .onRun(async () => {
        const staleDate = new Date();
        staleDate.setDate(staleDate.getDate() - 7); // 7 days old

        const staleAlerts = await db.collection('hospital_pre_alerts')
            .where('sentAt', '<', staleDate)
            .where('status', '==', 'sent')
            .get();

        const batch = db.batch();
        staleAlerts.forEach(doc => {
            batch.update(doc.ref, { status: 'expired' });
        });

        await batch.commit();
        console.log(`Cleaned up ${staleAlerts.size} stale pre-alerts`);

        return null;
    });
