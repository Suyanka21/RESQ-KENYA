// ResQ Kenya - Provider Dashboard
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import {
    updateProviderLocation,
    getPendingRequestsNearby
} from '../../services/firestore.service';
import {
    startProviderBroadcast,
    stopProviderBroadcast
} from '../../services/realtime.service';
import {
    getCurrentLocation,
    startLocationUpdates,
    NAIROBI_DEFAULT
} from '../../services/location.service';
import { colors, SERVICE_TYPES } from '../../theme/voltage-premium';
import type { GeoLocation, ServiceRequest } from '../../types';

// Mock provider data (in production, fetch from Firestore)
const MOCK_PROVIDER = {
    id: 'provider_1',
    displayName: "John's Towing Services",
    serviceTypes: ['towing', 'tire', 'battery'],
    rating: 4.8,
    totalServices: 156,
};

export default function ProviderDashboard() {
    const [isOnline, setIsOnline] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<GeoLocation>(NAIROBI_DEFAULT);
    const [nearbyRequests, setNearbyRequests] = useState<ServiceRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [todayStats, setTodayStats] = useState({
        completedJobs: 3,
        earnings: 7500,
        distance: 45.2,
        avgRating: 4.9,
    });

    // Get current location on mount
    useEffect(() => {
        const initLocation = async () => {
            const location = await getCurrentLocation();
            setCurrentLocation(location);
        };
        initLocation();
    }, []);

    // Handle online/offline toggle
    const handleToggleOnline = async (value: boolean) => {
        setIsLoading(true);

        try {
            if (value) {
                // Go online
                const location = await getCurrentLocation();
                setCurrentLocation(location);

                // Start broadcasting location
                await startProviderBroadcast(
                    MOCK_PROVIDER.id,
                    location,
                    MOCK_PROVIDER.serviceTypes
                );

                // Update Firestore
                await updateProviderLocation(
                    MOCK_PROVIDER.id,
                    location.latitude,
                    location.longitude,
                    true
                );

                // Fetch nearby pending requests
                const requests = await getPendingRequestsNearby(
                    location.latitude,
                    location.longitude,
                    MOCK_PROVIDER.serviceTypes,
                    15
                );
                setNearbyRequests(requests);
            } else {
                // Go offline
                await stopProviderBroadcast(MOCK_PROVIDER.id);
                await updateProviderLocation(
                    MOCK_PROVIDER.id,
                    currentLocation.latitude,
                    currentLocation.longitude,
                    false
                );
                setNearbyRequests([]);
            }

            setIsOnline(value);
        } catch (error) {
            console.error('Toggle online error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const StatCard = ({ title, value, icon, suffix = '' }: {
        title: string;
        value: string | number;
        icon: string;
        suffix?: string;
    }) => (
        <View className="bg-charcoal-800 rounded-xl p-4 flex-1 mx-1 border border-charcoal-600">
            <Text className="text-2xl mb-2">{icon}</Text>
            <Text className="text-voltage text-xl font-bold">{value}{suffix}</Text>
            <Text className="text-white/60 text-xs">{title}</Text>
        </View>
    );

    return (
        <View className="flex-1 bg-charcoal-900">
            {/* Header */}
            <View className={`px-6 pt-16 pb-6 ${isOnline ? 'bg-success/20' : 'bg-charcoal-800'} border-b border-charcoal-600`}>
                <View className="flex-row justify-between items-start mb-4">
                    <View>
                        <Text className="text-white/60 text-sm">Good morning</Text>
                        <Text className="text-white text-xl font-bold">{MOCK_PROVIDER.displayName}</Text>
                    </View>
                    <View className="items-center">
                        <View className={`px-3 py-1 rounded-full ${isOnline ? 'bg-success' : 'bg-charcoal-600'}`}>
                            <Text className={`text-xs font-semibold ${isOnline ? 'text-white' : 'text-white/60'}`}>
                                {isOnline ? '🟢 ONLINE' : '⚫ OFFLINE'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Online Toggle */}
                <View className="flex-row items-center justify-between bg-charcoal-700 rounded-xl p-4">
                    <View className="flex-row items-center">
                        {isLoading ? (
                            <ActivityIndicator size="small" color={colors.voltage} />
                        ) : (
                            <Switch
                                value={isOnline}
                                onValueChange={handleToggleOnline}
                                trackColor={{ false: colors.charcoal[600], true: colors.success }}
                                thumbColor={isOnline ? '#FFFFFF' : '#888888'}
                            />
                        )}
                        <Text className="text-white ml-3 font-medium">
                            {isOnline ? 'Accepting Jobs' : 'Go Online to Accept Jobs'}
                        </Text>
                    </View>
                    {isOnline && (
                        <View className="bg-voltage/20 px-2 py-1 rounded">
                            <Text className="text-voltage text-xs font-semibold">
                                {nearbyRequests.length} nearby
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <ScrollView className="flex-1 px-4 pt-4">
                {/* Today's Stats */}
                <Text className="text-white font-bold text-lg mb-3 px-2">Today's Performance</Text>
                <View className="flex-row mb-4">
                    <StatCard title="Jobs Done" value={todayStats.completedJobs} icon="✅" />
                    <StatCard title="Earnings" value={`KES ${todayStats.earnings.toLocaleString()}`} icon="💰" />
                </View>
                <View className="flex-row mb-6">
                    <StatCard title="Distance" value={todayStats.distance} icon="📍" suffix=" km" />
                    <StatCard title="Avg Rating" value={todayStats.avgRating} icon="⭐" />
                </View>

                {/* Quick Actions */}
                <Text className="text-white font-bold text-lg mb-3 px-2">Quick Actions</Text>
                <View className="flex-row flex-wrap mb-6">
                    <Pressable
                        className="bg-charcoal-800 rounded-xl p-4 w-[48%] mr-[2%] mb-2 border border-charcoal-600"
                        onPress={() => router.push('/(provider)/requests')}
                    >
                        <Text className="text-2xl mb-2">📋</Text>
                        <Text className="text-white font-semibold">View Requests</Text>
                        <Text className="text-white/50 text-xs">See pending jobs nearby</Text>
                    </Pressable>
                    <Pressable
                        className="bg-charcoal-800 rounded-xl p-4 w-[48%] mb-2 border border-charcoal-600"
                        onPress={() => router.push('/(provider)/earnings')}
                    >
                        <Text className="text-2xl mb-2">💵</Text>
                        <Text className="text-white font-semibold">Earnings</Text>
                        <Text className="text-white/50 text-xs">View your earnings</Text>
                    </Pressable>
                    <Pressable className="bg-charcoal-800 rounded-xl p-4 w-[48%] mr-[2%] mb-2 border border-charcoal-600">
                        <Text className="text-2xl mb-2">📊</Text>
                        <Text className="text-white font-semibold">Stats</Text>
                        <Text className="text-white/50 text-xs">Performance metrics</Text>
                    </Pressable>
                    <Pressable className="bg-charcoal-800 rounded-xl p-4 w-[48%] mb-2 border border-charcoal-600">
                        <Text className="text-2xl mb-2">💬</Text>
                        <Text className="text-white font-semibold">Support</Text>
                        <Text className="text-white/50 text-xs">Get help</Text>
                    </Pressable>
                </View>

                {/* Services Offered */}
                <Text className="text-white font-bold text-lg mb-3 px-2">Your Services</Text>
                <View className="flex-row flex-wrap mb-8">
                    {MOCK_PROVIDER.serviceTypes.map(type => {
                        const service = SERVICE_TYPES[type as keyof typeof SERVICE_TYPES];
                        return (
                            <View
                                key={type}
                                className="bg-charcoal-800 rounded-lg px-3 py-2 mr-2 mb-2 border border-voltage/30"
                            >
                                <Text className="text-voltage text-sm font-medium">
                                    {getServiceEmoji(type)} {service?.name || type}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Incoming Request Alert (Demo) */}
            {isOnline && nearbyRequests.length === 0 && (
                <View className="absolute bottom-24 left-4 right-4 bg-voltage rounded-xl p-4">
                    <View className="flex-row items-center">
                        <View className="w-12 h-12 bg-charcoal-900/30 rounded-full items-center justify-center mr-3">
                            <Text className="text-2xl">🔔</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-charcoal-900 font-bold">Ready for Requests</Text>
                            <Text className="text-charcoal-900/70 text-sm">
                                You'll be notified when jobs are available
                            </Text>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

function getServiceEmoji(type: string): string {
    const emojis: Record<string, string> = {
        towing: '🚛',
        tire: '🔧',
        battery: '⚡',
        fuel: '⛽',
        diagnostics: '🔍',
        ambulance: '🚑',
    };
    return emojis[type] || '🔧';
}
