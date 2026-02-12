// ⚡ ResQ Kenya - Service History Screen
// Converted from: DESIGN RES Q/components/ActivityHistoryScreen.tsx (Google Stitch)
// Phase 2.5 UI Enhancement - Agent 2.5

import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, Pressable, ScrollView, Animated,
    Easing, Platform, Dimensions, RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import {
    ArrowLeft, Filter, ChevronDown, ChevronUp, Star, MapPin,
    Clock, FileText, RefreshCw, Plus, Truck, Fuel, Battery,
    Disc, Activity, HeartPulse
} from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../../theme/voltage-premium';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

type ServiceType = 'towing' | 'fuel' | 'battery' | 'tire' | 'diagnostics' | 'medical';
type Status = 'completed' | 'cancelled' | 'in_progress';

interface ServiceRecord {
    id: string;
    type: ServiceType;
    provider: string;
    date: string;
    displayDate: string;
    displayTime: string;
    location: string;
    status: Status;
    price: number;
    rating?: number;
    duration?: number;
    distance?: number;
    breakdown: { service: number; platform: number };
}

const MOCK_HISTORY: ServiceRecord[] = [
    {
        id: 'RSQ-2601-1234', type: 'towing', provider: 'Michael Kiprop',
        date: '2026-01-28T14:45:00', displayDate: 'Jan 28, 2026', displayTime: '2:45 PM',
        location: 'Westlands, Nairobi', status: 'completed', price: 2750, rating: 5,
        duration: 25, distance: 12.4, breakdown: { service: 2500, platform: 250 },
    },
    {
        id: 'RSQ-2601-1190', type: 'fuel', provider: 'Sarah Kamau',
        date: '2026-01-27T09:15:00', displayDate: 'Jan 27, 2026', displayTime: '9:15 AM',
        location: 'Mombasa Road, Nairobi', status: 'completed', price: 3800, rating: 4,
        duration: 15, breakdown: { service: 3500, platform: 300 },
    },
    {
        id: 'RSQ-2601-1155', type: 'battery', provider: 'John Omondi',
        date: '2026-01-20T18:30:00', displayDate: 'Jan 20, 2026', displayTime: '6:30 PM',
        location: 'Langata Road, Nairobi', status: 'cancelled', price: 0,
        breakdown: { service: 0, platform: 0 },
    },
    {
        id: 'RSQ-2512-9982', type: 'diagnostics', provider: 'AutoFix Garage',
        date: '2025-12-15T11:00:00', displayDate: 'Dec 15, 2025', displayTime: '11:00 AM',
        location: 'Ngong Road, Nairobi', status: 'completed', price: 2500, rating: 5,
        duration: 45, breakdown: { service: 2200, platform: 300 },
    },
    {
        id: 'RSQ-2511-8871', type: 'tire', provider: 'QuickFix Tires',
        date: '2025-11-20T14:20:00', displayDate: 'Nov 20, 2025', displayTime: '2:20 PM',
        location: 'Thika Road, Nairobi', status: 'completed', price: 2000, rating: 5,
        duration: 20, breakdown: { service: 1800, platform: 200 },
    },
];

const FILTER_OPTIONS = ['all', 'towing', 'fuel', 'battery', 'tire', 'diagnostics', 'medical'];

const getServiceIcon = (type: ServiceType, size = 24) => {
    const map: Record<ServiceType, { Icon: any; color: string }> = {
        towing: { Icon: Truck, color: '#FFA500' },
        fuel: { Icon: Fuel, color: '#4CAF50' },
        battery: { Icon: Battery, color: '#FFA500' },
        tire: { Icon: Disc, color: '#9C27B0' },
        diagnostics: { Icon: Activity, color: '#2196F3' },
        medical: { Icon: HeartPulse, color: '#DC143C' },
    };
    const { Icon, color } = map[type];
    return <Icon size={size} color={color} strokeWidth={2} />;
};

const getServiceColor = (type: ServiceType): string => {
    const map: Record<ServiceType, string> = {
        towing: '#FFA500', fuel: '#4CAF50', battery: '#FFA500',
        tire: '#9C27B0', diagnostics: '#2196F3', medical: '#DC143C',
    };
    return map[type];
};

const getStatusStyle = (status: Status) => {
    const map: Record<Status, { bg: string; text: string; label: string }> = {
        completed: { bg: 'rgba(0,230,118,0.15)', text: '#00E676', label: 'Completed' },
        cancelled: { bg: 'rgba(255,61,61,0.15)', text: '#FF3D3D', label: 'Cancelled' },
        in_progress: { bg: 'rgba(255,165,0,0.15)', text: '#FFA500', label: 'In Progress' },
    };
    return map[status];
};

export default function HistoryScreen() {
    const [filter, setFilter] = useState('all');
    const [isStatsCollapsed, setIsStatsCollapsed] = useState(false);
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    }, []);

    const filteredHistory = filter === 'all'
        ? MOCK_HISTORY
        : MOCK_HISTORY.filter((item) => item.type === filter);

    // Group by time period
    const groupedHistory = filteredHistory.reduce((groups, item) => {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const itemDate = item.date.split('T')[0];

        let key = 'Older';
        if (itemDate === today) key = 'Today';
        else if (itemDate === yesterday) key = 'Yesterday';
        else if (new Date(item.date) > new Date(Date.now() - 7 * 86400000)) key = 'This Week';
        else if (new Date(item.date) > new Date(Date.now() - 30 * 86400000)) key = 'Last Month';

        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
        return groups;
    }, {} as Record<string, ServiceRecord[]>);

    const groupOrder = ['Today', 'Yesterday', 'This Week', 'Last Month', 'Older'];

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1500);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <Animated.View style={[styles.wrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        onPress={() => router.back()}
                        style={styles.headerButton}
                        accessibilityLabel="Go back"
                        accessibilityRole="button"
                    >
                        <ArrowLeft size={20} color={colors.voltage} strokeWidth={2} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Service History</Text>
                    <Pressable
                        style={styles.headerButton}
                        accessibilityLabel="Filter services"
                        accessibilityRole="button"
                    >
                        <Filter size={20} color={colors.text.secondary} strokeWidth={2} />
                    </Pressable>
                </View>

                {/* Filter Chips */}
                <View style={styles.filterBar}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        {FILTER_OPTIONS.map((f) => (
                            <Pressable
                                key={f}
                                onPress={() => setFilter(f)}
                                style={[styles.filterChip, filter === f && styles.filterChipActive]}
                                accessibilityLabel={`Filter by ${f}`}
                                accessibilityRole="button"
                            >
                                <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.voltage}
                            colors={[colors.voltage]}
                        />
                    }
                >
                    {/* Stats Summary Card */}
                    <View style={styles.statsCard}>
                        <Pressable
                            style={styles.statsHeader}
                            onPress={() => setIsStatsCollapsed(!isStatsCollapsed)}
                            accessibilityLabel="Toggle summary"
                            accessibilityRole="button"
                        >
                            <Text style={styles.statsTitle}>Summary</Text>
                            {isStatsCollapsed
                                ? <ChevronDown size={16} color={colors.text.tertiary} />
                                : <ChevronUp size={16} color={colors.text.tertiary} />
                            }
                        </Pressable>

                        {!isStatsCollapsed && (
                            <View style={styles.statsGrid}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>TOTAL</Text>
                                    <Text style={styles.statValue}>24</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>THIS MONTH</Text>
                                    <Text style={[styles.statValue, { color: colors.voltage }]}>3</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>SPENT</Text>
                                    <Text style={styles.statValueSmall}>KES 52k</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Empty State */}
                    {filteredHistory.length === 0 && (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconWrap}>
                                <FileText size={40} color={colors.text.tertiary} strokeWidth={1.5} />
                            </View>
                            <Text style={styles.emptyTitle}>No Service History</Text>
                            <Text style={styles.emptySubtitle}>Your completed service requests will appear here</Text>
                            <Pressable
                                style={styles.emptyButton}
                                onPress={() => router.push('/(customer)')}
                                accessibilityLabel="Request a service"
                                accessibilityRole="button"
                            >
                                <Text style={styles.emptyButtonText}>Request a Service</Text>
                            </Pressable>
                        </View>
                    )}

                    {/* Grouped History List */}
                    {groupOrder.map((group) => {
                        const items = groupedHistory[group];
                        if (!items || items.length === 0) return null;

                        return (
                            <View key={group} style={styles.historyGroup}>
                                <Text style={styles.groupTitle}>{group}</Text>

                                {items.map((item) => {
                                    const isExpanded = expandedCardId === item.id;
                                    const statusStyle = getStatusStyle(item.status);

                                    return (
                                        <Pressable
                                            key={item.id}
                                            style={[styles.historyCard, isExpanded && styles.historyCardExpanded]}
                                            onPress={() => setExpandedCardId(isExpanded ? null : item.id)}
                                            accessibilityLabel={`${item.type} service by ${item.provider}`}
                                            accessibilityRole="button"
                                        >
                                            {/* Collapsed Header */}
                                            <View style={styles.cardHeader}>
                                                <View style={[styles.cardIcon, { borderColor: getServiceColor(item.type) }]}>
                                                    {getServiceIcon(item.type)}
                                                </View>
                                                <View style={styles.cardDetails}>
                                                    <View style={styles.cardTopRow}>
                                                        <Text style={styles.cardTitle} numberOfLines={1}>
                                                            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                                        </Text>
                                                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                                            <Text style={[styles.statusText, { color: statusStyle.text }]}>
                                                                {statusStyle.label}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <Text style={styles.cardProvider}>{item.provider}</Text>
                                                    <View style={styles.cardMetaRow}>
                                                        <Clock size={12} color={colors.text.tertiary} strokeWidth={2} />
                                                        <Text style={styles.cardMetaText}>{item.displayDate}, {item.displayTime}</Text>
                                                    </View>
                                                    <View style={styles.cardMetaRow}>
                                                        <MapPin size={12} color={colors.text.tertiary} strokeWidth={2} />
                                                        <Text style={styles.cardMetaText} numberOfLines={1}>{item.location}</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.cardRight}>
                                                    {item.status !== 'cancelled' ? (
                                                        <Text style={styles.cardPrice}>KES {item.price.toLocaleString()}</Text>
                                                    ) : (
                                                        <Text style={styles.cardPriceCancelled}>--</Text>
                                                    )}
                                                    {isExpanded
                                                        ? <ChevronUp size={16} color={colors.text.tertiary} />
                                                        : <ChevronDown size={16} color={colors.text.tertiary} />
                                                    }
                                                </View>
                                            </View>

                                            {/* Expanded details */}
                                            {isExpanded && (
                                                <View style={styles.expandedSection}>
                                                    <View style={styles.expandedDivider} />

                                                    {/* Detail tiles */}
                                                    <View style={styles.detailGrid}>
                                                        {item.duration && (
                                                            <View style={styles.detailTile}>
                                                                <Text style={styles.detailTileLabel}>Duration</Text>
                                                                <Text style={styles.detailTileValue}>{item.duration} mins</Text>
                                                            </View>
                                                        )}
                                                        {item.distance && (
                                                            <View style={styles.detailTile}>
                                                                <Text style={styles.detailTileLabel}>Distance</Text>
                                                                <Text style={styles.detailTileValue}>{item.distance} km</Text>
                                                            </View>
                                                        )}
                                                        {item.rating && (
                                                            <View style={styles.detailTile}>
                                                                <Text style={styles.detailTileLabel}>Your Rating</Text>
                                                                <View style={styles.ratingRow}>
                                                                    <Text style={styles.detailTileValue}>{item.rating}</Text>
                                                                    <Star size={12} color={colors.voltage} fill={colors.voltage} strokeWidth={2} />
                                                                </View>
                                                            </View>
                                                        )}
                                                        <View style={styles.detailTile}>
                                                            <Text style={styles.detailTileLabel}>Service ID</Text>
                                                            <Text style={styles.detailTileValueMono}>{item.id.split('-')[2]}</Text>
                                                        </View>
                                                    </View>

                                                    {/* Price breakdown */}
                                                    {item.status !== 'cancelled' && (
                                                        <View style={styles.breakdownCard}>
                                                            <View style={styles.breakdownRow}>
                                                                <Text style={styles.breakdownLabel}>Service Fee</Text>
                                                                <Text style={styles.breakdownValue}>KES {item.breakdown.service.toLocaleString()}</Text>
                                                            </View>
                                                            <View style={styles.breakdownRow}>
                                                                <Text style={styles.breakdownLabel}>Platform Fee</Text>
                                                                <Text style={styles.breakdownValue}>KES {item.breakdown.platform.toLocaleString()}</Text>
                                                            </View>
                                                            <View style={styles.breakdownDivider} />
                                                            <View style={styles.breakdownRow}>
                                                                <Text style={styles.breakdownTotal}>Total Paid</Text>
                                                                <Text style={styles.breakdownTotalValue}>KES {item.price.toLocaleString()}</Text>
                                                            </View>
                                                        </View>
                                                    )}

                                                    {/* Action buttons */}
                                                    <View style={styles.actionRow}>
                                                        <Pressable
                                                            style={({ pressed }) => [
                                                                styles.actionPrimary,
                                                                pressed && { backgroundColor: colors.interactive.pressed }
                                                            ]}
                                                            onPress={() => router.push({
                                                                pathname: '/(customer)/request/[service]',
                                                                params: { service: item.type }
                                                            })}
                                                            accessibilityLabel="Request this service again"
                                                            accessibilityRole="button"
                                                        >
                                                            <Text style={styles.actionPrimaryText}>Request Again</Text>
                                                        </Pressable>
                                                        <Pressable
                                                            style={({ pressed }) => [
                                                                styles.actionSecondary,
                                                                pressed && { backgroundColor: colors.charcoal[800] }
                                                            ]}
                                                            accessibilityLabel="View receipt"
                                                            accessibilityRole="button"
                                                        >
                                                            <FileText size={16} color={colors.text.primary} strokeWidth={2} />
                                                            <Text style={styles.actionSecondaryText}>Receipt</Text>
                                                        </Pressable>
                                                    </View>
                                                </View>
                                            )}
                                        </Pressable>
                                    );
                                })}
                            </View>
                        );
                    })}
                </ScrollView>

                {/* FAB: New Request */}
                <Pressable
                    style={({ pressed }) => [
                        styles.fab,
                        pressed && { transform: [{ scale: 0.95 }] }
                    ]}
                    onPress={() => router.push('/(customer)')}
                    accessibilityLabel="Request new service"
                    accessibilityRole="button"
                >
                    <Plus size={32} color={colors.background.primary} strokeWidth={2.5} />
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    wrapper: { flex: 1 },

    // Header
    header: {
        height: 60,
        paddingHorizontal: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: colors.charcoal[700],
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: '700',
        color: colors.text.primary,
    },

    // Filter Chips
    filterBar: {
        backgroundColor: colors.background.secondary,
        borderBottomWidth: 1,
        borderBottomColor: colors.background.border,
        paddingVertical: spacing.sm,
    },
    filterScroll: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    filterChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.charcoal[800],
        borderWidth: 1,
        borderColor: colors.background.border,
    },
    filterChipActive: {
        backgroundColor: colors.voltage,
        borderColor: colors.voltage,
    },
    filterChipText: {
        fontSize: typography.fontSize.sm,
        fontWeight: '500',
        color: colors.text.secondary,
    },
    filterChipTextActive: {
        color: colors.background.primary,
        fontWeight: '700',
    },

    scrollContent: {
        padding: spacing.lg,
        paddingBottom: 100,
    },

    // Stats
    statsCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.background.border,
        borderLeftWidth: 3,
        borderLeftColor: colors.voltage,
        overflow: 'hidden',
        marginBottom: spacing.lg,
    },
    statsHeader: {
        padding: spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statsTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: '700',
        color: colors.text.primary,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: spacing.md,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
    statItem: {
        flex: 1,
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.md,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: colors.background.border,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.xs,
    },
    statValue: {
        fontSize: typography.fontSize.xl,
        fontWeight: '700',
        color: colors.text.primary,
    },
    statValueSmall: {
        fontSize: typography.fontSize.base,
        fontWeight: '700',
        color: colors.text.primary,
    },

    // Empty state
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl * 2,
    },
    emptyIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.charcoal[800],
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    emptyTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    emptySubtitle: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        textAlign: 'center',
        maxWidth: 200,
        marginBottom: spacing.lg,
    },
    emptyButton: {
        height: 48,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.voltage,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyButtonText: {
        fontSize: typography.fontSize.base,
        fontWeight: '700',
        color: colors.background.primary,
    },

    // History group
    historyGroup: {
        marginBottom: spacing.lg,
    },
    groupTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: '700',
        color: colors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        paddingLeft: spacing.xs,
        marginBottom: spacing.sm,
    },

    // History card
    historyCard: {
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.background.border,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        marginBottom: spacing.sm,
    },
    historyCardExpanded: {
        borderColor: colors.charcoal[600],
        ...shadows.card,
    },
    cardHeader: {
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
    },
    cardIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.charcoal[800],
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardDetails: {
        flex: 1,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    cardTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: '700',
        color: colors.text.primary,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardProvider: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        marginBottom: 4,
    },
    cardMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: 2,
    },
    cardMetaText: {
        fontSize: typography.fontSize.xs,
        color: colors.text.tertiary,
    },
    cardRight: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 48,
    },
    cardPrice: {
        fontSize: typography.fontSize.sm,
        fontWeight: '700',
        color: colors.text.primary,
    },
    cardPriceCancelled: {
        fontSize: typography.fontSize.xs,
        fontWeight: '500',
        color: colors.text.tertiary,
    },

    // Expanded section
    expandedSection: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
    expandedDivider: {
        height: 1,
        backgroundColor: colors.background.border,
        marginBottom: spacing.sm,
    },
    detailGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    detailTile: {
        flex: 1,
        minWidth: (width - spacing.lg * 2 - spacing.md * 3) / 2 - spacing.md,
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.md,
        padding: spacing.sm,
    },
    detailTileLabel: {
        fontSize: typography.fontSize.xs,
        color: colors.text.tertiary,
        marginBottom: 2,
    },
    detailTileValue: {
        fontSize: typography.fontSize.sm,
        fontWeight: '500',
        color: colors.text.primary,
    },
    detailTileValueMono: {
        fontSize: typography.fontSize.xs,
        fontWeight: '500',
        color: colors.text.primary,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },

    // Breakdown
    breakdownCard: {
        backgroundColor: `${colors.charcoal[800]}80`,
        borderRadius: borderRadius.md,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: colors.background.border,
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    breakdownLabel: {
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
    },
    breakdownValue: {
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
    },
    breakdownDivider: {
        height: 1,
        backgroundColor: colors.background.border,
    },
    breakdownTotal: {
        fontSize: typography.fontSize.sm,
        fontWeight: '700',
        color: colors.text.primary,
    },
    breakdownTotalValue: {
        fontSize: typography.fontSize.sm,
        fontWeight: '700',
        color: colors.text.primary,
    },

    // Action buttons
    actionRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    actionPrimary: {
        flex: 1,
        height: 40,
        backgroundColor: colors.voltage,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionPrimaryText: {
        fontSize: typography.fontSize.sm,
        fontWeight: '700',
        color: colors.background.primary,
    },
    actionSecondary: {
        flex: 1,
        height: 40,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.background.border,
        borderRadius: borderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    actionSecondaryText: {
        fontSize: typography.fontSize.sm,
        fontWeight: '500',
        color: colors.text.primary,
    },

    // FAB
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.voltage,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.button,
        zIndex: 40,
    },
});
