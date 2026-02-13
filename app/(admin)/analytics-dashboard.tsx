// ResQ Kenya - Analytics Dashboard
// Phase 4: Admin dashboard for predictive analytics and metrics

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { voltageColors, voltageSpacing, spacing, typography } from '../../theme/voltage-premium';
import { type ChurnRisk, type RiskLevel } from '../../types/analytics';
import { getActiveCoverageAlerts, type CoverageAlert } from '../../services/demand-forecast.service';
import { ErrorState } from '../../components/ui/ErrorState';

const { width } = Dimensions.get('window');

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon: string;
    color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, color }) => (
    <View style={styles.metricCard}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon as any} size={24} color={color} />
        </View>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
        {change !== undefined && (
            <View style={styles.changeContainer}>
                <Ionicons
                    name={change >= 0 ? 'trending-up' : 'trending-down'}
                    size={14}
                    color={change >= 0 ? voltageColors.success : voltageColors.error}
                />
                <Text style={[
                    styles.changeText,
                    { color: change >= 0 ? voltageColors.success : voltageColors.error }
                ]}>
                    {Math.abs(change)}%
                </Text>
            </View>
        )}
    </View>
);

interface ChurnAlertCardProps {
    risk: ChurnRisk;
    onPress: () => void;
}

const ChurnAlertCard: React.FC<ChurnAlertCardProps> = ({ risk, onPress }) => {
    const getRiskColor = (level: RiskLevel) => {
        switch (level) {
            case 'critical': return voltageColors.error;
            case 'high': return voltageColors.warning;
            case 'medium': return voltageColors.accent;
            default: return voltageColors.success;
        }
    };

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <View style={styles.alertCard}>
                <View style={styles.alertHeader}>
                    <View style={[styles.riskBadge, { backgroundColor: getRiskColor(risk.riskLevel) }]}>
                        <Text style={styles.riskBadgeText}>{risk.riskLevel.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.alertType}>{risk.userType}</Text>
                </View>
                <Text style={styles.alertName}>{risk.userName || `User ${risk.userId.slice(-6)}`}</Text>
                <Text style={styles.alertReason}>{risk.highestRiskFactor.replace(/_/g, ' ')}</Text>
                <View style={styles.alertFooter}>
                    <Text style={styles.alertScore}>Risk: {risk.riskScore}%</Text>
                    <Text style={styles.alertValue}>LTV: KES {(risk.lifetimeValue / 1000).toFixed(0)}K</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

interface CoverageAlertCardProps {
    alert: CoverageAlert;
}

const CoverageAlertCard: React.FC<CoverageAlertCardProps> = ({ alert }) => (
    <View style={[
        styles.coverageCard,
        { borderLeftColor: alert.severity === 'critical' ? voltageColors.error : voltageColors.warning }
    ]}>
        <View style={styles.coverageHeader}>
            <Ionicons
                name="warning-outline"
                size={20}
                color={alert.severity === 'critical' ? voltageColors.error : voltageColors.warning}
            />
            <Text style={styles.coverageZone}>{alert.zone}</Text>
        </View>
        <Text style={styles.coverageAction}>{alert.recommendedAction}</Text>
        <View style={styles.coverageStats}>
            <Text style={styles.coverageStat}>Expected: {alert.expectedDemand}</Text>
            <Text style={styles.coverageStat}>Available: {alert.availableProviders}</Text>
        </View>
    </View>
);

export default function AnalyticsDashboard() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [churnAlerts, setChurnAlerts] = useState<ChurnRisk[]>([]);
    const [coverageAlerts, setCoverageAlerts] = useState<CoverageAlert[]>([]);
    const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
    const [error, setError] = useState<string | null>(null);
    const [metrics, setMetrics] = useState({
        totalRequests: 1247,
        completionRate: 94.2,
        avgResponseTime: 8.5,
        avgRating: 4.7,
        activeProviders: 156,
        newCustomers: 89,
        churnRate: 2.3,
        revenue: 1850000,
    });

    useEffect(() => {
        loadData();
    }, [period]);

    const loadData = async () => {
        setError(null);
        try {
            // Load coverage alerts
            const coverage = await getActiveCoverageAlerts();
            setCoverageAlerts(coverage);

            // Mock churn data for demo
            setChurnAlerts([
                {
                    userId: 'user_001',
                    userName: 'John Kamau',
                    userType: 'customer',
                    riskScore: 75,
                    riskLevel: 'high',
                    factors: [],
                    highestRiskFactor: 'days_inactive',
                    suggestedActions: ['Send re-engagement email'],
                    lastActive: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    accountAge: 180,
                    totalTransactions: 8,
                    lifetimeValue: 24000,
                    assessedAt: new Date(),
                },
                {
                    userId: 'prov_002',
                    userName: 'Peter Ochieng',
                    userType: 'provider',
                    riskScore: 65,
                    riskLevel: 'high',
                    factors: [],
                    highestRiskFactor: 'declining_earnings',
                    suggestedActions: ['Suggest high-demand zones'],
                    lastActive: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                    accountAge: 365,
                    totalTransactions: 250,
                    lifetimeValue: 850000,
                    assessedAt: new Date(),
                },
            ]);
        } catch (err) {
            setError('Failed to load analytics data');
            console.error('Error loading analytics:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleChurnAlertPress = (risk: ChurnRisk) => {
        console.log('Churn alert pressed:', risk.userId);
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={voltageColors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <ErrorState
                    title="Analytics Unavailable"
                    message={error}
                    onRetry={() => { setLoading(true); loadData(); }}
                />
            </View>
        );
    }

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
                        <Text style={styles.title}>Analytics Dashboard</Text>
                        <View style={styles.periodSelector}>
                            {(['day', 'week', 'month'] as const).map(p => (
                                <TouchableOpacity
                                    key={p}
                                    style={[styles.periodButton, period === p && styles.periodButtonActive]}
                                    onPress={() => setPeriod(p)}
                                >
                                    <Text style={[
                                        styles.periodText,
                                        period === p && styles.periodTextActive
                                    ]}>
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Key Metrics */}
                    <View style={styles.metricsGrid}>
                        <MetricCard
                            title="Requests"
                            value={metrics.totalRequests}
                            change={12}
                            icon="flash-outline"
                            color={voltageColors.primary}
                        />
                        <MetricCard
                            title="Completion"
                            value={`${metrics.completionRate}%`}
                            change={2.5}
                            icon="checkmark-circle-outline"
                            color={voltageColors.success}
                        />
                        <MetricCard
                            title="Avg Response"
                            value={`${metrics.avgResponseTime}m`}
                            change={-8}
                            icon="time-outline"
                            color={voltageColors.accent}
                        />
                        <MetricCard
                            title="Rating"
                            value={metrics.avgRating}
                            change={0.3}
                            icon="star-outline"
                            color={voltageColors.warning}
                        />
                    </View>

                    {/* Revenue Card */}
                    <View style={styles.revenueCard}>
                        <View style={styles.revenueHeader}>
                            <Text style={styles.revenueTitle}>Revenue</Text>
                            <View style={styles.revenueBadge}>
                                <Ionicons name="trending-up" size={14} color={voltageColors.success} />
                                <Text style={styles.revenueBadgeText}>+18%</Text>
                            </View>
                        </View>
                        <Text style={styles.revenueValue}>KES {(metrics.revenue / 1000000).toFixed(2)}M</Text>
                        <View style={styles.revenueStats}>
                            <View style={styles.revenueStat}>
                                <Text style={styles.revenueStatLabel}>Providers</Text>
                                <Text style={styles.revenueStatValue}>{metrics.activeProviders}</Text>
                            </View>
                            <View style={styles.revenueStat}>
                                <Text style={styles.revenueStatLabel}>New Users</Text>
                                <Text style={styles.revenueStatValue}>{metrics.newCustomers}</Text>
                            </View>
                            <View style={styles.revenueStat}>
                                <Text style={styles.revenueStatLabel}>Churn</Text>
                                <Text style={[styles.revenueStatValue, { color: voltageColors.error }]}>
                                    {metrics.churnRate}%
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Coverage Alerts */}
                    {coverageAlerts.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Coverage Alerts</Text>
                                <View style={styles.alertCount}>
                                    <Text style={styles.alertCountText}>{coverageAlerts.length}</Text>
                                </View>
                            </View>
                            {coverageAlerts.map((alert, index) => (
                                <CoverageAlertCard key={alert.alertId || index} alert={alert} />
                            ))}
                        </View>
                    )}

                    {/* Churn Alerts */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Churn Risk</Text>
                            <TouchableOpacity>
                                <Text style={styles.sectionAction}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        {churnAlerts.map(risk => (
                            <ChurnAlertCard
                                key={risk.userId}
                                risk={risk}
                                onPress={() => handleChurnAlertPress(risk)}
                            />
                        ))}
                    </View>

                    {/* AI Model Stats */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>AI Model Performance</Text>
                        <View style={styles.modelCard}>
                            <View style={styles.modelStat}>
                                <Text style={styles.modelLabel}>Dispatch Accuracy</Text>
                                <Text style={styles.modelValue}>78.5%</Text>
                            </View>
                            <View style={styles.modelStat}>
                                <Text style={styles.modelLabel}>Top-3 Accuracy</Text>
                                <Text style={styles.modelValue}>92.3%</Text>
                            </View>
                            <View style={styles.modelStat}>
                                <Text style={styles.modelLabel}>Training Samples</Text>
                                <Text style={styles.modelValue}>12,450</Text>
                            </View>
                            <View style={styles.modelStat}>
                                <Text style={styles.modelLabel}>Model Version</Text>
                                <Text style={styles.modelValue}>v1.0-heuristic</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.bottomPadding} />
                </ScrollView>
            </LinearGradient>
        </View >
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
    periodSelector: {
        flexDirection: 'row',
        marginTop: voltageSpacing.md,
        backgroundColor: voltageColors.surface,
        borderRadius: 10,
        padding: spacing.xs,
    },
    periodButton: {
        flex: 1,
        paddingVertical: voltageSpacing.sm,
        alignItems: 'center',
        borderRadius: 8,
    },
    periodButtonActive: {
        backgroundColor: voltageColors.primary,
    },
    periodText: {
        fontSize: typography.sizes.sm,
        color: voltageColors.textSecondary,
    },
    periodTextActive: {
        color: voltageColors.textPrimary,
        fontWeight: typography.weights.semibold as any,
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: voltageSpacing.md,
        gap: voltageSpacing.sm,
    },
    metricCard: {
        width: (width - voltageSpacing.md * 2 - voltageSpacing.sm) / 2 - voltageSpacing.sm / 2,
        backgroundColor: voltageColors.surface,
        borderRadius: 12,
        padding: voltageSpacing.md,
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: voltageSpacing.sm,
    },
    metricValue: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.bold as any,
        color: voltageColors.textPrimary,
    },
    metricTitle: {
        fontSize: typography.sizes.xs,
        color: voltageColors.textSecondary,
        marginTop: voltageSpacing.xs,
    },
    changeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: voltageSpacing.xs,
        gap: spacing.xs,
    },
    changeText: {
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.medium as any,
    },
    revenueCard: {
        margin: voltageSpacing.md,
        backgroundColor: voltageColors.primary,
        borderRadius: 16,
        padding: voltageSpacing.lg,
    },
    revenueHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    revenueTitle: {
        fontSize: typography.sizes.base,
        color: voltageColors.textOpacity80,
    },
    revenueBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: voltageColors.textOpacity20,
        paddingHorizontal: voltageSpacing.sm,
        paddingVertical: voltageSpacing.xs,
        borderRadius: 12,
        gap: spacing.xs,
    },
    revenueBadgeText: {
        fontSize: typography.sizes.xs,
        color: voltageColors.success,
    },
    revenueValue: {
        fontSize: typography.sizes['3xl'],
        fontWeight: typography.weights.bold as any,
        color: voltageColors.textPrimary,
        marginTop: voltageSpacing.sm,
    },
    revenueStats: {
        flexDirection: 'row',
        marginTop: voltageSpacing.lg,
        gap: voltageSpacing.lg,
    },
    revenueStat: {},
    revenueStatLabel: {
        fontSize: typography.sizes.xs,
        color: voltageColors.textOpacity60,
    },
    revenueStatValue: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.semibold as any,
        color: voltageColors.textPrimary,
    },
    section: {
        padding: voltageSpacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: voltageSpacing.md,
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
    alertCount: {
        backgroundColor: voltageColors.error,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertCountText: {
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.bold as any,
        color: voltageColors.textPrimary,
    },
    alertCard: {
        backgroundColor: voltageColors.surface,
        borderRadius: 12,
        padding: voltageSpacing.md,
        marginBottom: voltageSpacing.sm,
    },
    alertHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: voltageSpacing.xs,
    },
    riskBadge: {
        paddingHorizontal: voltageSpacing.sm,
        paddingVertical: 2,
        borderRadius: 4,
    },
    riskBadgeText: {
        fontSize: 10,
        fontWeight: typography.weights.bold as any,
        color: voltageColors.textPrimary,
    },
    alertType: {
        fontSize: typography.sizes.xs,
        color: voltageColors.textSecondary,
        textTransform: 'capitalize',
    },
    alertName: {
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.semibold as any,
        color: voltageColors.textPrimary,
    },
    alertReason: {
        fontSize: typography.sizes.sm,
        color: voltageColors.textSecondary,
        marginTop: voltageSpacing.xs,
        textTransform: 'capitalize',
    },
    alertFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: voltageSpacing.sm,
    },
    alertScore: {
        fontSize: typography.sizes.xs,
        color: voltageColors.textMuted,
    },
    alertValue: {
        fontSize: typography.sizes.xs,
        color: voltageColors.textMuted,
    },
    coverageCard: {
        backgroundColor: voltageColors.surface,
        borderRadius: 12,
        padding: voltageSpacing.md,
        marginBottom: voltageSpacing.sm,
        borderLeftWidth: 4,
    },
    coverageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: voltageSpacing.sm,
        marginBottom: voltageSpacing.xs,
    },
    coverageZone: {
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.semibold as any,
        color: voltageColors.textPrimary,
        textTransform: 'uppercase',
    },
    coverageAction: {
        fontSize: typography.sizes.sm,
        color: voltageColors.textSecondary,
    },
    coverageStats: {
        flexDirection: 'row',
        gap: voltageSpacing.lg,
        marginTop: voltageSpacing.sm,
    },
    coverageStat: {
        fontSize: typography.sizes.xs,
        color: voltageColors.textMuted,
    },
    modelCard: {
        backgroundColor: voltageColors.surface,
        borderRadius: 12,
        padding: voltageSpacing.md,
        gap: voltageSpacing.sm,
    },
    modelStat: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modelLabel: {
        fontSize: typography.sizes.sm,
        color: voltageColors.textSecondary,
    },
    modelValue: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.semibold as any,
        color: voltageColors.textPrimary,
    },
    bottomPadding: {
        height: voltageSpacing.xl * 2,
    },
});
