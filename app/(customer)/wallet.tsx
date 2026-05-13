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
import { useAuth } from '../../services/AuthContext';
import { subscribeToWalletBalance } from '../../services/customer.service';
import { getUserTransactions, type Transaction as ServiceTransaction } from '../../services/transaction.service';
import { formatWalletBalance } from '../../components/dashboard/SidebarDrawer.helpers';

// Phase 4 (audit-v3 §MOCK-SWEEP) — transactions and payment methods are
// scoped per user. The mock array (Towing Service / Top Up / Fuel / etc.)
// that previously shipped to every customer has been removed. Until the
// transactions collection has a per-user query (separate ticket), a
// fresh account renders the empty-state card defined below.
interface WalletTransaction {
    id: string;
    title: string;
    date: string;
    amount: number;
    type: 'debit' | 'credit' | 'pending';
    icon: string;
}

function maskMpesaPhone(phone: string | undefined): string {
    // "+254712345678" → "+254 712 *** 678". Returns '' if we don't have a
    // valid 12-digit phone so the UI can hide the payment-method tile
    // for fresh accounts instead of rendering a misleading placeholder.
    const digits = (phone ?? '').replace(/\D/g, '');
    if (digits.length < 12) return '';
    const cc = digits.slice(0, 3);
    const prefix = digits.slice(3, 6);
    const suffix = digits.slice(-3);
    return `+${cc} ${prefix} *** ${suffix}`;
}

// Phase 4 (audit-v3 §WALLET-WIRE) — translate the canonical Transaction
// record into the wallet screen's display shape. Kept as a pure helper
// (Code-Simplification) so it's unit-testable in isolation.
function adaptTransaction(t: ServiceTransaction): WalletTransaction {
    let title: string;
    let icon: string;
    let direction: 'debit' | 'credit' | 'pending';
    switch (t.type) {
        case 'wallet_topup':
            title = 'Wallet Top Up';
            icon = 'topup';
            direction = 'credit';
            break;
        case 'wallet_withdraw':
            title = 'Withdrawal';
            icon = 'service';
            direction = 'debit';
            break;
        case 'refund':
            title = 'Refund';
            icon = 'refund';
            direction = 'credit';
            break;
        case 'provider_payout':
            title = 'Provider Payout';
            icon = 'service';
            direction = 'credit';
            break;
        case 'service_payment':
        default:
            title = t.description?.trim() || 'Service Payment';
            icon = 'service';
            direction = 'debit';
            break;
    }
    if (t.status === 'pending' || t.status === 'processing') {
        direction = 'pending';
    }
    const createdAt = t.createdAt instanceof Date
        ? t.createdAt
        : new Date(t.createdAt as any);
    return {
        id: t.id,
        title,
        date: Number.isNaN(createdAt.getTime())
            ? ''
            : createdAt.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }),
        amount: t.amount,
        type: direction,
        icon,
    };
}

export default function WalletScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    // Phase 4 (audit-v3 §MOCK-SWEEP) — wire the balance to the user's
    // Firestore wallet doc via the existing subscribeToWalletBalance
    // service. Returns 0 for fresh accounts (no wallet doc yet), which
    // is the correct empty state.
    const { user } = useAuth();
    const [balance, setBalance] = useState<number>(0);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const mpesaPhone = maskMpesaPhone(user?.phoneNumber);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    }, [fadeAnim, slideAnim]);

    useEffect(() => {
        if (!user?.id) {
            // No user yet (route guard should keep this unreachable).
            // Render zero and don't subscribe.
            setBalance(0);
            setIsLoading(false);
            return;
        }
        const unsubscribe = subscribeToWalletBalance(user.id, (next) => {
            setBalance(next);
            setIsLoading(false);
        });
        return unsubscribe;
    }, [user?.id]);

    // Phase 4 (audit-v3 §WALLET-WIRE) — populate the transaction list
    // from the real `transactions` collection scoped to user.id. The
    // previous hard-coded empty array meant a customer who had topped
    // up, paid for a service, or received a refund still saw
    // "No transactions yet" forever.
    useEffect(() => {
        let cancelled = false;
        if (!user?.id) {
            setTransactions([]);
            return;
        }
        getUserTransactions(user.id, 50)
            .then((rows) => {
                if (cancelled) return;
                setTransactions(rows.map(adaptTransaction));
            })
            .catch((err) => {
                if (cancelled) return;
                console.warn('[wallet] getUserTransactions failed:', err);
                setTransactions([]);
            });
        return () => { cancelled = true; };
    }, [user?.id]);

    const renderTransactionIcon = (icon: string) => {
        if (icon === 'topup') return <ArrowDownLeft size={20} color={colors.status.success} strokeWidth={2} />;
        if (icon === 'refund') return <HistoryIcon size={20} color={colors.voltage} strokeWidth={2} />;
        if (icon === 'card') return <CreditCard size={20} color={colors.text.secondary} strokeWidth={2} />;
        return <Text style={styles.txnEmoji}>{icon}</Text>;
    };

    const getAmountColor = (type: string) => {
        if (type === 'debit') return colors.status.error;
        if (type === 'credit') return colors.status.success;
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
                            <Text style={styles.balanceAmount}>{formatWalletBalance(balance)}</Text>
                            <View style={styles.updatedRow}>
                                <View style={styles.liveDot} />
                                <Text style={styles.updatedText}>Live</Text>
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

                        {/* M-Pesa Card — only shown when we actually have
                            a phone number on the user profile. For fresh
                            accounts the user lands straight on the
                            "Add Payment Method" CTA below. */}
                        {mpesaPhone ? (
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
                                        <Text style={styles.paymentNumber}>{mpesaPhone}</Text>
                                    </View>
                                </View>
                                <View style={styles.paymentCheck}>
                                    <View style={styles.paymentCheckMark} />
                                </View>
                            </View>
                        ) : null}

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
                                // Loading skeletons — only while the
                                // subscribeToWalletBalance subscription is
                                // in flight.
                                [...Array(3)].map((_, i) => (
                                    <SkeletonListItem key={i} />
                                ))
                            ) : transactions.length === 0 ? (
                                <View style={styles.emptyState} accessibilityRole="summary">
                                    <View style={styles.emptyIconWrap}>
                                        <HistoryIcon size={24} color={colors.text.tertiary} strokeWidth={2} />
                                    </View>
                                    <Text style={styles.emptyTitle}>No transactions yet</Text>
                                    <Text style={styles.emptyBody}>
                                        Your top-ups, service payments, and refunds will appear here.
                                    </Text>
                                </View>
                            ) : (
                                transactions.map((txn, idx) => (
                                    <Pressable
                                        key={txn.id}
                                        style={[
                                            styles.transactionRow,
                                            idx < transactions.length - 1 && styles.transactionBorder
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

                    {/* Membership Upsell — Phase 4 (audit-v3 §MOCK-SWEEP).
                        The user's tier is read from the authed user; only
                        "basic" accounts see the upgrade CTA. The Plus tier
                        is the real upsell target (matches User.membership
                        union in types/index.ts). */}
                    {user?.membership !== 'plus' && (
                        <View style={styles.membershipCard}>
                            <View style={styles.membershipLeft}>
                                <View style={styles.membershipIconWrap}>
                                    <Crown size={20} color={colors.voltage} strokeWidth={2} />
                                </View>
                                <View style={styles.membershipTextBlock}>
                                    <Text style={styles.membershipTitle}>Current Plan: Basic</Text>
                                    <Text style={styles.membershipDesc}>Upgrade to Plus for discounted services</Text>
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
                    )}
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
        backgroundColor: colors.status.success,
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
        borderLeftColor: colors.service.fuel,
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
        backgroundColor: colors.text.primary,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.text.opacity80,
    },
    mpesaText: {
        fontSize: 8,
        fontWeight: '900',
        color: colors.service.fuel,
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
        backgroundColor: colors.successGlow,
        borderWidth: 1,
        borderColor: `${colors.status.success}4D`,
    },
    defaultBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.status.success,
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
        backgroundColor: colors.status.success,
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
    emptyState: {
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    emptyIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.charcoal[800],
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
    },
    emptyTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: '700',
        color: colors.text.primary,
        textAlign: 'center',
    },
    emptyBody: {
        fontSize: typography.fontSize.sm,
        color: colors.text.tertiary,
        textAlign: 'center',
        lineHeight: typography.fontSize.sm * 1.4,
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
