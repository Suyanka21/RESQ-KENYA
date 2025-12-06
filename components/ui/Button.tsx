// ⚡ Voltage Premium Button Component
// Primary, Secondary, Emergency, and Text button variants

import React from 'react';
import { Pressable, Text, View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { colors, shadows, borderRadius, spacing, typography } from '../../theme/voltage-premium';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'emergency' | 'text';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    style?: object;
}

export default function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    fullWidth = false,
    style,
}: ButtonProps) {
    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return { paddingVertical: 10, paddingHorizontal: 20, fontSize: 14 };
            case 'lg':
                return { paddingVertical: 18, paddingHorizontal: 36, fontSize: 18 };
            default:
                return { paddingVertical: 14, paddingHorizontal: 28, fontSize: 16 };
        }
    };

    const sizeStyles = getSizeStyles();

    const getVariantStyles = () => {
        switch (variant) {
            case 'secondary':
                return {
                    container: styles.secondaryContainer,
                    text: styles.secondaryText,
                    pressed: styles.secondaryPressed,
                };
            case 'emergency':
                return {
                    container: styles.emergencyContainer,
                    text: styles.emergencyText,
                    pressed: styles.emergencyPressed,
                };
            case 'text':
                return {
                    container: styles.textContainer,
                    text: styles.voltageText,
                    pressed: styles.textPressed,
                };
            default:
                return {
                    container: styles.primaryContainer,
                    text: styles.primaryText,
                    pressed: styles.primaryPressed,
                };
        }
    };

    const variantStyles = getVariantStyles();

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || loading}
            style={({ pressed }) => [
                styles.base,
                variantStyles.container,
                { paddingVertical: sizeStyles.paddingVertical, paddingHorizontal: sizeStyles.paddingHorizontal },
                fullWidth && styles.fullWidth,
                pressed && variantStyles.pressed,
                disabled && styles.disabled,
                style,
            ]}
        >
            {({ pressed }) => (
                <View style={styles.content}>
                    {loading ? (
                        <ActivityIndicator
                            color={variant === 'primary' ? colors.charcoal[900] : colors.voltage}
                            size="small"
                        />
                    ) : (
                        <>
                            {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
                            <Text style={[
                                variantStyles.text,
                                { fontSize: sizeStyles.fontSize },
                                styles.buttonText,
                            ]}>
                                {title}
                            </Text>
                            {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
                        </>
                    )}
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: borderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullWidth: {
        width: '100%',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontWeight: '600',
        letterSpacing: -0.2,
    },
    iconLeft: {
        marginRight: 8,
    },
    iconRight: {
        marginLeft: 8,
    },
    disabled: {
        opacity: 0.5,
    },

    // Primary (Voltage Yellow)
    primaryContainer: {
        backgroundColor: colors.voltage,
        ...shadows.button,
    },
    primaryText: {
        color: colors.charcoal[900],
    },
    primaryPressed: {
        backgroundColor: colors.voltageDeep,
        transform: [{ scale: 0.98 }],
    },

    // Secondary (Ghost)
    secondaryContainer: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.voltage,
    },
    secondaryText: {
        color: colors.text.primary,
    },
    secondaryPressed: {
        backgroundColor: 'rgba(255, 214, 10, 0.1)',
        borderColor: colors.voltageBright,
    },

    // Emergency (Red - SOS Only)
    emergencyContainer: {
        backgroundColor: colors.emergency,
        ...shadows.emergencyGlow,
    },
    emergencyText: {
        color: colors.text.primary,
    },
    emergencyPressed: {
        backgroundColor: '#E02020',
        transform: [{ scale: 0.98 }],
    },

    // Text Button
    textContainer: {
        backgroundColor: 'transparent',
    },
    voltageText: {
        color: colors.voltage,
    },
    textPressed: {
        opacity: 0.7,
    },
});
