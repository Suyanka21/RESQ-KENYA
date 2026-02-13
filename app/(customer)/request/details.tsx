// ⚡ ResQ Kenya - Service Details Screen v3 (Voltage Premium)
// All 6 service-specific forms with full enhancements

import { useState, useEffect, useRef } from 'react';
import {
    View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView,
    Platform, StyleSheet, Animated, Dimensions, Image, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft, MapPin, Fuel, Car, Wrench, Heart, Battery, Truck,
    Disc, CheckCircle, AlertTriangle, Camera, ChevronRight, ChevronDown,
    Plus, Minus, Bike, Clock, Phone
} from 'lucide-react-native';
import { getCurrentLocation, reverseGeocode, NAIROBI_DEFAULT } from '../../../services/location.service';
import { colors, SERVICE_TYPES, spacing, borderRadius, shadows, touchTargets } from '../../../theme/voltage-premium';
import { ServiceIcon } from '../../../components/ui/ServiceIcon';
import StepIndicator from '../../../components/request/StepIndicator';
import FormInput from '../../../components/request/FormInput';
import type { GeoLocation } from '../../../types';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

// Prices
const PRICES = {
    FUEL_PETROL: 180.66,
    FUEL_DIESEL: 168.06,
    TOWING_BASE: 5000,
    TOWING_PER_KM: 200,
    AMBULANCE_BASE: 3500,
    JUMPSTART_BASE: 1500,
    TIRE_BASE: 2000,
    DIAGNOSTICS_BASE: 2500,
    DELIVERY_FEE: 200,
};

// ============================================================================
// VEHICLE TYPES - Visual Cards for Towing
// ============================================================================
const VEHICLE_TYPES = [
    { id: 'sedan', label: 'Sedan', icon: Car, description: 'Cars, Hatchbacks' },
    { id: 'suv', label: 'SUV/4x4', icon: Car, description: 'SUVs, Pickups' },
    { id: 'pickup', label: 'Pickup', icon: Truck, description: 'Light trucks' },
    { id: 'motorcycle', label: 'Motorcycle', icon: Bike, description: '2-wheelers' },
];

// ============================================================================
// TIRE POSITIONS - Interactive Diagram
// ============================================================================
const TIRE_POSITIONS = [
    { id: 'fl', label: 'Front Left', row: 0, col: 0 },
    { id: 'fr', label: 'Front Right', row: 0, col: 1 },
    { id: 'rl', label: 'Rear Left', row: 1, col: 0 },
    { id: 'rr', label: 'Rear Right', row: 1, col: 1 },
];

// ============================================================================
// SYMPTOMS - Visual Cards for Diagnostics
// ============================================================================
const SYMPTOMS = [
    { id: 'engine_noise', label: 'Engine Noise', icon: '🔊' },
    { id: 'wont_start', label: "Won't Start", icon: '🔑' },
    { id: 'overheating', label: 'Overheating', icon: '🌡️' },
    { id: 'warning_light', label: 'Warning Light', icon: '⚠️' },
    { id: 'smoke', label: 'Smoke/Fumes', icon: '💨' },
    { id: 'vibration', label: 'Vibration', icon: '📳' },
    { id: 'brakes', label: 'Brake Issues', icon: '🛑' },
    { id: 'other', label: 'Other', icon: '❓' },
];

// ============================================================================
// MEDICAL CONDITIONS - Quick Select Cards
// ============================================================================
const MEDICAL_CONDITIONS = [
    { id: 'chest_pain', label: 'Chest Pain', icon: Heart, urgent: true },
    { id: 'breathing', label: 'Breathing Difficulty', icon: Heart, urgent: true },
    { id: 'unconscious', label: 'Unconscious', icon: Heart, urgent: true },
    { id: 'accident', label: 'Road Accident', icon: Car, urgent: true },
    { id: 'bleeding', label: 'Heavy Bleeding', icon: Heart, urgent: true },
    { id: 'stroke', label: 'Stroke Signs', icon: Heart, urgent: true },
    { id: 'seizure', label: 'Seizure', icon: Heart, urgent: false },
    { id: 'other', label: 'Other Emergency', icon: Phone, urgent: false },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function ServiceDetailsScreen() {
    const { serviceType = 'towing' } = useLocalSearchParams<{ serviceType: string }>();
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);

    const [currentStep, setCurrentStep] = useState(1);
    const [location, setLocation] = useState<GeoLocation>(NAIROBI_DEFAULT);
    const [address, setAddress] = useState('Locating...');

    // ========== TOWING STATE ==========
    const [vehicleType, setVehicleType] = useState('sedan');
    const [towDestination, setTowDestination] = useState('');
    const [damagePhoto, setDamagePhoto] = useState<string | null>(null);

    // ========== FUEL STATE ==========
    const [fuelType, setFuelType] = useState<'petrol' | 'diesel'>('petrol');
    const [fuelAmount, setFuelAmount] = useState(2000);
    const MIN_FUEL = 500;
    const MAX_FUEL = 10000;

    // ========== TIRE STATE ==========
    const [selectedTires, setSelectedTires] = useState<string[]>([]);
    const [hasSpare, setHasSpare] = useState(true);

    // ========== DIAGNOSTICS STATE ==========
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [issueDescription, setIssueDescription] = useState('');
    const [showDescInput, setShowDescInput] = useState(false);

    // ========== MEDICAL STATE ==========
    const [selectedCondition, setSelectedCondition] = useState('');
    const [emergencyNotes, setEmergencyNotes] = useState('');
    const [emergencyContact, setEmergencyContact] = useState('+254 712 345 678');

    const service = SERVICE_TYPES[serviceType as keyof typeof SERVICE_TYPES];

    // Get location on mount
    useEffect(() => {
        (async () => {
            const loc = await getCurrentLocation();
            setLocation(loc);
            const addr = await reverseGeocode(loc.latitude, loc.longitude);
            setAddress(addr);
        })();
    }, []);

    // ========== CALCULATIONS ==========
    const calculateFuelLiters = () => {
        const price = fuelType === 'petrol' ? PRICES.FUEL_PETROL : PRICES.FUEL_DIESEL;
        return (fuelAmount / price).toFixed(1);
    };

    const calculateTotal = () => {
        switch (serviceType) {
            case 'fuel':
                return fuelAmount + PRICES.DELIVERY_FEE;
            case 'towing':
                return PRICES.TOWING_BASE;
            case 'ambulance':
                return PRICES.AMBULANCE_BASE;
            case 'battery':
                return PRICES.JUMPSTART_BASE;
            case 'tire':
                return PRICES.TIRE_BASE * Math.max(1, selectedTires.length);
            case 'diagnostics':
                return PRICES.DIAGNOSTICS_BASE;
            default:
                return 0;
        }
    };

    const isFormValid = () => {
        switch (serviceType) {
            case 'fuel':
                return fuelAmount >= MIN_FUEL;
            case 'towing':
                return vehicleType !== '' && towDestination.length > 3;
            case 'tire':
                return selectedTires.length > 0;
            case 'diagnostics':
                return selectedSymptoms.length > 0;
            case 'ambulance':
                return selectedCondition !== '';
            case 'battery':
                return true; // Simplest flow
            default:
                return true;
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleProceed = () => {
        setIsSubmitting(true);
        router.push({
            pathname: '/(customer)/request/tracking',
            params: {
                serviceType,
                totalAmount: calculateTotal().toString(),
            }
        });
    };

    const toggleTire = (tireId: string) => {
        setSelectedTires(prev =>
            prev.includes(tireId)
                ? prev.filter(t => t !== tireId)
                : [...prev, tireId]
        );
    };

    const toggleSymptom = (symptomId: string) => {
        setSelectedSymptoms(prev =>
            prev.includes(symptomId)
                ? prev.filter(s => s !== symptomId)
                : [...prev, symptomId]
        );
    };

    const handleCameraPress = () => {
        // Would integrate with camera/image picker
        setDamagePhoto('captured');
    };

    // ========================================================================
    // RENDER TOWING FORM
    // ========================================================================
    const renderTowingForm = () => (
        <View style={styles.formSection}>
            {/* Vehicle Type - Visual Cards */}
            <Text style={styles.sectionTitle}>Vehicle Type</Text>
            <View style={styles.vehicleGrid}>
                {VEHICLE_TYPES.map(type => {
                    const Icon = type.icon;
                    const isSelected = vehicleType === type.id;
                    return (
                        <Pressable
                            key={type.id}
                            style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
                            onPress={() => setVehicleType(type.id)}
                        >
                            <View style={[styles.vehicleIcon, isSelected && styles.vehicleIconSelected]}>
                                <Icon size={28} color={isSelected ? '#FFF' : colors.text.secondary} />
                            </View>
                            <Text style={[styles.vehicleLabel, isSelected && styles.vehicleLabelSelected]}>
                                {type.label}
                            </Text>
                            <Text style={styles.vehicleDesc}>{type.description}</Text>
                            {isSelected && <CheckCircle size={16} color={colors.voltage} style={styles.checkIcon} />}
                        </Pressable>
                    );
                })}
            </View>

            {/* Damage Photo - Large Camera Button */}
            <Text style={styles.sectionTitle}>Vehicle Photo (Optional)</Text>
            <Pressable style={styles.cameraButton} onPress={handleCameraPress}>
                {damagePhoto ? (
                    <View style={styles.photoPreview}>
                        <CheckCircle size={32} color={colors.success} />
                        <Text style={styles.photoPreviewText}>Photo Added</Text>
                    </View>
                ) : (
                    <>
                        <Camera size={40} color={colors.voltage} />
                        <Text style={styles.cameraButtonText}>Tap to capture damage</Text>
                        <Text style={styles.cameraButtonHint}>Helps provider arrive prepared</Text>
                    </>
                )}
            </Pressable>

            {/* Destination */}
            <FormInput
                label="Tow Destination"
                value={towDestination}
                onChangeText={setTowDestination}
                placeholder="e.g. Toyota Kenya, Mombasa Rd"
                isValid={towDestination.length > 3}
                prefix={<MapPin size={18} color={colors.voltage} />}
            />

            {/* Price Preview */}
            <View style={styles.priceCard}>
                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Base fare (first 5km)</Text>
                    <Text style={styles.priceValue}>KES {PRICES.TOWING_BASE.toLocaleString()}</Text>
                </View>
                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Per additional km</Text>
                    <Text style={styles.priceValue}>KES {PRICES.TOWING_PER_KM}</Text>
                </View>
            </View>
        </View>
    );

    // ========================================================================
    // RENDER FUEL FORM
    // ========================================================================
    const renderFuelForm = () => (
        <View style={styles.formSection}>
            {/* Fuel Type Toggle */}
            <Text style={styles.sectionTitle}>Fuel Type</Text>
            <View style={styles.fuelToggleRow}>
                <Pressable
                    style={[styles.fuelToggle, fuelType === 'petrol' && styles.fuelToggleActive]}
                    onPress={() => setFuelType('petrol')}
                >
                    <Fuel size={24} color={fuelType === 'petrol' ? colors.charcoal[900] : colors.text.secondary} />
                    <Text style={[styles.fuelToggleText, fuelType === 'petrol' && styles.fuelToggleTextActive]}>
                        Petrol
                    </Text>
                    <Text style={[styles.fuelPrice, fuelType === 'petrol' && styles.fuelPriceActive]}>
                        KES {PRICES.FUEL_PETROL}/L
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.fuelToggle, fuelType === 'diesel' && styles.fuelToggleActive]}
                    onPress={() => setFuelType('diesel')}
                >
                    <Fuel size={24} color={fuelType === 'diesel' ? colors.charcoal[900] : colors.text.secondary} />
                    <Text style={[styles.fuelToggleText, fuelType === 'diesel' && styles.fuelToggleTextActive]}>
                        Diesel
                    </Text>
                    <Text style={[styles.fuelPrice, fuelType === 'diesel' && styles.fuelPriceActive]}>
                        KES {PRICES.FUEL_DIESEL}/L
                    </Text>
                </Pressable>
            </View>

            {/* Amount Slider with Visual Indicator */}
            <Text style={styles.sectionTitle}>Amount</Text>
            <View style={styles.sliderContainer}>
                <Pressable
                    style={styles.sliderButton}
                    onPress={() => setFuelAmount(Math.max(MIN_FUEL, fuelAmount - 500))}
                >
                    <Minus size={24} color={colors.voltage} />
                </Pressable>
                <View style={styles.sliderDisplay}>
                    <Text style={styles.sliderAmount}>KES {fuelAmount.toLocaleString()}</Text>
                    <Text style={styles.sliderLiters}>≈ {calculateFuelLiters()} Liters</Text>
                </View>
                <Pressable
                    style={styles.sliderButton}
                    onPress={() => setFuelAmount(Math.min(MAX_FUEL, fuelAmount + 500))}
                >
                    <Plus size={24} color={colors.voltage} />
                </Pressable>
            </View>

            {/* Visual Progress Bar */}
            <View style={styles.fuelProgress}>
                <View style={[styles.fuelProgressFill, { width: `${((fuelAmount - MIN_FUEL) / (MAX_FUEL - MIN_FUEL)) * 100}%` }]} />
            </View>
            <View style={styles.fuelProgressLabels}>
                <Text style={styles.fuelProgressLabel}>KES {MIN_FUEL}</Text>
                <Text style={styles.fuelProgressLabel}>KES {MAX_FUEL.toLocaleString()}</Text>
            </View>

            {/* Price Preview - Prominent */}
            <View style={styles.priceCardLarge}>
                <Text style={styles.priceCardLargeLabel}>Total Cost</Text>
                <View style={styles.priceBreakdown}>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Fuel ({calculateFuelLiters()}L)</Text>
                        <Text style={styles.priceValue}>KES {fuelAmount.toLocaleString()}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Delivery Fee</Text>
                        <Text style={styles.priceValue}>KES {PRICES.DELIVERY_FEE}</Text>
                    </View>
                    <View style={styles.priceDivider} />
                    <View style={styles.priceRow}>
                        <Text style={styles.priceTotalLabel}>Total</Text>
                        <Text style={styles.priceTotalValue}>KES {(fuelAmount + PRICES.DELIVERY_FEE).toLocaleString()}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    // ========================================================================
    // RENDER BATTERY FORM - Simplest Flow
    // ========================================================================
    const renderBatteryForm = () => (
        <View style={styles.formSection}>
            <View style={styles.batterySimple}>
                <View style={styles.batteryIconLarge}>
                    <Battery size={64} color={colors.voltage} strokeWidth={1.5} />
                </View>
                <Text style={styles.batteryTitle}>Battery Jumpstart</Text>
                <Text style={styles.batteryDesc}>
                    A verified technician will arrive to jumpstart your vehicle's battery.
                </Text>

                {/* One-tap Info */}
                <View style={styles.batteryFeatures}>
                    <View style={styles.batteryFeature}>
                        <CheckCircle size={18} color={colors.success} />
                        <Text style={styles.batteryFeatureText}>No additional info needed</Text>
                    </View>
                    <View style={styles.batteryFeature}>
                        <Clock size={18} color={colors.voltage} />
                        <Text style={styles.batteryFeatureText}>Avg. arrival: 10-15 min</Text>
                    </View>
                </View>

                {/* Price Card */}
                <View style={styles.batteryPriceCard}>
                    <Text style={styles.batteryPriceLabel}>Service Fee</Text>
                    <Text style={styles.batteryPriceValue}>KES {PRICES.JUMPSTART_BASE.toLocaleString()}</Text>
                </View>
            </View>
        </View>
    );

    // ========================================================================
    // RENDER TIRE FORM - Interactive Diagram
    // ========================================================================
    const renderTireForm = () => (
        <View style={styles.formSection}>
            {/* Interactive Car Diagram */}
            <Text style={styles.sectionTitle}>Select Affected Tire(s)</Text>
            <View style={styles.carDiagram}>
                <View style={styles.carBody}>
                    <Text style={styles.carBodyText}>🚗</Text>
                </View>
                <View style={styles.tireGrid}>
                    {/* Front Row */}
                    <View style={styles.tireRow}>
                        {TIRE_POSITIONS.filter(t => t.row === 0).map(tire => (
                            <Pressable
                                key={tire.id}
                                style={[styles.tireButton, selectedTires.includes(tire.id) && styles.tireButtonSelected]}
                                onPress={() => toggleTire(tire.id)}
                            >
                                <Disc size={28} color={selectedTires.includes(tire.id) ? colors.voltage : colors.text.muted} />
                                <Text style={[styles.tireLabel, selectedTires.includes(tire.id) && styles.tireLabelSelected]}>
                                    {tire.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                    {/* Rear Row */}
                    <View style={styles.tireRow}>
                        {TIRE_POSITIONS.filter(t => t.row === 1).map(tire => (
                            <Pressable
                                key={tire.id}
                                style={[styles.tireButton, selectedTires.includes(tire.id) && styles.tireButtonSelected]}
                                onPress={() => toggleTire(tire.id)}
                            >
                                <Disc size={28} color={selectedTires.includes(tire.id) ? colors.voltage : colors.text.muted} />
                                <Text style={[styles.tireLabel, selectedTires.includes(tire.id) && styles.tireLabelSelected]}>
                                    {tire.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            </View>

            {/* Spare Tire Toggle */}
            <View style={styles.spareRow}>
                <Text style={styles.spareLabel}>Do you have a spare tire?</Text>
                <View style={styles.spareToggle}>
                    <Pressable
                        style={[styles.spareBtn, hasSpare && styles.spareBtnActive]}
                        onPress={() => setHasSpare(true)}
                    >
                        <Text style={[styles.spareBtnText, hasSpare && styles.spareBtnTextActive]}>Yes</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.spareBtn, !hasSpare && styles.spareBtnActive]}
                        onPress={() => setHasSpare(false)}
                    >
                        <Text style={[styles.spareBtnText, !hasSpare && styles.spareBtnTextActive]}>No</Text>
                    </Pressable>
                </View>
            </View>

            {/* Price Preview */}
            <View style={styles.priceCard}>
                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Per tire service</Text>
                    <Text style={styles.priceValue}>KES {PRICES.TIRE_BASE.toLocaleString()}</Text>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceRow}>
                    <Text style={styles.priceTotalLabel}>
                        Total ({selectedTires.length || 1} tire{selectedTires.length !== 1 ? 's' : ''})
                    </Text>
                    <Text style={styles.priceTotalValue}>
                        KES {(PRICES.TIRE_BASE * Math.max(1, selectedTires.length)).toLocaleString()}
                    </Text>
                </View>
            </View>
        </View>
    );

    // ========================================================================
    // RENDER DIAGNOSTICS FORM - Visual Symptom Cards
    // ========================================================================
    const renderDiagnosticsForm = () => (
        <View style={styles.formSection}>
            {/* Symptom Checklist - Visual Cards */}
            <Text style={styles.sectionTitle}>What symptoms are you experiencing?</Text>
            <View style={styles.symptomGrid}>
                {SYMPTOMS.map(symptom => (
                    <Pressable
                        key={symptom.id}
                        style={[styles.symptomCard, selectedSymptoms.includes(symptom.id) && styles.symptomCardSelected]}
                        onPress={() => toggleSymptom(symptom.id)}
                    >
                        <Text style={styles.symptomIcon}>{symptom.icon}</Text>
                        <Text style={[styles.symptomLabel, selectedSymptoms.includes(symptom.id) && styles.symptomLabelSelected]}>
                            {symptom.label}
                        </Text>
                        {selectedSymptoms.includes(symptom.id) && (
                            <CheckCircle size={14} color={colors.voltage} style={styles.symptomCheck} />
                        )}
                    </Pressable>
                ))}
            </View>

            {/* Expandable Description */}
            <Pressable
                style={styles.expandButton}
                onPress={() => setShowDescInput(!showDescInput)}
            >
                <Text style={styles.expandButtonText}>
                    {showDescInput ? 'Hide Details' : 'Add More Details (Optional)'}
                </Text>
                <ChevronDown
                    size={18}
                    color={colors.voltage}
                    style={{ transform: [{ rotate: showDescInput ? '180deg' : '0deg' }] }}
                />
            </Pressable>

            {showDescInput && (
                <TextInput
                    style={styles.descriptionInput}
                    value={issueDescription}
                    onChangeText={setIssueDescription}
                    placeholder="Describe the issue in more detail..."
                    placeholderTextColor={colors.text.muted}
                    multiline
                    numberOfLines={4}
                />
            )}

            {/* Photo Upload Optional */}
            <Pressable style={styles.photoOptional} onPress={handleCameraPress}>
                <Camera size={20} color={colors.text.muted} />
                <Text style={styles.photoOptionalText}>Add photo (optional)</Text>
            </Pressable>

            {/* Price */}
            <View style={styles.priceCard}>
                <Text style={styles.priceLabel}>Diagnostic Fee</Text>
                <Text style={styles.priceTotalValue}>KES {PRICES.DIAGNOSTICS_BASE.toLocaleString()}</Text>
            </View>
        </View>
    );

    // ========================================================================
    // RENDER MEDICAL FORM - CRITICAL (Largest Buttons)
    // ========================================================================
    const renderMedicalForm = () => (
        <View style={styles.formSection}>
            {/* Emergency Warning */}
            <View style={styles.emergencyBanner}>
                <AlertTriangle size={24} color={colors.emergency} />
                <View style={styles.emergencyBannerContent}>
                    <Text style={styles.emergencyBannerTitle}>Life-Threatening?</Text>
                    <Text style={styles.emergencyBannerText}>Call 999 directly for fastest response</Text>
                </View>
                <Pressable style={styles.callButton}>
                    <Phone size={16} color="#FFF" />
                    <Text style={styles.callButtonText}>999</Text>
                </Pressable>
            </View>

            {/* Condition Quick-Select - Large Cards */}
            <Text style={styles.sectionTitle}>Nature of Emergency</Text>
            <View style={styles.conditionGrid}>
                {MEDICAL_CONDITIONS.map(condition => {
                    const Icon = condition.icon;
                    const isSelected = selectedCondition === condition.id;
                    return (
                        <Pressable
                            key={condition.id}
                            style={[
                                styles.conditionCard,
                                isSelected && styles.conditionCardSelected,
                                condition.urgent && styles.conditionCardUrgent
                            ]}
                            onPress={() => setSelectedCondition(condition.id)}
                        >
                            <Icon
                                size={28}
                                color={isSelected ? '#FFF' : colors.emergency}
                            />
                            <Text style={[
                                styles.conditionLabel,
                                isSelected && styles.conditionLabelSelected
                            ]}>
                                {condition.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {/* Emergency Contact - Auto-filled */}
            <View style={styles.emergencyContactCard}>
                <Text style={styles.emergencyContactLabel}>Emergency Contact</Text>
                <Text style={styles.emergencyContactValue}>{emergencyContact}</Text>
                <Text style={styles.emergencyContactHint}>Will be notified on dispatch</Text>
            </View>

            {/* Notes */}
            <TextInput
                style={styles.emergencyNotes}
                value={emergencyNotes}
                onChangeText={setEmergencyNotes}
                placeholder="Allergies, medications, other conditions..."
                placeholderTextColor={colors.text.muted}
                multiline
            />

            {/* ETA Countdown - Prominent */}
            <View style={styles.etaBanner}>
                <Clock size={24} color={colors.success} />
                <View>
                    <Text style={styles.etaLabel}>Estimated Arrival</Text>
                    <Text style={styles.etaValue}>8-12 minutes</Text>
                </View>
            </View>
        </View>
    );

    // ========================================================================
    // MAIN RENDER
    // ========================================================================
    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
                <Pressable style={({ pressed }) => [styles.backButton, pressed && { backgroundColor: colors.charcoal[700], transform: [{ scale: 0.9 }] }]} onPress={() => router.back()}>
                    <ArrowLeft size={22} color={colors.text.primary} />
                </Pressable>
                <View style={styles.headerCenter}>
                    <View style={[styles.serviceIconHeader, { backgroundColor: `${service?.color || colors.voltage}20` }]}>
                        <ServiceIcon type={serviceType as any} size={22} color={service?.color || colors.voltage} />
                    </View>
                    <Text style={styles.headerTitle}>{service?.name || 'Service'}</Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            {/* Step Indicator */}
            <StepIndicator currentStep={currentStep} steps={['Details', 'Confirm', 'Track']} />

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    ref={scrollRef}
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Location Card */}
                    <View style={styles.locationCard}>
                        <View style={styles.locationHeader}>
                            <MapPin size={16} color={colors.success} />
                            <Text style={styles.locationLabel}>PICKUP LOCATION</Text>
                        </View>
                        <Text style={styles.locationAddress} numberOfLines={2}>{address}</Text>
                        <Pressable style={styles.changeButton}>
                            <Text style={styles.changeButtonText}>Change Location</Text>
                            <ChevronRight size={14} color={colors.voltage} />
                        </Pressable>
                    </View>

                    {/* Render Service-Specific Form */}
                    {serviceType === 'towing' && renderTowingForm()}
                    {serviceType === 'fuel' && renderFuelForm()}
                    {serviceType === 'battery' && renderBatteryForm()}
                    {serviceType === 'tire' && renderTireForm()}
                    {serviceType === 'diagnostics' && renderDiagnosticsForm()}
                    {serviceType === 'ambulance' && renderMedicalForm()}

                    {/* Total Display (except medical) */}
                    {serviceType !== 'ambulance' && (
                        <View style={styles.totalCard}>
                            <Text style={styles.totalLabel}>Estimated Total</Text>
                            <Text style={styles.totalValue}>KES {calculateTotal().toLocaleString()}</Text>
                        </View>
                    )}
                </ScrollView>

                {/* Footer */}
                <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.proceedButton,
                            serviceType === 'ambulance' && styles.proceedButtonEmergency,
                            (!isFormValid() || isSubmitting) && styles.proceedButtonDisabled,
                            pressed && isFormValid() && !isSubmitting && styles.proceedButtonPressed
                        ]}
                        onPress={handleProceed}
                        disabled={!isFormValid() || isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color={serviceType === 'ambulance' ? '#FFF' : colors.charcoal[900]} />
                        ) : (
                            <>
                                <Text style={[
                                    styles.proceedButtonText,
                                    !isFormValid() && styles.proceedButtonTextDisabled
                                ]}>
                                    {serviceType === 'ambulance' ? 'REQUEST AMBULANCE NOW' :
                                        serviceType === 'battery' ? 'CONFIRM JUMPSTART' :
                                            'CONFIRM REQUEST'}
                                </Text>
                                <ChevronRight size={22} color={isFormValid() ? (serviceType === 'ambulance' ? '#FFF' : colors.charcoal[900]) : colors.text.muted} />
                            </>
                        )}
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.charcoal[900],
    },
    flex: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
        backgroundColor: colors.charcoal[800],
        borderBottomWidth: 1,
        borderBottomColor: colors.charcoal[700],
    },
    backButton: {
        width: touchTargets.minimum,
        height: touchTargets.minimum,
        borderRadius: touchTargets.minimum / 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    serviceIconHeader: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
    },
    headerSpacer: { width: touchTargets.minimum },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: 120,
    },

    // Location
    locationCard: {
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.charcoal[700],
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.xs,
    },
    locationLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.text.muted,
        letterSpacing: 0.5,
    },
    locationAddress: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    changeButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    changeButtonText: {
        fontSize: 13,
        color: colors.voltage,
        fontWeight: '600',
    },

    // Form Section
    formSection: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.md,
    },

    // ========== TOWING STYLES ==========
    vehicleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    vehicleCard: {
        width: (width - spacing.lg * 2 - spacing.sm) / 2,
        padding: spacing.md,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.charcoal[800],
        borderWidth: 2,
        borderColor: colors.charcoal[600],
        alignItems: 'center',
        position: 'relative',
    },
    vehicleCardSelected: {
        borderColor: colors.voltage,
        backgroundColor: `${colors.voltage}10`,
    },
    vehicleIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.charcoal[700],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    vehicleIconSelected: {
        backgroundColor: colors.voltage,
    },
    vehicleLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: 2,
    },
    vehicleLabelSelected: {
        color: colors.voltage,
    },
    vehicleDesc: {
        fontSize: 11,
        color: colors.text.muted,
    },
    checkIcon: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
    },
    cameraButton: {
        height: 140,
        borderRadius: borderRadius.xl,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: colors.charcoal[600],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    cameraButtonText: {
        fontSize: 15,
        color: colors.voltage,
        fontWeight: '600',
        marginTop: spacing.sm,
    },
    cameraButtonHint: {
        fontSize: 12,
        color: colors.text.muted,
        marginTop: 4,
    },
    photoPreview: {
        alignItems: 'center',
    },
    photoPreviewText: {
        fontSize: 14,
        color: colors.success,
        fontWeight: '600',
        marginTop: spacing.sm,
    },

    // ========== FUEL STYLES ==========
    fuelToggleRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    fuelToggle: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.charcoal[800],
        borderWidth: 2,
        borderColor: colors.charcoal[600],
        alignItems: 'center',
        gap: spacing.xs,
    },
    fuelToggleActive: {
        backgroundColor: colors.voltage,
        borderColor: colors.voltage,
    },
    fuelToggleText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text.secondary,
    },
    fuelToggleTextActive: {
        color: colors.charcoal[900],
    },
    fuelPrice: {
        fontSize: 12,
        color: colors.text.muted,
    },
    fuelPriceActive: {
        color: colors.charcoal[800],
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sliderButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.charcoal[800],
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.voltage,
    },
    sliderDisplay: {
        flex: 1,
        alignItems: 'center',
    },
    sliderAmount: {
        fontSize: 32,
        fontWeight: '700',
        color: colors.voltage,
    },
    sliderLiters: {
        fontSize: 14,
        color: colors.text.secondary,
    },
    fuelProgress: {
        height: 8,
        backgroundColor: colors.charcoal[700],
        borderRadius: 4,
        marginBottom: spacing.xs,
        overflow: 'hidden',
    },
    fuelProgressFill: {
        height: '100%',
        backgroundColor: colors.voltage,
        borderRadius: 4,
    },
    fuelProgressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    fuelProgressLabel: {
        fontSize: 11,
        color: colors.text.muted,
    },

    // ========== BATTERY STYLES ==========
    batterySimple: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    batteryIconLarge: {
        marginBottom: spacing.lg,
    },
    batteryTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    batteryDesc: {
        fontSize: 14,
        color: colors.text.secondary,
        textAlign: 'center',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },
    batteryFeatures: {
        width: '100%',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    batteryFeature: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
    },
    batteryFeatureText: {
        fontSize: 14,
        color: colors.text.secondary,
    },
    batteryPriceCard: {
        backgroundColor: `${colors.voltage}15`,
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        width: '100%',
    },
    batteryPriceLabel: {
        fontSize: 12,
        color: colors.text.muted,
        marginBottom: spacing.xs,
    },
    batteryPriceValue: {
        fontSize: 36,
        fontWeight: '700',
        color: colors.voltage,
    },

    // ========== TIRE STYLES ==========
    carDiagram: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    carBody: {
        marginBottom: -spacing.md,
        zIndex: 1,
    },
    carBodyText: {
        fontSize: 48,
    },
    tireGrid: {
        width: '100%',
    },
    tireRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.md,
        marginBottom: spacing.sm,
    },
    tireButton: {
        flex: 1,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.charcoal[800],
        borderWidth: 2,
        borderColor: colors.charcoal[600],
        alignItems: 'center',
        gap: spacing.xs,
    },
    tireButtonSelected: {
        borderColor: colors.voltage,
        backgroundColor: `${colors.voltage}10`,
    },
    tireLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.text.muted,
    },
    tireLabelSelected: {
        color: colors.voltage,
        fontWeight: '600',
    },
    spareRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.charcoal[800],
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
    },
    spareLabel: {
        fontSize: 14,
        color: colors.text.primary,
    },
    spareToggle: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    spareBtn: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
        backgroundColor: colors.charcoal[700],
    },
    spareBtnActive: {
        backgroundColor: colors.voltage,
    },
    spareBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    spareBtnTextActive: {
        color: colors.charcoal[900],
    },

    // ========== DIAGNOSTICS STYLES ==========
    symptomGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    symptomCard: {
        width: (width - spacing.lg * 2 - spacing.sm * 3) / 4,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.charcoal[800],
        borderWidth: 2,
        borderColor: colors.charcoal[600],
        alignItems: 'center',
        position: 'relative',
    },
    symptomCardSelected: {
        borderColor: colors.voltage,
        backgroundColor: `${colors.voltage}10`,
    },
    symptomIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    symptomLabel: {
        fontSize: 10,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    symptomLabelSelected: {
        color: colors.voltage,
        fontWeight: '600',
    },
    symptomCheck: {
        position: 'absolute',
        top: 4,
        right: 4,
    },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        marginBottom: spacing.sm,
    },
    expandButtonText: {
        fontSize: 14,
        color: colors.voltage,
        fontWeight: '500',
    },
    descriptionInput: {
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        color: colors.text.primary,
        fontSize: 14,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: spacing.md,
    },
    photoOptional: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.charcoal[600],
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
    },
    photoOptionalText: {
        fontSize: 13,
        color: colors.text.muted,
    },

    // ========== MEDICAL STYLES ==========
    emergencyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${colors.emergency}15`,
        borderWidth: 1,
        borderColor: `${colors.emergency}40`,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        marginBottom: spacing.lg,
        gap: spacing.md,
    },
    emergencyBannerContent: {
        flex: 1,
    },
    emergencyBannerTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.emergency,
    },
    emergencyBannerText: {
        fontSize: 12,
        color: colors.text.secondary,
    },
    callButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.emergency,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
    },
    callButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
    conditionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    conditionCard: {
        width: (width - spacing.lg * 2 - spacing.sm) / 2,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.charcoal[800],
        borderWidth: 2,
        borderColor: colors.charcoal[600],
        alignItems: 'center',
        gap: spacing.sm,
    },
    conditionCardSelected: {
        backgroundColor: colors.emergency,
        borderColor: colors.emergency,
    },
    conditionCardUrgent: {
        borderColor: `${colors.emergency}50`,
    },
    conditionLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.text.secondary,
        textAlign: 'center',
    },
    conditionLabelSelected: {
        color: '#FFF',
        fontWeight: '600',
    },
    emergencyContactCard: {
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    emergencyContactLabel: {
        fontSize: 12,
        color: colors.text.muted,
        marginBottom: 2,
    },
    emergencyContactValue: {
        fontSize: 16,
        color: colors.text.primary,
        fontWeight: '600',
    },
    emergencyContactHint: {
        fontSize: 11,
        color: colors.success,
        marginTop: 4,
    },
    emergencyNotes: {
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        color: colors.text.primary,
        fontSize: 14,
        minHeight: 60,
        textAlignVertical: 'top',
        marginBottom: spacing.md,
    },
    etaBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: `${colors.success}15`,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
    },
    etaLabel: {
        fontSize: 12,
        color: colors.success,
    },
    etaValue: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.success,
    },

    // ========== PRICE STYLES ==========
    priceCard: {
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.lg,
        padding: spacing.md,
    },
    priceCardLarge: {
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: `${colors.voltage}30`,
    },
    priceCardLargeLabel: {
        fontSize: 12,
        color: colors.text.muted,
        marginBottom: spacing.sm,
    },
    priceBreakdown: {},
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    priceLabel: {
        fontSize: 14,
        color: colors.text.secondary,
    },
    priceValue: {
        fontSize: 14,
        color: colors.text.primary,
    },
    priceDivider: {
        height: 1,
        backgroundColor: colors.charcoal[600],
        marginVertical: spacing.sm,
    },
    priceTotalLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text.primary,
    },
    priceTotalValue: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.voltage,
    },

    // ========== TOTAL & FOOTER ==========
    totalCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: `${colors.voltage}30`,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.text.primary,
    },
    totalValue: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.voltage,
    },
    footer: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        backgroundColor: colors.charcoal[800],
        borderTopWidth: 1,
        borderTopColor: colors.charcoal[700],
    },
    proceedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.voltage,
        paddingVertical: 18,
        borderRadius: borderRadius.xl,
        gap: spacing.sm,
        ...shadows.button,
    },
    proceedButtonEmergency: {
        backgroundColor: colors.emergency,
    },
    proceedButtonDisabled: {
        backgroundColor: colors.charcoal[700],
    },
    proceedButtonPressed: {
        opacity: 0.9,
    },
    proceedButtonText: {
        color: colors.charcoal[900],
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    proceedButtonTextDisabled: {
        color: colors.text.muted,
    },
});
