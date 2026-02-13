// ⚡ ResQ Kenya - Ambulance / Medical Emergency Request Form
// 3-step: Location → Details → Confirm

import React, { useState } from 'react';
import {
    View, Text, ScrollView, Pressable, TextInput, StyleSheet, Dimensions, Platform, ActivityIndicator
} from 'react-native';
import {
    MapPin, ChevronRight, ChevronLeft, HeartPulse, Phone, AlertTriangle,
    User, Clock, Building2, CheckCircle
} from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../../../theme/voltage-premium';
import { StepIndicator } from '../StepIndicator';
import { PRICES } from '../../../constants/prices';
import LocationMapPreview from '../../maps/LocationMapPreview';

const { width } = Dimensions.get('window');
type Step = 1 | 2 | 3;
type TriageLevel = 'critical' | 'urgent' | 'non_emergency';

interface AmbulanceFormProps {
    onSubmit: (data: any) => void;
    onBack: () => void;
}

const TRIAGE_OPTIONS = [
    { id: 'critical' as TriageLevel, label: 'Critical', desc: 'Life-threatening emergency', fee: PRICES.AMBULANCE_CRITICAL_FEE, color: '#FF3D3D', eta: '5-10 min' },
    { id: 'urgent' as TriageLevel, label: 'Urgent', desc: 'Serious but not life-threatening', fee: PRICES.AMBULANCE_URGENT_FEE, color: '#FFA500', eta: '10-20 min' },
    { id: 'non_emergency' as TriageLevel, label: 'Non-Emergency', desc: 'Stable, needs medical transport', fee: 0, color: '#4CAF50', eta: '20-30 min' },
];

export const AmbulanceForm: React.FC<AmbulanceFormProps> = ({ onSubmit, onBack }) => {
    const [step, setStep] = useState<Step>(1);
    const [location, setLocation] = useState('');
    const [triage, setTriage] = useState<TriageLevel>('urgent');
    const [patientName, setPatientName] = useState('');
    const [patientAge, setPatientAge] = useState('');
    const [condition, setCondition] = useState('');
    const [medicalHistory, setMedicalHistory] = useState('');
    const [emergencyContact, setEmergencyContact] = useState('');
    const [preferredHospital, setPreferredHospital] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const triageOption = TRIAGE_OPTIONS.find(t => t.id === triage)!;
    const totalCost = PRICES.AMBULANCE_BASE + triageOption.fee;

    const canProceed = () => {
        if (step === 1) return location.length > 0;
        if (step === 2) return condition.length > 0;
        return true;
    };

    const handleNext = () => { if (step < 3) setStep((step + 1) as Step); };
    const handleBack = () => { if (step > 1) setStep((step - 1) as Step); else onBack(); };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={handleBack} style={styles.backButton} accessibilityLabel="Go back" accessibilityRole="button">
                    <ChevronLeft size={24} color={colors.text.primary} strokeWidth={2} />
                </Pressable>
                <Text style={styles.headerTitle}>Medical Emergency</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Emergency Banner */}
            <View style={styles.emergencyBanner}>
                <AlertTriangle size={16} color="#FF3D3D" strokeWidth={2.5} />
                <Text style={styles.emergencyText}>For life-threatening emergencies, call 999 immediately</Text>
            </View>

            <StepIndicator currentStep={step} steps={['Location', 'Details', 'Confirm']} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Step 1: Location */}
                {step === 1 && (
                    <View>
                        <Text style={styles.sectionTitle}>Emergency Location</Text>
                        <Text style={styles.sectionDesc}>Where is the patient?</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Patient Location</Text>
                            <View style={styles.inputRow}>
                                <MapPin size={20} color={colors.medical} strokeWidth={2} />
                                <TextInput style={styles.textInput} value={location} onChangeText={setLocation} placeholder="Enter location" placeholderTextColor={colors.text.muted} />
                            </View>
                        </View>

                        <LocationMapPreview />

                        {/* 999 Quick Call */}
                        <Pressable style={styles.callBanner}>
                            <Phone size={20} color="#FF3D3D" strokeWidth={2} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.callTitle}>Emergency Hotline</Text>
                                <Text style={styles.callNumber}>999</Text>
                            </View>
                            <Text style={styles.callAction}>Call Now →</Text>
                        </Pressable>
                    </View>
                )}

                {/* Step 2: Patient Details */}
                {step === 2 && (
                    <View>
                        <Text style={styles.sectionTitle}>Patient Details</Text>
                        <Text style={styles.sectionDesc}>Provide patient information for faster care</Text>

                        {/* Triage Level */}
                        <Text style={styles.inputLabel}>Severity Level</Text>
                        {TRIAGE_OPTIONS.map((option) => (
                            <Pressable
                                key={option.id}
                                style={[styles.triageCard, triage === option.id && { borderColor: option.color, backgroundColor: `${option.color}10` }]}
                                onPress={() => setTriage(option.id)}
                            >
                                <View style={[styles.triageDot, { backgroundColor: option.color }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.triageLabel, triage === option.id && { color: colors.text.primary }]}>{option.label}</Text>
                                    <Text style={styles.triageDesc}>{option.desc}</Text>
                                </View>
                                <View style={styles.triageRight}>
                                    <Text style={[styles.triageEta, { color: option.color }]}>{option.eta}</Text>
                                    {option.fee > 0 && <Text style={styles.triageFee}>+KES {option.fee.toLocaleString()}</Text>}
                                </View>
                            </Pressable>
                        ))}

                        {/* Patient Info */}
                        <View style={styles.patientRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>Patient Name</Text>
                                <View style={styles.inputRow}>
                                    <User size={18} color={colors.medical} strokeWidth={2} />
                                    <TextInput style={styles.textInput} value={patientName} onChangeText={setPatientName} placeholder="Name" placeholderTextColor={colors.text.muted} />
                                </View>
                            </View>
                            <View style={{ width: 90 }}>
                                <Text style={styles.inputLabel}>Age</Text>
                                <View style={styles.inputRow}>
                                    <TextInput style={styles.textInput} value={patientAge} onChangeText={setPatientAge} placeholder="Age" placeholderTextColor={colors.text.muted} keyboardType="numeric" />
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Condition / Symptoms *</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={condition}
                                onChangeText={setCondition}
                                placeholder="Describe the emergency..."
                                placeholderTextColor={colors.text.muted}
                                multiline numberOfLines={3}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Medical History (Optional)</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={medicalHistory}
                                onChangeText={setMedicalHistory}
                                placeholder="Allergies, medications, conditions..."
                                placeholderTextColor={colors.text.muted}
                                multiline numberOfLines={2}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Preferred Hospital (Optional)</Text>
                            <View style={styles.inputRow}>
                                <Building2 size={18} color={colors.medical} strokeWidth={2} />
                                <TextInput style={styles.textInput} value={preferredHospital} onChangeText={setPreferredHospital} placeholder="e.g. Nairobi Hospital" placeholderTextColor={colors.text.muted} />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Emergency Contact</Text>
                            <View style={styles.inputRow}>
                                <Phone size={18} color={colors.medical} strokeWidth={2} />
                                <TextInput style={styles.textInput} value={emergencyContact} onChangeText={setEmergencyContact} placeholder="+254 7XX XXX XXX" placeholderTextColor={colors.text.muted} keyboardType="phone-pad" />
                            </View>
                        </View>
                    </View>
                )}

                {/* Step 3: Confirm */}
                {step === 3 && (
                    <View>
                        <Text style={styles.sectionTitle}>Confirm Request</Text>
                        <Text style={styles.sectionDesc}>Review emergency details</Text>

                        <View style={styles.confirmCard}>
                            <View style={styles.confirmHeader}>
                                <HeartPulse size={28} color={colors.medical} strokeWidth={2} />
                                <Text style={styles.confirmTitle}>Medical Emergency</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Severity</Text><Text style={[styles.confirmValue, { color: triageOption.color }]}>{triageOption.label}</Text></View>
                            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>ETA</Text><Text style={[styles.confirmValue, { color: triageOption.color }]}>{triageOption.eta}</Text></View>
                            {patientName ? <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Patient</Text><Text style={styles.confirmValue}>{patientName}{patientAge ? `, ${patientAge} yrs` : ''}</Text></View> : null}
                            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Condition</Text><Text style={styles.confirmValue} numberOfLines={2}>{condition}</Text></View>
                            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Location</Text><Text style={styles.confirmValue} numberOfLines={1}>{location}</Text></View>
                            {preferredHospital ? <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Hospital</Text><Text style={styles.confirmValue}>{preferredHospital}</Text></View> : null}
                            <View style={styles.divider} />
                            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Base Fee</Text><Text style={styles.confirmValue}>KES {PRICES.AMBULANCE_BASE.toLocaleString()}</Text></View>
                            {triageOption.fee > 0 && <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Priority Fee</Text><Text style={styles.confirmValue}>KES {triageOption.fee.toLocaleString()}</Text></View>}
                            <View style={[styles.divider, { backgroundColor: colors.medical }]} />
                            <View style={styles.confirmRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>KES {totalCost.toLocaleString()}</Text></View>
                        </View>
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                {step < 3 ? (
                    <Pressable style={({ pressed }) => [styles.continueButton, pressed && { opacity: 0.9 }, !canProceed() && styles.buttonDisabled]} onPress={handleNext} disabled={!canProceed()}>
                        <Text style={styles.continueText}>Continue</Text>
                        <ChevronRight size={20} color={colors.voltage} strokeWidth={2.5} />
                    </Pressable>
                ) : (
                    <Pressable style={({ pressed }) => [styles.submitButtonEmergency, pressed && { transform: [{ scale: 0.98 }] }, isSubmitting && styles.buttonDisabled]} onPress={() => { setIsSubmitting(true); onSubmit({ triage, patientName, patientAge, condition, location, emergencyContact, preferredHospital, totalCost, service: 'medical' }); }} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <HeartPulse size={20} color="#FFF" strokeWidth={2.5} />
                                <Text style={styles.submitTextEmergency}>Request Ambulance Now</Text>
                            </>
                        )}
                    </Pressable>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.charcoal[900] },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: spacing.sm, backgroundColor: colors.charcoal[800], borderBottomWidth: 1, borderBottomColor: colors.charcoal[700] },
    backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.text.primary },
    headerSpacer: { width: 44 },
    emergencyBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: `${'#FF3D3D'}15`, borderBottomWidth: 1, borderBottomColor: `${'#FF3D3D'}30` },
    emergencyText: { fontSize: 12, fontWeight: '600', color: '#FF3D3D' },
    scroll: { flex: 1 },
    scrollContent: { padding: spacing.lg, paddingBottom: 140 },
    sectionTitle: { fontSize: typography.fontSize.xl, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs },
    sectionDesc: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginBottom: spacing.lg },
    inputGroup: { marginBottom: spacing.lg },
    inputLabel: { fontSize: 13, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.xs, letterSpacing: 0.3 },
    inputRow: { flexDirection: 'row', alignItems: 'center', height: 56, backgroundColor: colors.charcoal[800], borderWidth: 2, borderColor: colors.charcoal[600], borderRadius: borderRadius.xl, paddingHorizontal: spacing.md, gap: spacing.sm },
    textInput: { flex: 1, fontSize: 16, color: colors.text.primary, height: '100%' },
    textArea: { height: 90, textAlignVertical: 'top', paddingTop: spacing.md, backgroundColor: colors.charcoal[800], borderWidth: 2, borderColor: colors.charcoal[600], borderRadius: borderRadius.xl, paddingHorizontal: spacing.md },

    callBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: `${'#FF3D3D'}10`, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: `${'#FF3D3D'}30` },
    callTitle: { fontSize: 12, color: colors.text.secondary },
    callNumber: { fontSize: 20, fontWeight: '700', color: '#FF3D3D' },
    callAction: { fontSize: 13, fontWeight: '600', color: '#FF3D3D' },
    triageCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.charcoal[800], borderRadius: borderRadius.xl, borderWidth: 2, borderColor: colors.charcoal[600], marginBottom: spacing.sm, gap: spacing.sm },
    triageDot: { width: 12, height: 12, borderRadius: 6 },
    triageLabel: { fontSize: 15, fontWeight: '600', color: colors.text.muted },
    triageDesc: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
    triageRight: { alignItems: 'flex-end' },
    triageEta: { fontSize: 13, fontWeight: '700' },
    triageFee: { fontSize: 11, color: colors.text.secondary, marginTop: 2 },
    patientRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, marginTop: spacing.md },
    divider: { height: 1, backgroundColor: colors.charcoal[600], marginVertical: spacing.xs },
    confirmCard: { backgroundColor: colors.charcoal[800], borderRadius: borderRadius['2xl'], padding: spacing.lg, borderWidth: 1, borderColor: colors.charcoal[600] },
    confirmHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    confirmTitle: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.text.primary },
    confirmRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
    confirmLabel: { fontSize: 14, color: colors.text.secondary },
    confirmValue: { fontSize: 14, fontWeight: '500', color: colors.text.primary, maxWidth: '60%', textAlign: 'right' },
    totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
    totalValue: { fontSize: 18, fontWeight: '700', color: colors.voltage },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, backgroundColor: colors.charcoal[900], borderTopWidth: 1, borderTopColor: colors.charcoal[700] },
    continueButton: { height: 60, backgroundColor: colors.charcoal[800], borderWidth: 2, borderColor: colors.voltage, borderRadius: borderRadius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    continueText: { fontSize: 16, fontWeight: '700', color: colors.voltage },
    submitButtonEmergency: { height: 64, backgroundColor: '#DC143C', borderRadius: borderRadius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, ...shadows.button },
    submitTextEmergency: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    buttonDisabled: { opacity: 0.5 },
});

export default AmbulanceForm;
