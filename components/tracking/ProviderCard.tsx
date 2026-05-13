// ⚡ ResQ Kenya - Provider Card Component (Shared)
// Reusable provider info card for tracking lifecycle screens

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Star, Car } from 'lucide-react-native';
import { colors, spacing } from '../../theme/voltage-premium';

interface ProviderCardProps {
    name?: string;
    rating?: number;
    rescueCount?: number;
    vehicle?: string;
    plate?: string;
    serviceType?: string;
    compact?: boolean;
    showBadge?: boolean;
}

// Phase 4 (audit-v3 §MOCK-SWEEP) — the prior default props
// ("Michael Kiprop" / 4.8 / 234 rescues / Toyota Hilux KXX 789B)
// silently shipped a fake provider any time a caller forgot to pass
// props. Callers must now supply real data; absent fields render as
// em-dash placeholders so missing data is visible rather than mocked.
export const ProviderCard: React.FC<ProviderCardProps> = ({
    name = '—',
    rating,
    rescueCount,
    vehicle = '',
    plate = '',
    serviceType,
    compact = false,
    showBadge = true,
}) => {
    if (compact) {
        return (
            <View style={styles.compactContainer}>
                {/* Avatar placeholder */}
                <View style={styles.compactAvatar}>
                    <Text style={styles.avatarText}>{name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.compactName}>{name}</Text>
                    <View style={styles.compactMeta}>
                        <Star size={12} color={colors.voltage} fill={colors.voltage} />
                        <Text style={styles.compactRating}>{rating !== undefined ? rating.toFixed(1) : '—'}</Text>
                        <Text style={styles.compactDot}>•</Text>
                        <Text style={styles.compactVehicle}>
                            {[vehicle, plate].filter(Boolean).join(' - ') || '—'}
                        </Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Avatar */}
            <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarTextLg}>{name.charAt(0)}</Text>
                </View>
                {showBadge && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>TOP</Text>
                    </View>
                )}
            </View>

            <View style={{ flex: 1 }}>
                <Text style={styles.name}>{name}</Text>
                <View style={styles.ratingRow}>
                    <Star size={14} color={colors.voltage} fill={colors.voltage} />
                    <Text style={styles.ratingText}>{rating !== undefined ? rating.toFixed(1) : '—'} </Text>
                    {rescueCount !== undefined && (
                        <Text style={styles.rescues}>({rescueCount} rescues)</Text>
                    )}
                </View>
                <View style={styles.tagsRow}>
                    <View style={styles.vehicleTag}>
                        <Car size={12} color={colors.text.secondary} />
                        <Text style={styles.vehicleText}>
                            {[vehicle, plate].filter(Boolean).join(' - ') || '—'}
                        </Text>
                    </View>
                    {serviceType && (
                        <View style={styles.serviceTag}>
                            <Text style={styles.serviceText}>{serviceType}</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // Full card
    container: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.lg },
    avatarWrap: { position: 'relative' },
    avatar: {
        width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: colors.voltage,
        backgroundColor: colors.background.border, alignItems: 'center', justifyContent: 'center',
    },
    avatarTextLg: { fontSize: 24, fontWeight: '700', color: colors.voltage },
    badge: {
        position: 'absolute', bottom: -4, right: -4,
        backgroundColor: colors.voltage, paddingHorizontal: 6, paddingVertical: 2,
        borderRadius: 4, borderWidth: 1, borderColor: colors.background.secondary,
    },
    badgeText: { fontSize: 9, fontWeight: '700', color: colors.text.onBrand },
    name: { fontSize: 20, fontWeight: '700', color: colors.text.primary, lineHeight: 24 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
    ratingText: { fontSize: 14, color: colors.text.secondary },
    rescues: { fontSize: 12, color: colors.text.tertiary },
    tagsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
    vehicleTag: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
        backgroundColor: colors.background.tertiary, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 4,
    },
    vehicleText: { fontSize: 12, color: colors.text.secondary },
    serviceTag: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 4, borderWidth: 1, borderColor: colors.background.border },
    serviceText: { fontSize: 12, fontWeight: '500', color: colors.text.primary },

    // Compact card
    compactContainer: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 12, backgroundColor: colors.background.tertiary, borderRadius: 12,
        borderWidth: 1, borderColor: colors.background.border, marginBottom: spacing.lg,
    },
    compactAvatar: {
        width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.voltage,
        backgroundColor: colors.background.border, alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontSize: 18, fontWeight: '700', color: colors.voltage },
    compactName: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
    compactMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
    compactRating: { fontSize: 12, color: colors.text.secondary },
    compactDot: { fontSize: 12, color: colors.text.tertiary },
    compactVehicle: { fontSize: 12, color: colors.text.secondary },
});

export default ProviderCard;
