// ⚡ ResQ Kenya - Wallet
// M-Pesa wallet with balance and payment methods matching web prototype

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { colors, shadows, borderRadius, spacing } from '../../theme/voltage-premium';

export default function WalletScreen() {
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <Text style={styles.headerIconText}>💰</Text>
                </View>
                <Text style={styles.headerTitle}>Wallet</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Balance Card */}
                <View style={styles.balanceCard}>
                    <View style={styles.balanceGlow} />
                    <View style={styles.balanceContent}>
                        <Text style={styles.balanceLabel}>M-Pesa Connected Balance</Text>
                        <Text style={styles.balanceValue}>KES 4,500.00</Text>

                        <View style={styles.balanceActions}>
                            <Pressable style={styles.topUpButton}>
                                <Text style={styles.topUpButtonText}>Top Up</Text>
                            </Pressable>
                            <Pressable style={styles.historyButton}>
                                <Text style={styles.historyButtonText}>History</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.quickStat}>
                        <Text style={styles.quickStatValue}>12</Text>
                        <Text style={styles.quickStatLabel}>Rescues</Text>
                    </View>
                    <View style={styles.quickStatDivider} />
                    <View style={styles.quickStat}>
                        <Text style={styles.quickStatValue}>KES 28K</Text>
                        <Text style={styles.quickStatLabel}>Saved</Text>
                    </View>
                    <View style={styles.quickStatDivider} />
                    <View style={styles.quickStat}>
                        <Text style={styles.quickStatValue}>⭐ Gold</Text>
                        <Text style={styles.quickStatLabel}>Member</Text>
                    </View>
                </View>

                {/* Payment Methods */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Methods</Text>

                    {/* M-Pesa - Primary */}
                    <View style={styles.paymentMethod}>
                        <View style={styles.paymentMethodIcon}>
                            <Text style={styles.mpesaText}>M-PESA</Text>
                        </View>
                        <View style={styles.paymentMethodDetails}>
                            <Text style={styles.paymentMethodName}>Safaricom M-Pesa</Text>
                            <Text style={styles.paymentMethodInfo}>Connected: 07** *** 892</Text>
                        </View>
                        <View style={styles.primaryBadge}>
                            <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                        </View>
                    </View>

                    {/* Add Payment Method */}
                    <Pressable style={styles.addPaymentMethod}>
                        <View style={styles.addPaymentIcon}>
                            <Text style={styles.addPaymentIconText}>+</Text>
                        </View>
                        <Text style={styles.addPaymentText}>Add Payment Method</Text>
                    </Pressable>
                </View>

                {/* Membership Card */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Membership</Text>

                    <View style={styles.membershipCard}>
                        <View style={styles.membershipHeader}>
                            <Text style={styles.membershipBadge}>⚡ GOLD MEMBER</Text>
                            <Text style={styles.membershipExpiry}>Exp: Dec 2025</Text>
                        </View>
                        <View style={styles.membershipBenefits}>
                            <View style={styles.benefit}>
                                <Text style={styles.benefitCheck}>✓</Text>
                                <Text style={styles.benefitText}>Priority dispatch</Text>
                            </View>
                            <View style={styles.benefit}>
                                <Text style={styles.benefitCheck}>✓</Text>
                                <Text style={styles.benefitText}>15% off all services</Text>
                            </View>
                            <View style={styles.benefit}>
                                <Text style={styles.benefitCheck}>✓</Text>
                                <Text style={styles.benefitText}>Free diagnostics (2/month)</Text>
                            </View>
                        </View>
                        <Pressable style={styles.upgradeButton}>
                            <Text style={styles.upgradeButtonText}>Upgrade to Platinum</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Recent Transactions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Transactions</Text>

                    {[
                        { type: 'Towing Service', date: 'Today, 12:30 PM', amount: -5000 },
                        { type: 'M-Pesa Top Up', date: 'Yesterday', amount: +10000 },
                        { type: 'Battery Jump', date: '12 Oct 2024', amount: -1500 },
                    ].map((tx, index) => (
                        <View key={index} style={styles.transaction}>
                            <View style={styles.transactionDetails}>
                                <Text style={styles.transactionType}>{tx.type}</Text>
                                <Text style={styles.transactionDate}>{tx.date}</Text>
                            </View>
                            <Text style={[
                                styles.transactionAmount,
                                { color: tx.amount > 0 ? colors.success : colors.text.primary }
                            ]}>
                                {tx.amount > 0 ? '+' : ''}KES {Math.abs(tx.amount).toLocaleString()}
                            </Text>
                        </View>
                    ))}
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

    // Balance Card
    balanceCard: {
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius['2xl'],
        borderWidth: 1,
        borderColor: colors.charcoal[600],
        padding: spacing.xl,
        marginBottom: spacing.lg,
        overflow: 'hidden',
        position: 'relative',
        ...shadows.cardElevated,
    },
    balanceGlow: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: `${colors.success}10`,
    },
    balanceContent: {
        position: 'relative',
        zIndex: 1,
    },
    balanceLabel: {
        fontSize: 14,
        color: colors.text.secondary,
        marginBottom: 8,
    },
    balanceValue: {
        fontSize: 36,
        fontWeight: '700',
        color: colors.text.primary,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        marginBottom: spacing.lg,
    },
    balanceActions: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    topUpButton: {
        backgroundColor: colors.success,
        paddingHorizontal: spacing.lg,
        paddingVertical: 12,
        borderRadius: borderRadius.md,
    },
    topUpButtonText: {
        color: colors.charcoal[900],
        fontSize: 14,
        fontWeight: '700',
    },
    historyButton: {
        backgroundColor: colors.charcoal[700],
        paddingHorizontal: spacing.lg,
        paddingVertical: 12,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
    },
    historyButtonText: {
        color: colors.text.secondary,
        fontSize: 14,
        fontWeight: '600',
    },

    // Quick Stats
    statsRow: {
        flexDirection: 'row',
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
        padding: spacing.md,
        marginBottom: spacing.xl,
    },
    quickStat: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    quickStatDivider: {
        width: 1,
        backgroundColor: colors.charcoal[600],
    },
    quickStatValue: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 4,
    },
    quickStatLabel: {
        fontSize: 12,
        color: colors.text.secondary,
    },

    // Sections
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.md,
    },

    // Payment Methods
    paymentMethod: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: `${colors.success}30`,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    paymentMethodIcon: {
        width: 48,
        height: 32,
        backgroundColor: colors.success,
        borderRadius: borderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    mpesaText: {
        color: colors.text.primary,
        fontSize: 10,
        fontWeight: '700',
    },
    paymentMethodDetails: {
        flex: 1,
    },
    paymentMethodName: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text.primary,
    },
    paymentMethodInfo: {
        fontSize: 12,
        color: colors.text.secondary,
        marginTop: 2,
    },
    primaryBadge: {
        backgroundColor: `${colors.success}15`,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
    },
    primaryBadgeText: {
        color: colors.success,
        fontSize: 10,
        fontWeight: '700',
    },
    addPaymentMethod: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
        borderStyle: 'dashed',
        padding: spacing.md,
    },
    addPaymentIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.charcoal[700],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    addPaymentIconText: {
        color: colors.text.secondary,
        fontSize: 20,
    },
    addPaymentText: {
        color: colors.text.secondary,
        fontSize: 14,
        fontWeight: '600',
    },

    // Membership Card
    membershipCard: {
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: `${colors.voltage}30`,
        padding: spacing.lg,
    },
    membershipHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    membershipBadge: {
        color: colors.voltage,
        fontSize: 14,
        fontWeight: '700',
    },
    membershipExpiry: {
        color: colors.text.muted,
        fontSize: 12,
    },
    membershipBenefits: {
        marginBottom: spacing.lg,
    },
    benefit: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    benefitCheck: {
        color: colors.success,
        fontSize: 14,
        marginRight: 8,
    },
    benefitText: {
        color: colors.text.secondary,
        fontSize: 14,
    },
    upgradeButton: {
        borderWidth: 1,
        borderColor: colors.voltage,
        borderRadius: borderRadius.md,
        paddingVertical: 12,
        alignItems: 'center',
    },
    upgradeButtonText: {
        color: colors.voltage,
        fontSize: 14,
        fontWeight: '700',
    },

    // Transactions
    transaction: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.charcoal[700],
    },
    transactionDetails: {
        flex: 1,
    },
    transactionType: {
        color: colors.text.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    transactionDate: {
        color: colors.text.muted,
        fontSize: 12,
        marginTop: 2,
    },
    transactionAmount: {
        fontSize: 14,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
});
