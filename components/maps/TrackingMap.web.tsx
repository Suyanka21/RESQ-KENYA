// ResQ Kenya - Tracking Map Component (Web Version)
// Placeholder UI for web since react-native-maps is native-only

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/voltage-premium';
import type { GeoLocation } from '../../types';

interface TrackingMapProps {
    customerLocation: GeoLocation;
    providerLocation?: GeoLocation | null;
    eta?: number;
    distance?: number;
    showRoute?: boolean;
    serviceType?: string;
    isLoading?: boolean;
    onMapReady?: () => void;
    routeCoordinates?: { latitude: number; longitude: number }[];
    traveledCoordinates?: { latitude: number; longitude: number }[];
}

export default function TrackingMap({
    eta,
    distance,
    serviceType = 'towing',
    isLoading = false,
}: TrackingMapProps) {
    const getProviderEmoji = () => {
        const emojis: Record<string, string> = {
            towing: '🚛', tire: '🔧', battery: '⚡',
            fuel: '⛽', diagnostics: '🔍', ambulance: '🚑',
        };
        return emojis[serviceType] || '🚗';
    };

    const formatETA = (seconds: number) => {
        const minutes = Math.round(seconds / 60);
        return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.emoji}>{getProviderEmoji()}</Text>
            <Text style={styles.title}>Live Tracking</Text>
            <Text style={styles.subtitle}>
                {'Map view is available on mobile devices.\nYour provider is on the way!'}
            </Text>

            {(eta != null && eta > 0) || (distance != null && distance > 0) ? (
                <View style={styles.infoCard}>
                    {eta != null && eta > 0 ? (
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>ETA</Text>
                            <Text style={styles.infoValue}>{formatETA(eta)}</Text>
                        </View>
                    ) : null}
                    {distance != null && distance > 0 ? (
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Distance</Text>
                            <Text style={styles.infoValue}>{distance.toFixed(1)} km</Text>
                        </View>
                    ) : null}
                </View>
            ) : null}

            {isLoading ? (
                <Text style={styles.loading}>Finding providers...</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.charcoal[800],
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        color: colors.voltage,
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: colors.charcoal[700],
        borderRadius: 16,
        padding: 20,
        marginTop: 32,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
    },
    infoItem: {
        flex: 1,
        alignItems: 'center',
    },
    infoLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        marginBottom: 4,
    },
    infoValue: {
        color: colors.voltage,
        fontSize: 24,
        fontWeight: 'bold',
    },
    loading: {
        color: 'rgba(255,255,255,0.6)',
        marginTop: 24,
    },
});
