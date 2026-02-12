// ⚡ ResQ Kenya - Login Screen
// Converted from: DESIGN RES Q/components/LoginScreen.tsx (Google Stitch)
// Phase 2.5 UI Enhancement - Agent 2.5

import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView,
    Platform, Animated, Easing, ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Phone, Check } from 'lucide-react-native';
import { formatPhoneNumber } from '../../services/auth.service';
import { colors, spacing, borderRadius, shadows, touchTargets, typography } from '../../theme/voltage-premium';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    }, []);

    const isValidPhone = () => {
        const cleaned = phoneNumber.replace(/\D/g, '');
        return cleaned.length >= 9;
    };

    const handleContinue = async () => {
        if (!isValidPhone()) {
            setError('Please enter a valid Kenyan phone number');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const fullNumber = formatPhoneNumber(phoneNumber);
            router.push({
                pathname: '/(auth)/verify-otp',
                params: { phoneNumber: fullNumber }
            });
        } catch (err: any) {
            setError(err.message || 'Failed to send verification code');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Pressable
                                onPress={() => router.back()}
                                style={({ pressed }) => [
                                    styles.backButton,
                                    pressed && { backgroundColor: colors.charcoal[800], transform: [{ scale: 0.9 }] },
                                ]}
                                accessibilityLabel="Go back"
                                accessibilityRole="button"
                            >
                                <ArrowLeft size={20} color={colors.voltage} strokeWidth={2} />
                            </Pressable>
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>Sign in to access emergency services</Text>
                        </View>

                        {/* Phone Number Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <View style={[
                                styles.inputContainer,
                                isFocused && styles.inputContainerFocused,
                                !!error && styles.inputContainerError,
                            ]}>
                                <View style={styles.inputPrefix}>
                                    <Phone
                                        size={20}
                                        color={isFocused ? colors.voltage : colors.text.tertiary}
                                        strokeWidth={2}
                                    />
                                    <View style={styles.inputDivider} />
                                    <Text style={styles.flagText}>🇰🇪</Text>
                                    <Text style={styles.countryCode}>+254</Text>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="712 345 678"
                                    placeholderTextColor={colors.text.tertiary}
                                    value={phoneNumber}
                                    onChangeText={(text) => {
                                        setPhoneNumber(text.replace(/\D/g, ''));
                                        setError('');
                                    }}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    accessibilityLabel="Phone number input"
                                />
                            </View>
                        </View>

                        {/* Error */}
                        {error ? (
                            <Text style={styles.errorText}>{error}</Text>
                        ) : null}

                        {/* Terms Checkbox */}
                        <Pressable
                            style={styles.termsRow}
                            onPress={() => setAgreedToTerms(!agreedToTerms)}
                            accessibilityLabel="Agree to terms of service and privacy policy"
                            accessibilityRole="checkbox"
                        >
                            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                                {agreedToTerms && (
                                    <Check size={14} color={colors.background.primary} strokeWidth={3} />
                                )}
                            </View>
                            <Text style={styles.termsText}>
                                I agree to{' '}
                                <Text style={styles.termsLink}>Terms of Service</Text>
                                {' '}and{' '}
                                <Text style={styles.termsLink}>Privacy Policy</Text>
                            </Text>
                        </Pressable>

                        {/* Continue Button - 80px height per Stitch design */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.continueButton,
                                pressed && styles.continueButtonPressed,
                                (!isValidPhone() || isLoading) && styles.continueButtonDisabled,
                            ]}
                            onPress={handleContinue}
                            disabled={!isValidPhone() || isLoading}
                            accessibilityLabel="Continue to verification"
                            accessibilityRole="button"
                        >
                            <Text style={[
                                styles.continueButtonText,
                                (!isValidPhone() || isLoading) && styles.continueButtonTextDisabled,
                            ]}>
                                {isLoading ? 'Sending...' : 'Continue'}
                            </Text>
                        </Pressable>


                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                Don't have an account?{' '}
                            </Text>
                            <Pressable
                                onPress={() => router.push('/(auth)/register')}
                                accessibilityLabel="Sign up for a new account"
                                accessibilityRole="button"
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Text style={styles.footerLink}>Sign Up</Text>
                            </Pressable>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: spacing.lg,
    },

    // Header
    header: {
        marginBottom: spacing.xl,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.background.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: typography.fontSize.xxl,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
    },

    // Input
    inputGroup: {
        marginBottom: spacing.lg,
    },
    inputLabel: {
        fontSize: typography.fontSize.sm,
        fontWeight: '500',
        color: colors.text.primary,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.background.border,
        overflow: 'hidden',
    },
    inputContainerFocused: {
        borderColor: colors.voltage,
        ...shadows.focusRing,
    },
    inputContainerError: {
        borderColor: colors.status.error,
    },
    inputPrefix: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: spacing.md,
        gap: spacing.sm,
    },
    inputDivider: {
        width: 1,
        height: 24,
        backgroundColor: colors.background.border,
    },
    flagText: {
        fontSize: 18,
    },
    countryCode: {
        fontSize: typography.fontSize.sm,
        fontWeight: '500',
        color: colors.text.secondary,
    },
    input: {
        flex: 1,
        paddingHorizontal: spacing.md,
        fontSize: typography.fontSize.base,
        color: colors.text.primary,
        height: '100%',
    },

    // Error
    errorText: {
        color: colors.status.error,
        fontSize: typography.fontSize.sm,
        marginBottom: spacing.md,
    },

    // Terms
    termsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.background.border,
        backgroundColor: colors.background.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    checkboxChecked: {
        backgroundColor: colors.voltage,
        borderColor: colors.voltage,
    },
    termsText: {
        flex: 1,
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        lineHeight: 20,
    },
    termsLink: {
        color: colors.voltage,
    },

    // Continue Button
    continueButton: {
        width: '100%',
        height: touchTargets.sos, // 80px
        backgroundColor: colors.interactive.default,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
        ...shadows.button,
    },
    continueButtonPressed: {
        backgroundColor: colors.interactive.pressed,
        transform: [{ scale: 0.98 }],
    },
    continueButtonDisabled: {
        backgroundColor: colors.interactive.disabled,
    },
    continueButtonText: {
        fontSize: typography.fontSize.lg,
        fontWeight: '700',
        color: colors.text.onBrand,
    },
    continueButtonTextDisabled: {
        color: colors.text.disabled,
    },



    // Footer
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto',
        paddingTop: spacing.lg,
        paddingBottom: spacing.sm,
    },
    footerText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
    },
    footerLink: {
        fontSize: typography.fontSize.sm,
        fontWeight: '700',
        color: colors.voltage,
    },
});
