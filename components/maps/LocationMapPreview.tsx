// ⚡ ResQ Kenya - Location Map Preview
// Reusable map preview for service request forms (Step 2: Location)
// Shows a dark-styled map centered on Nairobi with a customer marker

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme/voltage-premium';

// Conditionally import react-native-maps
let MapView: any;
let Marker: any;
let PROVIDER_GOOGLE: any;

if (Platform.OS !== 'web') {
    try {
        const Maps = require('react-native-maps');
        MapView = Maps.default;
        Marker = Maps.Marker;
        PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
    } catch (e) {
        // react-native-maps not available
    }
}

const DARK_MAP_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8e8e8e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1d1d1d' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a3a3a' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#262626' }] },
];

// Default to Nairobi
const DEFAULT_REGION = {
    latitude: -1.2921,
    longitude: 36.8219,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
};

interface LocationMapPreviewProps {
    height?: number;
}

export default function LocationMapPreview({ height = 180 }: LocationMapPreviewProps) {
    // Web fallback
    if (Platform.OS === 'web' || !MapView) {
        return (
            <View style={[styles.fallback, { height }]}>
                <MapPin size={32} color={colors.voltage} strokeWidth={2} />
                <Text style={styles.fallbackText}>Map view available on mobile</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { height }]}>
            <MapView
                style={StyleSheet.absoluteFillObject}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                customMapStyle={DARK_MAP_STYLE}
                initialRegion={DEFAULT_REGION}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                showsUserLocation
                showsMyLocationButton={false}
                showsCompass={false}
            >
                <Marker
                    coordinate={{ latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude }}
                    title="Your Location"
                >
                    <View style={styles.marker}>
                        <View style={styles.markerInner} />
                    </View>
                </Marker>
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: colors.charcoal[600],
    },
    fallback: {
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.xl,
        borderWidth: 2,
        borderColor: colors.charcoal[600],
        borderStyle: 'dashed' as any,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    fallbackText: {
        fontSize: 14,
        color: colors.text.muted,
    },
    marker: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.voltage,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    markerInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.charcoal[900],
    },
});
