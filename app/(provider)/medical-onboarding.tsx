// ResQ Kenya - Medical Provider Onboarding Screen
// Multi-step form for EMT/Paramedic registration

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors as _colors, spacing, typography, borderRadius as radii } from '../../theme/voltage-premium';
import type { KenyaEMTLevel, MedicalCertificationType } from '../../types/medical';
import { KENYA_CERTIFICATION_ISSUERS } from '../../services/medical-compliance.service';

// Theme Adapter (Mapping Voltage Premium to Local UI)
const colors = {
    primary: _colors.voltage,
    primarySoft: _colors.voltageGlow,
    success: _colors.success,
    successSoft: _colors.successGlow,
    warning: _colors.warning,
    warningSoft: _colors.warningGlow,
    danger: _colors.emergency,
    dangerSoft: _colors.emergencyGlow,
    info: _colors.info,
    infoSoft: _colors.infoGlow,
    background: _colors.charcoal[900],
    surface: _colors.charcoal[800],
    surfaceAlt: _colors.charcoal[700],
    textPrimary: _colors.text.primary,
    textSecondary: _colors.text.secondary,
    textMuted: _colors.text.muted,
    textOnPrimary: _colors.text.onBrand,
    border: _colors.charcoal[600],
};

const typo = {
    h2: { fontSize: typography.mobile.section.size, lineHeight: typography.mobile.section.lineHeight, fontWeight: typography.mobile.section.weight as any },
    h3: { fontSize: typography.mobile.subsection.size, lineHeight: typography.mobile.subsection.lineHeight, fontWeight: typography.mobile.subsection.weight as any },
    h4: { fontSize: typography.mobile.bodyLarge.size, lineHeight: typography.mobile.bodyLarge.lineHeight, fontWeight: '700' as any },
    body: { fontSize: typography.mobile.body.size, lineHeight: typography.mobile.body.lineHeight, fontWeight: typography.mobile.body.weight as any },
    bodyBold: { fontSize: typography.mobile.body.size, lineHeight: typography.mobile.body.lineHeight, fontWeight: '700' as any },
    caption: { fontSize: typography.mobile.caption.size, lineHeight: typography.mobile.caption.lineHeight, fontWeight: typography.mobile.caption.weight as any },
    small: { fontSize: typography.mobile.bodySmall.size, lineHeight: typography.mobile.bodySmall.lineHeight, fontWeight: typography.mobile.bodySmall.weight as any },
};

// ============================================================================
// TYPES
// ============================================================================

interface CertificationInput {
    type: MedicalCertificationType;
    issuer: string;
    certificateNumber: string;
    issueDate: string;
    expiryDate: string;
}

interface FormData {
    // Step 1: Personal Info
    emtLevel: KenyaEMTLevel | null;
    licenseNumber: string;
    yearsExperience: number;

    // Step 2: Certifications
    certifications: CertificationInput[];

    // Step 3: Insurance & Hospital
    insuranceProvider: string;
    policyNumber: string;
    coverageAmount: string;
    associatedHospital: string;

    // Step 4: Documents (simplified for demo)
    documentsUploaded: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const EMT_LEVELS: { value: KenyaEMTLevel; label: string; description: string }[] = [
    { value: 'first_responder', label: 'First Responder', description: 'Basic first aid & CPR trained' },
    { value: 'emt_basic', label: 'EMT Basic', description: 'Emergency Medical Technician' },
    { value: 'emt_intermediate', label: 'EMT Intermediate', description: 'Advanced skills, IV therapy' },
    { value: 'emt_paramedic', label: 'Paramedic', description: 'Full advanced life support' },
];

const REQUIRED_CERTS: Record<KenyaEMTLevel, MedicalCertificationType[]> = {
    first_responder: ['first_aid', 'cpr'],
    emt_basic: ['emt_license', 'first_aid', 'cpr', 'bls'],
    emt_intermediate: ['emt_license', 'first_aid', 'cpr', 'bls', 'als'],
    emt_paramedic: ['emt_license', 'first_aid', 'cpr', 'bls', 'als', 'acls', 'phtls'],
};

const CERT_DISPLAY_NAMES: Record<MedicalCertificationType, string> = {
    emt_license: 'EMT License',
    first_aid: 'First Aid',
    cpr: 'CPR Certification',
    bls: 'Basic Life Support (BLS)',
    als: 'Advanced Life Support (ALS)',
    acls: 'Advanced Cardiac Life Support (ACLS)',
    phtls: 'Pre-Hospital Trauma Life Support (PHTLS)',
    nals: 'Neonatal Advanced Life Support (NALS)',
};

const STEPS = [
    { title: 'Level & Experience', icon: 'medical' as const },
    { title: 'Certifications', icon: 'document-text' as const },
    { title: 'Insurance', icon: 'shield-checkmark' as const },
    { title: 'Review', icon: 'checkmark-circle' as const },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function MedicalOnboardingScreen() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        emtLevel: null,
        licenseNumber: '',
        yearsExperience: 0,
        certifications: [],
        insuranceProvider: '',
        policyNumber: '',
        coverageAmount: '',
        associatedHospital: '',
        documentsUploaded: false,
    });

    // ========================================================================
    // STEP NAVIGATION
    // ========================================================================

    const canProceed = useCallback(() => {
        switch (currentStep) {
            case 0: // Level & Experience
                return formData.emtLevel !== null && formData.yearsExperience > 0;
            case 1: // Certifications
                if (!formData.emtLevel) return false;
                const required = REQUIRED_CERTS[formData.emtLevel];
                const hasAll = required.every(type =>
                    formData.certifications.some(c => c.type === type && c.certificateNumber)
                );
                return hasAll;
            case 2: // Insurance
                return formData.insuranceProvider && formData.policyNumber;
            case 3: // Review
                return true;
            default:
                return false;
        }
    }, [currentStep, formData]);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        } else {
            router.back();
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            Alert.alert(
                '✅ Application Submitted',
                'Your EMT registration is under review. You will be notified once verified.',
                [{ text: 'OK', onPress: () => router.replace('/(provider)/') }]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to submit application. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ========================================================================
    // STEP 1: LEVEL & EXPERIENCE
    // ========================================================================

    const renderStep1 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Select Your EMT Level</Text>
            <Text style={styles.stepDescription}>
                Choose the certification level that matches your training (based on Kenya Red Cross / KNAS standards).
            </Text>

            <View style={styles.levelGrid}>
                {EMT_LEVELS.map(level => (
                    <TouchableOpacity
                        key={level.value}
                        style={[
                            styles.levelCard,
                            formData.emtLevel === level.value && styles.levelCardSelected,
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, emtLevel: level.value, certifications: [] }))}
                    >
                        <Ionicons
                            name="medical"
                            size={24}
                            color={formData.emtLevel === level.value ? colors.primary : colors.textSecondary}
                        />
                        <Text style={[
                            styles.levelLabel,
                            formData.emtLevel === level.value && styles.levelLabelSelected,
                        ]}>
                            {level.label}
                        </Text>
                        <Text style={styles.levelDescription}>{level.description}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Years of Experience *</Text>
                <TextInput
                    style={styles.textInput}
                    value={formData.yearsExperience.toString()}
                    onChangeText={text => {
                        const num = parseInt(text) || 0;
                        setFormData(prev => ({ ...prev, yearsExperience: num }));
                    }}
                    keyboardType="number-pad"
                    placeholder="e.g., 5"
                    placeholderTextColor={colors.textMuted}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMT License Number (if applicable)</Text>
                <TextInput
                    style={styles.textInput}
                    value={formData.licenseNumber}
                    onChangeText={text => setFormData(prev => ({ ...prev, licenseNumber: text }))}
                    placeholder="e.g., EMT-2024-001234"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                />
            </View>
        </View>
    );

    // ========================================================================
    // STEP 2: CERTIFICATIONS
    // ========================================================================

    const renderStep2 = () => {
        if (!formData.emtLevel) return null;

        const requiredCerts = REQUIRED_CERTS[formData.emtLevel];

        const updateCertification = (type: MedicalCertificationType, field: keyof CertificationInput, value: string) => {
            setFormData(prev => {
                const existing = prev.certifications.find(c => c.type === type);
                if (existing) {
                    return {
                        ...prev,
                        certifications: prev.certifications.map(c =>
                            c.type === type ? { ...c, [field]: value } : c
                        ),
                    };
                } else {
                    return {
                        ...prev,
                        certifications: [
                            ...prev.certifications,
                            { type, issuer: '', certificateNumber: '', issueDate: '', expiryDate: '', [field]: value },
                        ],
                    };
                }
            });
        };

        const getCertValue = (type: MedicalCertificationType, field: keyof CertificationInput): string => {
            const cert = formData.certifications.find(c => c.type === type);
            return cert ? (cert[field] as string) : '';
        };

        return (
            <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Required Certifications</Text>
                <Text style={styles.stepDescription}>
                    Enter details for each required certification. All must be valid and unexpired.
                </Text>

                {requiredCerts.map(certType => (
                    <View key={certType} style={styles.certCard}>
                        <View style={styles.certHeader}>
                            <Ionicons name="ribbon" size={20} color={colors.success} />
                            <Text style={styles.certTitle}>{CERT_DISPLAY_NAMES[certType]}</Text>
                        </View>

                        <View style={styles.certFields}>
                            <View style={styles.certFieldRow}>
                                <View style={styles.certField}>
                                    <Text style={styles.certFieldLabel}>Certificate # *</Text>
                                    <TextInput
                                        style={styles.certInput}
                                        value={getCertValue(certType, 'certificateNumber')}
                                        onChangeText={v => updateCertification(certType, 'certificateNumber', v)}
                                        placeholder="Enter number"
                                        placeholderTextColor={colors.textMuted}
                                    />
                                </View>
                                <View style={styles.certField}>
                                    <Text style={styles.certFieldLabel}>Issuer</Text>
                                    <TextInput
                                        style={styles.certInput}
                                        value={getCertValue(certType, 'issuer')}
                                        onChangeText={v => updateCertification(certType, 'issuer', v)}
                                        placeholder="e.g., Kenya Red Cross"
                                        placeholderTextColor={colors.textMuted}
                                    />
                                </View>
                            </View>
                            <View style={styles.certFieldRow}>
                                <View style={styles.certField}>
                                    <Text style={styles.certFieldLabel}>Issue Date</Text>
                                    <TextInput
                                        style={styles.certInput}
                                        value={getCertValue(certType, 'issueDate')}
                                        onChangeText={v => updateCertification(certType, 'issueDate', v)}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={colors.textMuted}
                                    />
                                </View>
                                <View style={styles.certField}>
                                    <Text style={styles.certFieldLabel}>Expiry Date *</Text>
                                    <TextInput
                                        style={styles.certInput}
                                        value={getCertValue(certType, 'expiryDate')}
                                        onChangeText={v => updateCertification(certType, 'expiryDate', v)}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={colors.textMuted}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    // ========================================================================
    // STEP 3: INSURANCE
    // ========================================================================

    const renderStep3 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Insurance & Affiliation</Text>
            <Text style={styles.stepDescription}>
                Professional liability insurance is required for medical service providers in Kenya.
            </Text>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Insurance Provider *</Text>
                <TextInput
                    style={styles.textInput}
                    value={formData.insuranceProvider}
                    onChangeText={text => setFormData(prev => ({ ...prev, insuranceProvider: text }))}
                    placeholder="e.g., AAR Insurance, Jubilee"
                    placeholderTextColor={colors.textMuted}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Policy Number *</Text>
                <TextInput
                    style={styles.textInput}
                    value={formData.policyNumber}
                    onChangeText={text => setFormData(prev => ({ ...prev, policyNumber: text }))}
                    placeholder="Enter policy number"
                    placeholderTextColor={colors.textMuted}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Coverage Amount (KES)</Text>
                <TextInput
                    style={styles.textInput}
                    value={formData.coverageAmount}
                    onChangeText={text => setFormData(prev => ({ ...prev, coverageAmount: text }))}
                    placeholder="e.g., 5,000,000"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Associated Hospital (Optional)</Text>
                <TextInput
                    style={styles.textInput}
                    value={formData.associatedHospital}
                    onChangeText={text => setFormData(prev => ({ ...prev, associatedHospital: text }))}
                    placeholder="e.g., Kenyatta National Hospital"
                    placeholderTextColor={colors.textMuted}
                />
            </View>

            <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={colors.info} />
                <Text style={styles.infoText}>
                    Your insurance documents will be verified before activation.
                </Text>
            </View>
        </View>
    );

    // ========================================================================
    // STEP 4: REVIEW
    // ========================================================================

    const renderStep4 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review Your Application</Text>
            <Text style={styles.stepDescription}>
                Please confirm all information is correct before submitting.
            </Text>

            <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>EMT Level</Text>
                <Text style={styles.reviewValue}>
                    {EMT_LEVELS.find(l => l.value === formData.emtLevel)?.label || 'Not selected'}
                </Text>
                <Text style={styles.reviewLabel}>Experience: {formData.yearsExperience} years</Text>
                {formData.licenseNumber && (
                    <Text style={styles.reviewLabel}>License: {formData.licenseNumber}</Text>
                )}
            </View>

            <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Certifications</Text>
                {formData.certifications.map(cert => (
                    <View key={cert.type} style={styles.reviewCert}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                        <Text style={styles.reviewCertText}>
                            {CERT_DISPLAY_NAMES[cert.type]}: {cert.certificateNumber}
                        </Text>
                    </View>
                ))}
            </View>

            <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Insurance</Text>
                <Text style={styles.reviewValue}>{formData.insuranceProvider}</Text>
                <Text style={styles.reviewLabel}>Policy: {formData.policyNumber}</Text>
            </View>

            <View style={styles.termsBox}>
                <Ionicons name="document-text" size={20} color={colors.warning} />
                <Text style={styles.termsText}>
                    By submitting, I confirm all information is accurate and I agree to ResQ Kenya's Terms of Service and Provider Agreement.
                </Text>
            </View>
        </View>
    );

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Medical Provider Registration</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Progress */}
            <View style={styles.progressContainer}>
                {STEPS.map((step, index) => (
                    <View key={index} style={styles.progressStep}>
                        <View
                            style={[
                                styles.progressDot,
                                index <= currentStep && styles.progressDotActive,
                            ]}
                        >
                            <Ionicons
                                name={step.icon}
                                size={16}
                                color={index <= currentStep ? colors.textOnPrimary : colors.textMuted}
                            />
                        </View>
                        {index < STEPS.length - 1 && (
                            <View
                                style={[
                                    styles.progressLine,
                                    index < currentStep && styles.progressLineActive,
                                ]}
                            />
                        )}
                    </View>
                ))}
            </View>
            <Text style={styles.progressLabel}>
                Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
            </Text>

            {/* Content */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {currentStep === 0 && renderStep1()}
                {currentStep === 1 && renderStep2()}
                {currentStep === 2 && renderStep3()}
                {currentStep === 3 && renderStep4()}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, styles.buttonSecondary]}
                    onPress={handleBack}
                >
                    <Text style={styles.buttonSecondaryText}>
                        {currentStep === 0 ? 'Cancel' : 'Back'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.button,
                        styles.buttonPrimary,
                        !canProceed() && styles.buttonDisabled,
                    ]}
                    onPress={handleNext}
                    disabled={!canProceed() || isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color={colors.textOnPrimary} />
                    ) : (
                        <Text style={styles.buttonPrimaryText}>
                            {currentStep === STEPS.length - 1 ? 'Submit Application' : 'Continue'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: spacing.md,
        backgroundColor: colors.surface,
    },
    backButton: {
        padding: spacing.xs,
    },
    headerTitle: {
        ...typo.h3,
        color: colors.textPrimary,
    },
    headerSpacer: {
        width: 40,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    progressStep: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.surfaceAlt,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressDotActive: {
        backgroundColor: colors.primary,
    },
    progressLine: {
        width: 40,
        height: 2,
        backgroundColor: colors.surfaceAlt,
        marginHorizontal: spacing.xs,
    },
    progressLineActive: {
        backgroundColor: colors.primary,
    },
    progressLabel: {
        ...typo.caption,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        ...typo.h3,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    stepDescription: {
        ...typo.body,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
    },
    levelGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -spacing.xs,
        marginBottom: spacing.lg,
    },
    levelCard: {
        width: '48%',
        margin: '1%',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        borderWidth: 2,
        borderColor: 'transparent',
        alignItems: 'center',
    },
    levelCardSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primarySoft,
    },
    levelLabel: {
        ...typo.bodyBold,
        color: colors.textPrimary,
        marginTop: spacing.sm,
    },
    levelLabelSelected: {
        color: colors.primary,
    },
    levelDescription: {
        ...typo.caption,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    inputGroup: {
        marginBottom: spacing.md,
    },
    inputLabel: {
        ...typo.caption,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    textInput: {
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        ...typo.body,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.border,
    },
    certCard: {
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    certHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    certTitle: {
        ...typo.bodyBold,
        color: colors.textPrimary,
        marginLeft: spacing.sm,
    },
    certFields: {
        gap: spacing.sm,
    },
    certFieldRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    certField: {
        flex: 1,
    },
    certFieldLabel: {
        ...typo.caption,
        color: colors.textMuted,
        marginBottom: spacing.xs,
    },
    certInput: {
        backgroundColor: colors.surfaceAlt,
        borderRadius: radii.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        ...typo.small,
        color: colors.textPrimary,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.infoSoft,
        padding: spacing.md,
        borderRadius: radii.md,
        marginTop: spacing.md,
    },
    infoText: {
        ...typo.small,
        color: colors.info,
        marginLeft: spacing.sm,
        flex: 1,
    },
    reviewSection: {
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    reviewSectionTitle: {
        ...typo.caption,
        color: colors.textMuted,
        marginBottom: spacing.xs,
    },
    reviewValue: {
        ...typo.bodyBold,
        color: colors.textPrimary,
    },
    reviewLabel: {
        ...typo.small,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    reviewCert: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    reviewCertText: {
        ...typo.small,
        color: colors.textPrimary,
        marginLeft: spacing.xs,
    },
    termsBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.warningSoft,
        padding: spacing.md,
        borderRadius: radii.md,
    },
    termsText: {
        ...typo.small,
        color: colors.warning,
        marginLeft: spacing.sm,
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        padding: spacing.md,
        paddingBottom: Platform.OS === 'ios' ? 34 : spacing.md,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: spacing.sm,
    },
    button: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonPrimary: {
        backgroundColor: colors.primary,
    },
    buttonSecondary: {
        backgroundColor: colors.surfaceAlt,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonPrimaryText: {
        ...typo.bodyBold,
        color: colors.textOnPrimary,
    },
    buttonSecondaryText: {
        ...typo.bodyBold,
        color: colors.textSecondary,
    },
});
