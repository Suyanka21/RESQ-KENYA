// ⚡ ResQ Kenya - Skeleton Loader Components
// Shimmer animation primitives + compound presets
// Phase 4: Loading, Error & Empty States

import React, { useEffect, useRef } from 'react';
import {
    View, Animated, StyleSheet, AccessibilityInfo, Easing,
} from 'react-native';
import { colors, spacing, borderRadius } from '../../theme/voltage-premium';

// =============================================================================
// HOOK: Reduced Motion Awareness
// =============================================================================

function useReducedMotion(): boolean {
    const [reduced, setReduced] = React.useState(false);
    useEffect(() => {
        AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
        const sub = AccessibilityInfo.addEventListener(
            'reduceMotionChanged',
            setReduced,
        );
        return () => sub.remove();
    }, []);
    return reduced;
}

// =============================================================================
// BASE: Shimmer Animation
// =============================================================================

interface SkeletonBaseProps {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: any;
}

const SkeletonBase: React.FC<SkeletonBaseProps> = ({
    width,
    height,
    borderRadius: radius = borderRadius.md,
    style,
}) => {
    const opacity = useRef(new Animated.Value(0.3)).current;
    const reducedMotion = useReducedMotion();

    useEffect(() => {
        if (reducedMotion) {
            opacity.setValue(0.5);
            return;
        }

        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 600,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 600,
                    easing: Easing.in(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]),
        );
        animation.start();
        return () => animation.stop();
    }, [reducedMotion, opacity]);

    return (
        <Animated.View
            accessibilityRole="none"
            accessibilityLabel="Loading"
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius: radius,
                    backgroundColor: colors.charcoal[700],
                    opacity,
                },
                style,
            ]}
        />
    );
};

// =============================================================================
// PRIMITIVES
// =============================================================================

interface SkeletonBoxProps {
    width?: number | string;
    height?: number;
    radius?: number;
    style?: any;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
    width = '100%',
    height = 48,
    radius = borderRadius.md,
    style,
}) => <SkeletonBase width={width} height={height} borderRadius={radius} style={style} />;

interface SkeletonCircleProps {
    size?: number;
    style?: any;
}

export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({
    size = 48,
    style,
}) => <SkeletonBase width={size} height={size} borderRadius={size / 2} style={style} />;

interface SkeletonTextProps {
    lines?: number;
    widths?: (number | string)[];
    lineHeight?: number;
    gap?: number;
    style?: any;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
    lines = 3,
    widths,
    lineHeight = 14,
    gap = spacing.sm,
    style,
}) => {
    const defaultWidths = ['100%', '85%', '60%'];
    return (
        <View style={[{ gap }, style]}>
            {Array.from({ length: lines }).map((_, i) => (
                <SkeletonBase
                    key={i}
                    width={(widths?.[i] ?? defaultWidths[i % defaultWidths.length]) as any}
                    height={lineHeight}
                    borderRadius={borderRadius.sm}
                />
            ))}
        </View>
    );
};

// =============================================================================
// COMPOUND PRESETS
// =============================================================================

interface PresetProps {
    style?: any;
}

/** Card skeleton — box header + text lines */
export const SkeletonCard: React.FC<PresetProps> = ({ style }) => (
    <View style={[styles.card, style]} accessibilityLabel="Loading content">
        <SkeletonBox height={24} width="60%" />
        <View style={{ height: spacing.sm }} />
        <SkeletonText lines={2} widths={['100%', '75%']} />
        <View style={{ height: spacing.md }} />
        <SkeletonBox height={40} radius={borderRadius.xl} />
    </View>
);

/** List item — avatar circle + two text lines */
export const SkeletonListItem: React.FC<PresetProps> = ({ style }) => (
    <View style={[styles.listItem, style]} accessibilityLabel="Loading item">
        <SkeletonCircle size={40} />
        <View style={styles.listItemText}>
            <SkeletonBox height={14} width="70%" />
            <View style={{ height: spacing.xs }} />
            <SkeletonBox height={12} width="45%" />
        </View>
    </View>
);

/** Profile card — large circle + name + subtitle */
export const SkeletonProfileCard: React.FC<PresetProps> = ({ style }) => (
    <View style={[styles.profileCard, style]} accessibilityLabel="Loading profile">
        <SkeletonCircle size={72} />
        <View style={{ height: spacing.md }} />
        <SkeletonBox height={20} width="50%" style={{ alignSelf: 'center' }} />
        <View style={{ height: spacing.sm }} />
        <SkeletonBox height={14} width="35%" style={{ alignSelf: 'center' }} />
    </View>
);

/** Stat row — 3 equal stat boxes side by side */
export const SkeletonStatRow: React.FC<PresetProps & { count?: number }> = ({
    count = 3,
    style,
}) => (
    <View style={[styles.statRow, style]} accessibilityLabel="Loading stats">
        {Array.from({ length: count }).map((_, i) => (
            <View key={i} style={styles.statBox}>
                <SkeletonBox height={28} width="60%" style={{ alignSelf: 'center' }} />
                <View style={{ height: spacing.xs }} />
                <SkeletonBox height={12} width="80%" style={{ alignSelf: 'center' }} />
            </View>
        ))}
    </View>
);

/** Service grid — 2×3 grid of service card skeletons */
export const SkeletonServiceGrid: React.FC<PresetProps> = ({ style }) => (
    <View style={[styles.serviceGrid, style]} accessibilityLabel="Loading services">
        {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={styles.serviceItem}>
                <SkeletonCircle size={48} style={{ alignSelf: 'center' }} />
                <View style={{ height: spacing.sm }} />
                <SkeletonBox height={12} width="70%" style={{ alignSelf: 'center' }} />
            </View>
        ))}
    </View>
);

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
        marginBottom: spacing.md,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    listItemText: {
        flex: 1,
    },
    profileCard: {
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
    },
    statRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    statBox: {
        flex: 1,
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
    },
    serviceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    serviceItem: {
        width: '31%',
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
    },
});

export default SkeletonBase;
