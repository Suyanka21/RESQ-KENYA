// ⚡ ResQ Kenya - Confirmation Card Component
// Success confirmation with service details

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CheckCircle, MapPin, Clock, CreditCard } from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme/voltage-premium';

interface ConfirmationCardProps {
    service: string;
    estimatedCost: number;
    eta: string;
    location?: string;
    onTrack: () => void;
}

export const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
    service,
    estimatedCost,
    eta,
    location,
    onTrack
}) => {
    return (
        <View style={styles.card}>
            {/* Success Header */}
            <View style={styles.header}>
                <View style={styles.successIcon}>
                    <CheckCircle size={48} color={colors.success} strokeWidth={2} />
                </View>
                <Text style={styles.title}>Request Confirmed</Text>
                <Text style={styles.subtitle}>Your provider is on the way</Text>
            </View>

            {/* Details Section */}
            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                        <CreditCard size={18} color={colors.voltage} />
                    </View>
                    <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Service</Text>
                        <Text style={styles.detailValue}>{service}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                        <Clock size={18} color={colors.voltage} />
                    </View>
                    <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Estimated Arrival</Text>
                        <Text style={styles.detailValueHighlight}>{eta}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                        <CreditCard size={18} color={colors.voltage} />
                    </View>
                    <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Estimated Cost</Text>
                        <Text style={styles.detailValue}>KES {estimatedCost.toLocaleString()}</Text>
                    </View>
                </View>

                {location && (
                    <>
                        <View style={styles.divider} />
                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <MapPin size={18} color={colors.voltage} />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Pickup Location</Text>
                                <Text style={styles.detailValue} numberOfLines={1}>{location}</Text>
                            </View>
                        </View>
                    </>
                )}
            </View>

            {/* Track Button */}
            <Pressable
                style={({ pressed }) => [
                    styles.trackButton,
                    pressed && styles.trackButtonPressed
                ]}
                onPress={onTrack}
            >
                <Text style={styles.trackButtonText}>Track Provider</Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius['2xl'],
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    successIcon: {
        marginBottom: spacing.md,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: 14,
        color: colors.text.secondary,
    },
    details: {
        backgroundColor: colors.charcoal[700],
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    detailIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: `${colors.voltage}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: colors.text.muted,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 15,
        color: colors.text.primary,
        fontWeight: '500',
    },
    detailValueHighlight: {
        fontSize: 16,
        color: colors.voltage,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: colors.charcoal[600],
        marginVertical: spacing.xs,
    },
    trackButton: {
        backgroundColor: colors.voltage,
        paddingVertical: 16,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        ...shadows.button,
    },
    trackButtonPressed: {
        opacity: 0.9,
    },
    trackButtonText: {
        color: colors.charcoal[900],
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});

export default ConfirmationCard;
