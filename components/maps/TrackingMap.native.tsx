// ResQ Kenya - Tracking Map Component
// Real-time map showing provider and customer locations

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/voltage-premium';
import type { GeoLocation } from '../../types';

// Conditionally import react-native-maps only on native platforms
let MapView: any;
let Marker: any;
let Polyline: any;
let PROVIDER_GOOGLE: any;

if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

// Type for Region
interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}

// Map styling for dark mode
const DARK_MAP_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8e8e8e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1d1d1d' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a3a3a' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#262626' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a3d1a' }] },
];

// Nairobi default region
const DEFAULT_REGION: Region = {
    latitude: -1.2921,
    longitude: 36.8219,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

interface TrackingMapProps {
    customerLocation: GeoLocation;
    providerLocation?: GeoLocation | null;
    eta?: number; // seconds
    distance?: number; // km
    showRoute?: boolean;
    serviceType?: string;
    isLoading?: boolean;
    onMapReady?: () => void;
}

export default function TrackingMap({
    customerLocation,
    providerLocation,
    eta,
    distance,
    showRoute = true,
    serviceType = 'towing',
    isLoading = false,
    onMapReady,
}: TrackingMapProps) {
    const mapRef = useRef<any>(null);
    const [region, setRegion] = useState<Region>({
        ...DEFAULT_REGION,
        latitude: customerLocation.latitude,
        longitude: customerLocation.longitude,
    });

    // Fit map to show both markers
    useEffect(() => {
        if (mapRef.current && providerLocation) {
            mapRef.current.fitToCoordinates(
                [
                    { latitude: customerLocation.latitude, longitude: customerLocation.longitude },
                    { latitude: providerLocation.latitude, longitude: providerLocation.longitude },
                ],
                {
                    edgePadding: { top: 100, bottom: 200, left: 50, right: 50 },
                    animated: true,
                }
            );
        }
    }, [providerLocation?.latitude, providerLocation?.longitude]);

    // Get emoji for service type
    const getProviderEmoji = () => {
        const emojis: Record<string, string> = {
            towing: '🚛',
            tire: '🔧',
            battery: '⚡',
            fuel: '⛽',
            diagnostics: '🔍',
            ambulance: '🚑',
        };
        return emojis[serviceType] || '🚗';
    };

    // Format ETA for display
    const formatETA = (seconds: number) => {
        const minutes = Math.round(seconds / 60);
        if (minutes < 60) {
            return `${minutes} min`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMins = minutes % 60;
        return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
    };

    // Web fallback - react-native-maps doesn't work on web
    if (Platform.OS === 'web') {
        return (
            <View className="flex-1 bg-charcoal-800 items-center justify-center">
                <Text style={{ fontSize: 48, marginBottom: 16 }}>{getProviderEmoji()}</Text>
                <Text style={{ color: colors.voltage, fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
                    Live Tracking
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', paddingHorizontal: 32 }}>
                    Map view is available on mobile devices.
                    The provider is on their way!
                </Text>
                {(eta || distance) && (
                    <View style={styles.etaCard}>
                        {eta && (
                            <View style={styles.etaItem}>
                                <Text style={styles.etaLabel}>ETA</Text>
                                <Text style={styles.etaValue}>{formatETA(eta)}</Text>
                            </View>
                        )}
                        {distance && (
                            <View style={styles.etaItem}>
                                <Text style={styles.etaLabel}>Distance</Text>
                                <Text style={styles.etaValue}>{distance.toFixed(1)} km</Text>
                            </View>
                        )}
                    </View>
                )}
            </View>
        );
    }

    return (
        <View className="flex-1">
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                customMapStyle={DARK_MAP_STYLE}
                initialRegion={region}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={false}
                onMapReady={onMapReady}
            >
                {/* Customer Location Marker */}
                <Marker
                    coordinate={{
                        latitude: customerLocation.latitude,
                        longitude: customerLocation.longitude,
                    }}
                    title="Your Location"
                    anchor={{ x: 0.5, y: 0.5 }}
                >
                    <View style={styles.customerMarker}>
                        <View style={styles.customerMarkerInner} />
                    </View>
                </Marker>

                {/* Provider Location Marker */}
                {providerLocation && (
                    <Marker
                        coordinate={{
                            latitude: providerLocation.latitude,
                            longitude: providerLocation.longitude,
                        }}
                        title="Service Provider"
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={styles.providerMarker}>
                            <Text style={styles.providerEmoji}>{getProviderEmoji()}</Text>
                        </View>
                    </Marker>
                )}

                {/* Route Line */}
                {showRoute && providerLocation && (
                    <Polyline
                        coordinates={[
                            { latitude: providerLocation.latitude, longitude: providerLocation.longitude },
                            { latitude: customerLocation.latitude, longitude: customerLocation.longitude },
                        ]}
                        strokeColor={colors.voltage}
                        strokeWidth={3}
                        lineDashPattern={[10, 5]}
                    />
                )}
            </MapView>

            {/* ETA Overlay */}
            {providerLocation && (eta || distance) && (
                <View style={styles.etaOverlay}>
                    <View style={styles.etaCard}>
                        {eta && (
                            <View style={styles.etaItem}>
                                <Text style={styles.etaLabel}>ETA</Text>
                                <Text style={styles.etaValue}>{formatETA(eta)}</Text>
                            </View>
                        )}
                        {distance && (
                            <View style={styles.etaItem}>
                                <Text style={styles.etaLabel}>Distance</Text>
                                <Text style={styles.etaValue}>{distance.toFixed(1)} km</Text>
                            </View>
                        )}
                    </View>
                </View>
            )}

            {/* Loading Overlay */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.voltage} />
                    <Text style={styles.loadingText}>Finding providers...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    customerMarker: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.voltage,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    customerMarkerInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.charcoal[900],
    },
    providerMarker: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.charcoal[800],
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.voltage,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 5,
    },
    providerEmoji: {
        fontSize: 22,
    },
    etaOverlay: {
        position: 'absolute',
        top: 20,
        left: 16,
        right: 16,
    },
    etaCard: {
        flexDirection: 'row',
        backgroundColor: colors.charcoal[800],
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.charcoal[600],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    etaItem: {
        flex: 1,
        alignItems: 'center',
    },
    etaLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        marginBottom: 4,
    },
    etaValue: {
        color: colors.voltage,
        fontSize: 20,
        fontWeight: 'bold',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15,15,15,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#FFFFFF',
        marginTop: 16,
        fontSize: 16,
    },
});
