// ResQ Kenya - Provider Requests Screen
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors, SERVICE_TYPES } from '../../theme/voltage-premium';
import type { ServiceRequest } from '../../types';

// Mock pending requests
const MOCK_REQUESTS: ServiceRequest[] = [
    {
        id: 'req_1',
        userId: 'user_1',
        serviceType: 'towing',
        status: 'pending',
        customerLocation: {
            coordinates: { latitude: -1.2673, longitude: 36.8114 },
            address: 'Westlands, Nairobi',
        },
        timeline: { requestedAt: new Date(Date.now() - 120000) }, // 2 min ago
        pricing: { total: 3500 },
    } as ServiceRequest,
    {
        id: 'req_2',
        userId: 'user_2',
        serviceType: 'tire',
        status: 'pending',
        customerLocation: {
            coordinates: { latitude: -1.2875, longitude: 36.7844 },
            address: 'Kilimani, Nairobi',
        },
        timeline: { requestedAt: new Date(Date.now() - 300000) }, // 5 min ago
        pricing: { total: 1500 },
    } as ServiceRequest,
    {
        id: 'req_3',
        userId: 'user_3',
        serviceType: 'battery',
        status: 'pending',
        customerLocation: {
            coordinates: { latitude: -1.3103, longitude: 36.8441 },
            address: 'South B, Nairobi',
        },
        timeline: { requestedAt: new Date(Date.now() - 480000) }, // 8 min ago
        pricing: { total: 2500 },
    } as ServiceRequest,
];

export default function ProviderRequestsScreen() {
    const [requests, setRequests] = useState<ServiceRequest[]>(MOCK_REQUESTS);
    const [isLoading, setIsLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'accepted'>('all');

    const handleAccept = async (requestId: string) => {
        setIsLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Remove from list and navigate to active service
        setRequests(prev => prev.filter(r => r.id !== requestId));
        setIsLoading(false);

        Alert.alert(
            '✅ Request Accepted!',
            'Navigate to customer location now.',
            [
                { text: 'Start Navigation', onPress: () => console.log('Navigate') },
            ]
        );
    };

    const handleDecline = async (requestId: string) => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        setRequests(prev => prev.filter(r => r.id !== requestId));
        setIsLoading(false);
    };

    const getTimeAgo = (date: Date) => {
        const mins = Math.floor((Date.now() - date.getTime()) / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins} min ago`;
        return `${Math.floor(mins / 60)}h ago`;
    };

    const getServiceEmoji = (type: string) => {
        const emojis: Record<string, string> = {
            towing: '🚛', tire: '🔧', battery: '⚡',
            fuel: '⛽', diagnostics: '🔍', ambulance: '🚑',
        };
        return emojis[type] || '🔧';
    };

    const RequestCard = ({ request }: { request: ServiceRequest }) => {
        const service = SERVICE_TYPES[request.serviceType as keyof typeof SERVICE_TYPES];
        const timeAgo = getTimeAgo(new Date(request.timeline.requestedAt));

        return (
            <View className="bg-charcoal-800 rounded-2xl p-4 mb-4 border border-charcoal-600">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                        <View
                            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                            style={{ backgroundColor: `${service?.color || colors.voltage}20` }}
                        >
                            <Text className="text-xl">{getServiceEmoji(request.serviceType)}</Text>
                        </View>
                        <View>
                            <Text className="text-white font-bold">{service?.name}</Text>
                            <Text className="text-white/50 text-xs">{timeAgo}</Text>
                        </View>
                    </View>
                    <View className="bg-voltage/20 px-3 py-1 rounded-full">
                        <Text className="text-voltage font-bold">
                            KES {request.pricing?.total?.toLocaleString() || '---'}
                        </Text>
                    </View>
                </View>

                {/* Location */}
                <View className="flex-row items-center mb-3 bg-charcoal-700 rounded-lg px-3 py-2">
                    <Text className="text-xl mr-2">📍</Text>
                    <View className="flex-1">
                        <Text className="text-white text-sm">{request.customerLocation.address}</Text>
                        <Text className="text-white/50 text-xs">~2.5 km away • 8 min drive</Text>
                    </View>
                </View>

                {/* Actions */}
                <View className="flex-row">
                    <Pressable
                        className="flex-1 bg-charcoal-600 py-3 rounded-xl mr-2"
                        onPress={() => handleDecline(request.id)}
                    >
                        <Text className="text-white text-center font-semibold">Decline</Text>
                    </Pressable>
                    <Pressable
                        className="flex-1 bg-success py-3 rounded-xl ml-2"
                        onPress={() => handleAccept(request.id)}
                    >
                        <Text className="text-white text-center font-bold">Accept</Text>
                    </Pressable>
                </View>
            </View>
        );
    };

    const filteredRequests = requests.filter(r => {
        if (activeFilter === 'all') return true;
        return r.status === activeFilter;
    });

    return (
        <View className="flex-1 bg-charcoal-900">
            {/* Header */}
            <View className="px-6 pt-16 pb-4 bg-charcoal-800 border-b border-charcoal-600">
                <Text className="text-white text-2xl font-bold mb-4">Requests</Text>

                {/* Filters */}
                <View className="flex-row">
                    {(['all', 'pending', 'accepted'] as const).map(filter => (
                        <Pressable
                            key={filter}
                            className={`px-4 py-2 rounded-full mr-2 ${activeFilter === filter ? 'bg-voltage' : 'bg-charcoal-700'
                                }`}
                            onPress={() => setActiveFilter(filter)}
                        >
                            <Text className={`text-sm font-medium capitalize ${activeFilter === filter ? 'text-charcoal-900' : 'text-white/60'
                                }`}>
                                {filter}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <ScrollView className="flex-1 px-4 pt-4">
                {isLoading ? (
                    <View className="items-center py-8">
                        <ActivityIndicator size="large" color={colors.voltage} />
                    </View>
                ) : filteredRequests.length > 0 ? (
                    filteredRequests.map(request => (
                        <RequestCard key={request.id} request={request} />
                    ))
                ) : (
                    <View className="items-center py-12">
                        <Text className="text-4xl mb-4">📭</Text>
                        <Text className="text-white/60 text-center">
                            No {activeFilter !== 'all' ? activeFilter : ''} requests available
                        </Text>
                        <Text className="text-white/40 text-sm text-center mt-2">
                            Stay online to receive new requests
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
