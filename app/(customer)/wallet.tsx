// ⚡ ResQ Kenya - Wallet Screen
// Converted from: DESIGN RES Q/components/WalletScreen.tsx (Google Stitch)
// Phase 2.5 UI Enhancement - Agent 2.5

import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Pressable, ScrollView, Animated,
    Easing, Platform, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import {
    ArrowLeft, Settings, Plus, ArrowUpRight, ChevronRight, Crown,
    ArrowDownLeft, Wallet, CreditCard, Clock as HistoryIcon
} from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../../theme/voltage-premium';
import { StatusBar } from 'expo-status-bar';
import { SkeletonListItem } from '../../components/ui/SkeletonLoader';

// Mock transactions
const TRANSACTIONS = [
    { id: 'TXN-1234', title: 'Towing Service', date: 'Today, 2:45 PM', amount: -2750, type: 'debit', icon: '🚛' },
    { id: 'TXN-1233', title: 'Wallet Top Up', date: 'Yesterday, 10:00 AM', amount: 1000, type: 'credit', icon: 'topup' },
    { id: 'TXN-1232', title: 'Fuel Delivery', date: 'Oct 24, 4:30 PM', amount: -1500, type: 'debit', icon: '⛽' },
    { id: 'TXN-1231', title: 'Refund Processed', date: 'Oct 22, 9:15 AM', amount: 500, type: 'pending', icon: 'refund' },
    { id: 'TXN-1230', title: 'Monthly Subscription', date: 'Oct 01, 12:00 AM', amount: -2500, type: 'debit', icon: 'card' },
];

export default function WalletScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();

        // Simulate loading
        const timer = setTimeout(() => setIsLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const renderTransactionIcon = (icon: string) => {
        if (icon === 'topup') return <ArrowDownLeft size={20} color="#00E676" strokeWidth={2} />;
        if (icon === 'refund') return <HistoryIcon size={20} color={colors.voltage} strokeWidth={2} />;
        if (icon === 'card') return <CreditCard size={20} color={colors.text.secondary} strokeWidth={2} />;
        return <Text style={styles.txnEmoji}>{icon}</Text>;
    };

    const getAmountColor = (type: string) => {
        if (type === 'debit') return '#FF3D3D';
        if (type === 'credit') return '#00E676';
        return colors.voltage;
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
                        <ArrowLeft size={20} color={colors.text.secondary} strokeWidth={2} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Wallet</Text>
                    <Pressable
                        style={styles.headerButton}
                        accessibilityLabel="Wallet settings"
                        accessibilityRole="button"
                    >
                        <Settings size={24} color={colors.text.secondary} strokeWidth={2} />
                    </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Balance Card */}
                    <View style={styles.balanceCard}>
                        <View style={styles.balanceCardInner}>
                            <View style={styles.balanceTop}>
                                <Text style={styles.balanceLabel}>Available Balance</Text>
                                <Wallet size={20} color={colors.voltage} style={{ opacity: 0.5 }} strokeWidth={2} />
                            </View>
                            <Text style={styles.balanceAmount}>KES 4,500</Text>
                            <View style={styles.updatedRow}>
                                <View style={styles.liveDot} />
                                <Text style={styles.updatedText}>Updated 2 min ago</Text>
                            </View>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.topUpButton,
                                pressed && { transform: [{ scale: 0.98 }] }
                            ]}
                            accessibilityLabel="Top up wallet"
                            accessibilityRole="button"
                        >
                            <Plus size={20} color={colors.background.primary} strokeWidth={2.5} />
                            <Text style={styles.topUpText}>Top Up</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [
                                styles.withdrawButton,
                                pressed && { transform: [{ scale: 0.98 }] }
                            ]}
                            accessibilityLabel="Withdraw funds"
                            accessibilityRole="button"
                        >
                            <ArrowUpRight size={20} color={colors.voltage} strokeWidth={2.5} />
                            <Text style={styles.withdrawText}>Withdraw</Text>
                        </Pressable>
                    </View>

                    {/* Payment Methods */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <View>
                                <Text style={styles.sectionTitle}>Payment Methods</Text>
                                <Text style={styles.sectionSubtitle}>Manage your payment options</Text>
                            </View>
                        </View>

                        {/* M-Pesa Card */}
                        <View style={styles.paymentCard}>
                            <View style={styles.paymentCardLeft}>
                                <View style={styles.mpesaBadge}>
                                    <Text style={styles.mpesaText}>M-PESA</Text>
                                </View>
                                <View>
                                    <View style={styles.paymentNameRow}>
                                        <Text style={styles.paymentName}>M-Pesa</Text>
                                        <View style={styles.defaultBadge}>
                                            <Text style={styles.defaultBadgeText}>Default</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.paymentNumber}>+254 712 *** 678</Text>
                                </View>
                            </View>
                            <View style={styles.paymentCheck}>
                                <View style={styles.paymentCheckMark} />
                            </View>
                        </View>

                        {/* Add Payment Button */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.addPaymentButton,
                                pressed && { backgroundColor: colors.background.secondary }
                            ]}
                            accessibilityLabel="Add payment method"
                            accessibilityRole="button"
                        >
                            <Plus size={20} color={colors.voltage} strokeWidth={2.5} />
                            <Text style={styles.addPaymentText}>Add Payment Method</Text>
                        </Pressable>
                    </View>

                    {/* Transaction History */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Recent Transactions</Text>
                            <Pressable accessibilityLabel="View all transactions" accessibilityRole="button">
                                <Text style={styles.viewAllText}>View All</Text>
                            </Pressable>
                        </View>

                        <View style={styles.transactionList}>
                            {isLoading ? (
                                // Loading skeletons
                                [...Array(5)].map((_, i) => (
                                    <SkeletonListItem key={i} />
                                ))
                            ) : (
                                TRANSACTIONS.map((txn, idx) => (
                                    <Pressable
                                        key={txn.id}
                                        style={[
                                            styles.transactionRow,
                                            idx < TRANSACTIONS.length - 1 && styles.transactionBorder
                                        ]}
                                        accessibilityLabel={`${txn.title}, ${txn.type === 'debit' ? 'minus' : 'plus'} KES ${Math.abs(txn.amount)}`}
                                        accessibilityRole="button"
                                    >
                                        <View style={styles.txnLeft}>
                                            <View style={styles.txnIconWrap}>
                                                {renderTransactionIcon(txn.icon)}
                                            </View>
                                            <View>
                                                <Text style={styles.txnTitle}>{txn.title}</Text>
                                                <View style={styles.txnMetaRow}>
                                                    <Text style={styles.txnDate}>{txn.date}</Text>
                                                    <View style={styles.txnDot} />
                                                    <Text style={styles.txnId}>{txn.id}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View style={styles.txnRight}>
                                            <Text style={[styles.txnAmount, { color: getAmountColor(txn.type) }]}>
                                                {txn.type === 'debit' ? '-' : txn.type === 'credit' ? '+' : ''} KES {Math.abs(txn.amount).toLocaleString()}
                                            </Text>
                                            <ChevronRight size={16} color={colors.text.tertiary} strokeWidth={2} />
                                        </View>
                                    </Pressable>
                                ))
                            )}
                        </View>
                    </View>

                    {/* Membership Upsell */}
                    <View style={styles.membershipCard}>
                        <View style={styles.membershipLeft}>
                            <View style={styles.membershipIconWrap}>
                                <Crown size={20} color={colors.voltage} strokeWidth={2} />
                            </View>
                            <View style={styles.membershipTextBlock}>
                                <Text style={styles.membershipTitle}>Current Plan: Basic</Text>
                                <Text style={styles.membershipDesc}>Upgrade to Gold for 10% off all services</Text>
                            </View>
                        </View>
                        <Pressable
                            style={({ pressed }) => [
                                styles.upgradeButton,
                                pressed && { backgroundColor: colors.interactive.pressed }
                            ]}
                            accessibilityLabel="Upgrade membership plan"
                            accessibilityRole="button"
                        >
                            <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                        </Pressable>
                    </View>
                </ScrollView>
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
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: spacing.xl * 2,
    },

    // Balance Card
    balanceCard: {
        borderRadius: borderRadius['2xl'],
        borderWidth: 1,
        borderColor: colors.background.border,
        borderLeftWidth: 4,
        borderLeftColor: colors.voltage,
        overflow: 'hidden',
        marginBottom: spacing.xl,
        ...shadows.card,
    },
    balanceCardInner: {
        padding: spacing.lg,
        backgroundColor: colors.background.secondary,
    },
    balanceTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.xs,
    },
    balanceLabel: {
        fontSize: typography.fontSize.sm,
        fontWeight: '500',
        color: colors.text.secondary,
    },
    balanceAmount: {
        fontSize: 40,
        fontWeight: '700',
        color: colors.text.primary,
        letterSpacing: -1,
        marginBottom: spacing.sm,
    },
    updatedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#00E676',
    },
    updatedText: {
        fontSize: typography.fontSize.xs,
        color: colors.text.tertiary,
    },

    // Action buttons
    actionRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    topUpButton: {
        flex: 1,
        height: 48,
        backgroundColor: colors.voltage,
        borderRadius: borderRadius.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        ...shadows.button,
    },
    topUpText: {
        fontSize: typography.fontSize.base,
        fontWeight: '700',
        color: colors.background.primary,
    },
    withdrawButton: {
        flex: 1,
        height: 48,
        borderWidth: 2,
        borderColor: colors.voltage,
        backgroundColor: 'transparent',
        borderRadius: borderRadius.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    withdrawText: {
        fontSize: typography.fontSize.base,
        fontWeight: '700',
        color: colors.voltage,
    },

    // Section
    section: {
        marginBottom: spacing.xl,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: spacing.xs,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: '700',
        color: colors.text.primary,
    },
    sectionSubtitle: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        marginTop: 2,
    },
    viewAllText: {
        fontSize: typography.fontSize.sm,
        fontWeight: '500',
        color: colors.voltage,
    },

    // Payment card
    paymentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.background.border,
        borderLeftWidth: 3,
        borderLeftColor: '#4CAF50',
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    paymentCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    mpesaBadge: {
        width: 48,
        height: 32,
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    mpesaText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#4CAF50',
        letterSpacing: -0.5,
    },
    paymentNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    paymentName: {
        fontSize: typography.fontSize.base,
        fontWeight: '700',
        color: colors.text.primary,
    },
    defaultBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        backgroundColor: 'rgba(0, 230, 118, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(0, 230, 118, 0.3)',
    },
    defaultBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#00E676',
    },
    paymentNumber: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        marginTop: 2,
    },
    paymentCheck: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#00E676',
        alignItems: 'center',
        justifyContent: 'center',
    },
    paymentCheckMark: {
        width: 10,
        height: 6,
        borderBottomWidth: 2,
        borderRightWidth: 2,
        borderColor: colors.background.primary,
        transform: [{ rotate: '45deg' }],
        marginBottom: 2,
    },

    // Add payment
    addPaymentButton: {
        width: '100%',
        height: 56,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: colors.background.border,
        borderRadius: borderRadius.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    addPaymentText: {
        fontSize: typography.fontSize.base,
        fontWeight: '700',
        color: colors.voltage,
    },

    // Transactions
    transactionList: {
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.background.border,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
    },
    transactionRow: {
        height: 72,
        paddingHorizontal: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    transactionBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.background.border,
    },
    txnLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flex: 1,
    },
    txnIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.charcoal[800],
        borderWidth: 1,
        borderColor: colors.charcoal[700],
        alignItems: 'center',
        justifyContent: 'center',
    },
    txnEmoji: {
        fontSize: 18,
    },
    txnTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: '500',
        color: colors.text.primary,
    },
    txnMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: 2,
    },
    txnDate: {
        fontSize: typography.fontSize.xs,
        color: colors.text.tertiary,
    },
    txnDot: {
        width: 2,
        height: 10,
        backgroundColor: colors.background.border,
    },
    txnId: {
        fontSize: 10,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        color: colors.text.tertiary,
    },
    txnRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    txnAmount: {
        fontSize: typography.fontSize.base,
        fontWeight: '700',
    },

    // Skeleton
    skeletonRow: {
        height: 72,
        paddingHorizontal: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: colors.background.border,
    },
    skeletonCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.charcoal[800],
    },
    skeletonTextBlock: {
        flex: 1,
        marginLeft: spacing.sm,
        gap: spacing.sm,
    },
    skeletonLine1: {
        width: 96,
        height: 12,
        borderRadius: 4,
        backgroundColor: colors.charcoal[800],
    },
    skeletonLine2: {
        width: 64,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.charcoal[800],
    },
    skeletonAmount: {
        width: 80,
        height: 16,
        borderRadius: 4,
        backgroundColor: colors.charcoal[800],
    },

    // Membership
    membershipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: `${colors.voltage}08`,
        borderWidth: 1,
        borderColor: colors.voltage,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
    },
    membershipLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flex: 1,
    },
    membershipIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${colors.voltage}33`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    membershipTextBlock: {
        flex: 1,
    },
    membershipTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: '700',
        color: colors.text.primary,
    },
    membershipDesc: {
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
        marginTop: 2,
    },
    upgradeButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        backgroundColor: colors.voltage,
        borderRadius: borderRadius.md,
    },
    upgradeButtonText: {
        fontSize: typography.fontSize.xs,
        fontWeight: '700',
        color: colors.background.primary,
    },
});
