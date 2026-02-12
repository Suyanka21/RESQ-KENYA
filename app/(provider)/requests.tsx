// ⚡ ResQ Kenya - Provider Requests Screen
// Converted from NativeWind to StyleSheet for consistency

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { colors, SERVICE_TYPES, spacing, borderRadius, shadows } from '../../theme/voltage-premium';
import { ServiceIcon } from '../../components/ui/ServiceIcon';
import {
    acceptRequest,
    subscribeToNearbyRequests,
    calculateDistance,
    estimateETA
} from '../../services/provider.service';
import { getCurrentLocation } from '../../services/location.service';
import type { ServiceRequest, GeoLocation } from '../../types';

// Mock provider data (in production, fetch from auth context)
const MOCK_PROVIDER = {
    id: 'provider_1',
    serviceTypes: ['towing', 'tire', 'battery', 'fuel', 'diagnostics'],
};

// Mock pending requests for demo (will be replaced by real-time subscription)
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
        timeline: { requestedAt: new Date(Date.now() - 120000) },
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
        timeline: { requestedAt: new Date(Date.now() - 300000) },
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
        timeline: { requestedAt: new Date(Date.now() - 480000) },
        pricing: { total: 2500 },
    } as ServiceRequest,
];

export default function ProviderRequestsScreen() {
    const [requests, setRequests] = useState<ServiceRequest[]>(MOCK_REQUESTS);
    const [isLoading, setIsLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'accepted'>('all');
    const [providerLocation, setProviderLocation] = useState<GeoLocation | null>(null);

    // Get provider location on mount
    useEffect(() => {
        getCurrentLocation().then(setProviderLocation);
    }, []);

    const handleAccept = async (requestId: string) => {
        setIsLoading(true);

        try {
            // Call Cloud Function to accept request
            const result = await acceptRequest(requestId);

            if (result.success) {
                // Remove from list
                setRequests(prev => prev.filter(r => r.id !== requestId));

                // Navigate to active job screen
                router.push({
                    pathname: '/(provider)/active-job',
                    params: { requestId }
                });
            } else {
                Alert.alert('Error', 'Failed to accept request. It may have been taken by another provider.');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDecline = async (requestId: string) => {
        // Just remove from local list (don't affect others)
        setRequests(prev => prev.filter(r => r.id !== requestId));
    };

    const getTimeAgo = (date: Date) => {
        const mins = Math.floor((Date.now() - date.getTime()) / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins} min ago`;
        return `${Math.floor(mins / 60)}h ago`;
    };

    const RequestCard = ({ request }: { request: ServiceRequest }) => {
        const service = SERVICE_TYPES[request.serviceType as keyof typeof SERVICE_TYPES];
        const timeAgo = getTimeAgo(new Date(request.timeline.requestedAt));

        return (
            <View style={styles.requestCard}>
                {/* Header */}
                <View style={styles.requestHeader}>
                    <View style={styles.requestHeaderLeft}>
                        <View style={[styles.serviceIconContainer, { backgroundColor: `${service?.color || colors.voltage}20` }]}>
                            <ServiceIcon type={request.serviceType as any} size={20} color={service?.color || colors.voltage} />
                        </View>
                        <View>
                            <Text style={styles.serviceName}>{service?.name}</Text>
                            <Text style={styles.timeAgo}>{timeAgo}</Text>
                        </View>
                    </View>
                    <View style={styles.priceBadge}>
                        <Text style={styles.priceText}>
                            KES {request.pricing?.total?.toLocaleString() || '---'}
                        </Text>
                    </View>
                </View>

                {/* Location */}
                <View style={styles.locationCard}>
                    <View style={styles.locationIcon}>
                        <Text style={styles.locationDot}>◉</Text>
                    </View>
                    <View style={styles.locationInfo}>
                        <Text style={styles.locationAddress}>{request.customerLocation.address}</Text>
                        <Text style={styles.locationDistance}>~2.5 km away • 8 min drive</Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                    <Pressable
                        style={styles.declineButton}
                        onPress={() => handleDecline(request.id)}
                    >
                        <Text style={styles.declineButtonText}>Decline</Text>
                    </Pressable>
                    <Pressable
                        style={styles.acceptButton}
                        onPress={() => handleAccept(request.id)}
                    >
                        <Text style={styles.acceptButtonText}>Accept</Text>
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
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Requests</Text>

                {/* Filters */}
                <View style={styles.filtersRow}>
                    {(['all', 'pending', 'accepted'] as const).map(filter => (
                        <Pressable
                            key={filter}
                            style={[
                                styles.filterChip,
                                activeFilter === filter && styles.filterChipActive
                            ]}
                            onPress={() => setActiveFilter(filter)}
                        >
                            <Text style={[
                                styles.filterChipText,
                                activeFilter === filter && styles.filterChipTextActive
                            ]}>
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.voltage} />
                    </View>
                ) : filteredRequests.length > 0 ? (
                    filteredRequests.map(request => (
                        <RequestCard key={request.id} request={request} />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconContainer}>
                            <Text style={styles.emptyIcon}>📭</Text>
                        </View>
                        <Text style={styles.emptyText}>
                            No {activeFilter !== 'all' ? activeFilter : ''} requests available
                        </Text>
                        <Text style={styles.emptySubtext}>
                            Stay online to receive new requests
                        </Text>
                    </View>
                )}
            </ScrollView>
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
    headerTitle: {
        color: colors.text.primary,
        fontSize: 24,
        fontWeight: '700',
        marginBottom: spacing.md,
    },
    filtersRow: {
        flexDirection: 'row',
    },
    filterChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.charcoal[700],
        marginRight: spacing.sm,
    },
    filterChipActive: {
        backgroundColor: colors.voltage,
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text.secondary,
    },
    filterChipTextActive: {
        color: colors.charcoal[900],
    },

    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.md,
        paddingBottom: 100,
    },

    // Request Card
    requestCard: {
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius['2xl'],
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
    },
    requestHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    requestHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    serviceIconContainer: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    serviceName: {
        color: colors.text.primary,
        fontWeight: '700',
    },
    timeAgo: {
        color: colors.text.muted,
        fontSize: 12,
    },
    priceBadge: {
        backgroundColor: `${colors.voltage}20`,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    priceText: {
        color: colors.voltage,
        fontWeight: '700',
    },

    // Location
    locationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.charcoal[700],
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginBottom: spacing.md,
    },
    locationIcon: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    locationDot: {
        color: colors.voltage,
        fontSize: 16,
    },
    locationInfo: {
        flex: 1,
    },
    locationAddress: {
        color: colors.text.primary,
        fontSize: 14,
    },
    locationDistance: {
        color: colors.text.muted,
        fontSize: 12,
    },

    // Actions
    actionsRow: {
        flexDirection: 'row',
    },
    declineButton: {
        flex: 1,
        backgroundColor: colors.charcoal[600],
        paddingVertical: spacing.md,
        borderRadius: borderRadius.xl,
        marginRight: spacing.sm,
    },
    declineButtonText: {
        color: colors.text.primary,
        textAlign: 'center',
        fontWeight: '600',
    },
    acceptButton: {
        flex: 1,
        backgroundColor: colors.success,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.xl,
        marginLeft: spacing.sm,
    },
    acceptButtonText: {
        color: colors.text.primary,
        textAlign: 'center',
        fontWeight: '700',
    },

    // Loading
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xl * 2,
    },
    emptyIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.charcoal[800],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    emptyIcon: {
        fontSize: 32,
    },
    emptyText: {
        color: colors.text.secondary,
        textAlign: 'center',
    },
    emptySubtext: {
        color: colors.text.muted,
        fontSize: 14,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
});
