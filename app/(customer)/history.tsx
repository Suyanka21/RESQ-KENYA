// ⚡ ResQ Kenya - Order History
// Rescue history with status badges matching web prototype

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { colors, PRICES, shadows, borderRadius, spacing } from '../../theme/voltage-premium';

// Mock order data matching web prototype
const MOCK_ORDERS = [
    {
        id: '#RSQ-2093',
        date: 'Today, 12:30 PM',
        location: 'Westlands, Nairobi',
        amount: 5000,
        status: 'In Progress',
        type: 'Flatbed Towing',
        emoji: '🚛'
    },
    {
        id: '#RSQ-1029',
        date: '12 Oct 2024',
        location: 'Thika Road Mall',
        amount: 1500,
        status: 'Completed',
        type: 'Battery Jump',
        emoji: '⚡'
    },
    {
        id: '#RSQ-0921',
        date: '28 Sep 2024',
        location: 'Mombasa Road',
        amount: 3000,
        status: 'Completed',
        type: 'Fuel Delivery',
        emoji: '⛽'
    },
    {
        id: '#RSQ-0815',
        date: '15 Sep 2024',
        location: 'Karen',
        amount: 2000,
        status: 'Completed',
        type: 'Tire Repair',
        emoji: '🔧'
    },
    {
        id: '#RSQ-0712',
        date: '01 Sep 2024',
        location: 'CBD, Nairobi',
        amount: 2500,
        status: 'Completed',
        type: 'Diagnostics',
        emoji: '🔍'
    },
];

export default function HistoryScreen() {
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <Text style={styles.headerIconText}>📋</Text>
                </View>
                <Text style={styles.headerTitle}>Rescue History</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {MOCK_ORDERS.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🚗</Text>
                        <Text style={styles.emptyTitle}>No Rescues Yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Your rescue requests will appear here.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.ordersList}>
                        {MOCK_ORDERS.map((order, index) => (
                            <Pressable
                                key={order.id}
                                style={({ pressed }) => [
                                    styles.orderCard,
                                    pressed && styles.orderCardPressed,
                                ]}
                            >
                                <View style={styles.orderCardContent}>
                                    {/* Icon */}
                                    <View style={[
                                        styles.orderIcon,
                                        {
                                            backgroundColor: order.status === 'Completed'
                                                ? `${colors.success}15`
                                                : `${colors.voltage}15`
                                        }
                                    ]}>
                                        <Text style={styles.orderEmoji}>{order.emoji}</Text>
                                    </View>

                                    {/* Details */}
                                    <View style={styles.orderDetails}>
                                        <Text style={styles.orderLocation}>{order.location}</Text>
                                        <View style={styles.orderMeta}>
                                            <Text style={styles.orderMetaText}>{order.date}</Text>
                                            <Text style={styles.orderMetaDot}>•</Text>
                                            <Text style={styles.orderMetaText}>{order.type}</Text>
                                            <Text style={styles.orderMetaDot}>•</Text>
                                            <Text style={styles.orderIdText}>{order.id}</Text>
                                        </View>
                                    </View>

                                    {/* Amount & Status */}
                                    <View style={styles.orderRight}>
                                        <Text style={styles.orderAmount}>
                                            KES {order.amount.toLocaleString()}
                                        </Text>
                                        <Text style={[
                                            styles.orderStatus,
                                            {
                                                color: order.status === 'Completed'
                                                    ? colors.success
                                                    : colors.voltage
                                            }
                                        ]}>
                                            {order.status.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                            </Pressable>
                        ))}
                    </View>
                )}

                {/* Summary Stats */}
                <View style={styles.statsSection}>
                    <Text style={styles.statsSectionTitle}>This Month</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{MOCK_ORDERS.length}</Text>
                            <Text style={styles.statLabel}>Rescues</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>
                                KES {MOCK_ORDERS.reduce((sum, o) => sum + o.amount, 0).toLocaleString()}
                            </Text>
                            <Text style={styles.statLabel}>Total Spent</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>8 min</Text>
                            <Text style={styles.statLabel}>Avg Response</Text>
                        </View>
                    </View>
                </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 70 : 50,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        backgroundColor: colors.charcoal[800],
        borderBottomWidth: 1,
        borderBottomColor: colors.charcoal[600],
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${colors.voltage}20`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    headerIconText: {
        fontSize: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text.primary,
    },

    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: 120,
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xl * 2,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: colors.text.secondary,
    },

    // Orders List
    ordersList: {
        gap: spacing.md,
    },
    orderCard: {
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
        padding: spacing.lg,
        marginBottom: spacing.md,
        ...shadows.card,
    },
    orderCardPressed: {
        borderColor: `${colors.voltage}50`,
    },
    orderCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    orderEmoji: {
        fontSize: 22,
    },
    orderDetails: {
        flex: 1,
    },
    orderLocation: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 4,
    },
    orderMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    orderMetaText: {
        fontSize: 12,
        color: colors.text.secondary,
    },
    orderMetaDot: {
        fontSize: 12,
        color: colors.text.muted,
        marginHorizontal: 6,
    },
    orderIdText: {
        fontSize: 12,
        color: colors.text.muted,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    orderRight: {
        alignItems: 'flex-end',
    },
    orderAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 4,
    },
    orderStatus: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    // Stats Section
    statsSection: {
        marginTop: spacing.xl,
    },
    statsSectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
        padding: spacing.md,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.voltage,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        color: colors.text.secondary,
        textAlign: 'center',
    },
});
