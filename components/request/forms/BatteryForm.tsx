// ⚡ ResQ Kenya - Battery / Jumpstart Request Form
// 3-step: Details → Location → Confirm

import React, { useState } from 'react';
import {
    View, Text, ScrollView, Pressable, TextInput, StyleSheet, Dimensions, Platform
} from 'react-native';
import {
    MapPin, ChevronRight, ChevronLeft, Battery, Zap, Clock, AlertTriangle, CheckCircle
} from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../../../theme/voltage-premium';
import { StepIndicator } from '../StepIndicator';
import { PRICES } from '../../../constants/prices';
import LocationMapPreview from '../../maps/LocationMapPreview';

const { width } = Dimensions.get('window');
type Step = 1 | 2 | 3;
type UrgencyLevel = 'standard' | 'priority' | 'express';

interface BatteryFormProps {
    onSubmit: (data: any) => void;
    onBack: () => void;
}

const URGENCY_OPTIONS = [
    { id: 'standard' as UrgencyLevel, label: 'Standard', desc: '30-45 min', fee: 0, color: colors.success, icon: Clock },
    { id: 'priority' as UrgencyLevel, label: 'Priority', desc: '15-25 min', fee: PRICES.PRIORITY_FEE, color: '#FFA500', icon: Zap },
    { id: 'express' as UrgencyLevel, label: 'Express', desc: '10-15 min', fee: PRICES.EXPRESS_FEE, color: colors.status.error, icon: AlertTriangle },
];

export const BatteryForm: React.FC<BatteryFormProps> = ({ onSubmit, onBack }) => {
    const [step, setStep] = useState<Step>(1);
    const [urgency, setUrgency] = useState<UrgencyLevel>('standard');
    const [location, setLocation] = useState('');
    const [vehicleInfo, setVehicleInfo] = useState('');
    const [additionalNotes, setAdditionalNotes] = useState('');

    const urgencyFee = URGENCY_OPTIONS.find(o => o.id === urgency)?.fee || 0;
    const totalCost = PRICES.JUMPSTART_BASE + urgencyFee;
    const eta = URGENCY_OPTIONS.find(o => o.id === urgency)?.desc || '30-45 min';

    const canProceed = () => {
        if (step === 1) return true;
        if (step === 2) return location.length > 0;
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
                <Text style={styles.headerTitle}>Battery Jumpstart</Text>
                <View style={styles.headerSpacer} />
            </View>

            <StepIndicator currentStep={step} steps={['Details', 'Location', 'Confirm']} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Step 1: Details & Urgency */}
                {step === 1 && (
                    <View>
                        <Text style={styles.sectionTitle}>Service Priority</Text>
                        <Text style={styles.sectionDesc}>How urgently do you need assistance?</Text>

                        {/* Hero Card */}
                        <View style={styles.heroCard}>
                            <Battery size={32} color={colors.voltage} strokeWidth={2} />
                            <View style={{ flex: 1, marginLeft: spacing.md }}>
                                <Text style={styles.heroTitle}>Battery Jumpstart</Text>
                                <Text style={styles.heroDesc}>Professional jumpstart service to get your vehicle running</Text>
                            </View>
                        </View>

                        {/* Urgency Options */}
                        {URGENCY_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            return (
                                <Pressable
                                    key={option.id}
                                    style={[styles.urgencyCard, urgency === option.id && { borderColor: option.color, backgroundColor: `${option.color}10` }]}
                                    onPress={() => setUrgency(option.id)}
                                >
                                    <View style={[styles.urgencyIcon, { backgroundColor: `${option.color}20` }]}>
                                        <Icon size={20} color={option.color} strokeWidth={2} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.urgencyLabel, urgency === option.id && { color: colors.text.primary }]}>{option.label}</Text>
                                        <Text style={styles.urgencyDesc}>{option.desc}</Text>
                                    </View>
                                    <View style={styles.urgencyPrice}>
                                        <Text style={[styles.urgencyPriceText, { color: option.color }]}>
                                            {option.fee > 0 ? `+KES ${option.fee}` : 'Free'}
                                        </Text>
                                    </View>
                                    {urgency === option.id && (
                                        <View style={[styles.radioOuter, { borderColor: option.color }]}>
                                            <View style={[styles.radioInner, { backgroundColor: option.color }]} />
                                        </View>
                                    )}
                                    {urgency !== option.id && <View style={styles.radioOuter} />}
                                </Pressable>
                            );
                        })}

                        {/* Vehicle Info */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Vehicle Info (Optional)</Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={styles.textInput}
                                    value={vehicleInfo}
                                    onChangeText={setVehicleInfo}
                                    placeholder="e.g. Toyota Corolla 2020, White"
                                    placeholderTextColor={colors.text.muted}
                                />
                            </View>
                        </View>
                    </View>
                )}

                {/* Step 2: Location */}
                {step === 2 && (
                    <View>
                        <Text style={styles.sectionTitle}>Your Location</Text>
                        <Text style={styles.sectionDesc}>Where is your vehicle located?</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Current Location</Text>
                            <View style={styles.inputRow}>
                                <MapPin size={20} color={colors.voltage} strokeWidth={2} />
                                <TextInput
                                    style={styles.textInput}
                                    value={location}
                                    onChangeText={setLocation}
                                    placeholder="Enter your location"
                                    placeholderTextColor={colors.text.muted}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={additionalNotes}
                                onChangeText={setAdditionalNotes}
                                placeholder="Landmarks, parking level, etc."
                                placeholderTextColor={colors.text.muted}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <LocationMapPreview />
                    </View>
                )}

                {/* Step 3: Confirm */}
                {step === 3 && (
                    <View>
                        <Text style={styles.sectionTitle}>Confirm Request</Text>
                        <Text style={styles.sectionDesc}>Review your jumpstart details</Text>

                        <View style={styles.confirmCard}>
                            <View style={styles.confirmHeader}>
                                <Battery size={28} color={colors.voltage} strokeWidth={2} />
                                <Text style={styles.confirmTitle}>Battery Jumpstart</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Priority</Text><Text style={[styles.confirmValue, { color: URGENCY_OPTIONS.find(o => o.id === urgency)?.color }]}>{urgency.charAt(0).toUpperCase() + urgency.slice(1)}</Text></View>
                            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>ETA</Text><Text style={styles.confirmValue}>{eta}</Text></View>
                            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Location</Text><Text style={styles.confirmValue} numberOfLines={1}>{location}</Text></View>
                            {vehicleInfo ? <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Vehicle</Text><Text style={styles.confirmValue}>{vehicleInfo}</Text></View> : null}
                            <View style={styles.divider} />
                            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Base Fee</Text><Text style={styles.confirmValue}>KES {PRICES.JUMPSTART_BASE.toLocaleString()}</Text></View>
                            {urgencyFee > 0 && <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Priority Fee</Text><Text style={styles.confirmValue}>KES {urgencyFee.toLocaleString()}</Text></View>}
                            <View style={[styles.divider, { backgroundColor: colors.voltage }]} />
                            <View style={styles.confirmRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>KES {totalCost.toLocaleString()}</Text></View>
                        </View>

                        <Text style={styles.etaNote}>Provider typically arrives in {eta}</Text>
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
                    <Pressable style={({ pressed }) => [styles.submitButton, pressed && { transform: [{ scale: 0.98 }] }]} onPress={() => onSubmit({ urgency, location, vehicleInfo, totalCost, service: 'battery' })}>
                        <Text style={styles.submitText}>Request Jumpstart Now</Text>
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
    heroCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.charcoal[800], borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.voltage, marginBottom: spacing.xl },
    heroTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
    heroDesc: { fontSize: 13, color: colors.text.secondary, marginTop: 2 },
    urgencyCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.charcoal[800], borderRadius: borderRadius.xl, borderWidth: 2, borderColor: colors.charcoal[600], marginBottom: spacing.sm, gap: spacing.sm },
    urgencyIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    urgencyLabel: { fontSize: 15, fontWeight: '600', color: colors.text.muted },
    urgencyDesc: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
    urgencyPrice: { marginRight: spacing.sm },
    urgencyPriceText: { fontSize: 13, fontWeight: '700' },
    radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.charcoal[500], alignItems: 'center', justifyContent: 'center' },
    radioInner: { width: 12, height: 12, borderRadius: 6 },
    inputGroup: { marginBottom: spacing.lg, marginTop: spacing.md },
    inputLabel: { fontSize: 13, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.xs, letterSpacing: 0.3 },
    inputRow: { flexDirection: 'row', alignItems: 'center', height: 56, backgroundColor: colors.charcoal[800], borderWidth: 2, borderColor: colors.charcoal[600], borderRadius: borderRadius.xl, paddingHorizontal: spacing.md, gap: spacing.sm },
    textInput: { flex: 1, fontSize: 16, color: colors.text.primary, height: '100%' },
    textArea: { height: 90, textAlignVertical: 'top', paddingTop: spacing.md, backgroundColor: colors.charcoal[800], borderWidth: 2, borderColor: colors.charcoal[600], borderRadius: borderRadius.xl, paddingHorizontal: spacing.md },

    divider: { height: 1, backgroundColor: colors.charcoal[600], marginVertical: spacing.xs },
    confirmCard: { backgroundColor: colors.charcoal[800], borderRadius: borderRadius['2xl'], padding: spacing.lg, borderWidth: 1, borderColor: colors.charcoal[600] },
    confirmHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    confirmTitle: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.text.primary },
    confirmRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
    confirmLabel: { fontSize: 14, color: colors.text.secondary },
    confirmValue: { fontSize: 14, fontWeight: '500', color: colors.text.primary, maxWidth: '60%', textAlign: 'right' },
    totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
    totalValue: { fontSize: 18, fontWeight: '700', color: colors.voltage },
    etaNote: { textAlign: 'center', fontSize: 13, color: colors.text.muted, marginTop: spacing.md },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, backgroundColor: colors.charcoal[900], borderTopWidth: 1, borderTopColor: colors.charcoal[700] },
    continueButton: { height: 60, backgroundColor: colors.charcoal[800], borderWidth: 2, borderColor: colors.voltage, borderRadius: borderRadius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    continueText: { fontSize: 16, fontWeight: '700', color: colors.voltage },
    submitButton: { height: 64, backgroundColor: colors.voltage, borderRadius: borderRadius.xl, alignItems: 'center', justifyContent: 'center', ...shadows.button },
    submitText: { fontSize: 16, fontWeight: '700', color: colors.charcoal[900] },
    buttonDisabled: { opacity: 0.5 },
});

export default BatteryForm;
