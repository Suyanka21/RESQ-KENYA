// ResQ Kenya - Vehicles Management Screen
// Allows users to add, edit, and select vehicles

import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/voltage-premium';

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
        <View className="flex-1 bg-charcoal-900">
            {/* Header */}
            <View className="px-6 pt-16 pb-4 bg-charcoal-800 border-b border-charcoal-600">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <Pressable onPress={() => router.back()} className="mr-4">
                            <Text className="text-white text-xl">←</Text>
                        </Pressable>
                        <Text className="text-white text-2xl font-bold">My Vehicles</Text>
                    </View>
                    <Pressable
                        className="bg-voltage px-4 py-2 rounded-lg"
                        onPress={openAddModal}
                    >
                        <Text className="text-charcoal-900 font-bold">+ Add</Text>
                    </Pressable>
                </View>
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                {vehicles.length > 0 ? (
                    vehicles.map(vehicle => (
                        <Pressable
                            key={vehicle.id}
                            className={`bg-charcoal-800 rounded-2xl p-4 mb-4 border ${vehicle.isDefault ? 'border-voltage' : 'border-charcoal-600'
                                }`}
                            onPress={() => openEditModal(vehicle)}
                        >
                            <View className="flex-row items-center">
                                <View className="w-14 h-14 bg-charcoal-700 rounded-xl items-center justify-center mr-4">
                                    <Text className="text-3xl">🚗</Text>
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row items-center">
                                        <Text className="text-white font-bold text-lg">
                                            {vehicle.make} {vehicle.model}
                                        </Text>
                                        {vehicle.isDefault && (
                                            <View className="bg-voltage ml-2 px-2 py-0.5 rounded">
                                                <Text className="text-charcoal-900 text-xs font-bold">DEFAULT</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text className="text-white/60 text-sm">
                                        {vehicle.registration} • {vehicle.year} • {vehicle.fuelType.charAt(0).toUpperCase() + vehicle.fuelType.slice(1)}
                                    </Text>
                                    <Text className="text-white/40 text-xs">{vehicle.color}</Text>
                                </View>
                                <Text className="text-white/50">›</Text>
                            </View>

                            {!vehicle.isDefault && (
                                <View className="flex-row mt-3 pt-3 border-t border-charcoal-600">
                                    <Pressable
                                        className="flex-1 py-2 mr-2"
                                        onPress={() => handleSetDefault(vehicle.id)}
                                    >
                                        <Text className="text-voltage text-center text-sm font-medium">Set as Default</Text>
                                    </Pressable>
                                    <Pressable
                                        className="flex-1 py-2 ml-2"
                                        onPress={() => handleDelete(vehicle.id)}
                                    >
                                        <Text className="text-emergency text-center text-sm font-medium">Remove</Text>
                                    </Pressable>
                                </View>
                            )}
                        </Pressable>
                    ))
                ) : (
                    <View className="items-center py-12">
                        <Text className="text-4xl mb-4">🚗</Text>
                        <Text className="text-white text-lg font-bold mb-2">No Vehicles Added</Text>
                        <Text className="text-white/60 text-center mb-6">
                            Add your vehicle to get faster service
                        </Text>
                        <Pressable
                            className="bg-voltage px-6 py-3 rounded-xl"
                            onPress={openAddModal}
                        >
                            <Text className="text-charcoal-900 font-bold">Add Your First Vehicle</Text>
                        </Pressable>
                    </View>
                )}

                {/* Info Card */}
                <View className="bg-charcoal-800 rounded-xl p-4 mt-4 mb-8 border border-charcoal-600">
                    <View className="flex-row items-center mb-2">
                        <Text className="text-voltage mr-2">ℹ️</Text>
                        <Text className="text-white font-bold">Why add vehicles?</Text>
                    </View>
                    <Text className="text-white/60 text-sm">
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
                    className="flex-1 bg-black/80 justify-end"
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View className="bg-charcoal-800 rounded-t-3xl px-6 pt-6 pb-10 max-h-[85%]">
                        {/* Modal Header */}
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-white text-xl font-bold">
                                {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
                            </Text>
                            <Pressable onPress={() => setShowAddModal(false)}>
                                <Text className="text-white/60 text-2xl">×</Text>
                            </Pressable>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Make */}
                            <Text className="text-white/60 text-sm mb-2">Make *</Text>
                            <TextInput
                                className="bg-charcoal-900 border border-charcoal-600 rounded-xl py-3 px-4 text-white mb-4"
                                value={make}
                                onChangeText={setMake}
                                placeholder="e.g. Toyota, BMW, Mercedes"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                            />

                            {/* Model */}
                            <Text className="text-white/60 text-sm mb-2">Model *</Text>
                            <TextInput
                                className="bg-charcoal-900 border border-charcoal-600 rounded-xl py-3 px-4 text-white mb-4"
                                value={model}
                                onChangeText={setModel}
                                placeholder="e.g. Prado, X5, C-Class"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                            />

                            {/* Year & Registration Row */}
                            <View className="flex-row mb-4">
                                <View className="flex-1 mr-2">
                                    <Text className="text-white/60 text-sm mb-2">Year</Text>
                                    <TextInput
                                        className="bg-charcoal-900 border border-charcoal-600 rounded-xl py-3 px-4 text-white"
                                        value={year}
                                        onChangeText={setYear}
                                        placeholder="2020"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        keyboardType="numeric"
                                        maxLength={4}
                                    />
                                </View>
                                <View className="flex-1 ml-2">
                                    <Text className="text-white/60 text-sm mb-2">Registration *</Text>
                                    <TextInput
                                        className="bg-charcoal-900 border border-charcoal-600 rounded-xl py-3 px-4 text-white"
                                        value={registration}
                                        onChangeText={text => setRegistration(text.toUpperCase())}
                                        placeholder="KBZ 123A"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        autoCapitalize="characters"
                                        maxLength={10}
                                    />
                                </View>
                            </View>

                            {/* Fuel Type */}
                            <Text className="text-white/60 text-sm mb-2">Fuel Type</Text>
                            <View className="flex-row mb-4">
                                <Pressable
                                    className={`flex-1 py-3 rounded-xl mr-2 border ${fuelType === 'petrol'
                                            ? 'border-voltage bg-voltage/10'
                                            : 'border-charcoal-600 bg-charcoal-900'
                                        }`}
                                    onPress={() => setFuelType('petrol')}
                                >
                                    <Text className={`text-center font-medium ${fuelType === 'petrol' ? 'text-voltage' : 'text-white/60'
                                        }`}>
                                        ⛽ Petrol
                                    </Text>
                                </Pressable>
                                <Pressable
                                    className={`flex-1 py-3 rounded-xl ml-2 border ${fuelType === 'diesel'
                                            ? 'border-voltage bg-voltage/10'
                                            : 'border-charcoal-600 bg-charcoal-900'
                                        }`}
                                    onPress={() => setFuelType('diesel')}
                                >
                                    <Text className={`text-center font-medium ${fuelType === 'diesel' ? 'text-voltage' : 'text-white/60'
                                        }`}>
                                        🛢️ Diesel
                                    </Text>
                                </Pressable>
                            </View>

                            {/* Color */}
                            <Text className="text-white/60 text-sm mb-2">Color</Text>
                            <TextInput
                                className="bg-charcoal-900 border border-charcoal-600 rounded-xl py-3 px-4 text-white mb-6"
                                value={color}
                                onChangeText={setColor}
                                placeholder="e.g. White, Black, Silver"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                            />

                            {/* Save Button */}
                            <Pressable
                                className={`py-4 rounded-xl ${isFormValid() ? 'bg-voltage' : 'bg-charcoal-600'}`}
                                onPress={handleSave}
                                disabled={!isFormValid()}
                            >
                                <Text className={`text-center font-bold text-lg ${isFormValid() ? 'text-charcoal-900' : 'text-white/50'
                                    }`}>
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
