// ⚡ ResQ Kenya - Registration Screen
// Converted from: DESIGN RES Q/components/RegistrationScreen.tsx (Google Stitch)
// Phase 2.5 UI Enhancement - Agent 2.5

import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView,
    Platform, ScrollView, Animated, Easing, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, User, Phone, MapPin, Crosshair, Check } from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows, touchTargets, typography } from '../../theme/voltage-premium';
import { StatusBar } from 'expo-status-bar';

export default function RegisterScreen() {
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [location, setLocation] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    }, []);

    const isFormValid = fullName.trim().length >= 2 && phoneNumber.length >= 9;

    const handleCreateAccount = async () => {
        if (!fullName.trim()) {
            setError('Please enter your full name');
            return;
        }
        if (phoneNumber.length < 9) {
            setError('Please enter a valid phone number');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const cleaned = phoneNumber.replace(/\D/g, '');
            const formattedPhone = cleaned.startsWith('0')
                ? `+254${cleaned.slice(1)}`
                : cleaned.startsWith('254')
                    ? `+${cleaned}`
                    : `+254${cleaned}`;

            router.push({
                pathname: '/(auth)/verify-otp',
                params: {
                    phoneNumber: formattedPhone,
                    name: fullName.trim(),
                    isRegistration: 'true'
                }
            });
        } catch (err: any) {
            setError(err.message || 'Registration failed');
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
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Join 50,000+ drivers using ResQ</Text>
                        </View>

                        {/* Full Name Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Full Name</Text>
                            <View style={[
                                styles.inputContainer,
                                focusedField === 'name' && styles.inputContainerFocused,
                            ]}>
                                <View style={styles.inputIconWrap}>
                                    <User
                                        size={20}
                                        color={focusedField === 'name' ? colors.voltage : colors.text.tertiary}
                                        strokeWidth={2}
                                    />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="John Mwangi"
                                    placeholderTextColor={colors.text.tertiary}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    autoCapitalize="words"
                                    onFocus={() => setFocusedField('name')}
                                    onBlur={() => setFocusedField(null)}
                                    accessibilityLabel="Full name input"
                                />
                            </View>
                        </View>

                        {/* Phone Number Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <View style={[
                                styles.inputContainer,
                                focusedField === 'phone' && styles.inputContainerFocused,
                            ]}>
                                <View style={styles.inputIconWrap}>
                                    <Phone
                                        size={20}
                                        color={focusedField === 'phone' ? colors.voltage : colors.text.tertiary}
                                        strokeWidth={2}
                                    />
                                </View>
                                <View style={styles.phoneDivider} />
                                <Text style={styles.flagText}>🇰🇪</Text>
                                <Text style={styles.countryCode}>+254</Text>
                                <TextInput
                                    style={styles.phoneInput}
                                    placeholder="712 345 678"
                                    placeholderTextColor={colors.text.tertiary}
                                    value={phoneNumber}
                                    onChangeText={(text) => setPhoneNumber(text.replace(/\D/g, ''))}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    onFocus={() => setFocusedField('phone')}
                                    onBlur={() => setFocusedField(null)}
                                    accessibilityLabel="Phone number input"
                                />
                            </View>
                        </View>

                        {/* Location Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Location</Text>
                            <View style={[
                                styles.inputContainer,
                                focusedField === 'location' && styles.inputContainerFocused,
                            ]}>
                                <View style={styles.inputIconWrap}>
                                    <MapPin
                                        size={20}
                                        color={focusedField === 'location' ? colors.voltage : colors.text.tertiary}
                                        strokeWidth={2}
                                    />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nairobi, Kenya"
                                    placeholderTextColor={colors.text.tertiary}
                                    value={location}
                                    onChangeText={setLocation}
                                    onFocus={() => setFocusedField('location')}
                                    onBlur={() => setFocusedField(null)}
                                    accessibilityLabel="Location input"
                                />
                            </View>
                            <Pressable
                                style={styles.useLocationButton}
                                accessibilityLabel="Use current location"
                                accessibilityRole="button"
                            >
                                <Crosshair size={16} color={colors.voltage} strokeWidth={2} />
                                <Text style={styles.useLocationText}>Use current location</Text>
                            </Pressable>
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

                        {/* Create Account Button - 80px */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.createButton,
                                pressed && styles.createButtonPressed,
                                (!isFormValid || isLoading) && styles.createButtonDisabled,
                            ]}
                            onPress={handleCreateAccount}
                            disabled={!isFormValid || isLoading}
                            accessibilityLabel="Create account"
                            accessibilityRole="button"
                        >
                            {isLoading ? (
                                <ActivityIndicator color={colors.text.onBrand} />
                            ) : (
                                <Text style={[
                                    styles.createButtonText,
                                    (!isFormValid || isLoading) && styles.createButtonTextDisabled,
                                ]}>
                                    Create Account
                                </Text>
                            )}
                        </Pressable>


                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                Already have an account?{' '}
                            </Text>
                            <Pressable
                                onPress={() => router.push('/(auth)/login')}
                                accessibilityLabel="Sign in to existing account"
                                accessibilityRole="button"
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Text style={styles.footerLink}>Sign In</Text>
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

    // Input Group
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
    inputIconWrap: {
        paddingLeft: spacing.md,
        paddingRight: spacing.sm,
    },
    input: {
        flex: 1,
        paddingRight: spacing.md,
        fontSize: typography.fontSize.base,
        color: colors.text.primary,
        height: '100%',
    },
    phoneDivider: {
        width: 1,
        height: 24,
        backgroundColor: colors.background.border,
        marginHorizontal: spacing.sm,
    },
    flagText: {
        fontSize: 18,
    },
    countryCode: {
        fontSize: typography.fontSize.sm,
        fontWeight: '500',
        color: colors.text.secondary,
        marginRight: spacing.xs,
    },
    phoneInput: {
        flex: 1,
        paddingRight: spacing.md,
        fontSize: typography.fontSize.base,
        color: colors.text.primary,
        height: '100%',
    },

    // Use Location
    useLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.sm,
        marginLeft: spacing.xs,
    },
    useLocationText: {
        fontSize: typography.fontSize.sm,
        fontWeight: '500',
        color: colors.voltage,
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
        marginBottom: spacing.md,
        gap: spacing.sm,
        marginTop: spacing.sm,
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

    // Create Account Button
    createButton: {
        width: '100%',
        height: touchTargets.sos, // 80px
        backgroundColor: colors.interactive.default,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
        ...shadows.button,
        // Glow effect matching stitch design
        shadowColor: '#FFA500',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    createButtonPressed: {
        backgroundColor: colors.interactive.pressed,
        transform: [{ scale: 0.98 }],
    },
    createButtonDisabled: {
        backgroundColor: colors.interactive.disabled,
    },
    createButtonText: {
        fontSize: typography.fontSize.lg,
        fontWeight: '700',
        color: colors.text.onBrand,
    },
    createButtonTextDisabled: {
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
