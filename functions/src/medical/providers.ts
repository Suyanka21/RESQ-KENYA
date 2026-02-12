// ResQ Kenya - Medical Provider Cloud Functions
// Kenya EMT/Paramedic onboarding and verification

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// ============================================================================
// TYPES (matching types/medical.ts)
// ============================================================================

type KenyaEMTLevel = 'first_responder' | 'emt_basic' | 'emt_intermediate' | 'emt_paramedic';
type MedicalCertificationType = 'emt_license' | 'cpr' | 'first_aid' | 'bls' | 'als' | 'acls' | 'phtls' | 'nals';
type MedicalProviderStatus = 'pending' | 'verified' | 'active' | 'suspended' | 'expired';

interface MedicalCertificationInput {
    type: MedicalCertificationType;
    issuer: string;
    certificateNumber: string;
    issueDate: string;
    expiryDate: string;
    documentUrl: string;
}

interface RegisterMedicalProviderInput {
    emtLevel: KenyaEMTLevel;
    licenseNumber?: string;
    associatedHospital?: string;
    yearsExperience: number;
    specializations: string[];
    certifications: MedicalCertificationInput[];
    insuranceInfo: {
        provider: string;
        policyNumber: string;
        coverage: 'personal' | 'professional' | 'comprehensive';
        coverageAmount: number;
        expiryDate: string;
        documentUrl: string;
    };
}

// ============================================================================
// REGISTER MEDICAL PROVIDER
// ============================================================================

export const registerMedicalProvider = functions.https.onCall(async (data: RegisterMedicalProviderInput, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const userId = context.auth.uid;

    // Validate required fields
    if (!data.emtLevel || !data.certifications || data.certifications.length === 0) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'EMT level and at least one certification required'
        );
    }

    // Validate certifications based on EMT level
    const requiredCerts = getRequiredCertifications(data.emtLevel);
    const providedCerts = data.certifications.map(c => c.type);
    const missingCerts = requiredCerts.filter(r => !providedCerts.includes(r));

    if (missingCerts.length > 0) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            `Missing required certifications for ${data.emtLevel}: ${missingCerts.join(', ')}`
        );
    }

    try {
        const now = admin.firestore.FieldValue.serverTimestamp();

        // Create medical provider document
        const providerData = {
            userId,
            emtLevel: data.emtLevel,
            licenseNumber: data.licenseNumber || null,
            associatedHospital: data.associatedHospital || null,
            yearsExperience: data.yearsExperience,
            specializations: data.specializations,
            certifications: data.certifications.map(cert => ({
                ...cert,
                id: db.collection('_').doc().id,
                verified: false,
                verifiedAt: null,
                verifiedBy: null,
            })),
            insuranceCoverage: {
                ...data.insuranceInfo,
                verified: false,
            },
            status: 'pending' as MedicalProviderStatus,
            verifiedAt: null,
            verifiedBy: null,
            totalEmergencies: 0,
            averageResponseTime: 0,
            rating: 0,
            createdAt: now,
            updatedAt: now,
        };

        const providerRef = await db.collection('medical_providers').add(providerData);

        // Update user's profile to indicate medical provider status
        await db.collection('users').doc(userId).update({
            isMedicalProvider: true,
            medicalProviderId: providerRef.id,
            medicalProviderStatus: 'pending',
            updatedAt: now,
        });

        // Log the registration for audit
        await logMedicalDataAccess({
            requestId: providerRef.id,
            accessedBy: userId,
            accessReason: 'dispatch',
            dataFields: ['registration'],
            actionTaken: 'create',
        });

        return {
            success: true,
            providerId: providerRef.id,
            status: 'pending',
            message: 'Registration submitted. Pending verification.',
        };
    } catch (error) {
        console.error('Register medical provider error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to register medical provider');
    }
});

// ============================================================================
// VERIFY MEDICAL CERTIFICATION (Admin only)
// ============================================================================

export const verifyMedicalCertification = functions.https.onCall(async (data: {
    providerId: string;
    certificationId: string;
    verified: boolean;
    notes?: string;
}, context) => {
    // Verify admin authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    // Check admin role (in production, verify from custom claims)
    const adminDoc = await db.collection('admins').doc(context.auth.uid).get();
    if (!adminDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const { providerId, certificationId, verified, notes } = data;

    try {
        const providerRef = db.collection('medical_providers').doc(providerId);
        const providerDoc = await providerRef.get();

        if (!providerDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Provider not found');
        }

        const providerData = providerDoc.data()!;
        const certifications = providerData.certifications || [];

        // Find and update the certification
        const certIndex = certifications.findIndex((c: any) => c.id === certificationId);
        if (certIndex === -1) {
            throw new functions.https.HttpsError('not-found', 'Certification not found');
        }

        certifications[certIndex] = {
            ...certifications[certIndex],
            verified,
            verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            verifiedBy: context.auth.uid,
            verificationNotes: notes || null,
        };

        await providerRef.update({
            certifications,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Check if all required certifications are verified
        const allVerified = checkAllCertificationsVerified(certifications, providerData.emtLevel);

        if (allVerified && providerData.insuranceCoverage?.verified) {
            // Auto-activate provider if all verifications complete
            await providerRef.update({
                status: 'verified',
                verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
                verifiedBy: context.auth.uid,
            });
        }

        return {
            success: true,
            allVerified,
            message: verified ? 'Certification verified' : 'Certification rejected',
        };
    } catch (error) {
        console.error('Verify certification error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to verify certification');
    }
});

// ============================================================================
// UPDATE PROVIDER STATUS (Admin)
// ============================================================================

export const updateMedicalProviderStatus = functions.https.onCall(async (data: {
    providerId: string;
    status: MedicalProviderStatus;
    reason?: string;
}, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const adminDoc = await db.collection('admins').doc(context.auth.uid).get();
    if (!adminDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const { providerId, status, reason } = data;

    try {
        const providerRef = db.collection('medical_providers').doc(providerId);
        const providerDoc = await providerRef.get();

        if (!providerDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Provider not found');
        }

        const updates: any = {
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            statusUpdatedBy: context.auth.uid,
        };

        if (status === 'suspended') {
            updates.suspensionReason = reason || 'No reason provided';
            updates.suspendedAt = admin.firestore.FieldValue.serverTimestamp();
        }

        if (status === 'active') {
            updates.activatedAt = admin.firestore.FieldValue.serverTimestamp();
        }

        await providerRef.update(updates);

        // Update user profile
        const userId = providerDoc.data()!.userId;
        await db.collection('users').doc(userId).update({
            medicalProviderStatus: status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
            success: true,
            status,
            message: `Provider status updated to ${status}`,
        };
    } catch (error) {
        console.error('Update provider status error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update provider status');
    }
});

// ============================================================================
// CHECK CERTIFICATION EXPIRY (Scheduled)
// Runs daily at 8am Nairobi time
// ============================================================================

export const checkCertificationExpiry = functions.pubsub
    .schedule('0 8 * * *')
    .timeZone('Africa/Nairobi')
    .onRun(async () => {
        const now = new Date();
        const warningDays = 30; // Warn 30 days before expiry
        const warningDate = new Date(now.getTime() + warningDays * 24 * 60 * 60 * 1000);

        try {
            // Get all active providers
            const providersSnapshot = await db.collection('medical_providers')
                .where('status', 'in', ['verified', 'active'])
                .get();

            const notifications: any[] = [];
            const expiryUpdates: any[] = [];

            for (const doc of providersSnapshot.docs) {
                const provider = doc.data();
                const certifications = provider.certifications || [];

                for (const cert of certifications) {
                    const expiryDate = new Date(cert.expiryDate);

                    // Check if expired
                    if (expiryDate < now) {
                        expiryUpdates.push({
                            providerId: doc.id,
                            certType: cert.type,
                            action: 'expired',
                        });
                    }
                    // Check if expiring soon
                    else if (expiryDate < warningDate) {
                        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
                        notifications.push({
                            userId: provider.userId,
                            title: 'Certification Expiring Soon',
                            body: `Your ${cert.type} certification expires in ${daysUntilExpiry} days. Please renew it.`,
                            data: { type: 'cert_expiry', certType: cert.type, providerId: doc.id },
                        });
                    }
                }
            }

            // Process expired certifications
            for (const update of expiryUpdates) {
                await db.collection('medical_providers').doc(update.providerId).update({
                    status: 'expired',
                    expiryReason: `${update.certType} certification expired`,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }

            // Send notifications (would integrate with notification service)
            console.log(`Certification check: ${expiryUpdates.length} expired, ${notifications.length} warnings`);

            return null;
        } catch (error) {
            console.error('Certification expiry check error:', error);
            return null;
        }
    });

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getRequiredCertifications(level: KenyaEMTLevel): MedicalCertificationType[] {
    const required: Record<KenyaEMTLevel, MedicalCertificationType[]> = {
        first_responder: ['first_aid', 'cpr'],
        emt_basic: ['emt_license', 'first_aid', 'cpr', 'bls'],
        emt_intermediate: ['emt_license', 'first_aid', 'cpr', 'bls', 'als'],
        emt_paramedic: ['emt_license', 'first_aid', 'cpr', 'bls', 'als', 'acls', 'phtls'],
    };
    return required[level];
}

function checkAllCertificationsVerified(certifications: any[], emtLevel: KenyaEMTLevel): boolean {
    const required = getRequiredCertifications(emtLevel);
    return required.every(reqType =>
        certifications.some(cert => cert.type === reqType && cert.verified)
    );
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
