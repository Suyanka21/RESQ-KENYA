// ⚡ ResQ Kenya - Entry Point (Bolt-Inspired)
// Dual state: Landing Page (logged out) / Splash Screen (logged in)

import React, { useRef, useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, Pressable, Animated, Easing,
    SafeAreaView, Platform, Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { Zap } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../services/AuthContext';
import { colors, spacing } from '../theme/voltage-premium';

const { width, height } = Dimensions.get('window');

// Brand Colors — Bolt-inspired
const VOLTAGE = colors.voltage;
const CHARCOAL = colors.background.primary;
const WHITE = colors.text.primary;

// =============================================================================
// SPLASH SCREEN (Logged In / Loading)
// =============================================================================

function SplashScreen() {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;
    const { isAuthenticated, isLoading, userRole } = useAuth();
    const [hasNavigated, setHasNavigated] = useState(false);

    // Pulse animation on logo
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.08,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // Phase 4 fix: navigate only AFTER auth has settled (`isLoading === false`)
    // and the splash has shown for at least 1.5s. The previous version fired
    // a fixed 1.5s timer which could navigate before `userRole` resolved,
    // sending authenticated providers to the customer stack momentarily.
    useEffect(() => {
        if (hasNavigated) return;
        if (isLoading) return;

        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 0,
                    tension: 180,
                    friction: 12,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 400,
                    easing: Easing.in(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setHasNavigated(true);
                if (isAuthenticated && userRole === 'provider') {
                    router.replace('/(provider)');
                } else if (isAuthenticated) {
                    router.replace('/(customer)');
                } else {
                    // Auth resolved as logged-out while splash was visible.
                    router.replace('/(auth)/login');
                }
            });
        }, 1500);

        return () => clearTimeout(timer);
    }, [isAuthenticated, isLoading, userRole, hasNavigated, scaleAnim, opacityAnim]);

    return (
        <View style={styles.splashContainer}>
            <StatusBar style="dark" />
            <Animated.View
                style={[
                    styles.splashContent,
                    {
                        transform: [{ scale: scaleAnim }],
                        opacity: opacityAnim,
                    },
                ]}
            >
                {/* Logo with Pulse */}
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <View style={styles.logoColumn}>
                        <Text style={styles.logoText}>RESQ</Text>
                        <Zap size={32} color={CHARCOAL} strokeWidth={2.5} fill={CHARCOAL} />
                    </View>
                </Animated.View>
            </Animated.View>
        </View>
    );
}

// =============================================================================
// LANDING PAGE (Logged Out)
// =============================================================================

function LandingPage() {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(40)).current;
    const buttonAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Staggered entrance
        Animated.sequence([
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(slideUpAnim, {
                    toValue: 0,
                    duration: 600,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]),
            Animated.spring(buttonAnim, {
                toValue: 1,
                friction: 8,
                tension: 80,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <View style={styles.landingContainer}>
            <StatusBar style="dark" />
            <SafeAreaView style={styles.landingSafe}>
                {/* Spacer — push logo to center */}
                <View style={styles.topSpacer} />

                {/* Logo — centered */}
                <Animated.View
                    style={[
                        styles.landingLogoArea,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }],
                        },
                    ]}
                >
                    <View style={styles.logoColumn}>
                        <Text style={styles.logoText}>RESQ</Text>
                        <Zap size={32} color={CHARCOAL} strokeWidth={2.5} fill={CHARCOAL} />
                    </View>
                </Animated.View>

                {/* Spacer — push button to bottom */}
                <View style={styles.bottomSpacer} />

                {/* Bottom CTA Area */}
                <Animated.View
                    style={[
                        styles.landingBottom,
                        {
                            opacity: buttonAnim,
                            transform: [{
                                translateY: buttonAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [30, 0],
                                }),
                            }],
                        },
                    ]}
                >
                    {/* Get Started Button */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.getStartedButton,
                            pressed && styles.getStartedButtonPressed,
                        ]}
                        onPress={() => router.push('/(auth)/register')}
                        accessibilityLabel="Get started with ResQ"
                        accessibilityRole="button"
                    >
                        <Text style={styles.getStartedText}>Get Started</Text>
                    </Pressable>

                    {/* Sign In / Sign Up Links */}
                    <View style={styles.linksRow}>
                        <Pressable
                            onPress={() => router.push('/(auth)/login')}
                            hitSlop={{ top: 12, bottom: 12, left: spacing.md, right: spacing.md }}
                            accessibilityLabel="Sign in to existing account"
                            accessibilityRole="button"
                        >
                            <Text style={styles.linkText}>Sign In</Text>
                        </Pressable>

                        <View style={styles.linkDot} />

                        <Pressable
                            onPress={() => router.push('/(auth)/register')}
                            hitSlop={{ top: 12, bottom: 12, left: spacing.md, right: spacing.md }}
                            accessibilityLabel="Create a new account"
                            accessibilityRole="button"
                        >
                            <Text style={styles.linkText}>Sign Up</Text>
                        </Pressable>
                    </View>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
}

// =============================================================================
// ROOT COMPONENT — branches on auth state
// =============================================================================

export default function EntryScreen() {
    const { isAuthenticated, isLoading } = useAuth();

    // While loading OR authenticated → show splash (which auto-navigates)
    if (isLoading || isAuthenticated) {
        return <SplashScreen />;
    }

    // Not authenticated → show landing page
    return <LandingPage />;
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    // ---- Shared Logo ----
    logoColumn: {
        alignItems: 'center',
    },
    logoText: {
        fontSize: 56,
        fontWeight: '900',
        color: CHARCOAL,
        letterSpacing: 4,
    },

    // ---- Splash Screen ----
    splashContainer: {
        flex: 1,
        backgroundColor: VOLTAGE,
    },
    splashContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ---- Landing Page ----
    landingContainer: {
        flex: 1,
        backgroundColor: VOLTAGE,
    },
    landingSafe: {
        flex: 1,
    },
    topSpacer: {
        flex: 1,
    },
    landingLogoArea: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottomSpacer: {
        flex: 1,
    },
    landingBottom: {
        paddingHorizontal: spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? 16 : 32,
    },
    getStartedButton: {
        height: 56,
        backgroundColor: CHARCOAL,
        borderRadius: 9999,
        alignItems: 'center',
        justifyContent: 'center',
    },
    getStartedButtonPressed: {
        backgroundColor: colors.background.secondary,
        transform: [{ scale: 0.98 }],
    },
    getStartedText: {
        fontSize: 18,
        fontWeight: '700',
        color: WHITE,
        letterSpacing: 0.5,
    },
    linksRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.lg,
        gap: 20,
    },
    linkText: {
        fontSize: 17,
        fontWeight: '700',
        color: CHARCOAL,
    },
    linkDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: CHARCOAL,
        opacity: 0.4,
    },
});
