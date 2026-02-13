// ⚡ ResQ Kenya - Error State Component
// Reusable error display with retry CTA
// Phase 4: Loading, Error & Empty States

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AlertTriangle, WifiOff, ServerCrash, RefreshCw } from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../../theme/voltage-premium';

// =============================================================================
// TYPES
// =============================================================================

type ErrorIcon = 'alert' | 'offline' | 'server';

interface ErrorStateProps {
    /** Main error title */
    title?: string;
    /** Descriptive error message */
    message?: string;
    /** Retry callback — shows retry button when provided */
    onRetry?: () => void;
    /** Retry button label */
    retryLabel?: string;
    /** Error icon type */
    icon?: ErrorIcon;
    /** Compact mode for inline/card usage */
    compact?: boolean;
    /** Custom style overrides */
    style?: any;
}

// =============================================================================
// ICON MAP
// =============================================================================

const ICON_MAP = {
    alert: AlertTriangle,
    offline: WifiOff,
    server: ServerCrash,
};

// =============================================================================
// COMPONENT
// =============================================================================

export const ErrorState: React.FC<ErrorStateProps> = ({
    title = 'Something went wrong',
    message = 'We couldn\'t load this data. Please try again.',
    onRetry,
    retryLabel = 'Try Again',
    icon = 'alert',
    compact = false,
    style,
}) => {
    const IconComponent = ICON_MAP[icon];

    if (compact) {
        return (
            <View
                style={[styles.compactContainer, style]}
                accessibilityRole="alert"
                accessibilityLabel={`Error: ${title}. ${message}`}
            >
                <View style={styles.compactRow}>
                    <IconComponent
                        size={20}
                        color={colors.status.error}
                        strokeWidth={2}
                    />
                    <View style={styles.compactTextWrap}>
                        <Text style={styles.compactTitle}>{title}</Text>
                        <Text style={styles.compactMessage} numberOfLines={2}>
                            {message}
                        </Text>
                    </View>
                </View>
                {onRetry && (
                    <Pressable
                        onPress={onRetry}
                        style={({ pressed }) => [
                            styles.compactRetry,
                            pressed && styles.retryPressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={retryLabel}
                    >
                        <RefreshCw size={14} color={colors.voltage} strokeWidth={2} />
                        <Text style={styles.compactRetryText}>{retryLabel}</Text>
                    </Pressable>
                )}
            </View>
        );
    }

    return (
        <View
            style={[styles.container, style]}
            accessibilityRole="alert"
            accessibilityLabel={`Error: ${title}. ${message}`}
        >
            {/* Icon Circle */}
            <View style={styles.iconCircle}>
                <IconComponent
                    size={32}
                    color={colors.status.error}
                    strokeWidth={2}
                />
            </View>

            {/* Text */}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            {/* Retry Button */}
            {onRetry && (
                <Pressable
                    onPress={onRetry}
                    style={({ pressed }) => [
                        styles.retryButton,
                        pressed && styles.retryPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={retryLabel}
                >
                    <RefreshCw size={18} color={colors.charcoal[900]} strokeWidth={2.5} />
                    <Text style={styles.retryText}>{retryLabel}</Text>
                </Pressable>
            )}
        </View>
    );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    // Full-screen centered layout
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: colors.charcoal[900],
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.status.errorGlow,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: typography.fontSize.xl,
        fontWeight: '700' as const,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    message: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 280,
        marginBottom: spacing.xl,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.voltage,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.xl,
        ...shadows.button,
    },
    retryPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.97 }],
    },
    retryText: {
        fontSize: typography.fontSize.base,
        fontWeight: '700' as const,
        color: colors.charcoal[900],
    },

    // Compact / inline layout
    compactContainer: {
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
        gap: spacing.sm,
    },
    compactRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
    },
    compactTextWrap: {
        flex: 1,
    },
    compactTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: '600' as const,
        color: colors.text.primary,
        marginBottom: 2,
    },
    compactMessage: {
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
        lineHeight: 18,
    },
    compactRetry: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
        backgroundColor: colors.charcoal[700],
    },
    compactRetryText: {
        fontSize: typography.fontSize.xs,
        fontWeight: '600' as const,
        color: colors.voltage,
    },
});

export default ErrorState;
