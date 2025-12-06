// ⚡ Voltage Premium Card Component
// Standard, Elevated, and Service card variants

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, shadows, borderRadius, spacing } from '../../theme/voltage-premium';

interface CardProps {
    children: React.ReactNode;
    variant?: 'standard' | 'elevated' | 'service';
    onPress?: () => void;
    accentColor?: string;
    style?: object;
}

export default function Card({
    children,
    variant = 'standard',
    onPress,
    accentColor,
    style,
}: CardProps) {
    const getVariantStyles = () => {
        switch (variant) {
            case 'elevated':
                return styles.elevated;
            case 'service':
                return [
                    styles.service,
                    accentColor && { borderLeftColor: accentColor },
                ];
            default:
                return styles.standard;
        }
    };

    const CardComponent = onPress ? Pressable : View;

    return (
        <CardComponent
            onPress={onPress}
            style={({ pressed }: { pressed?: boolean }) => [
                styles.base,
                getVariantStyles(),
                pressed && onPress && styles.pressed,
                style,
            ]}
        >
            {children}
        </CardComponent>
    );
}

// Service Card with Icon
interface ServiceCardProps {
    title: string;
    description?: string;
    price?: string;
    emoji: string;
    color: string;
    onPress: () => void;
    selected?: boolean;
    badge?: string;
}

export function ServiceCard({
    title,
    description,
    price,
    emoji,
    color,
    onPress,
    selected = false,
    badge,
}: ServiceCardProps) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.serviceCard,
                selected && styles.serviceCardSelected,
                pressed && styles.serviceCardPressed,
            ]}
        >
            {/* Icon Container */}
            <View style={[styles.iconContainer, { backgroundColor: `${color}20`, borderColor: color }]}>
                <Text style={styles.emoji}>{emoji}</Text>
            </View>

            {/* Content */}
            <Text style={styles.serviceTitle}>{title}</Text>
            {description && <Text style={styles.serviceDesc}>{description}</Text>}
            {price && <Text style={styles.servicePrice}>{price}</Text>}

            {/* Badge */}
            {badge && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}

            {/* Selected Glow */}
            {selected && <View style={styles.selectedGlow} />}
        </Pressable>
    );
}

// Stats Card
interface StatsCardProps {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

export function StatsCard({ value, label, icon }: StatsCardProps) {
    return (
        <View style={styles.statsCard}>
            {icon && <View style={styles.statsIcon}>{icon}</View>}
            <Text style={styles.statsValue}>{value}</Text>
            <Text style={styles.statsLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
    },
    standard: {
        backgroundColor: colors.charcoal[800],
        borderWidth: 1,
        borderColor: colors.charcoal[600],
        ...shadows.card,
    },
    elevated: {
        backgroundColor: colors.charcoal[700],
        borderWidth: 1,
        borderColor: `${colors.voltage}33`,
        ...shadows.cardElevated,
    },
    service: {
        backgroundColor: colors.charcoal[800],
        borderWidth: 1,
        borderColor: colors.charcoal[600],
        borderLeftWidth: 3,
        borderLeftColor: colors.voltage,
    },
    pressed: {
        transform: [{ translateY: -2 }],
        borderColor: `${colors.voltage}66`,
    },

    // Service Card
    serviceCard: {
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
        padding: spacing.md,
        position: 'relative',
        overflow: 'hidden',
    },
    serviceCardSelected: {
        borderWidth: 2,
        borderColor: colors.voltage,
        backgroundColor: 'rgba(255, 214, 10, 0.05)',
    },
    serviceCardPressed: {
        transform: [{ scale: 1.02 }],
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    emoji: {
        fontSize: 28,
    },
    serviceTitle: {
        color: colors.text.primary,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    serviceDesc: {
        color: colors.text.secondary,
        fontSize: 13,
        marginBottom: 8,
    },
    servicePrice: {
        color: colors.voltage,
        fontSize: 14,
        fontWeight: '600',
    },
    badge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: colors.voltage,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
    },
    badgeText: {
        color: colors.charcoal[900],
        fontSize: 10,
        fontWeight: '700',
    },
    selectedGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: borderRadius.xl,
        shadowColor: colors.voltage,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },

    // Stats Card
    statsCard: {
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
        padding: spacing.md,
        alignItems: 'center',
        flex: 1,
    },
    statsIcon: {
        marginBottom: 8,
    },
    statsValue: {
        color: colors.voltage,
        fontSize: 24,
        fontWeight: '700',
    },
    statsLabel: {
        color: colors.text.secondary,
        fontSize: 12,
        marginTop: 4,
    },
});
