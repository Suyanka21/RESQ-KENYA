// ResQ Kenya - Order History Screen
// Shows past service requests with detailed cards

import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, SERVICE_TYPES } from '../../theme/voltage-premium';

type OrderStatus = 'completed' | 'in_progress' | 'cancelled';

interface Order {
    id: string;
    serviceType: keyof typeof SERVICE_TYPES;
    location: string;
    address: string;
    date: Date;
    amount: number;
    status: OrderStatus;
    providerName?: string;
    rating?: number;
}

// Mock order data matching web prototype
const MOCK_ORDERS: Order[] = [
    {
        id: 'RSQ-2093',
        serviceType: 'towing',
        location: 'Westlands',
        address: 'Sarit Centre, Westlands',
        date: new Date(),
        amount: 5000,
        status: 'in_progress',
        providerName: "John's Towing Services",
    },
    {
        id: 'RSQ-1029',
        serviceType: 'battery',
        location: 'Thika Road Mall',
        address: 'TRM, Thika Super Highway',
        date: new Date(Date.now() - 86400000 * 5),
        amount: 1500,
        status: 'completed',
        providerName: 'Quick Start Auto',
        rating: 5,
    },
    {
        id: 'RSQ-0921',
        serviceType: 'fuel',
        location: 'Mombasa Road',
        address: 'Near SGR Station',
        date: new Date(Date.now() - 86400000 * 12),
        amount: 3000,
        status: 'completed',
        providerName: 'Fast Fuel Delivery',
        rating: 4,
    },
    {
        id: 'RSQ-0854',
        serviceType: 'tire',
        location: 'Karen',
        address: 'Karen Road, Near Hub',
        date: new Date(Date.now() - 86400000 * 20),
        amount: 2000,
        status: 'completed',
        providerName: 'TyrePro Services',
        rating: 5,
    },
    {
        id: 'RSQ-0712',
        serviceType: 'towing',
        location: 'CBD',
        address: 'Kenyatta Avenue',
        date: new Date(Date.now() - 86400000 * 30),
        amount: 4500,
        status: 'cancelled',
    },
];

export default function HistoryScreen() {
    const [activeFilter, setActiveFilter] = useState<'all' | OrderStatus>('all');

    const getServiceEmoji = (type: string) => {
        const emojis: Record<string, string> = {
            towing: '🚛', tire: '🔧', battery: '⚡',
            fuel: '⛽', diagnostics: '🔍', ambulance: '🚑',
        };
        return emojis[type] || '🔧';
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'completed': return colors.success;
            case 'in_progress': return colors.voltage;
            case 'cancelled': return colors.emergency;
        }
    };

    const getStatusLabel = (status: OrderStatus) => {
        switch (status) {
            case 'completed': return 'Completed';
            case 'in_progress': return 'In Progress';
            case 'cancelled': return 'Cancelled';
        }
    };

    const filteredOrders = MOCK_ORDERS.filter(order => {
        if (activeFilter === 'all') return true;
        return order.status === activeFilter;
    });

    const OrderCard = ({ order }: { order: Order }) => {
        const service = SERVICE_TYPES[order.serviceType];

        return (
            <Pressable
                className="bg-charcoal-800 rounded-2xl p-4 mb-4 border border-charcoal-600 active:border-voltage/50"
                onPress={() => {
                    if (order.status === 'in_progress') {
                        router.push({
                            pathname: '/(customer)/request/tracking',
                            params: { serviceType: order.serviceType, requestId: order.id }
                        });
                    }
                }}
            >
                {/* Header Row */}
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                        <View
                            className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                            style={{ backgroundColor: `${service?.color || colors.voltage}15` }}
                        >
                            <Text className="text-2xl">{getServiceEmoji(order.serviceType)}</Text>
                        </View>
                        <View>
                            <Text className="text-white font-bold text-base">{order.location}</Text>
                            <Text className="text-white/50 text-xs">{formatDate(order.date)} • #{order.id}</Text>
                        </View>
                    </View>
                    <View
                        className="px-3 py-1 rounded-full"
                        style={{ backgroundColor: `${getStatusColor(order.status)}20` }}
                    >
                        <Text
                            className="text-xs font-bold uppercase"
                            style={{ color: getStatusColor(order.status) }}
                        >
                            {getStatusLabel(order.status)}
                        </Text>
                    </View>
                </View>

                {/* Service & Location Details */}
                <View className="bg-charcoal-700 rounded-lg p-3 mb-3">
                    <View className="flex-row items-center mb-2">
                        <Text className="text-white/60 text-xs w-20">Service</Text>
                        <Text className="text-white text-sm font-medium">{service?.name}</Text>
                    </View>
                    <View className="flex-row items-center">
                        <Text className="text-white/60 text-xs w-20">Address</Text>
                        <Text className="text-white/80 text-sm">{order.address}</Text>
                    </View>
                </View>

                {/* Footer Row */}
                <View className="flex-row items-center justify-between">
                    <View>
                        {order.providerName && (
                            <Text className="text-white/50 text-xs">By {order.providerName}</Text>
                        )}
                        {order.rating && (
                            <View className="flex-row items-center mt-1">
                                {[...Array(5)].map((_, i) => (
                                    <Text key={i} className="text-xs">
                                        {i < order.rating! ? '⭐' : '☆'}
                                    </Text>
                                ))}
                            </View>
                        )}
                    </View>
                    <Text className="text-white text-lg font-bold">
                        KES {order.amount.toLocaleString()}
                    </Text>
                </View>

                {/* In Progress Action */}
                {order.status === 'in_progress' && (
                    <View className="mt-3 pt-3 border-t border-charcoal-600">
                        <Pressable className="bg-voltage py-3 rounded-xl">
                            <Text className="text-charcoal-900 text-center font-bold">
                                📍 Track Live
                            </Text>
                        </Pressable>
                    </View>
                )}
            </Pressable>
        );
    };

    return (
        <View className="flex-1 bg-charcoal-900">
            {/* Header */}
            <View className="px-6 pt-16 pb-4 bg-charcoal-800 border-b border-charcoal-600">
                <Text className="text-white text-2xl font-bold mb-4">Rescue History</Text>

                {/* Filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row">
                        {(['all', 'in_progress', 'completed', 'cancelled'] as const).map(filter => (
                            <Pressable
                                key={filter}
                                className={`px-4 py-2 rounded-full mr-2 ${activeFilter === filter ? 'bg-voltage' : 'bg-charcoal-700'
                                    }`}
                                onPress={() => setActiveFilter(filter)}
                            >
                                <Text className={`text-sm font-medium capitalize ${activeFilter === filter ? 'text-charcoal-900' : 'text-white/60'
                                    }`}>
                                    {filter === 'all' ? 'All' : filter === 'in_progress' ? 'Active' : filter}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </ScrollView>
            </View>

            <ScrollView className="flex-1 px-4 pt-4">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map(order => (
                        <OrderCard key={order.id} order={order} />
                    ))
                ) : (
                    <View className="items-center py-12">
                        <Text className="text-4xl mb-4">📭</Text>
                        <Text className="text-white/60 text-center">No orders found</Text>
                        <Pressable
                            className="mt-4 bg-voltage px-6 py-3 rounded-xl"
                            onPress={() => router.push('/(customer)')}
                        >
                            <Text className="text-charcoal-900 font-bold">Request Service</Text>
                        </Pressable>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
