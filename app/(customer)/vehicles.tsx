// ⚡ ResQ Kenya - Vehicles Management Screen
// Converted from NativeWind to StyleSheet for consistency

import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Car } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme/voltage-premium';

interface Vehicle {
    id: string;
    make: string;
    model: string;
    year: string;
    registration: string;
    fuelType: 'petrol' | 'diesel';
    color: string;
    isDefault: boolean;
}

// Mock vehicles data
const INITIAL_VEHICLES: Vehicle[] = [
    {
        id: '1',
        make: 'Toyota',
        model: 'Prado',
        year: '2020',
        registration: 'KBZ 123A',
        fuelType: 'diesel',
        color: 'White',
        isDefault: true
    },
    {
        id: '2',
        make: 'Mercedes',
        model: 'C200',
        year: '2019',
        registration: 'KCA 456B',
        fuelType: 'petrol',
        color: 'Black',
        isDefault: false
    },
];

export default function VehiclesScreen() {
    const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

    // Form state
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');
    const [registration, setRegistration] = useState('');
    const [fuelType, setFuelType] = useState<'petrol' | 'diesel'>('petrol');
    const [color, setColor] = useState('');

    const resetForm = () => {
        setMake('');
        setModel('');
        setYear('');
        setRegistration('');
        setFuelType('petrol');
        setColor('');
        setEditingVehicle(null);
    };

    const openAddModal = () => {
        resetForm();
        setShowAddModal(true);
    };

    const openEditModal = (vehicle: Vehicle) => {
        setMake(vehicle.make);
        setModel(vehicle.model);
        setYear(vehicle.year);
        setRegistration(vehicle.registration);
        setFuelType(vehicle.fuelType);
        setColor(vehicle.color);
        setEditingVehicle(vehicle);
        setShowAddModal(true);
    };

    const handleSave = () => {
        if (!make || !model || !registration) return;

        if (editingVehicle) {
            // Update existing
            setVehicles(prev => prev.map(v =>
                v.id === editingVehicle.id
                    ? { ...v, make, model, year, registration, fuelType, color }
                    : v
            ));
        } else {
            // Add new
            const newVehicle: Vehicle = {
                id: Date.now().toString(),
                make,
                model,
                year,
                registration: registration.toUpperCase(),
                fuelType,
                color,
                isDefault: vehicles.length === 0,
            };
            setVehicles(prev => [...prev, newVehicle]);
        }

        setShowAddModal(false);
        resetForm();
    };

    const handleSetDefault = (vehicleId: string) => {
        setVehicles(prev => prev.map(v => ({
            ...v,
            isDefault: v.id === vehicleId,
        })));
    };

    const handleDelete = (vehicleId: string) => {
        setVehicles(prev => {
            const remaining = prev.filter(v => v.id !== vehicleId);
            // If deleted the default, set first as default
            if (remaining.length > 0 && !remaining.some(v => v.isDefault)) {
                remaining[0].isDefault = true;
            }
            return remaining;
        });
    };

    const isFormValid = () => {
        return make.length > 0 && model.length > 0 && registration.length >= 5;
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && { transform: [{ scale: 0.9 }], opacity: 0.7 }]}>
                            <Text style={styles.backArrow}>←</Text>
                        </Pressable>
                        <Text style={styles.headerTitle}>My Vehicles</Text>
                    </View>
                    <Pressable style={styles.addButton} onPress={openAddModal}>
                        <Text style={styles.addButtonText}>+ Add</Text>
                    </Pressable>
                </View>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {vehicles.length > 0 ? (
                    vehicles.map(vehicle => (
                        <Pressable
                            key={vehicle.id}
                            style={[
                                styles.vehicleCard,
                                vehicle.isDefault && styles.vehicleCardDefault
                            ]}
                            onPress={() => openEditModal(vehicle)}
                        >
                            <View style={styles.vehicleRow}>
                                <View style={styles.vehicleIcon}>
                                    <Car size={20} color={colors.voltage} strokeWidth={2} />
                                </View>
                                <View style={styles.vehicleInfo}>
                                    <View style={styles.vehicleNameRow}>
                                        <Text style={styles.vehicleName}>
                                            {vehicle.make} {vehicle.model}
                                        </Text>
                                        {vehicle.isDefault && (
                                            <View style={styles.defaultBadge}>
                                                <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.vehicleDetails}>
                                        {vehicle.registration} • {vehicle.year} • {vehicle.fuelType.charAt(0).toUpperCase() + vehicle.fuelType.slice(1)}
                                    </Text>
                                    <Text style={styles.vehicleColor}>{vehicle.color}</Text>
                                </View>
                                <Text style={styles.vehicleArrow}>›</Text>
                            </View>

                            {!vehicle.isDefault && (
                                <View style={styles.vehicleActions}>
                                    <Pressable
                                        style={styles.vehicleAction}
                                        onPress={() => handleSetDefault(vehicle.id)}
                                    >
                                        <Text style={styles.vehicleActionText}>Set as Default</Text>
                                    </Pressable>
                                    <Pressable
                                        style={styles.vehicleAction}
                                        onPress={() => handleDelete(vehicle.id)}
                                    >
                                        <Text style={styles.vehicleActionTextDanger}>Remove</Text>
                                    </Pressable>
                                </View>
                            )}
                        </Pressable>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Car size={48} color={colors.text.muted} strokeWidth={1.5} />
                        <Text style={styles.emptyTitle}>No Vehicles Added</Text>
                        <Text style={styles.emptyText}>
                            Add your vehicle to get faster service
                        </Text>
                        <Pressable style={styles.emptyButton} onPress={openAddModal}>
                            <Text style={styles.emptyButtonText}>Add Your First Vehicle</Text>
                        </Pressable>
                    </View>
                )}

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <View style={styles.infoHeader}>
                        <Text style={styles.infoIcon}>ℹ️</Text>
                        <Text style={styles.infoTitle}>Why add vehicles?</Text>
                    </View>
                    <Text style={styles.infoText}>
                        Adding your vehicle details helps our providers prepare the right equipment
                        and speeds up the service process.
                    </Text>
                </View>
            </ScrollView>

            {/* Add/Edit Modal */}
            <Modal
                visible={showAddModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddModal(false)}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
                            </Text>
                            <Pressable onPress={() => setShowAddModal(false)}>
                                <Text style={styles.modalClose}>×</Text>
                            </Pressable>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Make */}
                            <Text style={styles.inputLabel}>Make *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={make}
                                onChangeText={setMake}
                                placeholder="e.g. Toyota, BMW, Mercedes"
                                placeholderTextColor={colors.text.muted}
                            />

                            {/* Model */}
                            <Text style={styles.inputLabel}>Model *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={model}
                                onChangeText={setModel}
                                placeholder="e.g. Prado, X5, C-Class"
                                placeholderTextColor={colors.text.muted}
                            />

                            {/* Year & Registration Row */}
                            <View style={styles.inputRow}>
                                <View style={styles.inputHalf}>
                                    <Text style={styles.inputLabel}>Year</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={year}
                                        onChangeText={setYear}
                                        placeholder="2020"
                                        placeholderTextColor={colors.text.muted}
                                        keyboardType="numeric"
                                        maxLength={4}
                                    />
                                </View>
                                <View style={styles.inputHalf}>
                                    <Text style={styles.inputLabel}>Registration *</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={registration}
                                        onChangeText={text => setRegistration(text.toUpperCase())}
                                        placeholder="KBZ 123A"
                                        placeholderTextColor={colors.text.muted}
                                        autoCapitalize="characters"
                                        maxLength={10}
                                    />
                                </View>
                            </View>

                            {/* Fuel Type */}
                            <Text style={styles.inputLabel}>Fuel Type</Text>
                            <View style={styles.fuelRow}>
                                <Pressable
                                    style={[
                                        styles.fuelButton,
                                        fuelType === 'petrol' && styles.fuelButtonActive
                                    ]}
                                    onPress={() => setFuelType('petrol')}
                                >
                                    <Text style={[
                                        styles.fuelButtonText,
                                        fuelType === 'petrol' && styles.fuelButtonTextActive
                                    ]}>Petrol</Text>
                                </Pressable>
                                <Pressable
                                    style={[
                                        styles.fuelButton,
                                        fuelType === 'diesel' && styles.fuelButtonActive
                                    ]}
                                    onPress={() => setFuelType('diesel')}
                                >
                                    <Text style={[
                                        styles.fuelButtonText,
                                        fuelType === 'diesel' && styles.fuelButtonTextActive
                                    ]}>Diesel</Text>
                                </Pressable>
                            </View>

                            {/* Color */}
                            <Text style={styles.inputLabel}>Color</Text>
                            <TextInput
                                style={[styles.textInput, styles.inputSpacing]}
                                value={color}
                                onChangeText={setColor}
                                placeholder="e.g. White, Black, Silver"
                                placeholderTextColor={colors.text.muted}
                            />

                            {/* Save Button */}
                            <Pressable
                                style={[
                                    styles.saveButton,
                                    !isFormValid() && styles.saveButtonDisabled
                                ]}
                                onPress={handleSave}
                                disabled={!isFormValid()}
                            >
                                <Text style={[
                                    styles.saveButtonText,
                                    !isFormValid() && styles.saveButtonTextDisabled
                                ]}>
                                    {editingVehicle ? 'Save Changes' : 'Add Vehicle'}
                                </Text>
                            </Pressable>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.charcoal[900],
    },

    // Header
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 70 : 50,
        paddingBottom: spacing.md,
        backgroundColor: colors.charcoal[800],
        borderBottomWidth: 1,
        borderBottomColor: colors.charcoal[600],
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: spacing.md,
    },
    backArrow: {
        color: colors.text.primary,
        fontSize: 20,
    },
    headerTitle: {
        color: colors.text.primary,
        fontSize: 24,
        fontWeight: '700',
    },
    addButton: {
        backgroundColor: colors.voltage,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
    },
    addButtonText: {
        color: colors.charcoal[900],
        fontWeight: '700',
    },

    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: 100,
    },

    // Vehicle Card
    vehicleCard: {
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius['2xl'],
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
    },
    vehicleCardDefault: {
        borderColor: colors.voltage,
    },
    vehicleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    vehicleIcon: {
        width: 56,
        height: 56,
        backgroundColor: colors.charcoal[700],
        borderRadius: borderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    vehicleIconText: {
        fontSize: 28,
    },
    vehicleInfo: {
        flex: 1,
    },
    vehicleNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    vehicleName: {
        color: colors.text.primary,
        fontWeight: '700',
        fontSize: 18,
    },
    defaultBadge: {
        backgroundColor: colors.voltage,
        marginLeft: spacing.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    defaultBadgeText: {
        color: colors.charcoal[900],
        fontSize: 10,
        fontWeight: '700',
    },
    vehicleDetails: {
        color: colors.text.secondary,
        fontSize: 14,
    },
    vehicleColor: {
        color: colors.text.muted,
        fontSize: 12,
    },
    vehicleArrow: {
        color: colors.text.muted,
        fontSize: 20,
    },
    vehicleActions: {
        flexDirection: 'row',
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.charcoal[600],
    },
    vehicleAction: {
        flex: 1,
        paddingVertical: spacing.sm,
    },
    vehicleActionText: {
        color: colors.voltage,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
    },
    vehicleActionTextDanger: {
        color: colors.emergency,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xl * 2,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyTitle: {
        color: colors.text.primary,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: spacing.sm,
    },
    emptyText: {
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    emptyButton: {
        backgroundColor: colors.voltage,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.xl,
    },
    emptyButtonText: {
        color: colors.charcoal[900],
        fontWeight: '700',
    },

    // Info Card
    infoCard: {
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        marginTop: spacing.md,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    infoIcon: {
        marginRight: spacing.sm,
    },
    infoTitle: {
        color: colors.text.primary,
        fontWeight: '700',
    },
    infoText: {
        color: colors.text.secondary,
        fontSize: 14,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.charcoal[800],
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xl * 2,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        color: colors.text.primary,
        fontSize: 20,
        fontWeight: '700',
    },
    modalClose: {
        color: colors.text.secondary,
        fontSize: 28,
    },

    // Form
    inputLabel: {
        color: colors.text.secondary,
        fontSize: 14,
        marginBottom: spacing.sm,
    },
    textInput: {
        backgroundColor: colors.charcoal[900],
        borderWidth: 1,
        borderColor: colors.charcoal[600],
        borderRadius: borderRadius.xl,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    inputRow: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    inputHalf: {
        flex: 1,
        marginRight: spacing.sm,
    },
    inputSpacing: {
        marginBottom: spacing.lg,
    },
    fuelRow: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    fuelButton: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
        backgroundColor: colors.charcoal[900],
        marginHorizontal: spacing.xs,
    },
    fuelButtonActive: {
        borderColor: colors.voltage,
        backgroundColor: `${colors.voltage}10`,
    },
    fuelButtonText: {
        textAlign: 'center',
        fontWeight: '500',
        color: colors.text.secondary,
    },
    fuelButtonTextActive: {
        color: colors.voltage,
    },
    saveButton: {
        backgroundColor: colors.voltage,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.xl,
    },
    saveButtonDisabled: {
        backgroundColor: colors.charcoal[600],
    },
    saveButtonText: {
        color: colors.charcoal[900],
        textAlign: 'center',
        fontWeight: '700',
        fontSize: 16,
    },
    saveButtonTextDisabled: {
        color: colors.text.muted,
    },
});
