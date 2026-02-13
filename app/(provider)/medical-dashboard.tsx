// ResQ Kenya - Medical Provider Dashboard
// Specialized dashboard for EMT/Paramedic providers

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    Platform,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors as _colors, spacing, typography, borderRadius as radii } from '../../theme/voltage-premium';
import type { KenyaEMTLevel, TriageLevel } from '../../types/medical';

// Theme Adapter (Mapping Voltage Premium to Local UI)
const colors = {
    primary: _colors.voltage,
    primarySoft: _colors.voltageGlow,
    success: _colors.success,
    successSoft: _colors.successGlow,
    warning: _colors.warning,
    warningSoft: _colors.warningGlow,
    danger: _colors.emergency,
    dangerSoft: _colors.emergencyGlow,
    info: _colors.info,
    background: _colors.charcoal[900],
    surface: _colors.charcoal[800],
    surfaceAlt: _colors.charcoal[700],
    textPrimary: _colors.text.primary,
    textSecondary: _colors.text.secondary,
    textMuted: _colors.text.muted,
    textOnPrimary: _colors.text.onBrand,
};

const typo = {
    h2: { fontSize: typography.mobile.section.size, lineHeight: typography.mobile.section.lineHeight, fontWeight: typography.mobile.section.weight as any },
    h3: { fontSize: typography.mobile.subsection.size, lineHeight: typography.mobile.subsection.lineHeight, fontWeight: typography.mobile.subsection.weight as any },
    h4: { fontSize: typography.mobile.bodyLarge.size, lineHeight: typography.mobile.bodyLarge.lineHeight, fontWeight: '700' as any },
    body: { fontSize: typography.mobile.body.size, lineHeight: typography.mobile.body.lineHeight, fontWeight: typography.mobile.body.weight as any },
    bodyBold: { fontSize: typography.mobile.body.size, lineHeight: typography.mobile.body.lineHeight, fontWeight: '700' as any },
    caption: { fontSize: typography.mobile.caption.size, lineHeight: typography.mobile.caption.lineHeight, fontWeight: typography.mobile.caption.weight as any },
    small: { fontSize: typography.mobile.bodySmall.size, lineHeight: typography.mobile.bodySmall.lineHeight, fontWeight: typography.mobile.bodySmall.weight as any },
};

// ============================================================================
// TYPES
// ============================================================================

interface MedicalProviderStats {
    todayEmergencies: number;
    weeklyEmergencies: number;
    avgResponseTime: number; // minutes
    patientsSaved: number;
    rating: number;
    certificationStatus: 'valid' | 'expiring_soon' | 'expired';
    nextExpiringCert: { name: string; daysUntil: number } | null;
}

interface ActiveEmergency {
    id: string;
    triageLevel: TriageLevel;
    type: string;
    distance: number;
    estimatedTime: number;
    patientInfo: {
        age?: number;
        gender?: string;
        condition: string;
    };
    location: string;
    requestedAt: Date;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_STATS: MedicalProviderStats = {
    todayEmergencies: 3,
    weeklyEmergencies: 18,
    avgResponseTime: 8.5,
    patientsSaved: 247,
    rating: 4.9,
    certificationStatus: 'valid',
    nextExpiringCert: { name: 'CPR Certification', daysUntil: 45 },
};

const MOCK_EMERGENCY: ActiveEmergency | null = null; // No active emergency

const MOCK_RECENT_CASES = [
    {
        id: '1',
        date: new Date(Date.now() - 3600000),
        type: 'Cardiac Arrest',
        triageLevel: 'red' as TriageLevel,
        outcome: 'transported',
        hospital: 'KNH Emergency',
    },
    {
        id: '2',
        date: new Date(Date.now() - 86400000),
        type: 'Traffic Accident',
        triageLevel: 'yellow' as TriageLevel,
        outcome: 'treated_on_scene',
        hospital: null,
    },
    {
        id: '3',
        date: new Date(Date.now() - 172800000),
        type: 'Breathing Difficulty',
        triageLevel: 'yellow' as TriageLevel,
        outcome: 'transported',
        hospital: 'Nairobi Hospital',
    },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function MedicalDashboard() {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [stats, setStats] = useState<MedicalProviderStats>(MOCK_STATS);
    const [activeEmergency, setActiveEmergency] = useState<ActiveEmergency | null>(MOCK_EMERGENCY);
    const emtLevel: KenyaEMTLevel = 'emt_intermediate';

    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        // Simulate API refresh
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsRefreshing(false);
    }, []);

    const toggleOnlineStatus = () => {
        setIsOnline(prev => {
            const newStatus = !prev;
            // Show confirmation
            Alert.alert(
                newStatus ? 'You are now Online' : 'You are now Offline',
                newStatus
                    ? 'You will receive emergency dispatch requests.'
                    : 'You will not receive new requests.',
                [{ text: 'OK' }]
            );
            return newStatus;
        });
    };

    // ========================================================================
    // TRIAGE COLORS
    // ========================================================================

    const getTriageStyle = (level: TriageLevel) => {
        switch (level) {
            case 'red':
                return { bg: colors.dangerSoft, color: colors.danger, label: 'Critical' };
            case 'yellow':
                return { bg: colors.warningSoft, color: colors.warning, label: 'Urgent' };
            case 'green':
                return { bg: colors.successSoft, color: colors.success, label: 'Stable' };
        }
    };

    // ========================================================================
    // ACTIVE EMERGENCY BANNER
    // ========================================================================

    const renderActiveEmergency = () => {
        if (!activeEmergency) return null;

        const triage = getTriageStyle(activeEmergency.triageLevel);

        return (
            <TouchableOpacity
                style={[styles.emergencyBanner, { backgroundColor: triage.bg }]}
                onPress={() => router.push('/(provider)/active-job')}
            >
                <View style={styles.emergencyHeader}>
                    <View style={[styles.triageBadge, { backgroundColor: triage.color }]}>
                        <Text style={styles.triageBadgeText}>{triage.label}</Text>
                    </View>
                    <Text style={[styles.emergencyTime, { color: triage.color }]}>
                        {activeEmergency.estimatedTime} min away
                    </Text>
                </View>
                <Text style={[styles.emergencyType, { color: triage.color }]}>
                    {activeEmergency.type}
                </Text>
                <Text style={styles.emergencyLocation}>{activeEmergency.location}</Text>
                <View style={styles.emergencyAction}>
                    <Text style={[styles.emergencyActionText, { color: triage.color }]}>
                        Tap to view details
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={triage.color} />
                </View>
            </TouchableOpacity>
        );
    };

    // ========================================================================
    // STATS SECTION
    // ========================================================================

    const renderStats = () => (
        <View style={styles.statsGrid}>
            <View style={styles.statCard}>
                <Ionicons name="pulse" size={24} color={colors.danger} />
                <Text style={styles.statValue}>{stats.todayEmergencies}</Text>
                <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={styles.statCard}>
                <Ionicons name="calendar" size={24} color={colors.primary} />
                <Text style={styles.statValue}>{stats.weeklyEmergencies}</Text>
                <Text style={styles.statLabel}>This Week</Text>
            </View>
            <View style={styles.statCard}>
                <Ionicons name="timer" size={24} color={colors.success} />
                <Text style={styles.statValue}>{stats.avgResponseTime}m</Text>
                <Text style={styles.statLabel}>Avg Response</Text>
            </View>
            <View style={styles.statCard}>
                <Ionicons name="star" size={24} color={colors.warning} />
                <Text style={styles.statValue}>{stats.rating}</Text>
                <Text style={styles.statLabel}>Rating</Text>
            </View>
        </View>
    );

    // ========================================================================
    // CERTIFICATION STATUS
    // ========================================================================

    const renderCertificationStatus = () => {
        const isExpiring = stats.certificationStatus === 'expiring_soon';
        const isExpired = stats.certificationStatus === 'expired';

        return (
            <View style={[
                styles.certCard,
                isExpired && styles.certCardDanger,
                isExpiring && styles.certCardWarning,
            ]}>
                <View style={styles.certHeader}>
                    <Ionicons
                        name={isExpired ? 'warning' : isExpiring ? 'time' : 'shield-checkmark'}
                        size={24}
                        color={isExpired ? colors.danger : isExpiring ? colors.warning : colors.success}
                    />
                    <Text style={styles.certTitle}>Certification Status</Text>
                </View>

                {stats.nextExpiringCert && (
                    <Text style={[
                        styles.certMessage,
                        isExpiring && styles.certMessageWarning,
                    ]}>
                        {stats.nextExpiringCert.name} expires in {stats.nextExpiringCert.daysUntil} days
                    </Text>
                )}

                <TouchableOpacity
                    style={styles.certButton}
                    onPress={() => router.push('/(provider)/medical-onboarding')}
                >
                    <Text style={styles.certButtonText}>View Certifications</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
            </View>
        );
    };

    // ========================================================================
    // RECENT CASES
    // ========================================================================

    const renderRecentCases = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Cases</Text>

            {MOCK_RECENT_CASES.map(caseItem => {
                const triage = getTriageStyle(caseItem.triageLevel);
                return (
                    <View key={caseItem.id} style={styles.caseCard}>
                        <View style={styles.caseHeader}>
                            <View style={[styles.caseTriage, { backgroundColor: triage.bg }]}>
                                <View style={[styles.caseTriageDot, { backgroundColor: triage.color }]} />
                            </View>
                            <View style={styles.caseInfo}>
                                <Text style={styles.caseType}>{caseItem.type}</Text>
                                <Text style={styles.caseDate}>
                                    {formatRelativeTime(caseItem.date)}
                                </Text>
                            </View>
                            <View style={[
                                styles.caseOutcome,
                                caseItem.outcome === 'transported' && styles.caseOutcomeTransported,
                            ]}>
                                <Text style={[
                                    styles.caseOutcomeText,
                                    caseItem.outcome === 'transported' && styles.caseOutcomeTextTransported,
                                ]}>
                                    {caseItem.outcome === 'transported' ? 'Transported' : 'Treated'}
                                </Text>
                            </View>
                        </View>

                        {caseItem.hospital && (
                            <View style={styles.caseHospital}>
                                <Ionicons name="business" size={14} color={colors.textMuted} />
                                <Text style={styles.caseHospitalText}>{caseItem.hospital}</Text>
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );

    // ========================================================================
    // QUICK ACTIONS
    // ========================================================================

    const renderQuickActions = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>

            <View style={styles.actionsGrid}>
                <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(provider)/requests')}>
                    <Ionicons name="list" size={28} color={colors.primary} />
                    <Text style={styles.actionLabel}>Requests</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert('Coming Soon', 'Hospital directory feature is coming soon.')}>
                    <Ionicons name="business" size={28} color={colors.info} />
                    <Text style={styles.actionLabel}>Hospitals</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(provider)/earnings')}>
                    <Ionicons name="wallet" size={28} color={colors.success} />
                    <Text style={styles.actionLabel}>Earnings</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert('Coming Soon', 'Medical supplies ordering is coming soon.')}>
                    <Ionicons name="medkit" size={28} color={colors.danger} />
                    <Text style={styles.actionLabel}>Supplies</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.emtBadge}>
                        <Ionicons name="medical" size={16} color={colors.textOnPrimary} />
                        <Text style={styles.emtBadgeText}>EMT</Text>
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Medical Dashboard</Text>
                        <Text style={styles.headerSubtitle}>
                            {EMT_LEVELS[emtLevel]} • Nairobi
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[
                        styles.onlineToggle,
                        isOnline ? styles.onlineToggleActive : styles.onlineToggleInactive,
                    ]}
                    onPress={toggleOnlineStatus}
                >
                    <View style={[
                        styles.onlineDot,
                        isOnline ? styles.onlineDotActive : styles.onlineDotInactive,
                    ]} />
                    <Text style={[
                        styles.onlineText,
                        isOnline ? styles.onlineTextActive : styles.onlineTextInactive,
                    ]}>
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
                }
            >
                {/* Active Emergency Banner */}
                {renderActiveEmergency()}

                {/* Waiting for Emergency */}
                {!activeEmergency && isOnline && (
                    <View style={styles.waitingCard}>
                        <Ionicons name="radio" size={32} color={colors.primary} />
                        <Text style={styles.waitingTitle}>Ready for Dispatch</Text>
                        <Text style={styles.waitingText}>
                            You will be notified when an emergency matches your skills.
                        </Text>
                    </View>
                )}

                {/* Offline Message */}
                {!isOnline && (
                    <View style={styles.offlineCard}>
                        <Ionicons name="pause-circle" size={32} color={colors.textMuted} />
                        <Text style={styles.offlineTitle}>You're Offline</Text>
                        <Text style={styles.offlineText}>
                            Go online to receive emergency dispatch requests.
                        </Text>
                    </View>
                )}

                {/* Stats */}
                {renderStats()}

                {/* Certification Status */}
                {renderCertificationStatus()}

                {/* Quick Actions */}
                {renderQuickActions()}

                {/* Recent Cases */}
                {renderRecentCases()}
            </ScrollView>
        </View>
    );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const EMT_LEVELS: Record<KenyaEMTLevel, string> = {
    first_responder: 'First Responder',
    emt_basic: 'EMT Basic',
    emt_intermediate: 'EMT Intermediate',
    emt_paramedic: 'Paramedic',
};

function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: spacing.md,
        backgroundColor: colors.surface,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    emtBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.danger,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radii.md,
        gap: spacing.xs,
    },
    emtBadgeText: {
        ...typo.caption,
        color: colors.textOnPrimary,
        fontWeight: '700',
    },
    headerTitle: {
        ...typo.h3,
        color: colors.textPrimary,
    },
    headerSubtitle: {
        ...typo.caption,
        color: colors.textSecondary,
    },
    onlineToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.full,
        gap: spacing.xs,
    },
    onlineToggleActive: {
        backgroundColor: colors.successSoft,
    },
    onlineToggleInactive: {
        backgroundColor: colors.surfaceAlt,
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    onlineDotActive: {
        backgroundColor: colors.success,
    },
    onlineDotInactive: {
        backgroundColor: colors.textMuted,
    },
    onlineText: {
        ...typo.caption,
        fontWeight: '700',
    },
    onlineTextActive: {
        color: colors.success,
    },
    onlineTextInactive: {
        color: colors.textMuted,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    emergencyBanner: {
        borderRadius: radii.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    emergencyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    triageBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radii.sm,
    },
    triageBadgeText: {
        ...typo.caption,
        color: colors.textOnPrimary,
        fontWeight: '700',
    },
    emergencyTime: {
        ...typo.bodyBold,
    },
    emergencyType: {
        ...typo.h3,
        marginBottom: spacing.xs,
    },
    emergencyLocation: {
        ...typo.body,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    emergencyAction: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    emergencyActionText: {
        ...typo.caption,
        fontWeight: '600',
    },
    waitingCard: {
        backgroundColor: colors.primarySoft,
        borderRadius: radii.lg,
        padding: spacing.lg,
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    waitingTitle: {
        ...typo.h4,
        color: colors.primary,
        marginTop: spacing.sm,
    },
    waitingText: {
        ...typo.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    offlineCard: {
        backgroundColor: colors.surfaceAlt,
        borderRadius: radii.lg,
        padding: spacing.lg,
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    offlineTitle: {
        ...typo.h4,
        color: colors.textSecondary,
        marginTop: spacing.sm,
    },
    offlineText: {
        ...typo.body,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -spacing.xs,
        marginBottom: spacing.md,
    },
    statCard: {
        width: '48%',
        margin: '1%',
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.md,
        alignItems: 'center',
    },
    statValue: {
        ...typo.h2,
        color: colors.textPrimary,
        marginTop: spacing.xs,
    },
    statLabel: {
        ...typo.caption,
        color: colors.textSecondary,
    },
    certCard: {
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    certCardWarning: {
        borderWidth: 1,
        borderColor: colors.warning,
    },
    certCardDanger: {
        borderWidth: 1,
        borderColor: colors.danger,
    },
    certHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    certTitle: {
        ...typo.bodyBold,
        color: colors.textPrimary,
    },
    certMessage: {
        ...typo.small,
        color: colors.textSecondary,
        marginTop: spacing.sm,
    },
    certMessageWarning: {
        color: colors.warning,
    },
    certButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    certButtonText: {
        ...typo.caption,
        color: colors.primary,
        fontWeight: '600',
    },
    section: {
        marginBottom: spacing.md,
    },
    sectionTitle: {
        ...typo.h3,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -spacing.xs,
    },
    actionCard: {
        width: '23%',
        margin: '1%',
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.md,
        alignItems: 'center',
    },
    actionLabel: {
        ...typo.caption,
        color: colors.textSecondary,
        marginTop: spacing.xs,
        textAlign: 'center',
    },
    caseCard: {
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    caseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    caseTriage: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    caseTriageDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    caseInfo: {
        flex: 1,
    },
    caseType: {
        ...typo.bodyBold,
        color: colors.textPrimary,
    },
    caseDate: {
        ...typo.caption,
        color: colors.textMuted,
    },
    caseOutcome: {
        backgroundColor: colors.surfaceAlt,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radii.sm,
    },
    caseOutcomeTransported: {
        backgroundColor: colors.primarySoft,
    },
    caseOutcomeText: {
        ...typo.caption,
        color: colors.textSecondary,
    },
    caseOutcomeTextTransported: {
        color: colors.primary,
    },
    caseHospital: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
        paddingLeft: 36,
    },
    caseHospitalText: {
        ...typo.caption,
        color: colors.textMuted,
        marginLeft: spacing.xs,
    },
});
