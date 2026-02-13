// ⚡ ResQ Kenya - Tire Service Request Form
// Converted from: DESIGN RES Q/components/TireRequestScreen.tsx (Google Stitch)
// Features: Car chassis diagram, issue type cards with Lucide icons, purple accent theme

import React, { useState } from 'react';
import {
    View, Text, ScrollView, Pressable, TextInput, StyleSheet, Dimensions, Platform, ActivityIndicator
} from 'react-native';
import {
    MapPin, ChevronRight, ChevronLeft, ChevronDown, Disc, Car, CheckCircle, AlertCircle,
    Circle, HelpCircle, Clock, Crosshair, Check
} from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../../../theme/voltage-premium';
import { StepIndicator } from '../StepIndicator';
import { PRICES } from '../../../constants/prices';
import LocationMapPreview from '../../maps/LocationMapPreview';

const { width } = Dimensions.get('window');
type Step = 1 | 2 | 3;
type IssueType = 'flat' | 'burst' | 'install' | 'unsure';
type TirePosition = 'front-left' | 'front-right' | 'rear-left' | 'rear-right';

// Purple accent color matching stitch design
const PURPLE = '#9C27B0';
const PURPLE_10 = 'rgba(156, 39, 176, 0.1)';
const PURPLE_20 = 'rgba(156, 39, 176, 0.2)';
const PURPLE_30 = 'rgba(156, 39, 176, 0.3)';

interface TireFormProps {
    onSubmit: (data: any) => void;
    onBack: () => void;
}

const ISSUE_TYPES: { id: IssueType; label: string; desc: string; Icon: any }[] = [
    { id: 'flat', label: 'Flat Tire', desc: 'Puncture or leak', Icon: Circle },
    { id: 'burst', label: 'Tire Burst', desc: 'Complete blowout', Icon: AlertCircle },
    { id: 'install', label: 'Install Spare', desc: 'I have a spare', Icon: Disc },
    { id: 'unsure', label: 'Not Sure', desc: 'Need diagnosis', Icon: HelpCircle },
];

export const TireForm: React.FC<TireFormProps> = ({ onSubmit, onBack }) => {
    const [step, setStep] = useState<Step>(1);
    const [location, setLocation] = useState('');
    const [issueType, setIssueType] = useState<IssueType | null>(null);
    const [selectedTires, setSelectedTires] = useState<TirePosition[]>([]);
    const [hasSpare, setHasSpare] = useState<boolean | null>(null);
    const [showVehicleDetails, setShowVehicleDetails] = useState(false);
    const [vehicleType, setVehicleType] = useState('');
    const [licensePlate, setLicensePlate] = useState('');
    const [tireSize, setTireSize] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const basePrice = PRICES.TIRE_REPAIR_BASE;
    const serviceCall = PRICES.TIRE_SERVICE_CALL;
    const totalCost = basePrice + serviceCall;

    const toggleTire = (tire: TirePosition) => {
        setSelectedTires(prev =>
            prev.includes(tire) ? prev.filter(t => t !== tire) : [...prev, tire]
        );
    };

    const canProceed = () => {
        if (step === 1) return location.length > 0;
        if (step === 2) return issueType !== null && selectedTires.length > 0;
        return true;
    };

    const handleNext = () => { if (step < 3) setStep((step + 1) as Step); };
    const handleBack = () => { if (step > 1) setStep((step - 1) as Step); else onBack(); };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    onPress={handleBack}
                    style={({ pressed }) => [styles.backButton, pressed && { backgroundColor: colors.charcoal[700], transform: [{ scale: 0.9 }] }]}
                    accessibilityLabel="Go back" accessibilityRole="button"
                >
                    <ChevronLeft size={24} color={colors.text.primary} strokeWidth={2} />
                </Pressable>
                <Text style={styles.headerTitle}>Tire Service</Text>
                <View style={styles.headerSpacer} />
            </View>

            <StepIndicator currentStep={step} steps={['Location', 'Details', 'Confirm']} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* ===== STEP 1: LOCATION ===== */}
                {step === 1 && (
                    <View>
                        {/* Title Section */}
                        <View style={styles.titleRow}>
                            <View style={styles.titleIcon}>
                                <Disc size={32} color={PURPLE} strokeWidth={2} />
                            </View>
                            <View>
                                <Text style={styles.sectionTitle}>Tire Repair</Text>
                                <Text style={styles.sectionDesc}>Flat tire? We'll get you rolling again</Text>
                            </View>
                        </View>

                        {/* Response Badge */}
                        <View style={styles.responseBadge}>
                            <Clock size={16} color={PURPLE} strokeWidth={2} />
                            <Text style={styles.responseBadgeText}>Usually 15-25 minutes</Text>
                        </View>

                        {/* Location Input */}
                        <Text style={styles.inputLabel}>Your Location</Text>

                        {/* Map Preview */}
                        <LocationMapPreview height={150} />

                        {/* Location Text Input */}
                        <View style={styles.locationInputRow}>
                            <MapPin size={20} color={PURPLE} strokeWidth={2} />
                            <TextInput
                                style={styles.textInput}
                                value={location}
                                onChangeText={setLocation}
                                placeholder="Enter your location"
                                placeholderTextColor={colors.text.muted}
                            />
                        </View>

                        {/* Use Current Location */}
                        <Pressable style={styles.currentLocationBtn}>
                            <Crosshair size={16} color={PURPLE} strokeWidth={2} />
                            <Text style={styles.currentLocationText}>Use current location</Text>
                        </Pressable>
                    </View>
                )}

                {/* ===== STEP 2: DETAILS (matches stitch) ===== */}
                {step === 2 && (
                    <View>
                        {/* Issue Type Selection — 2x2 Grid with Lucide icons */}
                        <Text style={styles.inputLabel}>What happened?</Text>
                        <View style={styles.issueGrid}>
                            {ISSUE_TYPES.map(({ id, label, desc, Icon }) => {
                                const selected = issueType === id;
                                return (
                                    <Pressable
                                        key={id}
                                        style={[styles.issueCard, selected && styles.issueCardActive]}
                                        onPress={() => setIssueType(id)}
                                    >
                                        <Icon size={28} color={selected ? '#FFFFFF' : colors.text.muted} strokeWidth={2} />
                                        <Text style={[styles.issueLabel, selected && styles.issueLabelActive]}>{label}</Text>
                                        <Text style={styles.issueDesc}>{desc}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {/* ===== CAR CHASSIS DIAGRAM ===== */}
                        <Text style={styles.inputLabel}>Affected Tire(s)</Text>
                        <View style={styles.chassisDiagram}>
                            <View style={styles.chassisOuter}>
                                {/* Car body outline */}
                                <View style={styles.carBodyOuter}>
                                    <View style={styles.carBodyInner} />
                                </View>

                                {/* Front label */}
                                <Text style={styles.frontLabel}>FRONT</Text>

                                {/* Front Left Tire */}
                                <Pressable
                                    onPress={() => toggleTire('front-left')}
                                    style={[styles.tireTouchable, styles.tireFrontLeft,
                                    selectedTires.includes('front-left') && styles.tireSelected]}
                                />

                                {/* Front Right Tire */}
                                <Pressable
                                    onPress={() => toggleTire('front-right')}
                                    style={[styles.tireTouchable, styles.tireFrontRight,
                                    selectedTires.includes('front-right') && styles.tireSelected]}
                                />

                                {/* Rear Left Tire */}
                                <Pressable
                                    onPress={() => toggleTire('rear-left')}
                                    style={[styles.tireTouchable, styles.tireRearLeft,
                                    selectedTires.includes('rear-left') && styles.tireSelected]}
                                />

                                {/* Rear Right Tire */}
                                <Pressable
                                    onPress={() => toggleTire('rear-right')}
                                    style={[styles.tireTouchable, styles.tireRearRight,
                                    selectedTires.includes('rear-right') && styles.tireSelected]}
                                />
                            </View>

                            {/* Selected tires summary */}
                            <View style={styles.selectedTiresRow}>
                                {selectedTires.length === 0 ? (
                                    <Text style={styles.tapHint}>Tap tires to select</Text>
                                ) : (
                                    selectedTires.map(t => (
                                        <View key={t} style={styles.selectedTireBadge}>
                                            <Text style={styles.selectedTireText}>{t.replace('-', ' ')}</Text>
                                        </View>
                                    ))
                                )}
                            </View>
                        </View>

                        {/* Spare Tire Toggle */}
                        <Text style={styles.inputLabel}>Spare Tire Available?</Text>
                        <View style={styles.spareRow}>
                            <Pressable
                                style={[styles.spareBtn, hasSpare === true && styles.spareBtnActive]}
                                onPress={() => setHasSpare(true)}
                            >
                                <Text style={[styles.spareBtnText, hasSpare === true && styles.spareBtnTextActive]}>Yes</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.spareBtn, hasSpare === false && styles.spareBtnActive]}
                                onPress={() => setHasSpare(false)}
                            >
                                <Text style={[styles.spareBtnText, hasSpare === false && styles.spareBtnTextActive]}>No</Text>
                            </Pressable>
                        </View>
                        {hasSpare === false && (
                            <View style={styles.spareWarning}>
                                <AlertCircle size={16} color={PURPLE} strokeWidth={2} />
                                <Text style={styles.spareWarningText}>Provider will bring a replacement tire (additional cost)</Text>
                            </View>
                        )}

                        {/* Vehicle Details (Collapsible) */}
                        <Pressable
                            onPress={() => setShowVehicleDetails(!showVehicleDetails)}
                            style={styles.collapseHeader}
                        >
                            <Text style={styles.collapseHeaderText}>Vehicle details (optional)</Text>
                            <ChevronDown
                                size={20} color={colors.text.muted} strokeWidth={2}
                                style={{ transform: [{ rotate: showVehicleDetails ? '180deg' : '0deg' }] }}
                            />
                        </Pressable>
                        {showVehicleDetails && (
                            <View style={styles.collapseBody}>
                                <TextInput
                                    style={styles.collapsedInput}
                                    value={vehicleType}
                                    onChangeText={setVehicleType}
                                    placeholder="Vehicle Type (e.g. Sedan, SUV)"
                                    placeholderTextColor={colors.text.muted}
                                />
                                <TextInput
                                    style={styles.collapsedInput}
                                    value={licensePlate}
                                    onChangeText={text => setLicensePlate(text.toUpperCase())}
                                    placeholder="License Plate (e.g., KCA 123B)"
                                    placeholderTextColor={colors.text.muted}
                                    autoCapitalize="characters"
                                />
                                <TextInput
                                    style={styles.collapsedInput}
                                    value={tireSize}
                                    onChangeText={setTireSize}
                                    placeholder="Tire Size (e.g., 205/55R16) - Optional"
                                    placeholderTextColor={colors.text.muted}
                                />
                            </View>
                        )}

                        {/* Notes */}
                        <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>Additional Notes</Text>
                        <View style={styles.notesContainer}>
                            <TextInput
                                style={styles.notesInput}
                                value={notes}
                                onChangeText={setNotes}
                                maxLength={200}
                                multiline
                                placeholder="e.g., Tire is severely damaged"
                                placeholderTextColor={colors.text.muted}
                            />
                            <Text style={styles.charCount}>{notes.length}/200</Text>
                        </View>
                    </View>
                )}

                {/* ===== STEP 3: CONFIRM ===== */}
                {step === 3 && (
                    <View>
                        <Text style={styles.sectionTitle}>Review & Request</Text>

                        {/* Service Summary */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryHeader}>
                                <View style={styles.summaryIconWrap}>
                                    <Disc size={24} color={PURPLE} strokeWidth={2} />
                                </View>
                                <View>
                                    <Text style={styles.summaryTitle}>Tire Repair Service</Text>
                                    <Text style={styles.summarySubtitle}>
                                        {issueType === 'flat' ? 'Flat Tire Repair' :
                                            issueType === 'burst' ? 'Tire Replacement' :
                                                issueType === 'install' ? 'Spare Installation' : 'Diagnostic Service'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryTags}>
                                <View style={styles.summaryTag}>
                                    <Text style={styles.summaryTagText}>{location.split(',')[0] || 'Location'}</Text>
                                </View>
                                {selectedTires.map(t => (
                                    <View key={t} style={styles.summaryTag}>
                                        <Text style={styles.summaryTagText}>{t.replace('-', ' ')}</Text>
                                    </View>
                                ))}
                                {hasSpare !== null && (
                                    <View style={styles.summaryTag}>
                                        <Text style={styles.summaryTagText}>Spare: {hasSpare ? 'Yes' : 'No'}</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Price Breakdown — Purple left border */}
                        <View style={styles.priceCard}>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Tire repair service</Text>
                                <Text style={styles.priceValue}>KES {basePrice.toLocaleString()}</Text>
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Service call</Text>
                                <Text style={styles.priceValue}>KES {serviceCall.toLocaleString()}</Text>
                            </View>
                            {hasSpare === false && (
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>Replacement tire</Text>
                                    <Text style={[styles.priceValue, { fontStyle: 'italic', fontSize: 12 }]}>From KES 3,500</Text>
                                </View>
                            )}
                            <View style={styles.priceDivider} />
                            <View style={styles.priceRow}>
                                <Text style={styles.totalLabel}>Estimated total</Text>
                                <Text style={styles.totalValue}>KES {totalCost.toLocaleString()}</Text>
                            </View>
                        </View>

                        <Text style={styles.disclaimer}>Final price may vary based on actual tire damage or replacement needs.</Text>
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
                        style={({ pressed }) => [styles.submitButton, pressed && { transform: [{ scale: 0.98 }] }, isSubmitting && styles.buttonDisabled]}
                        onPress={() => { setIsSubmitting(true); onSubmit({ issueType, selectedTires, hasSpare, location, vehicleType, licensePlate, tireSize, notes, totalCost, service: 'tire' }); }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color={'#0F0F0F'} />
                        ) : (
                            <Text style={styles.submitText}>Request Tire Service</Text>
                        )}
                    </Pressable>
                )}
            </View>
        </View>
    );
};

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.charcoal[900] },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.md, paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: spacing.sm,
        backgroundColor: colors.charcoal[800], borderBottomWidth: 1, borderBottomColor: colors.charcoal[700],
    },
    backButton: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.charcoal[600], alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.text.primary },
    headerSpacer: { width: 44 },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: { padding: spacing.lg, paddingBottom: 140 },

    // Title Section
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
    titleIcon: {
        width: 64, height: 64, borderRadius: 16, backgroundColor: PURPLE_10,
        borderWidth: 1, borderColor: PURPLE_20, alignItems: 'center', justifyContent: 'center',
    },
    sectionTitle: { fontSize: typography.fontSize.xl, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs },
    sectionDesc: { fontSize: typography.fontSize.sm, color: colors.text.secondary },

    // Response Badge
    responseBadge: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start',
        paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 8,
        backgroundColor: PURPLE_10, borderWidth: 1, borderColor: PURPLE_30, marginBottom: spacing.xl,
    },
    responseBadgeText: { fontSize: 12, fontWeight: '700', color: PURPLE },

    // Labels
    inputLabel: { fontSize: 15, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.sm },

    // Map Placeholder


    // Location Input
    locationInputRow: {
        flexDirection: 'row', alignItems: 'center', height: 56,
        backgroundColor: colors.charcoal[800], borderWidth: 1, borderColor: colors.charcoal[600],
        borderRadius: 12, paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm,
    },
    textInput: { flex: 1, fontSize: 16, color: colors.text.primary, height: '100%' },
    currentLocationBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginLeft: 4, marginBottom: spacing.lg },
    currentLocationText: { fontSize: 14, fontWeight: '500', color: PURPLE },

    // Issue Grid — 2x2
    issueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl, marginTop: spacing.xs },
    issueCard: {
        width: (width - spacing.lg * 2 - spacing.sm) / 2, height: 100,
        borderRadius: 12, borderWidth: 2, borderColor: colors.charcoal[600],
        backgroundColor: colors.charcoal[800], alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: spacing.sm, gap: 4,
    },
    issueCardActive: {
        backgroundColor: '#252525', borderColor: PURPLE, borderLeftWidth: 4, borderLeftColor: PURPLE,
        shadowColor: PURPLE, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 5,
    },
    issueLabel: { fontSize: 14, fontWeight: '700', color: colors.text.muted },
    issueLabelActive: { color: colors.text.primary },
    issueDesc: { fontSize: 11, color: '#6B6B6B' },

    // ===== CAR CHASSIS DIAGRAM =====
    chassisDiagram: {
        backgroundColor: colors.charcoal[800], borderRadius: 12, padding: spacing.lg,
        borderWidth: 1, borderColor: colors.charcoal[600], alignItems: 'center', marginBottom: spacing.xl, marginTop: spacing.xs,
    },
    chassisOuter: { position: 'relative', width: 130, height: 200 },
    carBodyOuter: {
        position: 'absolute', left: 16, right: 16, top: 8, bottom: 8,
        backgroundColor: '#2E2E2E', borderRadius: 16, opacity: 0.5,
    },
    carBodyInner: {
        position: 'absolute', left: 8, right: 8, top: 32, bottom: 32,
        backgroundColor: '#3E3E3E', borderRadius: 8, opacity: 0.4,
    },
    frontLabel: {
        position: 'absolute', top: -20, alignSelf: 'center', left: 0, right: 0,
        textAlign: 'center', fontSize: 10, color: colors.text.muted, letterSpacing: 2,
        textTransform: 'uppercase',
    },

    // Tire touchables — positioned on the chassis
    tireTouchable: {
        position: 'absolute', width: 22, height: 40, borderRadius: 4,
        borderWidth: 2, borderColor: '#3E3E3E', backgroundColor: colors.charcoal[800],
    },
    tireSelected: {
        backgroundColor: PURPLE, borderColor: PURPLE,
        shadowColor: PURPLE, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 8,
    },
    tireFrontLeft: { left: -8, top: 24 },
    tireFrontRight: { right: -8, top: 24 },
    tireRearLeft: { left: -8, bottom: 24 },
    tireRearRight: { right: -8, bottom: 24 },

    selectedTiresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.lg },
    tapHint: { fontSize: 14, color: '#6B6B6B' },
    selectedTireBadge: { backgroundColor: PURPLE, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    selectedTireText: { fontSize: 12, fontWeight: '700', color: '#0F0F0F', textTransform: 'capitalize' },

    // Spare Tire
    spareRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm, marginTop: spacing.xs },
    spareBtn: {
        flex: 1, height: 56, borderRadius: 12, borderWidth: 2, borderColor: colors.charcoal[600],
        alignItems: 'center', justifyContent: 'center', backgroundColor: colors.charcoal[800],
    },
    spareBtnActive: { backgroundColor: '#252525', borderColor: PURPLE },
    spareBtnText: { fontSize: 16, fontWeight: '700', color: '#6B6B6B' },
    spareBtnTextActive: { color: colors.text.primary },
    spareWarning: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
        backgroundColor: colors.charcoal[800], padding: spacing.md, borderRadius: 8,
        borderWidth: 1, borderColor: colors.charcoal[600], marginBottom: spacing.md,
    },
    spareWarningText: { flex: 1, fontSize: 13, color: colors.text.secondary },

    // Collapsible Vehicle Details
    collapseHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: spacing.md, backgroundColor: colors.charcoal[800], borderWidth: 1,
        borderColor: colors.charcoal[600], borderRadius: 12, marginTop: spacing.md,
    },
    collapseHeaderText: { fontSize: 15, fontWeight: '500', color: colors.text.primary },
    collapseBody: { padding: spacing.md, paddingTop: 0, backgroundColor: colors.charcoal[800], borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderWidth: 1, borderTopWidth: 0, borderColor: colors.charcoal[600], gap: spacing.sm },
    collapsedInput: {
        height: 48, backgroundColor: colors.charcoal[800], borderWidth: 1, borderColor: colors.charcoal[600],
        borderRadius: 8, paddingHorizontal: spacing.md, color: colors.text.primary, fontSize: 14, marginTop: spacing.sm,
    },

    // Notes
    notesContainer: { position: 'relative', marginBottom: spacing.md },
    notesInput: {
        height: 100, backgroundColor: colors.charcoal[800], borderWidth: 1, borderColor: colors.charcoal[600],
        borderRadius: 12, padding: spacing.md, color: colors.text.primary, fontSize: 14,
        textAlignVertical: 'top',
    },
    charCount: { position: 'absolute', bottom: 12, right: 16, fontSize: 12, color: '#6B6B6B' },

    // Step 3 — Confirm
    summaryCard: {
        backgroundColor: colors.charcoal[800], borderRadius: 12, borderWidth: 1, borderColor: colors.charcoal[600],
        padding: spacing.md, marginBottom: spacing.lg,
    },
    summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    summaryIconWrap: {
        width: 40, height: 40, borderRadius: 8, backgroundColor: PURPLE_20,
        alignItems: 'center', justifyContent: 'center',
    },
    summaryTitle: { fontSize: typography.fontSize.base, fontWeight: '700', color: colors.text.primary },
    summarySubtitle: { fontSize: 13, color: colors.text.secondary, textTransform: 'capitalize' },
    summaryDivider: { height: 1, backgroundColor: colors.charcoal[600], marginVertical: spacing.md },
    summaryTags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    summaryTag: { backgroundColor: '#2E2E2E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#3E3E3E' },
    summaryTagText: { fontSize: 12, color: colors.text.primary, textTransform: 'capitalize' },

    // Price Card — with purple left border
    priceCard: {
        backgroundColor: colors.charcoal[800], borderWidth: 1, borderColor: colors.charcoal[600],
        borderLeftWidth: 4, borderLeftColor: PURPLE, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.md,
        ...shadows.card,
    },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    priceLabel: { fontSize: 14, color: colors.text.secondary },
    priceValue: { fontSize: 14, color: colors.text.secondary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    priceDivider: { height: 1, backgroundColor: colors.charcoal[600], marginVertical: spacing.sm },
    totalLabel: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
    totalValue: { fontSize: 20, fontWeight: '700', color: colors.voltage, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

    disclaimer: { textAlign: 'center', fontSize: 12, color: '#6B6B6B', marginTop: spacing.xs },

    // Footer
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg,
        backgroundColor: colors.charcoal[900], borderTopWidth: 1, borderTopColor: colors.charcoal[700],
    },
    continueButton: {
        height: 70, backgroundColor: colors.charcoal[800], borderWidth: 2, borderColor: colors.voltage,
        borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    },
    continueText: { fontSize: 18, fontWeight: '700', color: colors.voltage },
    submitButton: {
        height: 80, backgroundColor: colors.voltage, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#FFA500', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12,
    },
    submitText: { fontSize: 18, fontWeight: '700', color: '#0F0F0F' },
    buttonDisabled: { opacity: 0.5 },
});

export default TireForm;
