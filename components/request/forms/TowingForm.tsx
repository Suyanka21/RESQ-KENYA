// ⚡ ResQ Kenya - Towing Request Form
// 3-step: Location → Vehicle → Confirm

import React, { useState } from 'react';
import {
    View, Text, ScrollView, Pressable, TextInput, StyleSheet, Dimensions, Platform
} from 'react-native';
import {
    MapPin, ChevronRight, ChevronLeft, Car, Key, AlertTriangle,
    Navigation, Truck, CheckCircle
} from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../../../theme/voltage-premium';
import { StepIndicator } from '../StepIndicator';
import { PRICES } from '../../../constants/prices';

const { width } = Dimensions.get('window');

type Step = 1 | 2 | 3;

interface TowingFormProps {
    onSubmit: (data: any) => void;
    onBack: () => void;
}

const VEHICLE_TYPES = [
    { id: 'sedan', label: 'Sedan', icon: '🚗' },
    { id: 'suv', label: 'SUV', icon: '🚙' },
    { id: 'truck', label: 'Truck', icon: '🛻' },
    { id: 'van', label: 'Van', icon: '🚐' },
    { id: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
    { id: 'other', label: 'Other', icon: '🚘' },
];

export const TowingForm: React.FC<TowingFormProps> = ({ onSubmit, onBack }) => {
    const [step, setStep] = useState<Step>(1);
    const [pickupLocation, setPickupLocation] = useState('');
    const [dropoffLocation, setDropoffLocation] = useState('');
    const [vehiclePlate, setVehiclePlate] = useState('');
    const [vehicleType, setVehicleType] = useState('sedan');
    const [problemDescription, setProblemDescription] = useState('');
    const [isDrivable, setIsDrivable] = useState(false);
    const [hasKeys, setHasKeys] = useState(true);

    const estimatedDistance = 12;
    const totalCost = PRICES.TOWING_BASE + (estimatedDistance * PRICES.TOWING_PER_KM);

    const canProceed = () => {
        if (step === 1) return pickupLocation.length > 0 && dropoffLocation.length > 0;
        if (step === 2) return vehiclePlate.length > 0;
        return true;
    };

    const handleNext = () => {
        if (step < 3) setStep((step + 1) as Step);
    };

    const handleBack = () => {
        if (step > 1) setStep((step - 1) as Step);
        else onBack();
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={handleBack} style={styles.backButton} accessibilityLabel="Go back" accessibilityRole="button">
                    <ChevronLeft size={24} color={colors.text.primary} strokeWidth={2} />
                </Pressable>
                <Text style={styles.headerTitle}>Towing Service</Text>
                <View style={styles.headerSpacer} />
            </View>

            <StepIndicator currentStep={step} steps={['Location', 'Vehicle', 'Confirm']} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Step 1: Locations */}
                {step === 1 && (
                    <View>
                        <Text style={styles.sectionTitle}>Pickup & Drop-off</Text>
                        <Text style={styles.sectionDesc}>Where should we pick up and deliver your vehicle?</Text>

                        {/* Pickup */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Pickup Location</Text>
                            <View style={styles.inputRow}>
                                <MapPin size={20} color={colors.voltage} strokeWidth={2} />
                                <TextInput
                                    style={styles.textInput}
                                    value={pickupLocation}
                                    onChangeText={setPickupLocation}
                                    placeholder="Enter pickup location"
                                    placeholderTextColor={colors.text.muted}
                                />
                            </View>
                        </View>

                        {/* Dropoff */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Drop-off Location</Text>
                            <View style={styles.inputRow}>
                                <Navigation size={20} color={colors.status.info} strokeWidth={2} />
                                <TextInput
                                    style={styles.textInput}
                                    value={dropoffLocation}
                                    onChangeText={setDropoffLocation}
                                    placeholder="Enter drop-off location"
                                    placeholderTextColor={colors.text.muted}
                                />
                            </View>
                        </View>

                        {/* Route Preview */}
                        {pickupLocation.length > 0 && dropoffLocation.length > 0 && (
                            <View style={styles.routeCard}>
                                <View style={styles.routeRow}>
                                    <Text style={styles.routeLabel}>Estimated Distance</Text>
                                    <Text style={styles.routeValue}>{estimatedDistance} km</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.routeRow}>
                                    <Text style={styles.routeLabel}>Estimated Cost</Text>
                                    <Text style={styles.routeValueHighlight}>KES {totalCost.toLocaleString()}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Step 2: Vehicle Details */}
                {step === 2 && (
                    <View>
                        <Text style={styles.sectionTitle}>Vehicle Details</Text>
                        <Text style={styles.sectionDesc}>Tell us about your vehicle</Text>

                        {/* Plate */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>License Plate</Text>
                            <View style={styles.inputRow}>
                                <Car size={20} color={colors.voltage} strokeWidth={2} />
                                <TextInput
                                    style={styles.textInput}
                                    value={vehiclePlate}
                                    onChangeText={setVehiclePlate}
                                    placeholder="e.g. KDA 123A"
                                    placeholderTextColor={colors.text.muted}
                                    autoCapitalize="characters"
                                />
                            </View>
                        </View>

                        {/* Vehicle Type Grid */}
                        <Text style={styles.inputLabel}>Vehicle Type</Text>
                        <View style={styles.typeGrid}>
                            {VEHICLE_TYPES.map((type) => (
                                <Pressable
                                    key={type.id}
                                    style={[styles.typeCard, vehicleType === type.id && styles.typeCardActive]}
                                    onPress={() => setVehicleType(type.id)}
                                >
                                    <Text style={styles.typeEmoji}>{type.icon}</Text>
                                    <Text style={[styles.typeLabel, vehicleType === type.id && styles.typeLabelActive]}>
                                        {type.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        {/* Problem Description */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Problem Description (Optional)</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={problemDescription}
                                onChangeText={setProblemDescription}
                                placeholder="Describe the issue..."
                                placeholderTextColor={colors.text.muted}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Toggles */}
                        <View style={styles.toggleRow}>
                            <Pressable
                                style={[styles.toggleCard, !isDrivable && styles.toggleCardActive]}
                                onPress={() => setIsDrivable(!isDrivable)}
                            >
                                <AlertTriangle size={20} color={!isDrivable ? colors.status.error : colors.text.muted} strokeWidth={2} />
                                <Text style={[styles.toggleLabel, !isDrivable && styles.toggleLabelActive]}>
                                    {isDrivable ? 'Drivable' : 'Not Drivable'}
                                </Text>
                            </Pressable>
                            <Pressable
                                style={[styles.toggleCard, hasKeys && styles.toggleCardActive]}
                                onPress={() => setHasKeys(!hasKeys)}
                            >
                                <Key size={20} color={hasKeys ? colors.success : colors.text.muted} strokeWidth={2} />
                                <Text style={[styles.toggleLabel, hasKeys && styles.toggleLabelActive]}>
                                    {hasKeys ? 'Keys Available' : 'No Keys'}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* Step 3: Confirmation */}
                {step === 3 && (
                    <View>
                        <Text style={styles.sectionTitle}>Confirm Request</Text>
                        <Text style={styles.sectionDesc}>Review your towing details</Text>

                        <View style={styles.confirmCard}>
                            <View style={styles.confirmHeader}>
                                <Truck size={28} color={colors.voltage} strokeWidth={2} />
                                <Text style={styles.confirmTitle}>Towing Service</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.confirmRow}>
                                <Text style={styles.confirmLabel}>Pickup</Text>
                                <Text style={styles.confirmValue} numberOfLines={1}>{pickupLocation}</Text>
                            </View>
                            <View style={styles.confirmRow}>
                                <Text style={styles.confirmLabel}>Drop-off</Text>
                                <Text style={styles.confirmValue} numberOfLines={1}>{dropoffLocation}</Text>
                            </View>
                            <View style={styles.confirmRow}>
                                <Text style={styles.confirmLabel}>Vehicle</Text>
                                <Text style={styles.confirmValue}>{vehiclePlate} ({vehicleType})</Text>
                            </View>
                            <View style={styles.confirmRow}>
                                <Text style={styles.confirmLabel}>Distance</Text>
                                <Text style={styles.confirmValue}>{estimatedDistance} km</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.confirmRow}>
                                <Text style={styles.confirmLabel}>Base Fee</Text>
                                <Text style={styles.confirmValue}>KES {PRICES.TOWING_BASE.toLocaleString()}</Text>
                            </View>
                            <View style={styles.confirmRow}>
                                <Text style={styles.confirmLabel}>Distance Fee</Text>
                                <Text style={styles.confirmValue}>KES {(estimatedDistance * PRICES.TOWING_PER_KM).toLocaleString()}</Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: colors.voltage }]} />
                            <View style={styles.confirmRow}>
                                <Text style={styles.totalLabel}>Total</Text>
                                <Text style={styles.totalValue}>KES {totalCost.toLocaleString()}</Text>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                {step < 3 ? (
                    <Pressable
                        style={({ pressed }) => [styles.continueButton, pressed && { opacity: 0.9 }, !canProceed() && styles.buttonDisabled]}
                        onPress={handleNext}
                        disabled={!canProceed()}
                    >
                        <Text style={styles.continueText}>Continue</Text>
                        <ChevronRight size={20} color={colors.voltage} strokeWidth={2.5} />
                    </Pressable>
                ) : (
                    <Pressable
                        style={({ pressed }) => [styles.submitButton, pressed && { transform: [{ scale: 0.98 }] }]}
                        onPress={() => onSubmit({ pickupLocation, dropoffLocation, vehiclePlate, vehicleType, totalCost, service: 'towing' })}
                    >
                        <Text style={styles.submitText}>Request Towing Service</Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.charcoal[900] },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.md, paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: spacing.sm,
        backgroundColor: colors.charcoal[800], borderBottomWidth: 1, borderBottomColor: colors.charcoal[700],
    },
    backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.text.primary },
    headerSpacer: { width: 44 },
    scroll: { flex: 1 },
    scrollContent: { padding: spacing.lg, paddingBottom: 140 },
    sectionTitle: { fontSize: typography.fontSize.xl, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs },
    sectionDesc: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginBottom: spacing.lg },
    inputGroup: { marginBottom: spacing.lg },
    inputLabel: { fontSize: 13, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.xs, letterSpacing: 0.3 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center', height: 56,
        backgroundColor: colors.charcoal[800], borderWidth: 2, borderColor: colors.charcoal[600],
        borderRadius: borderRadius.xl, paddingHorizontal: spacing.md, gap: spacing.sm,
    },
    textInput: { flex: 1, fontSize: 16, color: colors.text.primary, height: '100%' },
    textArea: {
        height: 90, textAlignVertical: 'top', paddingTop: spacing.md,
        backgroundColor: colors.charcoal[800], borderWidth: 2, borderColor: colors.charcoal[600],
        borderRadius: borderRadius.xl, paddingHorizontal: spacing.md,
    },
    routeCard: {
        backgroundColor: colors.charcoal[800], borderRadius: borderRadius.xl, padding: spacing.md,
        borderWidth: 1, borderColor: colors.charcoal[600], marginTop: spacing.md,
    },
    routeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
    routeLabel: { fontSize: 14, color: colors.text.secondary },
    routeValue: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
    routeValueHighlight: { fontSize: 16, fontWeight: '700', color: colors.voltage },
    divider: { height: 1, backgroundColor: colors.charcoal[600], marginVertical: spacing.xs },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg, marginTop: spacing.sm },
    typeCard: {
        width: (width - spacing.lg * 2 - spacing.sm * 2) / 3, paddingVertical: spacing.md,
        backgroundColor: colors.charcoal[800], borderRadius: borderRadius.xl, borderWidth: 2,
        borderColor: colors.charcoal[600], alignItems: 'center', gap: spacing.xs,
    },
    typeCardActive: { borderColor: colors.voltage, backgroundColor: `${colors.voltage}15` },
    typeEmoji: { fontSize: 28 },
    typeLabel: { fontSize: 12, fontWeight: '500', color: colors.text.secondary },
    typeLabelActive: { color: colors.voltage, fontWeight: '600' },
    toggleRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    toggleCard: {
        flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
        padding: spacing.md, backgroundColor: colors.charcoal[800], borderRadius: borderRadius.xl,
        borderWidth: 2, borderColor: colors.charcoal[600],
    },
    toggleCardActive: { borderColor: colors.voltage, backgroundColor: `${colors.voltage}10` },
    toggleLabel: { fontSize: 13, fontWeight: '500', color: colors.text.secondary },
    toggleLabelActive: { color: colors.text.primary },
    confirmCard: {
        backgroundColor: colors.charcoal[800], borderRadius: borderRadius['2xl'], padding: spacing.lg,
        borderWidth: 1, borderColor: colors.charcoal[600],
    },
    confirmHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    confirmTitle: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.text.primary },
    confirmRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
    confirmLabel: { fontSize: 14, color: colors.text.secondary },
    confirmValue: { fontSize: 14, fontWeight: '500', color: colors.text.primary, maxWidth: '60%', textAlign: 'right' },
    totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
    totalValue: { fontSize: 18, fontWeight: '700', color: colors.voltage },
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg,
        backgroundColor: colors.charcoal[900], borderTopWidth: 1, borderTopColor: colors.charcoal[700],
    },
    continueButton: {
        height: 60, backgroundColor: colors.charcoal[800], borderWidth: 2, borderColor: colors.voltage,
        borderRadius: borderRadius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    },
    continueText: { fontSize: 16, fontWeight: '700', color: colors.voltage },
    submitButton: {
        height: 64, backgroundColor: colors.voltage, borderRadius: borderRadius.xl,
        alignItems: 'center', justifyContent: 'center', ...shadows.button,
    },
    submitText: { fontSize: 16, fontWeight: '700', color: colors.charcoal[900] },
    buttonDisabled: { opacity: 0.5 },
});

export default TowingForm;
