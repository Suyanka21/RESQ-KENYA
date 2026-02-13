// ⚡ ResQ Kenya - Fuel Delivery Request Form
// 3-step: Details → Location → Confirm

import React, { useState } from 'react';
import {
    View, Text, ScrollView, Pressable, TextInput, StyleSheet, Dimensions, Platform, ActivityIndicator
} from 'react-native';
import {
    MapPin, ChevronRight, ChevronLeft, Fuel, Droplets, CheckCircle
} from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../../../theme/voltage-premium';
import { StepIndicator } from '../StepIndicator';
import { PRICES } from '../../../constants/prices';
import LocationMapPreview from '../../maps/LocationMapPreview';

const { width } = Dimensions.get('window');
type Step = 1 | 2 | 3;
type FuelType = 'petrol' | 'diesel';

interface FuelFormProps {
    onSubmit: (data: any) => void;
    onBack: () => void;
}

export const FuelForm: React.FC<FuelFormProps> = ({ onSubmit, onBack }) => {
    const [step, setStep] = useState<Step>(1);
    const [fuelType, setFuelType] = useState<FuelType>('petrol');
    const [amount, setAmount] = useState<number>(20);
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const pricePerLiter = fuelType === 'petrol' ? PRICES.FUEL_PETROL : PRICES.FUEL_DIESEL;
    const fuelCost = amount * pricePerLiter;
    const totalCost = fuelCost + PRICES.DELIVERY_FEE;

    const FUEL_AMOUNTS = [5, 10, 15, 20, 30, 40, 50, 60];

    const canProceed = () => {
        if (step === 1) return amount > 0;
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
                <Text style={styles.headerTitle}>Fuel Delivery</Text>
                <View style={styles.headerSpacer} />
            </View>

            <StepIndicator currentStep={step} steps={['Details', 'Location', 'Confirm']} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Step 1: Fuel Type & Amount */}
                {step === 1 && (
                    <View>
                        <Text style={styles.sectionTitle}>Fuel Details</Text>
                        <Text style={styles.sectionDesc}>Select fuel type and amount</Text>

                        {/* Fuel Type */}
                        <Text style={styles.inputLabel}>Fuel Type</Text>
                        <View style={styles.fuelTypeRow}>
                            <Pressable
                                style={[styles.fuelTypeCard, fuelType === 'petrol' && styles.fuelTypeActive]}
                                onPress={() => setFuelType('petrol')}
                            >
                                {fuelType === 'petrol' && <View style={[styles.fuelStripe, { backgroundColor: '#4CAF50' }]} />}
                                <Fuel size={28} color={fuelType === 'petrol' ? colors.text.primary : colors.text.muted} strokeWidth={2} />
                                <Text style={[styles.fuelTypeLabel, fuelType === 'petrol' && styles.fuelTypeLabelActive]}>Petrol</Text>
                                <Text style={styles.fuelPrice}>KES {PRICES.FUEL_PETROL}/L</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.fuelTypeCard, fuelType === 'diesel' && styles.fuelTypeActive]}
                                onPress={() => setFuelType('diesel')}
                            >
                                {fuelType === 'diesel' && <View style={[styles.fuelStripe, { backgroundColor: '#FFA500' }]} />}
                                <Droplets size={28} color={fuelType === 'diesel' ? colors.text.primary : colors.text.muted} strokeWidth={2} />
                                <Text style={[styles.fuelTypeLabel, fuelType === 'diesel' && styles.fuelTypeLabelActive]}>Diesel</Text>
                                <Text style={styles.fuelPrice}>KES {PRICES.FUEL_DIESEL}/L</Text>
                            </Pressable>
                        </View>

                        {/* Amount Selector */}
                        <Text style={styles.inputLabel}>Amount (Liters)</Text>
                        <View style={styles.amountGrid}>
                            {FUEL_AMOUNTS.map((a) => (
                                <Pressable
                                    key={a}
                                    style={[styles.amountChip, amount === a && styles.amountChipActive]}
                                    onPress={() => setAmount(a)}
                                >
                                    <Text style={[styles.amountText, amount === a && styles.amountTextActive]}>{a}L</Text>
                                </Pressable>
                            ))}
                        </View>

                        {/* Live Cost Preview */}
                        <View style={styles.costPreview}>
                            <View style={styles.costRow}>
                                <Text style={styles.costLabel}>{amount}L × KES {pricePerLiter.toFixed(2)}</Text>
                                <Text style={styles.costValue}>KES {fuelCost.toFixed(0)}</Text>
                            </View>
                            <View style={styles.costRow}>
                                <Text style={styles.costLabel}>Delivery Fee</Text>
                                <Text style={styles.costValue}>KES {PRICES.DELIVERY_FEE}</Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: colors.voltage }]} />
                            <View style={styles.costRow}>
                                <Text style={styles.totalLabel}>Total</Text>
                                <Text style={styles.totalValue}>KES {totalCost.toFixed(0)}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Step 2: Location */}
                {step === 2 && (
                    <View>
                        <Text style={styles.sectionTitle}>Delivery Location</Text>
                        <Text style={styles.sectionDesc}>Where should we deliver the fuel?</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Your Location</Text>
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
                            <Text style={styles.inputLabel}>Delivery Notes (Optional)</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={notes}
                                onChangeText={setNotes}
                                placeholder="e.g. Near the petrol station, blue car..."
                                placeholderTextColor={colors.text.muted}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Map Preview */}
                        <LocationMapPreview />
                    </View>
                )}

                {/* Step 3: Confirm */}
                {step === 3 && (
                    <View>
                        <Text style={styles.sectionTitle}>Confirm Order</Text>
                        <Text style={styles.sectionDesc}>Review your fuel delivery details</Text>

                        <View style={styles.confirmCard}>
                            <View style={styles.confirmHeader}>
                                <Fuel size={28} color={colors.service.fuel} strokeWidth={2} />
                                <Text style={styles.confirmTitle}>Fuel Delivery</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Fuel Type</Text><Text style={styles.confirmValue}>{fuelType === 'petrol' ? 'Petrol' : 'Diesel'}</Text></View>
                            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Amount</Text><Text style={styles.confirmValue}>{amount} Liters</Text></View>
                            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Location</Text><Text style={styles.confirmValue} numberOfLines={1}>{location}</Text></View>
                            <View style={styles.divider} />
                            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Fuel Cost</Text><Text style={styles.confirmValue}>KES {fuelCost.toFixed(0)}</Text></View>
                            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Delivery</Text><Text style={styles.confirmValue}>KES {PRICES.DELIVERY_FEE}</Text></View>
                            <View style={[styles.divider, { backgroundColor: colors.voltage }]} />
                            <View style={styles.confirmRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>KES {totalCost.toFixed(0)}</Text></View>
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
                    <Pressable style={({ pressed }) => [styles.submitButton, pressed && { transform: [{ scale: 0.98 }] }, isSubmitting && styles.buttonDisabled]} onPress={() => { setIsSubmitting(true); onSubmit({ fuelType, amount, location, totalCost, service: 'fuel' }); }} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <ActivityIndicator color={colors.charcoal[900]} />
                        ) : (
                            <Text style={styles.submitText}>Request Fuel Delivery</Text>
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
    textArea: { height: 90, textAlignVertical: 'top', paddingTop: spacing.md, backgroundColor: colors.charcoal[800], borderWidth: 2, borderColor: colors.charcoal[600], borderRadius: borderRadius.xl, paddingHorizontal: spacing.md },
    fuelTypeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl, marginTop: spacing.sm },
    fuelTypeCard: { flex: 1, height: 110, borderRadius: borderRadius.xl, borderWidth: 2, borderColor: colors.charcoal[600], backgroundColor: colors.charcoal[800], alignItems: 'center', justifyContent: 'center', gap: spacing.xs, overflow: 'hidden' },
    fuelTypeActive: { borderColor: colors.voltage, backgroundColor: `${colors.voltage}15` },
    fuelStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
    fuelTypeLabel: { fontSize: 16, fontWeight: '700', color: colors.text.muted },
    fuelTypeLabelActive: { color: colors.text.primary },
    fuelPrice: { fontSize: 11, color: colors.text.secondary },
    amountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl, marginTop: spacing.sm },
    amountChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.charcoal[800], borderRadius: borderRadius.xl, borderWidth: 2, borderColor: colors.charcoal[600] },
    amountChipActive: { borderColor: colors.voltage, backgroundColor: `${colors.voltage}15` },
    amountText: { fontSize: 14, fontWeight: '600', color: colors.text.muted },
    amountTextActive: { color: colors.voltage },
    costPreview: { backgroundColor: colors.charcoal[800], borderRadius: borderRadius.xl, padding: spacing.md, borderWidth: 1, borderColor: colors.charcoal[600] },
    costRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
    costLabel: { fontSize: 14, color: colors.text.secondary },
    costValue: { fontSize: 14, fontWeight: '500', color: colors.text.primary },
    divider: { height: 1, backgroundColor: colors.charcoal[600], marginVertical: spacing.xs },
    totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
    totalValue: { fontSize: 18, fontWeight: '700', color: colors.voltage },

    confirmCard: { backgroundColor: colors.charcoal[800], borderRadius: borderRadius['2xl'], padding: spacing.lg, borderWidth: 1, borderColor: colors.charcoal[600] },
    confirmHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    confirmTitle: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.text.primary },
    confirmRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
    confirmLabel: { fontSize: 14, color: colors.text.secondary },
    confirmValue: { fontSize: 14, fontWeight: '500', color: colors.text.primary, maxWidth: '60%', textAlign: 'right' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, backgroundColor: colors.charcoal[900], borderTopWidth: 1, borderTopColor: colors.charcoal[700] },
    continueButton: { height: 60, backgroundColor: colors.charcoal[800], borderWidth: 2, borderColor: colors.voltage, borderRadius: borderRadius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    continueText: { fontSize: 16, fontWeight: '700', color: colors.voltage },
    submitButton: { height: 64, backgroundColor: colors.voltage, borderRadius: borderRadius.xl, alignItems: 'center', justifyContent: 'center', ...shadows.button },
    submitText: { fontSize: 16, fontWeight: '700', color: colors.charcoal[900] },
    buttonDisabled: { opacity: 0.5 },
});

export default FuelForm;
