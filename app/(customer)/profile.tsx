// ⚡ ResQ Kenya - Digital Glovebox & Account Hub
// Garage Management, System Settings, Urgency Banner
// Phase 2.5 UI Enhancement

import React, { useRef, useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, Pressable, ScrollView, Animated,
    Easing, Platform, Switch
} from 'react-native';
import { router } from 'expo-router';
import {
    ArrowLeft, Camera, User, CreditCard, Crown, Phone,
    HeartPulse, HelpCircle, Headphones, FileText, Info,
    LogOut, ChevronRight, Edit2, Shield, Car, Trash2,
    Fingerprint, Globe, Bell, AlertTriangle
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../../theme/voltage-premium';
import { StatusBar } from 'expo-status-bar';

// ============================================================================
// SECTION HEADER
// ============================================================================
const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionLabel}>{title}</Text>
);

// ============================================================================
// MENU ITEM
// ============================================================================
interface MenuItemProps {
    icon: any;
    label: string;
    sublabel?: string;
    sublabelColor?: string;
    sublabelMono?: boolean;
    badge?: string;
    badgeColor?: string;
    badgeTextColor?: string;
    iconColor?: string;
    isLast?: boolean;
    onPress?: () => void;
    rightElement?: React.ReactNode;
}

const MenuItem = ({
    icon: Icon,
    label,
    sublabel,
    sublabelColor = colors.text.tertiary,
    sublabelMono = false,
    badge,
    badgeColor = colors.charcoal[700],
    badgeTextColor = colors.text.secondary,
    iconColor = colors.voltage,
    isLast = false,
    onPress,
    rightElement,
}: MenuItemProps) => (
    <Pressable
        onPress={onPress}
        style={({ pressed }) => [
            styles.menuItem,
            !isLast && styles.menuItemBorder,
            pressed && { backgroundColor: 'rgba(255,165,0,0.04)' },
        ]}
        accessibilityLabel={label}
        accessibilityRole="button"
    >
        <View style={styles.menuItemLeft}>
            <View style={styles.menuItemIconWrap}>
                <Icon size={20} color={iconColor} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
                <View style={styles.menuItemLabelRow}>
                    <Text style={styles.menuItemLabel}>{label}</Text>
                    {badge && (
                        <View style={[styles.menuItemBadge, { backgroundColor: badgeColor }]}>
                            <Text style={[styles.menuItemBadgeText, { color: badgeTextColor }]}>{badge}</Text>
                        </View>
                    )}
                </View>
                {sublabel && (
                    <Text style={[
                        styles.menuItemSublabel,
                        { color: sublabelColor },
                        sublabelMono && styles.monoText,
                    ]}>{sublabel}</Text>
                )}
            </View>
        </View>
        {rightElement || <ChevronRight size={20} color={colors.text.tertiary} strokeWidth={2} />}
    </Pressable>
);

// ============================================================================
// TOGGLE ITEM
// ============================================================================
const ToggleItem = ({
    icon: Icon,
    label,
    sublabel,
    value,
    onValueChange,
    iconColor = colors.voltage,
    isLast = false,
}: {
    icon: any;
    label: string;
    sublabel?: string;
    value: boolean;
    onValueChange: (v: boolean) => void;
    iconColor?: string;
    isLast?: boolean;
}) => (
    <View style={[styles.menuItem, !isLast && styles.menuItemBorder]}>
        <View style={styles.menuItemLeft}>
            <View style={styles.menuItemIconWrap}>
                <Icon size={20} color={iconColor} strokeWidth={2} />
            </View>
            <View>
                <Text style={styles.menuItemLabel}>{label}</Text>
                {sublabel && (
                    <Text style={[styles.menuItemSublabel, { color: colors.text.tertiary }]}>{sublabel}</Text>
                )}
            </View>
        </View>
        <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: colors.charcoal[700], true: `${colors.voltage}80` }}
            thumbColor={value ? colors.voltage : colors.charcoal[500]}
            ios_backgroundColor={colors.charcoal[700]}
        />
    </View>
);

// ============================================================================
// MEMBERSHIP BADGE TOKEN
// ============================================================================
const MEMBERSHIP_TIERS: Record<string, { bg: string; text: string; border: string }> = {
    Basic: { bg: colors.charcoal[700], text: colors.text.secondary, border: colors.charcoal[600] },
    Gold: { bg: 'rgba(255, 165, 0, 0.15)', text: colors.voltage, border: 'rgba(255, 165, 0, 0.3)' },
    Platinum: { bg: 'rgba(160, 160, 160, 0.15)', text: '#C0C0C0', border: 'rgba(192, 192, 192, 0.3)' },
};

// ============================================================================
// PROFILE SCREEN → ACCOUNT HUB
// ============================================================================
export default function AccountHubScreen() {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    // System Settings state
    const [biometricEnabled, setBiometricEnabled] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // Current membership
    const membershipTier = 'Basic';
    const tierStyle = MEMBERSHIP_TIERS[membershipTier];

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <Animated.View style={[styles.wrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        onPress={() => router.back()}
                        style={({ pressed }) => [styles.headerButton, pressed && { transform: [{ scale: 0.95 }], backgroundColor: 'rgba(255,165,0,0.08)' }]}
                        accessibilityLabel="Go back"
                        accessibilityRole="button"
                    >
                        <ArrowLeft size={20} color={colors.voltage} strokeWidth={2} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Account</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Profile Header Card */}
                    <View style={styles.profileCard}>
                        {/* Centered Avatar */}
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <View style={styles.avatarInner}>
                                    <Text style={styles.avatarText}>JM</Text>
                                </View>
                            </View>
                            <Pressable
                                style={styles.cameraButton}
                                accessibilityLabel="Change profile photo"
                                accessibilityRole="button"
                            >
                                <Camera size={16} color={colors.background.primary} strokeWidth={2.5} />
                            </Pressable>
                        </View>

                        <Text style={styles.userName}>John Mwangi</Text>
                        <Text style={styles.userPhone}>+254 712 345 678</Text>

                        {/* Membership Badge */}
                        <View style={[styles.membershipBadge, {
                            backgroundColor: tierStyle.bg,
                            borderColor: tierStyle.border,
                        }]}>
                            <Crown size={14} color={tierStyle.text} strokeWidth={2} />
                            <Text style={[styles.membershipText, { color: tierStyle.text }]}>
                                {membershipTier} Member
                            </Text>
                        </View>

                        <Pressable
                            style={({ pressed }) => [
                                styles.editProfileButton,
                                pressed && { backgroundColor: `${colors.voltage}15` }
                            ]}
                            accessibilityLabel="Edit profile"
                            accessibilityRole="button"
                        >
                            <Edit2 size={14} color={colors.voltage} strokeWidth={2} />
                            <Text style={styles.editProfileText}>Edit Profile</Text>
                        </Pressable>
                    </View>

                    {/* ============================================================ */}
                    {/* URGENCY BANNER */}
                    {/* ============================================================ */}
                    <Pressable style={styles.urgencyBanner} accessibilityRole="button">
                        <View style={styles.urgencyIconWrap}>
                            <AlertTriangle size={18} color={colors.status.info} strokeWidth={2} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.urgencyText}>
                                Complete your Medical Profile for faster Ambulance dispatch.
                            </Text>
                        </View>
                        <ChevronRight size={16} color={colors.status.info} />
                    </Pressable>

                    {/* ============================================================ */}
                    {/* GARAGE MANAGEMENT */}
                    {/* ============================================================ */}
                    <View style={styles.sectionBlock}>
                        <SectionHeader title="Garage Management" />
                        <View style={styles.menuList}>
                            <MenuItem
                                icon={Car}
                                label="My Vehicles"
                                sublabel="Toyota Prado · KBZ 123A"
                                sublabelMono
                                badge="2 saved"
                                badgeColor={colors.voltage}
                                badgeTextColor={colors.background.primary}
                                onPress={() => router.push('/(customer)/vehicles')}
                            />
                            <MenuItem
                                icon={Phone}
                                label="Emergency Contacts"
                                sublabel="Next of Kin"
                                iconColor="#FF3D3D"
                                badge="3 added"
                                badgeColor="rgba(0, 230, 118, 0.2)"
                                badgeTextColor="#00E676"
                                isLast
                            />
                        </View>
                    </View>

                    {/* ============================================================ */}
                    {/* SYSTEM SETTINGS */}
                    {/* ============================================================ */}
                    <View style={styles.sectionBlock}>
                        <SectionHeader title="System Settings" />
                        <View style={styles.menuList}>
                            <ToggleItem
                                icon={Fingerprint}
                                label="Biometric Login"
                                sublabel="Face ID / Fingerprint"
                                value={biometricEnabled}
                                onValueChange={setBiometricEnabled}
                            />
                            <MenuItem
                                icon={Globe}
                                label="Language"
                                sublabel="English (KE)"
                            />
                            <ToggleItem
                                icon={Bell}
                                label="Notifications"
                                sublabel="Push & SMS alerts"
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                isLast
                            />
                        </View>
                    </View>

                    {/* ============================================================ */}
                    {/* SUPPORT */}
                    {/* ============================================================ */}
                    <View style={styles.sectionBlock}>
                        <SectionHeader title="Support" />
                        <View style={styles.menuList}>
                            <MenuItem
                                icon={HelpCircle}
                                label="Help Center"
                                onPress={() => router.push('/(customer)/help')}
                            />
                            <MenuItem
                                icon={Headphones}
                                label="Contact Support"
                                sublabel="24/7 available"
                                sublabelColor="#00E676"
                                onPress={() => router.push('/(customer)/help')}
                            />
                            <MenuItem
                                icon={FileText}
                                label="Terms & Privacy"
                                onPress={() => router.push('/(customer)/terms')}
                            />
                            <MenuItem
                                icon={Info}
                                label="About ResQ"
                                sublabel="Version 2.5.0"
                                isLast
                            />
                        </View>
                    </View>

                    {/* ============================================================ */}
                    {/* BOTTOM ACTIONS */}
                    {/* ============================================================ */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.logoutButton,
                            pressed && { backgroundColor: 'rgba(255, 255, 255, 0.06)', transform: [{ scale: 0.98 }] }
                        ]}
                        onPress={() => router.replace('/')}
                        accessibilityLabel="Sign out"
                        accessibilityRole="button"
                    >
                        <LogOut size={20} color="#FFFFFF" strokeWidth={2} />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.deleteButton,
                            pressed && { backgroundColor: 'rgba(255, 61, 61, 0.12)', transform: [{ scale: 0.98 }] }
                        ]}
                        accessibilityLabel="Delete account"
                        accessibilityRole="button"
                    >
                        <Trash2 size={20} color="#FF3D3D" strokeWidth={2} />
                        <Text style={styles.deleteText}>Delete Account</Text>
                    </Pressable>
                </ScrollView>
            </Animated.View>
        </View>
    );
}

// ============================================================================
// STYLES — 4px base grid enforcement
// ============================================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    wrapper: { flex: 1 },

    // Header
    header: {
        height: 60,
        paddingHorizontal: spacing.lg, // 16px
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
        padding: spacing.lg, // 16px
        paddingBottom: spacing.xl * 2,
    },

    // Profile Card
    profileCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius['2xl'],
        borderWidth: 1,
        borderColor: colors.background.border,
        padding: spacing.lg, // 16px (4px × 4)
        alignItems: 'center',
        marginBottom: spacing.lg,
        overflow: 'hidden',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: spacing.md, // 12px (4px × 3)
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: colors.voltage,
        padding: 2,
    },
    avatarInner: {
        width: '100%',
        height: '100%',
        borderRadius: 38,
        backgroundColor: colors.charcoal[800],
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text.primary,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.voltage,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.background.secondary,
    },
    userName: {
        fontSize: typography.fontSize.xl,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 4, // 4px grid
    },
    userPhone: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        marginBottom: 8, // 4px × 2
    },
    membershipBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12, // 4px × 3
        paddingVertical: 6,
        borderRadius: borderRadius.full,
        borderWidth: 1,
    },
    membershipText: {
        fontSize: typography.fontSize.xs,
        fontWeight: '600',
    },
    editProfileButton: {
        marginTop: spacing.md, // 12px
        height: 40,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: `${colors.voltage}50`,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    editProfileText: {
        fontSize: typography.fontSize.sm,
        fontWeight: '700',
        color: colors.voltage,
    },

    // Urgency Banner
    urgencyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, // 4px × 3
        backgroundColor: 'rgba(41, 182, 246, 0.12)', // status.infoGlow
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: 'rgba(41, 182, 246, 0.25)',
        padding: 16, // 4px × 4
        marginBottom: spacing.lg,
    },
    urgencyIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(41, 182, 246, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    urgencyText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#29B6F6', // status.info
        lineHeight: 18,
    },

    // Section block
    sectionBlock: {
        marginBottom: spacing.lg, // 16px
    },
    sectionLabel: {
        fontSize: typography.fontSize.base,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.md, // 12px
        paddingLeft: 4, // 4px grid
    },
    menuList: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius['2xl'],
        borderWidth: 1,
        borderColor: colors.background.border,
        overflow: 'hidden',
    },

    // Menu item — 4px grid padding
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16, // 4px × 4
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.background.border,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, // 4px × 3
        flex: 1,
    },
    menuItemIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12, // 4px × 3
        backgroundColor: colors.charcoal[800],
        borderWidth: 1,
        borderColor: colors.background.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuItemLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // 4px × 2
    },
    menuItemLabel: {
        fontSize: typography.fontSize.base,
        fontWeight: '500',
        color: colors.text.primary,
        fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
    },
    menuItemBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    menuItemBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    menuItemSublabel: {
        fontSize: typography.fontSize.xs,
        marginTop: 2,
        fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
    },
    monoText: {
        fontFamily: Platform.OS === 'ios' ? 'JetBrains Mono' : 'monospace',
        letterSpacing: 0.5,
    },

    // Bottom actions
    logoutButton: {
        width: '100%',
        height: 56,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        borderRadius: borderRadius.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        marginBottom: 12, // 4px × 3
    },
    logoutText: {
        fontSize: typography.fontSize.base,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    deleteButton: {
        width: '100%',
        height: 56,
        borderWidth: 2,
        borderColor: '#FF3D3D',
        borderRadius: borderRadius.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    deleteText: {
        fontSize: typography.fontSize.base,
        fontWeight: '700',
        color: '#FF3D3D',
    },
});
