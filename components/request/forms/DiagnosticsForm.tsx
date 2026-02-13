// ⚡ ResQ Kenya - Diagnostics Request Form
// 3-step: Location → Details → Confirm

import React, { useState } from 'react';
import {
    View, Text, ScrollView, Pressable, TextInput, StyleSheet, Dimensions, Platform, ActivityIndicator
} from 'react-native';
import {
    MapPin, ChevronRight, ChevronLeft, Activity, Wrench, Building2, Clock, Zap, CheckCircle
} from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../../../theme/voltage-premium';
import { StepIndicator } from '../StepIndicator';
import { PRICES } from '../../../constants/prices';
import LocationMapPreview from '../../maps/LocationMapPreview';

const { width } = Dimensions.get('window');
type Step = 1 | 2 | 3;
type ServiceType = 'onsite' | 'workshop';
type UrgencyLevel = 'standard' | 'urgent';

interface DiagnosticsFormProps {
    onSubmit: (data: any) => void;
    onBack: () => void;
}

const SYMPTOMS = [
    { id: 'engine_noise', label: 'Engine Noise', icon: '🔊' },
    { id: 'wont_start', label: "Won't Start", icon: '🔑' },
    { id: 'overheating', label: 'Overheating', icon: '🌡️' },
    { id: 'warning_light', label: 'Warning Light', icon: '⚠️' },
    { id: 'vibration', label: 'Vibration', icon: '📳' },
    { id: 'smoke', label: 'Smoke/Smell', icon: '💨' },
];

export const DiagnosticsForm: React.FC<DiagnosticsFormProps> = ({ onSubmit, onBack }) => {
    const [step, setStep] = useState<Step>(1);
    const [location, setLocation] = useState('');
    const [serviceType, setServiceType] = useState<ServiceType>('onsite');
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [urgency, setUrgency] = useState<UrgencyLevel>('standard');
    const [vehicleMake, setVehicleMake] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [vehicleYear, setVehicleYear] = useState('');
    const [errorCodes, setErrorCodes] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const basePrice = serviceType === 'onsite' ? PRICES.DIAGNOSTIC_BASE_ONSITE : PRICES.DIAGNOSTIC_BASE_WORKSHOP;
    const urgencyFee = urgency === 'urgent' ? PRICES.DIAGNOSTIC_URGENCY_FEE : 0;
    const totalCost = basePrice + urgencyFee;

    const toggleSymptom = (id: string) => {
        setSelectedSymptoms(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    };

    const canProceed = () => {
        if (step === 1) return location.length > 0;
        if (step === 2) return selectedSymptoms.length > 0;
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
                <Text style={styles.headerTitle}>Diagnostics</Text>
                <View style={styles.headerSpacer} />
            </View>

            <StepIndicator currentStep={step} steps={['Location', 'Details', 'Confirm']} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Step 1: Location */}
                {step === 1 && (
                    <View>
                        <Text style={styles.sectionTitle}>Service Location</Text>
                        <Text style={styles.sectionDesc}>Where should we diagnose your vehicle?</Text>

                        {/* Service Type */}
                        <Text style={styles.inputLabel}>Service Type</Text>
                        <View style={styles.serviceTypeRow}>
                            <Pressable style={[styles.serviceTypeCard, serviceType === 'onsite' && styles.serviceTypeActive]} onPress={() => setServiceType('onsite')}>
                                <Wrench size={24} color={serviceType === 'onsite' ? colors.service.diagnostic : colors.text.muted} strokeWidth={2} />
                                <Text style={[styles.serviceTypeLabel, serviceType === 'onsite' && styles.serviceTypeLabelActive]}>On-Site</Text>
                                <Text style={styles.serviceTypePrice}>KES {PRICES.DIAGNOSTIC_BASE_ONSITE.toLocaleString()}</Text>
                            </Pressable>
                            <Pressable style={[styles.serviceTypeCard, serviceType === 'workshop' && styles.serviceTypeActive]} onPress={() => setServiceType('workshop')}>
                                <Building2 size={24} color={serviceType === 'workshop' ? colors.service.diagnostic : colors.text.muted} strokeWidth={2} />
                                <Text style={[styles.serviceTypeLabel, serviceType === 'workshop' && styles.serviceTypeLabelActive]}>Workshop</Text>
                                <Text style={styles.serviceTypePrice}>KES {PRICES.DIAGNOSTIC_BASE_WORKSHOP.toLocaleString()}</Text>
                            </Pressable>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Your Location</Text>
                            <View style={styles.inputRow}>
                                <MapPin size={20} color={colors.service.diagnostic} strokeWidth={2} />
                                <TextInput style={styles.textInput} value={location} onChangeText={setLocation} placeholder="Enter your location" placeholderTextColor={colors.text.muted} />
                            </View>
                        </View>

                        <LocationMapPreview />
                    </View>
                )}

                {/* Step 2: Details */}
                {step === 2 && (
                    <View>
                        <Text style={styles.sectionTitle}>Vehicle & Symptoms</Text>
                        <Text style={styles.sectionDesc}>Select symptoms and provide vehicle info</Text>

                        {/* Symptom Grid */}
                        <Text style={styles.inputLabel}>Symptoms (select all that apply)</Text>
                        <View style={styles.symptomGrid}>
                            {SYMPTOMS.map((symptom) => (
                                <Pressable
                                    key={symptom.id}
                                    style={[styles.symptomChip, selectedSymptoms.includes(symptom.id) && styles.symptomChipActive]}
                                    onPress={() => toggleSymptom(symptom.id)}
                                >
                                    <Text style={styles.symptomEmoji}>{symptom.icon}</Text>
                                    <Text style={[styles.symptomLabel, selectedSymptoms.includes(symptom.id) && styles.symptomLabelActive]}>{symptom.label}</Text>
                                </Pressable>
                            ))}
                        </View>

                        {/* Vehicle Info */}
                        <View style={styles.vehicleRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>Make</Text>
                                <View style={styles.inputRow}>
                                    <TextInput style={styles.textInput} value={vehicleMake} onChangeText={setVehicleMake} placeholder="Toyota" placeholderTextColor={colors.text.muted} />
                                </View>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>Model</Text>
                                <View style={styles.inputRow}>
                                    <TextInput style={styles.textInput} value={vehicleModel} onChangeText={setVehicleModel} placeholder="Corolla" placeholderTextColor={colors.text.muted} />
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Year</Text>
                            <View style={styles.inputRow}>
                                <TextInput style={styles.textInput} value={vehicleYear} onChangeText={setVehicleYear} placeholder="2020" placeholderTextColor={colors.text.muted} keyboardType="numeric" />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Error Codes (Optional)</Text>
                            <View style={styles.inputRow}>
                                <TextInput style={styles.textInput} value={errorCodes} onChangeText={setErrorCodes} placeholder="e.g. P0300, P0171" placeholderTextColor={colors.text.muted} />
                            </View>
                        </View>

                        {/* Urgency */}
                        <Text style={styles.inputLabel}>Urgency</Text>
                        <View style={styles.urgencyRow}>
                            <Pressable style={[styles.urgencyChip, urgency === 'standard' && styles.urgencyChipActive]} onPress={() => setUrgency('standard')}>
                                <Clock size={16} color={urgency === 'standard' ? colors.success : colors.text.muted} strokeWidth={2} />
                                <Text style={[styles.urgencyLabel, urgency === 'standard' && { color: colors.success }]}>Standard</Text>
                            </Pressable>
                            <Pressable style={[styles.urgencyChip, urgency === 'urgent' && styles.urgencyChipActive]} onPress={() => setUrgency('urgent')}>
                                <Zap size={16} color={urgency === 'urgent' ? colors.voltage : colors.text.muted} strokeWidth={2} />
                                <Text style={[styles.urgencyLabel, urgency === 'urgent' && { color: colors.voltage }]}>Urgent (+KES {PRICES.DIAGNOSTIC_URGENCY_FEE})</Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* Step 3: Confirm */}
                {step === 3 && (
                    <View>
                        <Text style={styles.sectionTitle}>Confirm Request</Text>
                        <Text style={styles.sectionDesc}>Review your diagnostics details</Text>

                        <View style={styles.confirmCard}>
                            <View style={styles.confirmHeader}>
                                <Activity size={28} color={colors.service.diagnostic} strokeWidth={2} />
                                <Text style={styles.confirmTitle}>Diagnostics Service</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Type</Text><Text style={styles.confirmValue}>{serviceType === 'onsite' ? 'On-Site' : 'Workshop'}</Text></View>
                            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Symptoms</Text><Text style={styles.confirmValue} numberOfLines={2}>{selectedSymptoms.map(s => SYMPTOMS.find(sym => sym.id === s)?.label).join(', ')}</Text></View>
                            {vehicleMake ? <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Vehicle</Text><Text style={styles.confirmValue}>{vehicleMake} {vehicleModel} {vehicleYear}</Text></View> : null}
                            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Location</Text><Text style={styles.confirmValue} numberOfLines={1}>{location}</Text></View>
                            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Urgency</Text><Text style={[styles.confirmValue, { color: urgency === 'urgent' ? colors.voltage : colors.success }]}>{urgency === 'urgent' ? 'Urgent' : 'Standard'}</Text></View>
                            <View style={styles.divider} />
                            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Base Fee</Text><Text style={styles.confirmValue}>KES {basePrice.toLocaleString()}</Text></View>
                            {urgencyFee > 0 && <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Urgency Fee</Text><Text style={styles.confirmValue}>KES {urgencyFee.toLocaleString()}</Text></View>}
                            <View style={[styles.divider, { backgroundColor: colors.service.diagnostic }]} />
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
                    <Pressable style={({ pressed }) => [styles.submitButton, pressed && { transform: [{ scale: 0.98 }] }, isSubmitting && styles.buttonDisabled]} onPress={() => { setIsSubmitting(true); onSubmit({ serviceType, selectedSymptoms, vehicleMake, vehicleModel, vehicleYear, urgency, location, totalCost, service: 'diagnostics' }); }} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <ActivityIndicator color={colors.charcoal[900]} />
                        ) : (
                            <Text style={styles.submitText}>Request Diagnostics</Text>
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
    scroll: { flex: 1 },
    scrollContent: { padding: spacing.lg, paddingBottom: 140 },
    sectionTitle: { fontSize: typography.fontSize.xl, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs },
    sectionDesc: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginBottom: spacing.lg },
    inputGroup: { marginBottom: spacing.lg },
    inputLabel: { fontSize: 13, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.xs, letterSpacing: 0.3 },
    inputRow: { flexDirection: 'row', alignItems: 'center', height: 56, backgroundColor: colors.charcoal[800], borderWidth: 2, borderColor: colors.charcoal[600], borderRadius: borderRadius.xl, paddingHorizontal: spacing.md, gap: spacing.sm },
    textInput: { flex: 1, fontSize: 16, color: colors.text.primary, height: '100%' },

    serviceTypeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl, marginTop: spacing.sm },
    serviceTypeCard: { flex: 1, height: 100, borderRadius: borderRadius.xl, borderWidth: 2, borderColor: colors.charcoal[600], backgroundColor: colors.charcoal[800], alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
    serviceTypeActive: { borderColor: colors.service.diagnostic, backgroundColor: `${colors.service.diagnostic}15` },
    serviceTypeLabel: { fontSize: 14, fontWeight: '700', color: colors.text.muted },
    serviceTypeLabelActive: { color: colors.text.primary },
    serviceTypePrice: { fontSize: 11, color: colors.text.secondary },
    symptomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl, marginTop: spacing.sm },
    symptomChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.charcoal[800], borderRadius: borderRadius.full, borderWidth: 2, borderColor: colors.charcoal[600] },
    symptomChipActive: { borderColor: colors.service.diagnostic, backgroundColor: `${colors.service.diagnostic}15` },
    symptomEmoji: { fontSize: 16 },
    symptomLabel: { fontSize: 13, fontWeight: '500', color: colors.text.muted },
    symptomLabelActive: { color: colors.text.primary },
    vehicleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    urgencyRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.lg },
    urgencyChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.md, backgroundColor: colors.charcoal[800], borderRadius: borderRadius.xl, borderWidth: 2, borderColor: colors.charcoal[600] },
    urgencyChipActive: { borderColor: colors.voltage, backgroundColor: `${colors.voltage}10` },
    urgencyLabel: { fontSize: 13, fontWeight: '600', color: colors.text.muted },
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
    submitButton: { height: 64, backgroundColor: colors.voltage, borderRadius: borderRadius.xl, alignItems: 'center', justifyContent: 'center', ...shadows.button },
    submitText: { fontSize: 16, fontWeight: '700', color: colors.charcoal[900] },
    buttonDisabled: { opacity: 0.5 },
});

export default DiagnosticsForm;
