// ⚡ Voltage Premium Input Component
// Phone input, text input with focus glow

import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { colors, borderRadius, spacing } from '../../theme/voltage-premium';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export default function Input({
    label,
    error,
    icon,
    rightIcon,
    style,
    ...props
}: InputProps) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View style={[
                styles.inputContainer,
                isFocused && styles.inputFocused,
                error && styles.inputError,
            ]}>
                {icon && <View style={styles.iconLeft}>{icon}</View>}
                <TextInput
                    style={[styles.input, icon ? styles.inputWithIcon : undefined, style]}
                    placeholderTextColor={colors.text.muted}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />
                {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

// Phone Input with Kenya prefix
interface PhoneInputProps {
    value: string;
    onChangeText: (text: string) => void;
    error?: string;
}

export function PhoneInput({ value, onChangeText, error }: PhoneInputProps) {
    const [isFocused, setIsFocused] = useState(false);

    const formatPhoneNumber = (text: string) => {
        // Remove non-digits
        const digits = text.replace(/\D/g, '');
        // Format as 07XX XXX XXX
        if (digits.length <= 4) return digits;
        if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
        return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Phone Number</Text>

            <View style={[
                styles.inputContainer,
                isFocused && styles.inputFocused,
                error && styles.inputError,
            ]}>
                {/* Kenya Flag + Code */}
                <View style={styles.phonePrefix}>
                    <Text style={styles.flag}>🇰🇪</Text>
                    <Text style={styles.countryCode}>+254</Text>
                </View>

                <TextInput
                    style={[styles.input, styles.phoneInput]}
                    placeholder="712 345 678"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="phone-pad"
                    value={formatPhoneNumber(value)}
                    onChangeText={(text) => onChangeText(text.replace(/\D/g, ''))}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    maxLength={12}
                />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

// OTP Input
interface OTPInputProps {
    value: string;
    onChangeText: (text: string) => void;
    error?: string;
}

export function OTPInput({ value, onChangeText, error }: OTPInputProps) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Verification Code</Text>

            <View style={[
                styles.inputContainer,
                styles.otpContainer,
                isFocused && styles.inputFocused,
                error && styles.inputError,
            ]}>
                <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="000000"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="number-pad"
                    value={value}
                    onChangeText={(text) => onChangeText(text.replace(/\D/g, '').slice(0, 6))}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    maxLength={6}
                />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    label: {
        color: colors.text.primary,
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    inputContainer: {
        backgroundColor: colors.charcoal[700],
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputFocused: {
        borderColor: colors.voltage,
        shadowColor: colors.voltageGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    inputError: {
        borderColor: colors.emergency,
    },
    input: {
        flex: 1,
        color: colors.text.primary,
        fontSize: 16,
        paddingVertical: 14,
        paddingHorizontal: spacing.md,
    },
    inputWithIcon: {
        paddingLeft: 0,
    },
    iconLeft: {
        paddingLeft: spacing.md,
    },
    iconRight: {
        paddingRight: spacing.md,
    },
    errorText: {
        color: colors.emergency,
        fontSize: 12,
        marginTop: 6,
    },

    // Phone Input
    phonePrefix: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: spacing.md,
        borderRightWidth: 1,
        borderRightColor: colors.charcoal[600],
        paddingRight: spacing.sm,
        marginRight: spacing.sm,
    },
    flag: {
        fontSize: 20,
        marginRight: 6,
    },
    countryCode: {
        color: colors.text.secondary,
        fontSize: 16,
        fontWeight: '500',
    },
    phoneInput: {
        letterSpacing: 1,
    },

    // OTP Input
    otpContainer: {
        justifyContent: 'center',
    },
    otpInput: {
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: 12,
        textAlign: 'center',
        paddingVertical: 18,
    },
});
