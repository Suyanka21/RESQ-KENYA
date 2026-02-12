// ⚡ ResQ Kenya - Provider Dashboard
// Converted from NativeWind to StyleSheet for consistency

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { ClipboardList, Banknote, Bell, BarChart3, MessageCircle } from 'lucide-react-native';
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
import { colors, SERVICE_TYPES, spacing, borderRadius, shadows } from '../../theme/voltage-premium';
import { ServiceIcon } from '../../components/ui/ServiceIcon';
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

    const StatCard = ({ title, value, iconType, suffix = '' }: {
        title: string;
        value: string | number;
        iconType: 'check' | 'wallet' | 'location' | 'star';
        suffix?: string;
    }) => (
        <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
                {iconType === 'check' && <Text style={styles.statIcon}>✓</Text>}
                {iconType === 'wallet' && <Text style={styles.statIcon}>$</Text>}
                {iconType === 'location' && <Text style={styles.statIcon}>◉</Text>}
                {iconType === 'star' && <Text style={styles.statIcon}>★</Text>}
            </View>
            <Text style={styles.statValue}>{value}{suffix}</Text>
            <Text style={styles.statLabel}>{title}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, isOnline && styles.headerOnline]}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.greeting}>Good morning</Text>
                        <Text style={styles.providerName}>{MOCK_PROVIDER.displayName}</Text>
                    </View>
                    <View style={styles.statusBadgeContainer}>
                        <View style={[styles.statusBadge, isOnline ? styles.statusOnline : styles.statusOffline]}>
                            <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
                            <Text style={[styles.statusText, isOnline ? styles.statusTextOnline : styles.statusTextOffline]}>
                                {isOnline ? 'ONLINE' : 'OFFLINE'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Online Toggle */}
                <View style={styles.toggleContainer}>
                    <View style={styles.toggleLeft}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color={colors.voltage} />
                        ) : (
                            <Switch
                                value={isOnline}
                                onValueChange={handleToggleOnline}
                                trackColor={{ false: colors.charcoal[600], true: colors.success }}
                                thumbColor={isOnline ? colors.text.primary : colors.text.tertiary}
                            />
                        )}
                        <Text style={styles.toggleText}>
                            {isOnline ? 'Accepting Jobs' : 'Go Online to Accept Jobs'}
                        </Text>
                    </View>
                    {isOnline && (
                        <View style={styles.nearbyBadge}>
                            <Text style={styles.nearbyBadgeText}>
                                {nearbyRequests.length} nearby
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Today's Stats */}
                <Text style={styles.sectionTitle}>Today's Performance</Text>
                <View style={styles.statsRow}>
                    <StatCard title="Jobs Done" value={todayStats.completedJobs} iconType="check" />
                    <StatCard title="Earnings" value={`KES ${todayStats.earnings.toLocaleString()}`} iconType="wallet" />
                </View>
                <View style={styles.statsRow}>
                    <StatCard title="Distance" value={todayStats.distance} iconType="location" suffix=" km" />
                    <StatCard title="Avg Rating" value={todayStats.avgRating} iconType="star" />
                </View>

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                    <Pressable
                        style={styles.actionCard}
                        onPress={() => router.push('/(provider)/requests')}
                    >
                        <View style={styles.actionIconContainer}>
                            <ClipboardList size={24} color={colors.voltage} strokeWidth={2} />
                        </View>
                        <Text style={styles.actionTitle}>View Requests</Text>
                        <Text style={styles.actionSubtitle}>See pending jobs nearby</Text>
                    </Pressable>
                    <Pressable
                        style={styles.actionCard}
                        onPress={() => router.push('/(provider)/earnings')}
                    >
                        <View style={styles.actionIconContainer}>
                            <Banknote size={24} color={colors.voltage} strokeWidth={2} />
                        </View>
                        <Text style={styles.actionTitle}>Earnings</Text>
                        <Text style={styles.actionSubtitle}>View your earnings</Text>
                    </Pressable>
                    <Pressable style={styles.actionCard}>
                        <View style={styles.actionIconContainer}>
                            <BarChart3 size={24} color={colors.voltage} strokeWidth={2} />
                        </View>
                        <Text style={styles.actionTitle}>Stats</Text>
                        <Text style={styles.actionSubtitle}>Performance metrics</Text>
                    </Pressable>
                    <Pressable style={styles.actionCard}>
                        <View style={styles.actionIconContainer}>
                            <MessageCircle size={24} color={colors.voltage} strokeWidth={2} />
                        </View>
                        <Text style={styles.actionTitle}>Support</Text>
                        <Text style={styles.actionSubtitle}>Get help</Text>
                    </Pressable>
                </View>

                {/* Services Offered */}
                <Text style={styles.sectionTitle}>Your Services</Text>
                <View style={styles.servicesRow}>
                    {MOCK_PROVIDER.serviceTypes.map(type => {
                        const service = SERVICE_TYPES[type as keyof typeof SERVICE_TYPES];
                        return (
                            <View key={type} style={styles.serviceChip}>
                                <ServiceIcon type={type as any} size={16} color={colors.voltage} />
                                <Text style={styles.serviceChipText}>
                                    {service?.name || type}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Incoming Request Alert (Demo) */}
            {isOnline && nearbyRequests.length === 0 && (
                <View style={styles.alertBanner}>
                    <View style={styles.alertIconContainer}>
                        <Bell size={24} color={colors.voltage} fill={colors.voltage} strokeWidth={1} />
                    </View>
                    <View style={styles.alertContent}>
                        <Text style={styles.alertTitle}>Ready for Requests</Text>
                        <Text style={styles.alertSubtitle}>
                            You'll be notified when jobs are available
                        </Text>
                    </View>
                </View>
            )}
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
        paddingBottom: spacing.lg,
        backgroundColor: colors.charcoal[800],
        borderBottomWidth: 1,
        borderBottomColor: colors.charcoal[600],
    },
    headerOnline: {
        backgroundColor: `${colors.success}20`,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    greeting: {
        color: colors.text.secondary,
        fontSize: 14,
    },
    providerName: {
        color: colors.text.primary,
        fontSize: 20,
        fontWeight: '700',
    },
    statusBadgeContainer: {
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    statusOnline: {
        backgroundColor: colors.success,
    },
    statusOffline: {
        backgroundColor: colors.charcoal[600],
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: spacing.xs,
    },
    dotOnline: {
        backgroundColor: colors.text.primary,
    },
    dotOffline: {
        backgroundColor: colors.text.tertiary,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusTextOnline: {
        color: colors.text.primary,
    },
    statusTextOffline: {
        color: colors.text.secondary,
    },

    // Toggle
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.charcoal[700],
        borderRadius: borderRadius.xl,
        padding: spacing.md,
    },
    toggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toggleText: {
        color: colors.text.primary,
        marginLeft: spacing.md,
        fontWeight: '500',
    },
    nearbyBadge: {
        backgroundColor: `${colors.voltage}20`,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    nearbyBadgeText: {
        color: colors.voltage,
        fontSize: 12,
        fontWeight: '600',
    },

    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.md,
        paddingBottom: 120,
    },

    // Section
    sectionTitle: {
        color: colors.text.primary,
        fontWeight: '700',
        fontSize: 18,
        marginBottom: spacing.md,
        marginTop: spacing.md,
        paddingHorizontal: spacing.sm,
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        marginHorizontal: spacing.xs,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
    },
    statIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: `${colors.voltage}20`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    statIcon: {
        fontSize: 16,
        color: colors.voltage,
    },
    statValue: {
        color: colors.voltage,
        fontSize: 20,
        fontWeight: '700',
    },
    statLabel: {
        color: colors.text.secondary,
        fontSize: 12,
    },

    // Actions Grid
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: spacing.md,
    },
    actionCard: {
        width: '48%',
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        marginRight: '2%',
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
    },
    actionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: `${colors.voltage}20`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    actionIcon: {
        fontSize: 20,
    },
    actionTitle: {
        color: colors.text.primary,
        fontWeight: '600',
    },
    actionSubtitle: {
        color: colors.text.muted,
        fontSize: 12,
    },

    // Services
    servicesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: spacing.xl,
    },
    serviceChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginRight: spacing.sm,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: `${colors.voltage}30`,
    },
    serviceChipText: {
        color: colors.voltage,
        fontSize: 14,
        fontWeight: '500',
        marginLeft: spacing.sm,
    },

    // Alert Banner
    alertBanner: {
        position: 'absolute',
        bottom: 100,
        left: spacing.md,
        right: spacing.md,
        backgroundColor: colors.voltage,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
    },
    alertIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: `${colors.charcoal[900]}30`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    alertIcon: {
        fontSize: 24,
    },
    alertContent: {
        flex: 1,
    },
    alertTitle: {
        color: colors.charcoal[900],
        fontWeight: '700',
    },
    alertSubtitle: {
        color: `${colors.charcoal[900]}99`,
        fontSize: 14,
    },
});
