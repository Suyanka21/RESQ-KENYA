// ⚡ ResQ Kenya - Provider Earnings Screen
// Converted from NativeWind to StyleSheet for consistency

import { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme/voltage-premium';
import { ServiceIcon } from '../../components/ui/ServiceIcon';
import { useAuth } from '../../services/AuthContext';

// Phase 4 (audit-v3 §MOCK-SWEEP) — the previous MOCK_EARNINGS
// (KES 7,500 / 32,500 / 125,000 / 4,500) and MOCK_TRANSACTIONS
// (towing, tire, battery, fuel) shipped to every provider regardless
// of activity. A freshly-onboarded provider has zero earnings and
// zero transactions. Earnings now read from the AuthContext's
// `provider.earnings` slot; transactions render an empty state until
// the per-provider transactions query is wired up.
interface Transaction {
    id: string;
    type: string;
    amount: number;
    date: Date;
    status: string;
}

export default function ProviderEarningsScreen() {
    const { provider } = useAuth();
    const [activePeriod, setActivePeriod] = useState<'today' | 'week' | 'month'>('today');
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    // Earnings are sourced from the Provider.earnings sub-object on
    // the AuthContext. A fresh provider account has all zeros until
    // the provider has completed and settled a paid request.
    const earnings = {
        today: provider?.earnings?.today ?? 0,
        thisWeek: provider?.earnings?.thisWeek ?? 0,
        thisMonth: provider?.earnings?.thisMonth ?? 0,
        // Pending is not currently tracked on the Provider type; until
        // it is, render 0 rather than hard-coding KES 4,500.
        pending: 0,
    };
    const transactions: Transaction[] = [];

    const getActiveEarnings = () => {
        switch (activePeriod) {
            case 'today': return earnings.today;
            case 'week': return earnings.thisWeek;
            case 'month': return earnings.thisMonth;
        }
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - date.getTime()) / 3600000);

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffHours / 24)}d ago`;
    };

    // Job counts come from the same transactions list. Until the
    // per-period aggregate query is wired we report the in-memory
    // count for whichever period is showing.
    const getJobCount = () => transactions.length;
    const avgRating = provider?.rating ?? 0;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Earnings</Text>

                {/* Period Selector */}
                <View style={styles.periodSelector}>
                    {(['today', 'week', 'month'] as const).map(period => (
                        <Pressable
                            key={period}
                            style={[
                                styles.periodButton,
                                activePeriod === period && styles.periodButtonActive
                            ]}
                            onPress={() => setActivePeriod(period)}
                        >
                            <Text style={[
                                styles.periodButtonText,
                                activePeriod === period && styles.periodButtonTextActive
                            ]}>
                                {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'Today'}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Main Earnings Card */}
                <View style={styles.earningsCard}>
                    <Text style={styles.earningsLabel}>
                        {activePeriod === 'today' ? "Today's" : activePeriod === 'week' ? "This Week's" : "This Month's"} Earnings
                    </Text>
                    <Text style={styles.earningsValue}>
                        KES {getActiveEarnings().toLocaleString()}
                    </Text>
                    <View style={styles.earningsStats}>
                        <View style={styles.earningsStat}>
                            <Text style={styles.earningsStatLabel}>Pending</Text>
                            <Text style={styles.earningsStatValue}>
                                KES {earnings.pending.toLocaleString()}
                            </Text>
                        </View>
                        <View style={styles.earningsStat}>
                            <Text style={styles.earningsStatLabel}>Jobs</Text>
                            <Text style={styles.earningsStatValue}>{getJobCount()}</Text>
                        </View>
                        <View style={styles.earningsStat}>
                            <Text style={styles.earningsStatLabel}>Rating</Text>
                            <Text style={styles.earningsStatValue}>
                                {avgRating > 0 ? `${avgRating.toFixed(1)} ★` : '—'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Withdraw Button */}
                <Pressable
                    style={[styles.withdrawButton, isWithdrawing && styles.withdrawButtonDisabled]}
                    disabled={isWithdrawing}
                    onPress={() => {
                        setIsWithdrawing(true);
                        // Simulate API call
                        setTimeout(() => setIsWithdrawing(false), 2000);
                    }}
                >
                    {isWithdrawing ? (
                        <ActivityIndicator color={colors.text.primary} />
                    ) : (
                        <Text style={styles.withdrawButtonText}>
                            Withdraw to M-Pesa
                        </Text>
                    )}
                </Pressable>

                {/* Transaction History */}
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <View style={styles.transactionsList}>
                    {transactions.length === 0 ? (
                        <View style={styles.transactionsEmpty}>
                            <Text style={styles.transactionsEmptyTitle}>No transactions yet</Text>
                            <Text style={styles.transactionsEmptyBody}>
                                Completed jobs and payouts will appear here.
                            </Text>
                        </View>
                    ) : (
                        transactions.map((tx, index) => (
                            <View
                                key={tx.id}
                                style={[
                                    styles.transactionItem,
                                    index < transactions.length - 1 && styles.transactionItemBorder
                                ]}
                            >
                                <View style={styles.transactionIcon}>
                                    <ServiceIcon type={tx.type as any} size={18} color={colors.voltage} />
                                </View>
                                <View style={styles.transactionInfo}>
                                    <Text style={styles.transactionType}>{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} Service</Text>
                                    <Text style={styles.transactionTime}>{formatTime(tx.date)}</Text>
                                </View>
                                <Text style={styles.transactionAmount}>
                                    +KES {tx.amount.toLocaleString()}
                                </Text>
                            </View>
                        ))
                    )}
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
        paddingHorizontal: spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 70 : 50,
        paddingBottom: spacing.lg,
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
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: colors.charcoal[700],
        borderRadius: borderRadius.xl,
        padding: spacing.xs,
    },
    periodButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
    },
    periodButtonActive: {
        backgroundColor: colors.voltage,
    },
    periodButtonText: {
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
        color: colors.text.secondary,
    },
    periodButtonTextActive: {
        color: colors.charcoal[900],
    },

    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: 100,
    },

    // Earnings Card
    earningsCard: {
        backgroundColor: colors.voltage,
        borderRadius: borderRadius['2xl'],
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    earningsLabel: {
        color: `${colors.charcoal[900]}99`,
        fontSize: 14,
        marginBottom: spacing.xs,
    },
    earningsValue: {
        color: colors.charcoal[900],
        fontSize: 36,
        fontWeight: '700',
    },
    earningsStats: {
        flexDirection: 'row',
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: `${colors.charcoal[900]}20`,
    },
    earningsStat: {
        flex: 1,
    },
    earningsStatLabel: {
        color: `${colors.charcoal[900]}99`,
        fontSize: 12,
    },
    earningsStatValue: {
        color: colors.charcoal[900],
        fontWeight: '700',
    },

    // Withdraw Button
    withdrawButton: {
        backgroundColor: colors.success,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.lg,
    },
    withdrawButtonText: {
        color: colors.text.primary,
        textAlign: 'center',
        fontWeight: '700',
        fontSize: 16,
    },
    withdrawButtonDisabled: {
        opacity: 0.6,
    },

    // Section Title
    sectionTitle: {
        color: colors.text.primary,
        fontWeight: '700',
        fontSize: 18,
        marginBottom: spacing.md,
    },

    // Transactions
    transactionsList: {
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
        marginBottom: spacing.xl,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
    },
    transactionItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.charcoal[600],
    },
    transactionIcon: {
        width: 40,
        height: 40,
        backgroundColor: colors.charcoal[700],
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionType: {
        color: colors.text.primary,
        fontWeight: '500',
    },
    transactionTime: {
        color: colors.text.muted,
        fontSize: 12,
    },
    transactionAmount: {
        color: colors.success,
        fontWeight: '700',
    },
    transactionsEmpty: {
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        gap: spacing.xs,
    },
    transactionsEmptyTitle: {
        color: colors.text.primary,
        fontSize: 15,
        fontWeight: '600',
    },
    transactionsEmptyBody: {
        color: colors.text.tertiary,
        fontSize: 13,
        textAlign: 'center',
    },
});
