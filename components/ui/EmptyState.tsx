// ⚡ ResQ Kenya - Empty State Component
// Reusable empty state with icon, copy, and CTA
// Phase 4: Loading, Error & Empty States

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
    Inbox, Clock, Car, Wallet, FileText, Activity,
    TrendingUp, MapPin, Search, type LucideIcon,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../../theme/voltage-premium';

// =============================================================================
// TYPES
// =============================================================================

type PresetIcon = 'inbox' | 'history' | 'vehicle' | 'wallet' | 'document' |
    'activity' | 'earnings' | 'location' | 'search';

interface EmptyStateProps {
    /** Lucide icon component or preset name */
    icon?: PresetIcon | LucideIcon;
    /** Main title */
    title: string;
    /** Supporting subtitle text */
    subtitle?: string;
    /** Action button label — shows button when provided */
    actionLabel?: string;
    /** Action button callback */
    onAction?: () => void;
    /** Compact mode for inline/card usage */
    compact?: boolean;
    /** Custom style overrides */
    style?: any;
}

// =============================================================================
// ICON MAP
// =============================================================================

const PRESET_ICONS: Record<PresetIcon, LucideIcon> = {
    inbox: Inbox,
    history: Clock,
    vehicle: Car,
    wallet: Wallet,
    document: FileText,
    activity: Activity,
    earnings: TrendingUp,
    location: MapPin,
    search: Search,
};

// =============================================================================
// COMPONENT
// =============================================================================

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon = 'inbox',
    title,
    subtitle,
    actionLabel,
    onAction,
    compact = false,
    style,
}) => {
    const IconComponent = typeof icon === 'string'
        ? PRESET_ICONS[icon] ?? Inbox
        : icon;

    if (compact) {
        return (
            <View
                style={[styles.compactContainer, style]}
                accessibilityRole="text"
                accessibilityLabel={`${title}${subtitle ? `. ${subtitle}` : ''}`}
            >
                <IconComponent
                    size={28}
                    color={colors.text.muted}
                    strokeWidth={1.5}
                />
                <Text style={styles.compactTitle}>{title}</Text>
                {subtitle && (
                    <Text style={styles.compactSubtitle}>{subtitle}</Text>
                )}
                {actionLabel && onAction && (
                    <Pressable
                        onPress={onAction}
                        style={({ pressed }) => [
                            styles.compactAction,
                            pressed && styles.actionPressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={actionLabel}
                    >
                        <Text style={styles.compactActionText}>{actionLabel}</Text>
                    </Pressable>
                )}
            </View>
        );
    }

    return (
        <View
            style={[styles.container, style]}
            accessibilityRole="text"
            accessibilityLabel={`${title}${subtitle ? `. ${subtitle}` : ''}`}
        >
            {/* Icon Circle */}
            <View style={styles.iconCircle}>
                <IconComponent
                    size={36}
                    color={colors.text.muted}
                    strokeWidth={1.5}
                />
            </View>

            {/* Text */}
            <Text style={styles.title}>{title}</Text>
            {subtitle && (
                <Text style={styles.subtitle}>{subtitle}</Text>
            )}

            {/* CTA Button */}
            {actionLabel && onAction && (
                <Pressable
                    onPress={onAction}
                    style={({ pressed }) => [
                        styles.actionButton,
                        pressed && styles.actionPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={actionLabel}
                >
                    <Text style={styles.actionText}>{actionLabel}</Text>
                </Pressable>
            )}
        </View>
    );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    // Full layout
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.charcoal[800],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
    },
    title: {
        fontSize: typography.fontSize.lg,
        fontWeight: '700' as const,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 280,
        marginBottom: spacing.xl,
    },
    actionButton: {
        backgroundColor: colors.voltage,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.xl,
        ...shadows.button,
    },
    actionPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.97 }],
    },
    actionText: {
        fontSize: typography.fontSize.base,
        fontWeight: '700' as const,
        color: colors.charcoal[900],
    },

    // Compact layout
    compactContainer: {
        alignItems: 'center',
        padding: spacing.lg,
        gap: spacing.sm,
    },
    compactTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: '600' as const,
        color: colors.text.primary,
        textAlign: 'center',
    },
    compactSubtitle: {
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: 18,
    },
    compactAction: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
        backgroundColor: colors.charcoal[800],
        marginTop: spacing.xs,
    },
    compactActionText: {
        fontSize: typography.fontSize.xs,
        fontWeight: '600' as const,
        color: colors.voltage,
    },
});

export default EmptyState;
