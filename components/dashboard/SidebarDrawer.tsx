// ResQ Kenya — Sidebar Drawer (extracted from Home screen)
//
// Phase 4 (audit-v2 §N-HIGH-5) — Replaced hardcoded identity and wallet
// balance with the real authenticated user and a live wallet
// subscription. The pre-fix file rendered 'JM' avatar / 'John Mwangi' /
// 'KES 2,450' as literal strings so every customer saw the same fake
// identity. That single bug destroyed trust in the wallet feature and
// suggested the customer was signed into the wrong account.
//
// All visual layout, typography, spacing and animations are unchanged
// — this is a pure data-source swap (Frontend-UI-Engineering: "data
// changes, not visual changes").

import React, { useRef, useEffect, useMemo, useState } from 'react';
import {
    View, Text, StyleSheet, Pressable, ScrollView, Animated,
    Modal, Platform,
} from 'react-native';
import { router } from 'expo-router';
import {
    X, ChevronRight, Zap, Star, LogOut, Shield, Crown,
    Wallet as WalletIcon, Car, History, ShieldAlert,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../../theme/voltage-premium';
import { useAuth } from '../../services/AuthContext';
import { subscribeToWalletBalance } from '../../services/customer.service';
import { deriveInitials, formatWalletBalance } from './SidebarDrawer.helpers';

interface SidebarDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SidebarDrawer({ isOpen, onClose }: SidebarDrawerProps) {
    const { user } = useAuth();
    const [walletBalance, setWalletBalance] = useState<number | null>(null);

    // Live wallet subscription. Re-subscribe whenever the user.id
    // changes (sign-out → sign-in flow). The Firestore rule
    // (firestore.rules:137-139) is `isOwner(userId)`, so the read is
    // automatically scoped to the right doc.
    useEffect(() => {
        if (!user?.id) {
            setWalletBalance(null);
            return undefined;
        }
        const unsubscribe = subscribeToWalletBalance(user.id, (balance) => {
            setWalletBalance(balance);
        });
        return unsubscribe;
    }, [user?.id]);

    // Display strings are derived from the real auth state. `useMemo`
    // avoids recomputing on every animation tick of the drawer slide.
    const displayName = useMemo(() => {
        const raw = user?.displayName?.trim();
        return raw && raw.length > 0 ? raw : 'ResQ Customer';
    }, [user?.displayName]);
    const initials = useMemo(() => deriveInitials(user?.displayName), [user?.displayName]);
    const walletSublabel = useMemo(
        () => (walletBalance === null ? 'KES —' : formatWalletBalance(walletBalance)),
        [walletBalance]
    );

    // Nav items live inside the component now because the wallet
    // sublabel is dynamic. Routes and icons are unchanged from the
    // pre-fix file.
    const navItems = useMemo(
        () => [
            { icon: WalletIcon, label: 'ResQ Wallet', sublabel: walletSublabel, route: '/(customer)/wallet' as const },
            { icon: Car, label: 'My Garage', sublabel: 'Digital Glovebox', route: '/(customer)/profile' as const },
            { icon: History, label: 'Service History', sublabel: undefined, route: '/(customer)/history' as const },
            { icon: ShieldAlert, label: 'Emergency Safety Hub', sublabel: undefined, route: '/(customer)/help' as const },
        ],
        [walletSublabel]
    );

    const slideAnim = useRef(new Animated.Value(-280)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isOpen) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 180,
                    friction: 12,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: -280,
                    tension: 180,
                    friction: 12,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isOpen]);

    return (
        <Modal visible={isOpen} transparent animationType="none" onRequestClose={onClose}>
            <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>
            <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View style={styles.brandRow}>
                            <View style={styles.brandIcon}>
                                <Zap size={16} color={colors.background.primary} strokeWidth={3} fill={colors.background.primary} />
                            </View>
                            <Text style={styles.brandName}>ResQ</Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeBtn}
                            accessibilityLabel="Close menu" accessibilityRole="button">
                            <X size={20} color={colors.text.secondary} strokeWidth={2} />
                        </Pressable>
                    </View>

                    {/* User Profile — Phase 4 (audit-v2 §N-HIGH-5):
                        identity is now derived from the authenticated
                        user. Safety Rating shows the stable "—" glyph
                        until a real per-user rating field exists on
                        `users/{uid}` (current rule allow-list does not
                        include it). */}
                    <View style={styles.userProfile}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
                            <View style={styles.ratingRow}>
                                <Star size={14} color={colors.voltage} fill={colors.voltage} />
                                <Text style={styles.ratingValue}>—</Text>
                                <Text style={styles.ratingLabel}>Safety Rating</Text>
                            </View>
                        </View>
                    </View>
                    <Pressable
                        onPress={() => { onClose(); router.push('/(customer)/profile'); }}
                        style={styles.viewProfileLink}
                        accessibilityLabel="View profile" accessibilityRole="button">
                        <Text style={styles.viewProfileText}>View Profile</Text>
                        <ChevronRight size={14} color={colors.text.secondary} />
                    </Pressable>
                </View>

                {/* Nav Items */}
                <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
                    {navItems.map((item) => (
                        <Pressable key={item.label}
                            style={({ pressed }) => [styles.navItem, pressed && { backgroundColor: `${colors.voltage}0F` }]}
                            onPress={() => { onClose(); router.push(item.route as any); }}
                            accessibilityLabel={item.label} accessibilityRole="button">
                            <View style={styles.navItemLeft}>
                                <View style={styles.navIconWrap}>
                                    <item.icon size={20} color={colors.voltage} strokeWidth={2} />
                                </View>
                                <View>
                                    <Text style={styles.navLabel}>{item.label}</Text>
                                    {item.sublabel && (
                                        <Text style={styles.navSublabel}>{item.sublabel}</Text>
                                    )}
                                </View>
                            </View>
                            <ChevronRight size={16} color={colors.text.tertiary} />
                        </Pressable>
                    ))}
                </ScrollView>

                {/* ResQ Premium CTA */}
                <View style={styles.ctaBanner}>
                    <View style={styles.ctaGlow} />
                    <Crown size={20} color={colors.background.primary} strokeWidth={2.5} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.ctaTitle}>ResQ Premium</Text>
                        <Text style={styles.ctaSub}>Priority dispatch & free tows</Text>
                    </View>
                    <Shield size={16} color={colors.background.primary} />
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Pressable style={styles.logoutBtn}
                        accessibilityLabel="Sign out" accessibilityRole="button">
                        <LogOut size={18} color={colors.status.error} strokeWidth={2} />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </Pressable>
                    <Text style={styles.versionText}>ResQ Kenya v2.0 · Nairobi</Text>
                </View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.overlay.medium,
    },
    drawer: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 280,
        backgroundColor: colors.background.primary,
        borderRightWidth: 1,
        borderRightColor: colors.background.border,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        borderBottomWidth: 1,
        borderBottomColor: colors.background.border,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    brandIcon: {
        width: 32,
        height: 32,
        borderRadius: borderRadius.md,
        backgroundColor: colors.voltage,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandName: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.text.primary,
        letterSpacing: -0.5,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md - 4,
        padding: spacing.sm,
        borderRadius: borderRadius.xl,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.background.tertiary,
        borderWidth: 1,
        borderColor: colors.charcoal[500],
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.text.primary,
    },
    userName: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.text.primary,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: 2,
    },
    ratingValue: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.voltage,
    },
    ratingLabel: {
        fontSize: 11,
        color: colors.text.secondary,
        marginLeft: 2,
    },
    viewProfileLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: spacing.md - 4,
        paddingLeft: spacing.sm,
    },
    viewProfileText: {
        fontSize: 13,
        color: colors.text.secondary,
        fontWeight: typography.fontWeight.medium as any,
    },
    navList: {
        flex: 1,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.xs,
    },
    navItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md - 4,
    },
    navIconWrap: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.lg,
        backgroundColor: `${colors.voltage}1A`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navLabel: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold as any,
        color: colors.text.primary,
    },
    navSublabel: {
        fontSize: 11,
        color: colors.text.tertiary,
        marginTop: 1,
    },
    ctaBanner: {
        marginHorizontal: spacing.md - 4,
        marginBottom: spacing.sm,
        padding: spacing.md,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.voltage,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md - 4,
        overflow: 'hidden',
    },
    ctaGlow: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.text.opacity20,
    },
    ctaTitle: {
        fontSize: 13,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.text.onBrand,
    },
    ctaSub: {
        fontSize: 11,
        color: colors.background.primary,
        opacity: 0.65,
        marginTop: 1,
    },
    footer: {
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.background.border,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md - 4,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.xl,
    },
    logoutText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium as any,
        color: colors.status.error,
    },
    versionText: {
        textAlign: 'center',
        fontSize: 10,
        color: colors.text.tertiary,
        marginTop: spacing.md,
    },
});
