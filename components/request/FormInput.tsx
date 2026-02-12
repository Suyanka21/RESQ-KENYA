// ⚡ ResQ Kenya - Form Input Component
// Premium form input with 56px height, labels, and validation states

import React from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { AlertCircle, CheckCircle } from 'lucide-react-native';
import { colors, spacing, borderRadius, touchTargets } from '../../theme/voltage-premium';

interface FormInputProps extends TextInputProps {
    label: string;
    error?: string;
    helperText?: string;
    isValid?: boolean;
    prefix?: React.ReactNode;
}

export const FormInput: React.FC<FormInputProps> = ({
    label,
    error,
    helperText,
    isValid,
    prefix,
    style,
    ...props
}) => {
    return (
        <View style={styles.container}>
            {/* Label */}
            <Text style={styles.label}>{label}</Text>

            {/* Input Container */}
            <View style={[
                styles.inputContainer,
                error && styles.inputContainerError,
                isValid && styles.inputContainerValid
            ]}>
                {prefix && (
                    <View style={styles.prefix}>{prefix}</View>
                )}
                <TextInput
                    style={[styles.input, prefix ? styles.inputWithPrefix : null, style]}
                    placeholderTextColor={colors.text.muted}
                    {...props}
                />
                {isValid && !error && (
                    <CheckCircle size={20} color={colors.success} style={styles.validIcon} />
                )}
            </View>

            {/* Error Message */}
            {error && (
                <View style={styles.errorContainer}>
                    <AlertCircle size={14} color={colors.emergency} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* Helper Text */}
            {helperText && !error && (
                <Text style={styles.helperText}>{helperText}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: spacing.xs,
        letterSpacing: 0.3,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        backgroundColor: colors.charcoal[800],
        borderWidth: 2,
        borderColor: colors.charcoal[600],
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    inputContainerError: {
        borderColor: colors.emergency,
    },
    inputContainerValid: {
        borderColor: colors.success,
    },
    prefix: {
        paddingLeft: spacing.md,
    },
    input: {
        flex: 1,
        height: '100%',
        paddingHorizontal: spacing.md,
        fontSize: 16,
        color: colors.text.primary,
    },
    inputWithPrefix: {
        paddingLeft: spacing.sm,
    },
    validIcon: {
        marginRight: spacing.md,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
        gap: spacing.xs,
    },
    errorText: {
        fontSize: 12,
        color: colors.emergency,
    },
    helperText: {
        fontSize: 12,
        color: colors.text.muted,
        marginTop: spacing.xs,
    },
});

export default FormInput;
