// Platform-specific MapView for WEB
// This file is used on web platform - provides fallback components

import React from 'react';
import { View, StyleSheet } from 'react-native';

// Web fallback MapView component
export const PlatformMapView = ({ children, style, ...props }: any) => {
    return (
        <View style={[styles.webMap, style]}>
            <View style={styles.webMapGrid}>
                <View style={styles.gridLine1} />
                <View style={styles.gridLine2} />
                <View style={styles.gridLine3} />
                <View style={styles.gridLine4} />
                <View style={styles.gridCircle1} />
                <View style={styles.gridCircle2} />
            </View>
            {children}
        </View>
    );
};

// Web fallback Marker component
export const PlatformMarker = ({ children, coordinate, ...props }: any) => {
    return (
        <View style={styles.webMarkerContainer}>
            {children}
        </View>
    );
};

// Web fallback Polyline component
export const PlatformPolyline = ({ coordinates, strokeColor, strokeWidth, ...props }: any) => {
    return null; // No visual representation on web
};

// No provider on web
export const PlatformProviderGoogle = undefined;

const styles = StyleSheet.create({
    webMap: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        position: 'relative',
        overflow: 'hidden',
    },
    webMapGrid: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.15,
    },
    gridLine1: {
        position: 'absolute',
        top: '30%',
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: '#3d3d3d',
    },
    gridLine2: {
        position: 'absolute',
        top: '60%',
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: '#3d3d3d',
    },
    gridLine3: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '30%',
        width: 2,
        backgroundColor: '#3d3d3d',
    },
    gridLine4: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '70%',
        width: 2,
        backgroundColor: '#3d3d3d',
    },
    gridCircle1: {
        position: 'absolute',
        top: '25%',
        left: '20%',
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 1,
        borderColor: '#3d3d3d',
    },
    gridCircle2: {
        position: 'absolute',
        top: '55%',
        right: '15%',
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#3d3d3d',
    },
    webMarkerContainer: {
        position: 'absolute',
        top: '45%',
        left: '50%',
        transform: [{ translateX: -20 }, { translateY: -20 }],
    },
});
