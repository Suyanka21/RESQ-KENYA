// ResQ Kenya - Service Tracking Screen
// Shows live provider tracking during an active request

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import TrackingMap from '../../../components/maps/TrackingMap';
import {
    getCurrentLocation,
    startLocationUpdates,
    stopLocationUpdates,
    NAIROBI_DEFAULT
} from '../../../services/location.service';
import {
    subscribeToProviderLocation,
    formatETA,
    formatDistance,
} from '../../../services/realtime.service';
import { getServiceRequest, updateRequestStatus } from '../../../services/firestore.service';
import { colors, SERVICE_TYPES } from '../../../theme/voltage-premium';
import type { GeoLocation, ServiceRequest } from '../../../types';

type TrackingStage = 'searching' | 'matched' | 'enroute' | 'arrived' | 'inProgress' | 'completed';

export default function TrackingScreen() {
    const { requestId, serviceType = 'towing' } = useLocalSearchParams<{
        requestId?: string;
        serviceType?: string;
    }>();

    const [stage, setStage] = useState<TrackingStage>('searching');
    const [customerLocation, setCustomerLocation] = useState<GeoLocation>(NAIROBI_DEFAULT);
    const [providerLocation, setProviderLocation] = useState<GeoLocation | null>(null);
    const [eta, setEta] = useState<number>(0);
    const [distance, setDistance] = useState<number>(0);
    const [providerName, setProviderName] = useState<string>('Finding provider...');
    const [request, setRequest] = useState<ServiceRequest | null>(null);

    // Get customer location
    useEffect(() => {
        const initLocation = async () => {
            const location = await getCurrentLocation();
            setCustomerLocation(location);
        };
        initLocation();
    }, []);

    // Simulate provider matching and tracking for demo
    useEffect(() => {
        // Demo flow - in production this would listen to real Firestore/RTDB updates
        const simulateTracking = async () => {
            // Stage 1: Searching (3 seconds)
            setStage('searching');
            await delay(3000);

            // Stage 2: Matched
            setStage('matched');
            setProviderName('John\'s Towing Services');
            setProviderLocation({
                latitude: customerLocation.latitude + 0.02,
                longitude: customerLocation.longitude + 0.015,
            });
            setEta(720); // 12 minutes
            setDistance(3.5);
            await delay(2000);

            // Stage 3: En route
            setStage('enroute');

            // Simulate provider moving towards customer
            for (let i = 0; i < 10; i++) {
                await delay(2000);
                setProviderLocation(prev => {
                    if (!prev) return prev;
                    const progress = (i + 1) / 10;
                    return {
                        latitude: prev.latitude - (0.02 * 0.1),
                        longitude: prev.longitude - (0.015 * 0.1),
                    };
                });
                setEta(prev => Math.max(60, prev - 60));
                setDistance(prev => Math.max(0.1, prev - 0.35));
            }

            // Stage 4: Arrived
            setStage('arrived');
            setEta(0);
            setDistance(0);
            await delay(3000);

            // Stage 5: In Progress
            setStage('inProgress');
            await delay(5000);

            // Stage 6: Completed
            setStage('completed');
        };

        simulateTracking();
    }, [customerLocation]);

    // If real requestId is provided, subscribe to updates
    useEffect(() => {
        if (!requestId) return;

        const unsubscribe = subscribeToProviderLocation(requestId, (data) => {
            if (data) {
                setProviderLocation(data.location);
                setEta(data.eta);
                setDistance(data.distance);
                setStage(data.status as TrackingStage);
            }
        });

        return unsubscribe;
    }, [requestId]);

    const handleCancel = () => {
        // TODO: Implement cancellation
        router.back();
    };

    const handleComplete = () => {
        router.replace('/(customer)');
    };

    const getStageInfo = () => {
        const service = SERVICE_TYPES[serviceType as keyof typeof SERVICE_TYPES];
        const serviceName = service?.name || 'Service';

        switch (stage) {
            case 'searching':
                return {
                    title: 'Finding Provider',
                    subtitle: `Looking for the nearest ${serviceName.toLowerCase()} service...`,
                    icon: '🔍',
                };
            case 'matched':
                return {
                    title: 'Provider Matched!',
                    subtitle: `${providerName} is preparing to come to you`,
                    icon: '✅',
                };
            case 'enroute':
                return {
                    title: 'Provider En Route',
                    subtitle: `${providerName} is on the way`,
                    icon: getServiceEmoji(serviceType),
                };
            case 'arrived':
                return {
                    title: 'Provider Arrived',
                    subtitle: 'Your service provider has arrived at your location',
                    icon: '📍',
                };
            case 'inProgress':
                return {
                    title: 'Service In Progress',
                    subtitle: `${serviceName} is being performed`,
                    icon: '⚙️',
                };
            case 'completed':
                return {
                    title: 'Service Completed!',
                    subtitle: 'Thank you for using ResQ',
                    icon: '🎉',
                };
            default:
                return { title: '', subtitle: '', icon: '' };
        }
    };

    const getServiceEmoji = (type: string) => {
        const emojis: Record<string, string> = {
            towing: '🚛',
            tire: '🔧',
            battery: '⚡',
            fuel: '⛽',
            diagnostics: '🔍',
            ambulance: '🚑',
        };
        return emojis[type] || '🚗';
    };

    const stageInfo = getStageInfo();

    return (
        <View className="flex-1 bg-charcoal-900">
            {/* Map Section */}
            <View className="flex-1">
                <TrackingMap
                    customerLocation={customerLocation}
                    providerLocation={stage !== 'searching' ? providerLocation : null}
                    eta={stage === 'enroute' ? eta : undefined}
                    distance={stage === 'enroute' ? distance : undefined}
                    showRoute={stage === 'enroute' || stage === 'matched'}
                    serviceType={serviceType}
                    isLoading={stage === 'searching'}
                />
            </View>

            {/* Bottom Sheet */}
            <View className="bg-charcoal-800 rounded-t-3xl px-6 py-6 border-t border-charcoal-600">
                {/* Status Header */}
                <View className="flex-row items-center mb-4">
                    <View className="w-12 h-12 bg-charcoal-700 rounded-full items-center justify-center mr-4">
                        <Text className="text-2xl">{stageInfo.icon}</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-white font-bold text-lg">{stageInfo.title}</Text>
                        <Text className="text-white/60 text-sm">{stageInfo.subtitle}</Text>
                    </View>
                </View>

                {/* ETA Display (when en route) */}
                {stage === 'enroute' && (
                    <View className="flex-row justify-around py-4 bg-charcoal-700 rounded-xl mb-4">
                        <View className="items-center">
                            <Text className="text-white/60 text-xs">ETA</Text>
                            <Text className="text-voltage text-xl font-bold">{formatETA(eta)}</Text>
                        </View>
                        <View className="w-px bg-charcoal-600" />
                        <View className="items-center">
                            <Text className="text-white/60 text-xs">Distance</Text>
                            <Text className="text-voltage text-xl font-bold">{formatDistance(distance)}</Text>
                        </View>
                    </View>
                )}

                {/* Progress Indicator */}
                {stage !== 'completed' && (
                    <View className="flex-row justify-between mb-6">
                        {['searching', 'matched', 'enroute', 'arrived', 'inProgress'].map((s, i) => (
                            <View key={s} className="flex-1 items-center">
                                <View
                                    className={`w-3 h-3 rounded-full ${getStageIndex(stage) >= i ? 'bg-voltage' : 'bg-charcoal-600'
                                        }`}
                                />
                                {i < 4 && (
                                    <View
                                        className={`absolute top-1.5 left-1/2 w-full h-0.5 ${getStageIndex(stage) > i ? 'bg-voltage' : 'bg-charcoal-600'
                                            }`}
                                    />
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* Action Buttons */}
                {stage === 'completed' ? (
                    <Pressable
                        className="bg-voltage py-4 rounded-xl"
                        onPress={handleComplete}
                    >
                        <Text className="text-charcoal-900 text-center font-bold text-lg">
                            Rate & Return Home
                        </Text>
                    </Pressable>
                ) : stage === 'searching' || stage === 'matched' ? (
                    <Pressable
                        className="bg-emergency/20 border border-emergency py-4 rounded-xl"
                        onPress={handleCancel}
                    >
                        <Text className="text-emergency text-center font-semibold">
                            Cancel Request
                        </Text>
                    </Pressable>
                ) : (
                    <View className="flex-row">
                        <Pressable
                            className="flex-1 bg-charcoal-700 py-4 rounded-xl mr-2"
                        >
                            <Text className="text-white text-center font-semibold">
                                📞 Call Provider
                            </Text>
                        </Pressable>
                        <Pressable
                            className="flex-1 bg-charcoal-700 py-4 rounded-xl ml-2"
                        >
                            <Text className="text-white text-center font-semibold">
                                💬 Message
                            </Text>
                        </Pressable>
                    </View>
                )}
            </View>
        </View>
    );
}

function getStageIndex(stage: TrackingStage): number {
    const stages: TrackingStage[] = ['searching', 'matched', 'enroute', 'arrived', 'inProgress', 'completed'];
    return stages.indexOf(stage);
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
