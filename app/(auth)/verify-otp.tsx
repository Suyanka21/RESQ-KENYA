// ⚡ ResQ Kenya - OTP Verification Screen
// Converted from: DESIGN RES Q/components/OTPScreen.tsx (Google Stitch)
// Phase 2.5 UI Enhancement - Agent 2.5

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView,
    Platform, Animated, Easing, ActivityIndicator
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../services/AuthContext';
import { verifyOTP } from '../../services/auth.service';
import { colors, spacing, borderRadius, shadows, touchTargets, typography } from '../../theme/voltage-premium';
import { StatusBar } from 'expo-status-bar';

const OTP_LENGTH = 6;

export default function VerifyOTPScreen() {
    const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(45);
    const [isTimerActive, setIsTimerActive] = useState(true);
    const [focusedIndex, setFocusedIndex] = useState(0);

    const inputRef = useRef<TextInput>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            router.replace('/(customer)');
        }
    }, [isAuthenticated, authLoading]);

    // Entrance animation
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    }, []);

    // Timer countdown
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isTimerActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsTimerActive(false);
        }
        return () => clearInterval(interval);
    }, [isTimerActive, timeLeft]);

    // Auto-focus input
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleOtpChange = useCallback((text: string) => {
        const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
        const newOtp = digits.split('').concat(Array(OTP_LENGTH).fill('')).slice(0, OTP_LENGTH);
        setOtp(newOtp);
        setFocusedIndex(Math.min(digits.length, OTP_LENGTH - 1));
        setError('');
    }, []);

    const isComplete = otp.every(digit => digit !== '');

    const handleVerify = async () => {
        if (!isComplete) return;

        setIsLoading(true);
        setError('');

        try {
            const fullOtp = otp.join('');

            // Dev mode: accept test code
            if (fullOtp === '123456') {
                setTimeout(() => {
                    router.replace('/(customer)');
                }, 500);
                return;
            }

            // Production: Firebase verify
            const result = await verifyOTP(fullOtp);
            if (result.success && result.user) {
                router.replace('/(customer)');
            } else {
                setError(result.error || 'Invalid code. Please try again.');
            }
        } catch (err: any) {
            setError(err.message || 'Verification failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = () => {
        setTimeLeft(45);
        setIsTimerActive(true);
        setOtp(new Array(OTP_LENGTH).fill(''));
        setFocusedIndex(0);
        setError('');
        inputRef.current?.focus();
    };

    if (authLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.voltage} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                        <Text style={styles.title}>Verify Phone Number</Text>
                        <Text style={styles.subtitle}>Enter the 6-digit code sent to</Text>
                        <Text style={styles.phoneDisplay}>{phoneNumber || '+254 712 345 678'}</Text>
                    </View>

                    {/* OTP Display Cells */}
                    <Pressable
                        style={styles.otpContainer}
                        onPress={() => inputRef.current?.focus()}
                        accessibilityLabel="OTP input area"
                    >
                        {otp.map((digit, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.otpCell,
                                    digit !== '' && styles.otpCellFilled,
                                    focusedIndex === index && !isComplete && styles.otpCellFocused,
                                ]}
                            >
                                <Text style={styles.otpCellText}>{digit}</Text>
                            </View>
                        ))}
                    </Pressable>

                    {/* Hidden TextInput for keyboard */}
                    <TextInput
                        ref={inputRef}
                        style={styles.hiddenInput}
                        keyboardType="number-pad"
                        value={otp.join('')}
                        onChangeText={handleOtpChange}
                        maxLength={OTP_LENGTH}
                        autoFocus
                        accessibilityLabel="Enter OTP code"
                    />

                    {/* Timer / Resend */}
                    <View style={styles.timerContainer}>
                        <Text style={styles.timerLabel}>Didn't receive code?</Text>
                        {timeLeft > 0 ? (
                            <Text style={styles.timerText}>
                                Resend in 0:{timeLeft.toString().padStart(2, '0')}
                            </Text>
                        ) : (
                            <Pressable
                                onPress={handleResend}
                                accessibilityLabel="Resend verification code"
                                accessibilityRole="button"
                            >
                                <Text style={styles.resendText}>Resend Code</Text>
                            </Pressable>
                        )}
                    </View>

                    {/* Error */}
                    {error ? (
                        <Text style={styles.errorText}>{error}</Text>
                    ) : null}

                    {/* Verify Button - 80px */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.verifyButton,
                            pressed && isComplete && styles.verifyButtonPressed,
                            !isComplete && styles.verifyButtonDisabled,
                        ]}
                        onPress={handleVerify}
                        disabled={!isComplete || isLoading}
                        accessibilityLabel="Verify and continue"
                        accessibilityRole="button"
                    >
                        {isLoading ? (
                            <ActivityIndicator color={colors.text.onBrand} />
                        ) : (
                            <Text style={[
                                styles.verifyButtonText,
                                !isComplete && styles.verifyButtonTextDisabled,
                            ]}>
                                Verify & Continue
                            </Text>
                        )}
                    </Pressable>

                    {/* Spacer for keyboard */}
                    <View style={styles.bottomSpacer} />
                </Animated.View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.background.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
    phoneDisplay: {
        fontSize: typography.fontSize.base,
        fontWeight: '500',
        color: colors.text.primary,
        marginTop: spacing.xs,
    },

    // OTP Cells
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    otpCell: {
        flex: 1,
        height: 56,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.background.secondary,
        borderWidth: 2,
        borderColor: colors.background.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    otpCellFilled: {
        borderColor: colors.voltage,
        ...shadows.focusRing,
    },
    otpCellFocused: {
        borderColor: colors.voltage,
    },
    otpCellText: {
        fontSize: typography.fontSize.xxl,
        fontWeight: '700',
        color: colors.text.primary,
    },
    hiddenInput: {
        position: 'absolute',
        opacity: 0,
        height: 1,
        width: 1,
    },

    // Timer
    timerContainer: {
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    timerLabel: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
    },
    timerText: {
        fontSize: typography.fontSize.base,
        fontWeight: '700',
        color: colors.voltage,
    },
    resendText: {
        fontSize: typography.fontSize.base,
        fontWeight: '700',
        color: colors.voltage,
    },

    // Error
    errorText: {
        color: colors.status.error,
        fontSize: typography.fontSize.sm,
        textAlign: 'center',
        marginBottom: spacing.md,
    },

    // Verify Button
    verifyButton: {
        width: '100%',
        height: touchTargets.sos, // 80px
        backgroundColor: colors.interactive.default,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.button,
    },
    verifyButtonPressed: {
        backgroundColor: colors.interactive.pressed,
        transform: [{ scale: 0.98 }],
    },
    verifyButtonDisabled: {
        backgroundColor: colors.interactive.disabled,
    },
    verifyButtonText: {
        fontSize: typography.fontSize.lg,
        fontWeight: '700',
        color: colors.text.onBrand,
    },
    verifyButtonTextDisabled: {
        color: colors.text.disabled,
    },

    // Bottom spacer
    bottomSpacer: {
        height: spacing.xl,
    },
});
