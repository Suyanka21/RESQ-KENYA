// ResQ Kenya - Service Details Screen
// Collects specific details before confirming service request

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getCurrentLocation, reverseGeocode, NAIROBI_DEFAULT } from '../../../services/location.service';
import { colors, SERVICE_TYPES } from '../../../theme/voltage-premium';
import type { GeoLocation } from '../../../types';

// Nairobi Prices (matching web prototype)
const PRICES = {
    FUEL_PETROL: 180.66,
    FUEL_DIESEL: 168.06,
    TOWING_BASE: 5000,
    AMBULANCE_BASE: 3500,
    JUMPSTART_BASE: 1500,
    TIRE_BASE: 2000,
    DIAGNOSTICS_BASE: 2500,
};

export default function ServiceDetailsScreen() {
    const { serviceType = 'towing' } = useLocalSearchParams<{ serviceType: string }>();

    const [location, setLocation] = useState<GeoLocation>(NAIROBI_DEFAULT);
    const [address, setAddress] = useState('Loading...');

    // Fuel specific
    const [fuelType, setFuelType] = useState<'petrol' | 'diesel'>('petrol');
    const [fuelAmount, setFuelAmount] = useState('2000');

    // Towing specific
    const [towDestination, setTowDestination] = useState('');

    // Ambulance specific
    const [emergencyNotes, setEmergencyNotes] = useState('');

    // Get user location on mount
    useEffect(() => {
        const fetchLocation = async () => {
            const loc = await getCurrentLocation();
            setLocation(loc);
            const addr = await reverseGeocode(loc.latitude, loc.longitude);
            setAddress(addr);
        };
        fetchLocation();
    }, []);

    const service = SERVICE_TYPES[serviceType as keyof typeof SERVICE_TYPES];

    const getServiceEmoji = (type: string) => {
        const emojis: Record<string, string> = {
            towing: '🚛', tire: '🔧', battery: '⚡',
            fuel: '⛽', diagnostics: '🔍', ambulance: '🚑',
        };
        return emojis[type] || '🔧';
    };

    const calculateFuelLiters = () => {
        const val = parseFloat(fuelAmount);
        if (!val || val <= 0) return '0.00';
        const price = fuelType === 'petrol' ? PRICES.FUEL_PETROL : PRICES.FUEL_DIESEL;
        return (val / price).toFixed(2);
    };

    const calculateTotal = () => {
        switch (serviceType) {
            case 'fuel':
                const fuelVal = parseFloat(fuelAmount);
                return isNaN(fuelVal) ? 0 : fuelVal + 200; // +200 delivery fee
            case 'towing':
                return PRICES.TOWING_BASE;
            case 'ambulance':
                return PRICES.AMBULANCE_BASE;
            case 'battery':
                return PRICES.JUMPSTART_BASE;
            case 'tire':
                return PRICES.TIRE_BASE;
            case 'diagnostics':
                return PRICES.DIAGNOSTICS_BASE;
            default:
                return 0;
        }
    };

    const isFormValid = () => {
        switch (serviceType) {
            case 'fuel':
                return !isNaN(parseFloat(fuelAmount)) && parseFloat(fuelAmount) > 0;
            case 'towing':
                return towDestination.length > 3;
            default:
                return true;
        }
    };

    const handleProceed = () => {
        // Navigate to tracking with details
        router.push({
            pathname: '/(customer)/request/tracking',
            params: {
                serviceType,
                totalAmount: calculateTotal().toString(),
            }
        });
    };

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-charcoal-900"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View className="px-6 pt-16 pb-4 bg-charcoal-800 border-b border-charcoal-600">
                <View className="flex-row items-center">
                    <Pressable onPress={() => router.back()} className="mr-4">
                        <Text className="text-white text-xl">←</Text>
                    </Pressable>
                    <View className="flex-row items-center flex-1">
                        <View
                            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                            style={{ backgroundColor: `${service?.color || colors.voltage}20` }}
                        >
                            <Text className="text-xl">{getServiceEmoji(serviceType)}</Text>
                        </View>
                        <Text className="text-white text-xl font-bold">{service?.name} Details</Text>
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                {/* Current Location */}
                <View className="bg-charcoal-800 rounded-xl p-4 mb-6 border border-charcoal-600">
                    <Text className="text-white/60 text-xs mb-1">YOUR LOCATION</Text>
                    <View className="flex-row items-center">
                        <Text className="text-voltage text-lg mr-2">📍</Text>
                        <Text className="text-white font-medium flex-1">{address}</Text>
                        <Pressable>
                            <Text className="text-voltage text-sm">Change</Text>
                        </Pressable>
                    </View>
                </View>

                {/* FUEL FORM */}
                {serviceType === 'fuel' && (
                    <View className="mb-6">
                        <Text className="text-white font-bold text-lg mb-3">Select Fuel Type</Text>
                        <View className="flex-row mb-6">
                            <Pressable
                                className={`flex-1 py-4 rounded-xl mr-2 border-2 ${fuelType === 'petrol'
                                        ? 'border-voltage bg-voltage/10'
                                        : 'border-charcoal-600 bg-charcoal-800'
                                    }`}
                                onPress={() => setFuelType('petrol')}
                            >
                                <Text className={`text-center font-bold ${fuelType === 'petrol' ? 'text-voltage' : 'text-white/60'}`}>
                                    Petrol
                                </Text>
                                <Text className={`text-center text-xs ${fuelType === 'petrol' ? 'text-voltage/70' : 'text-white/40'}`}>
                                    KES {PRICES.FUEL_PETROL}/L
                                </Text>
                            </Pressable>
                            <Pressable
                                className={`flex-1 py-4 rounded-xl ml-2 border-2 ${fuelType === 'diesel'
                                        ? 'border-voltage bg-voltage/10'
                                        : 'border-charcoal-600 bg-charcoal-800'
                                    }`}
                                onPress={() => setFuelType('diesel')}
                            >
                                <Text className={`text-center font-bold ${fuelType === 'diesel' ? 'text-voltage' : 'text-white/60'}`}>
                                    Diesel
                                </Text>
                                <Text className={`text-center text-xs ${fuelType === 'diesel' ? 'text-voltage/70' : 'text-white/40'}`}>
                                    KES {PRICES.FUEL_DIESEL}/L
                                </Text>
                            </Pressable>
                        </View>

                        <Text className="text-white/60 text-sm mb-2">Amount (KES)</Text>
                        <TextInput
                            className="bg-charcoal-800 border border-charcoal-600 rounded-xl py-4 px-4 text-white text-2xl font-bold mb-2"
                            value={fuelAmount}
                            onChangeText={setFuelAmount}
                            keyboardType="numeric"
                            placeholder="2000"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                        />
                        <Text className="text-voltage text-right font-bold">
                            ≈ {calculateFuelLiters()} Liters
                        </Text>

                        <View className="bg-charcoal-700 rounded-lg p-3 mt-4">
                            <View className="flex-row justify-between">
                                <Text className="text-white/60">Fuel Cost</Text>
                                <Text className="text-white">KES {parseInt(fuelAmount) || 0}</Text>
                            </View>
                            <View className="flex-row justify-between mt-1">
                                <Text className="text-white/60">Delivery Fee</Text>
                                <Text className="text-white">KES 200</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* TOWING FORM */}
                {serviceType === 'towing' && (
                    <View className="mb-6">
                        <Text className="text-white font-bold text-lg mb-3">Destination</Text>
                        <TextInput
                            className="bg-charcoal-800 border border-charcoal-600 rounded-xl py-4 px-4 text-white mb-4"
                            value={towDestination}
                            onChangeText={setTowDestination}
                            placeholder="e.g. Toyota Kenya, Mombasa Rd"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                        />

                        <View className="bg-charcoal-700 rounded-lg p-4">
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-white/60">Base Fee (first 5km)</Text>
                                <Text className="text-white">KES {PRICES.TOWING_BASE.toLocaleString()}</Text>
                            </View>
                            <View className="flex-row justify-between">
                                <Text className="text-white/60">Additional per KM</Text>
                                <Text className="text-white">KES 200</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* AMBULANCE FORM */}
                {serviceType === 'ambulance' && (
                    <View className="mb-6">
                        <View className="bg-emergency/10 border border-emergency/30 rounded-xl p-4 mb-4">
                            <Text className="text-emergency font-bold text-sm mb-1">⚠️ Emergency Notice</Text>
                            <Text className="text-white/70 text-sm">
                                For life-threatening emergencies, call 999 directly for fastest response.
                            </Text>
                        </View>

                        <Text className="text-white font-bold text-lg mb-3">Nature of Emergency</Text>
                        <TextInput
                            className="bg-charcoal-800 border border-charcoal-600 rounded-xl py-4 px-4 text-white h-24"
                            value={emergencyNotes}
                            onChangeText={setEmergencyNotes}
                            placeholder="e.g. Chest pains, unconsciousness..."
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            multiline
                            textAlignVertical="top"
                        />

                        <View className="bg-charcoal-700 rounded-lg p-4 mt-4">
                            <View className="flex-row justify-between">
                                <Text className="text-white/60">Ambulance Dispatch</Text>
                                <Text className="text-white">KES {PRICES.AMBULANCE_BASE.toLocaleString()}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* BATTERY / TIRE / DIAGNOSTICS - Simple confirmation */}
                {['battery', 'tire', 'diagnostics'].includes(serviceType) && (
                    <View className="mb-6">
                        <View className="bg-charcoal-700 rounded-lg p-4">
                            <View className="flex-row justify-between mb-3">
                                <Text className="text-white/60">Service</Text>
                                <Text className="text-white font-medium">{service?.name}</Text>
                            </View>
                            <View className="flex-row justify-between">
                                <Text className="text-white/60">Estimated Cost</Text>
                                <Text className="text-white font-bold">
                                    KES {calculateTotal().toLocaleString()}
                                </Text>
                            </View>
                        </View>
                        <Text className="text-white/50 text-xs mt-3 text-center">
                            Final price may vary based on parts required
                        </Text>
                    </View>
                )}

                {/* Total */}
                <View className="bg-charcoal-800 rounded-xl p-4 mb-6 border border-voltage/30">
                    <View className="flex-row justify-between items-center">
                        <Text className="text-white font-medium">Estimated Total</Text>
                        <Text className="text-voltage text-2xl font-bold">
                            KES {calculateTotal().toLocaleString()}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View className="px-6 py-4 bg-charcoal-800 border-t border-charcoal-600">
                <Pressable
                    className={`py-4 rounded-xl ${isFormValid() ? 'bg-voltage' : 'bg-charcoal-600'}`}
                    onPress={handleProceed}
                    disabled={!isFormValid()}
                >
                    <Text className={`text-center font-bold text-lg ${isFormValid() ? 'text-charcoal-900' : 'text-white/50'
                        }`}>
                        {serviceType === 'ambulance' ? 'Request Ambulance' : 'Proceed to Payment'}
                    </Text>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}
