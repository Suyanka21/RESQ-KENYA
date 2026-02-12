// ResQ Kenya - Pricing Dashboard
// Phase 4: Admin dashboard for surge pricing management

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { voltageColors, voltageSpacing, typography } from '../../theme/voltage-premium';
import { getAllDemandZones, getActiveSurgeZones, type DemandZone } from '../../services/surge-pricing.service';

interface ZoneCardProps {
    zone: DemandZone;
    onPress: (zone: DemandZone) => void;
}

const ZoneCard: React.FC<ZoneCardProps> = ({ zone, onPress }) => {
    const getSurgeColor = (multiplier: number) => {
        if (multiplier >= 2.0) return voltageColors.error;
        if (multiplier >= 1.5) return voltageColors.warning;
        if (multiplier > 1.0) return voltageColors.accent;
        return voltageColors.success;
    };

    const getDemandColor = (demand: number) => {
        if (demand >= 8) return voltageColors.error;
        if (demand >= 5) return voltageColors.warning;
        return voltageColors.success;
    };

    return (
        <TouchableOpacity onPress={() => onPress(zone)} activeOpacity={0.8}>
            <View style={styles.zoneCard}>
                <View style={styles.zoneHeader}>
                    <Text style={styles.zoneName}>{zone.zoneName}</Text>
                    {zone.surgeActive && (
                        <View style={[styles.surgeBadge, { backgroundColor: getSurgeColor(zone.surgeMultiplier) }]}>
                            <Text style={styles.surgeBadgeText}>{zone.surgeMultiplier}x</Text>
                        </View>
                    )}
                </View>

                <View style={styles.zoneStats}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Demand</Text>
                        <View style={styles.demandBar}>
                            <View
                                style={[
                                    styles.demandFill,
                                    {
                                        width: `${zone.currentDemand * 10}%`,
                                        backgroundColor: getDemandColor(zone.currentDemand)
                                    }
                                ]}
                            />
                        </View>
                        <Text style={styles.statValue}>{zone.currentDemand}/10</Text>
                    </View>

                    <View style={styles.statRow}>
                        <View style={styles.miniStat}>
                            <Ionicons name="car-outline" size={16} color={voltageColors.textSecondary} />
                            <Text style={styles.miniStatText}>{zone.availableProviders} providers</Text>
                        </View>
                        <View style={styles.miniStat}>
                            <Ionicons name="time-outline" size={16} color={voltageColors.textSecondary} />
                            <Text style={styles.miniStatText}>{zone.estimatedWaitTime} min wait</Text>
                        </View>
                    </View>

                    <View style={styles.statRow}>
                        <View style={styles.miniStat}>
                            <Ionicons name="alert-circle-outline" size={16} color={voltageColors.textSecondary} />
                            <Text style={styles.miniStatText}>{zone.activeRequests} active</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.lastUpdated}>
                    Updated {formatTimeAgo(zone.lastUpdated)}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

function formatTimeAgo(date: Date | any): string {
    const now = new Date();
    const then = date instanceof Date ? date : date?.toDate?.() || new Date();
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
}

export default function PricingDashboard() {
    const [zones, setZones] = useState<DemandZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [surgeRevenue, setSurgeRevenue] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const allZones = await getAllDemandZones();
            setZones(allZones);

            // Calculate mock revenue data
            const activeZones = allZones.filter(z => z.surgeActive);
            setTotalRevenue(245000);
            setSurgeRevenue(activeZones.length * 12500);
        } catch (error) {
            console.error('Error loading zones:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleZonePress = (zone: DemandZone) => {
        // TODO: Navigate to zone detail screen
        console.log('Zone pressed:', zone.zoneId);
    };

    const activeSurgeCount = zones.filter(z => z.surgeActive).length;
    const avgMultiplier = zones.reduce((sum, z) => sum + z.surgeMultiplier, 0) / (zones.length || 1);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[voltageColors.background, voltageColors.backgroundDark]}
                style={styles.gradient}
            >
                <ScrollView
                    style={styles.scrollView}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Pricing Dashboard</Text>
                        <Text style={styles.subtitle}>Real-time surge pricing</Text>
                    </View>

                    {/* Summary Cards */}
                    <View style={styles.summaryContainer}>
                        <View style={styles.summaryCard}>
                            <Ionicons name="trending-up" size={24} color={voltageColors.primary} />
                            <Text style={styles.summaryValue}>{activeSurgeCount}</Text>
                            <Text style={styles.summaryLabel}>Active Surges</Text>
                        </View>

                        <View style={styles.summaryCard}>
                            <Ionicons name="stats-chart" size={24} color={voltageColors.accent} />
                            <Text style={styles.summaryValue}>{avgMultiplier.toFixed(2)}x</Text>
                            <Text style={styles.summaryLabel}>Avg Multiplier</Text>
                        </View>

                        <View style={styles.summaryCard}>
                            <Ionicons name="cash-outline" size={24} color={voltageColors.success} />
                            <Text style={styles.summaryValue}>KES {(surgeRevenue / 1000).toFixed(0)}K</Text>
                            <Text style={styles.summaryLabel}>Surge Revenue</Text>
                        </View>
                    </View>

                    {/* Zone Grid */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Demand Zones</Text>
                        <TouchableOpacity>
                            <Text style={styles.sectionAction}>View Map</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.zonesGrid}>
                        {zones.map(zone => (
                            <ZoneCard key={zone.zoneId} zone={zone} onPress={handleZonePress} />
                        ))}
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.actionsContainer}>
                        <Text style={styles.sectionTitle}>Quick Actions</Text>

                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="flash-outline" size={20} color={voltageColors.textPrimary} />
                            <Text style={styles.actionText}>Force Surge Update</Text>
                            <Ionicons name="chevron-forward" size={20} color={voltageColors.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="settings-outline" size={20} color={voltageColors.textPrimary} />
                            <Text style={styles.actionText}>Configure Limits</Text>
                            <Ionicons name="chevron-forward" size={20} color={voltageColors.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="analytics-outline" size={20} color={voltageColors.textPrimary} />
                            <Text style={styles.actionText}>View Price History</Text>
                            <Ionicons name="chevron-forward" size={20} color={voltageColors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: voltageColors.background,
    },
    gradient: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: voltageSpacing.lg,
        paddingTop: voltageSpacing.xl * 2,
    },
    title: {
        fontSize: typography.sizes['2xl'],
        fontWeight: typography.weights.bold as any,
        color: voltageColors.textPrimary,
    },
    subtitle: {
        fontSize: typography.sizes.sm,
        color: voltageColors.textSecondary,
        marginTop: voltageSpacing.xs,
    },
    summaryContainer: {
        flexDirection: 'row',
        paddingHorizontal: voltageSpacing.md,
        gap: voltageSpacing.sm,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: voltageColors.surface,
        borderRadius: 12,
        padding: voltageSpacing.md,
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.bold as any,
        color: voltageColors.textPrimary,
        marginTop: voltageSpacing.xs,
    },
    summaryLabel: {
        fontSize: typography.sizes.xs,
        color: voltageColors.textSecondary,
        marginTop: voltageSpacing.xs,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: voltageSpacing.lg,
        paddingTop: voltageSpacing.xl,
        paddingBottom: voltageSpacing.md,
    },
    sectionTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.semibold as any,
        color: voltageColors.textPrimary,
    },
    sectionAction: {
        fontSize: typography.sizes.sm,
        color: voltageColors.primary,
    },
    zonesGrid: {
        paddingHorizontal: voltageSpacing.md,
        gap: voltageSpacing.sm,
    },
    zoneCard: {
        backgroundColor: voltageColors.surface,
        borderRadius: 12,
        padding: voltageSpacing.md,
        marginBottom: voltageSpacing.sm,
    },
    zoneHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: voltageSpacing.sm,
    },
    zoneName: {
        fontSize: typography.sizes.md,
        fontWeight: typography.weights.semibold as any,
        color: voltageColors.textPrimary,
    },
    surgeBadge: {
        paddingHorizontal: voltageSpacing.sm,
        paddingVertical: voltageSpacing.xs,
        borderRadius: 8,
    },
    surgeBadgeText: {
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.bold as any,
        color: voltageColors.textPrimary,
    },
    zoneStats: {
        gap: voltageSpacing.sm,
    },
    statItem: {
        gap: voltageSpacing.xs,
    },
    statLabel: {
        fontSize: typography.sizes.xs,
        color: voltageColors.textSecondary,
    },
    demandBar: {
        height: 6,
        backgroundColor: voltageColors.backgroundDark,
        borderRadius: 3,
        overflow: 'hidden',
    },
    demandFill: {
        height: '100%',
        borderRadius: 3,
    },
    statValue: {
        fontSize: typography.sizes.xs,
        color: voltageColors.textSecondary,
        textAlign: 'right',
    },
    statRow: {
        flexDirection: 'row',
        gap: voltageSpacing.md,
    },
    miniStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: voltageSpacing.xs,
    },
    miniStatText: {
        fontSize: typography.sizes.xs,
        color: voltageColors.textSecondary,
    },
    lastUpdated: {
        fontSize: typography.sizes.xs,
        color: voltageColors.textMuted,
        marginTop: voltageSpacing.sm,
        textAlign: 'right',
    },
    actionsContainer: {
        padding: voltageSpacing.lg,
        gap: voltageSpacing.sm,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: voltageColors.surface,
        padding: voltageSpacing.md,
        borderRadius: 12,
        gap: voltageSpacing.md,
    },
    actionText: {
        flex: 1,
        fontSize: typography.sizes.md,
        color: voltageColors.textPrimary,
    },
});
