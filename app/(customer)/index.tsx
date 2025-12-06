// ⚡ ResQ Kenya - Customer Dashboard (Voltage Premium)
// Premium service selection with category colors and proper styling

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { ServiceCard } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { colors, SERVICE_TYPES, shadows, borderRadius, spacing } from '../../theme/voltage-premium';

export default function CustomerDashboard() {
    const handleServicePress = (serviceKey: string) => {
        router.push({
            pathname: '/(customer)/request/details',
            params: { serviceType: serviceKey },
        });
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.greeting}>Welcome back</Text>
                        <Text style={styles.headline}>
                            Need <Text style={styles.voltageText}>Rescue?</Text>
                        </Text>
                    </View>
                    <Pressable style={styles.notificationBtn}>
                        <Text style={styles.notificationIcon}>🔔</Text>
                        <View style={styles.notificationBadge} />
                    </Pressable>
                </View>

                {/* Location Bar */}
                <Pressable style={styles.locationBar}>
                    <Text style={styles.locationIcon}>📍</Text>
                    <Text style={styles.locationText}>Nairobi, Kenya</Text>
                    <Text style={styles.locationAction}>Change</Text>
                </Pressable>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Emergency Banner */}
                <Pressable
                    style={styles.emergencyBanner}
                    onPress={() => handleServicePress('ambulance')}
                >
                    <View style={styles.emergencyGlow} />
                    <View style={styles.emergencyIcon}>
                        <Text style={styles.emergencyEmoji}>🚑</Text>
                    </View>
                    <View style={styles.emergencyContent}>
                        <Text style={styles.emergencyTitle}>Medical Emergency?</Text>
                        <Text style={styles.emergencySubtitle}>Tap for immediate ambulance dispatch</Text>
                    </View>
                    <Text style={styles.emergencyArrow}>→</Text>
                </Pressable>

                {/* Services Section */}
                <Text style={styles.sectionTitle}>Roadside Services</Text>
                <View style={styles.serviceGrid}>
                    {Object.entries(SERVICE_TYPES)
                        .filter(([key]) => key !== 'ambulance')
                        .map(([key, service]) => (
                            <Pressable
                                key={key}
                                style={({ pressed }) => [
                                    styles.serviceCard,
                                    pressed && styles.serviceCardPressed,
                                ]}
                                onPress={() => handleServicePress(key)}
                            >
                                {/* Icon Container with Category Color */}
                                <View style={[
                                    styles.serviceIconContainer,
                                    { backgroundColor: `${service.color}15`, borderColor: `${service.color}40` }
                                ]}>
                                    <Text style={styles.serviceEmoji}>{service.emoji}</Text>
                                </View>

                                {/* Service Details */}
                                <Text style={styles.serviceName}>{service.name}</Text>
                                {service.basePrice > 0 && (
                                    <Text style={styles.servicePrice}>
                                        From KES {service.basePrice.toLocaleString()}
                                    </Text>
                                )}

                                {/* 24/7 Badge */}
                                <View style={styles.availableBadge}>
                                    <Text style={styles.availableBadgeText}>24/7</Text>
                                </View>
                            </Pressable>
                        ))}
                </View>

                {/* ResQ Plus Promo */}
                <View style={styles.promoCard}>
                    <View style={styles.promoHeader}>
                        <Text style={styles.promoIcon}>👑</Text>
                        <Text style={styles.promoTitle}>ResQ Plus</Text>
                    </View>
                    <Text style={styles.promoDescription}>
                        Get priority dispatch, discounted services, and 24/7 premium support.
                    </Text>
                    <Button
                        title="Upgrade Now - KES 2,500/month"
                        onPress={() => router.push('/(customer)/wallet')}
                        fullWidth
                    />
                </View>

                {/* Recent Activity Preview */}
                <View style={styles.recentSection}>
                    <View style={styles.recentHeader}>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        <Pressable onPress={() => router.push('/(customer)/history')}>
                            <Text style={styles.viewAllText}>View All</Text>
                        </Pressable>
                    </View>
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>📋</Text>
                        <Text style={styles.emptyText}>No recent requests</Text>
                        <Text style={styles.emptySubtext}>Your service history will appear here</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.charcoal[900],
    },

    // Header
    header: {
        backgroundColor: colors.charcoal[800],
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.charcoal[600],
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: 14,
        color: colors.text.secondary,
    },
    headline: {
        fontSize: 26,
        fontWeight: '700',
        color: colors.text.primary,
        marginTop: 2,
    },
    voltageText: {
        color: colors.voltage,
    },
    notificationBtn: {
        width: 44,
        height: 44,
        backgroundColor: colors.charcoal[700],
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    notificationIcon: {
        fontSize: 20,
    },
    notificationBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        backgroundColor: colors.voltage,
        borderRadius: 4,
    },

    // Location Bar
    locationBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.charcoal[700],
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
        marginTop: spacing.md,
    },
    locationIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    locationText: {
        flex: 1,
        fontSize: 15,
        color: colors.text.primary,
    },
    locationAction: {
        fontSize: 14,
        color: colors.voltage,
        fontWeight: '600',
    },

    // Scroll Content
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: 100,
    },

    // Emergency Banner
    emergencyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 61, 61, 0.1)',
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.emergency,
        padding: spacing.md,
        marginBottom: spacing.xl,
        position: 'relative',
        overflow: 'hidden',
    },
    emergencyGlow: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255, 61, 61, 0.1)',
    },
    emergencyIcon: {
        width: 56,
        height: 56,
        backgroundColor: 'rgba(255, 61, 61, 0.2)',
        borderRadius: borderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    emergencyEmoji: {
        fontSize: 28,
    },
    emergencyContent: {
        flex: 1,
    },
    emergencyTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.emergency,
    },
    emergencySubtitle: {
        fontSize: 13,
        color: colors.text.secondary,
        marginTop: 2,
    },
    emergencyArrow: {
        fontSize: 22,
        color: colors.emergency,
        fontWeight: '600',
    },

    // Section Title
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.md,
    },

    // Service Grid
    serviceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
    },
    serviceCard: {
        width: '48%',
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
        padding: spacing.md,
        marginBottom: spacing.md,
        position: 'relative',
    },
    serviceCardPressed: {
        borderColor: colors.voltage,
        transform: [{ scale: 0.98 }],
    },
    serviceIconContainer: {
        width: 52,
        height: 52,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    serviceEmoji: {
        fontSize: 26,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: 4,
    },
    servicePrice: {
        fontSize: 13,
        color: colors.text.secondary,
    },
    availableBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: colors.voltage,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: borderRadius.sm,
    },
    availableBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.charcoal[900],
    },

    // Promo Card
    promoCard: {
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: `${colors.voltage}40`,
        padding: spacing.lg,
        marginBottom: spacing.xl,
    },
    promoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    promoIcon: {
        fontSize: 22,
        marginRight: 8,
    },
    promoTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.voltage,
    },
    promoDescription: {
        fontSize: 14,
        color: colors.text.secondary,
        lineHeight: 20,
        marginBottom: spacing.md,
    },

    // Recent Section
    recentSection: {
        marginBottom: spacing.lg,
    },
    recentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    viewAllText: {
        fontSize: 14,
        color: colors.voltage,
        fontWeight: '600',
    },
    emptyState: {
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyEmoji: {
        fontSize: 40,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
    },
    emptySubtext: {
        fontSize: 13,
        color: colors.text.secondary,
        marginTop: 4,
    },
});
