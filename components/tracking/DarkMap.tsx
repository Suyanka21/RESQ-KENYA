// ⚡ ResQ Kenya - Dark Map Component (Shared)
// Extracted from tracking.tsx for reuse across tracking lifecycle screens

import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet, Dimensions, Platform } from 'react-native';
import { Car, Navigation } from 'lucide-react-native';
import { colors } from '../../theme/voltage-premium';

const { width, height } = Dimensions.get('window');

// Simulated route waypoints: provider → user (Nairobi-like path)
const ROUTE_WAYPOINTS = [
    { x: 0.18, y: 0.12 },
    { x: 0.24, y: 0.18 },
    { x: 0.30, y: 0.22 },
    { x: 0.35, y: 0.28 },
    { x: 0.40, y: 0.32 },
    { x: 0.44, y: 0.36 },
    { x: 0.46, y: 0.40 },
    { x: 0.48, y: 0.44 },
    { x: 0.50, y: 0.48 },
];
const USER_POS = { x: 0.50, y: 0.48 };

export { ROUTE_WAYPOINTS, USER_POS };

interface DarkMapProps {
    providerProgress: number;
    showRoute: boolean;
    isSearching?: boolean;
    heightPercent?: number; // 0-1, default full flex
    dimmed?: boolean;
}

export const DarkMap: React.FC<DarkMapProps> = ({
    providerProgress,
    showRoute,
    isSearching = false,
    dimmed = false,
}) => {
    const pulseScale = useRef(new Animated.Value(1)).current;
    const pulseOpacity = useRef(new Animated.Value(0.6)).current;

    useEffect(() => {
        Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(pulseScale, { toValue: 2.2, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                    Animated.timing(pulseScale, { toValue: 1, duration: 0, useNativeDriver: true }),
                ]),
                Animated.sequence([
                    Animated.timing(pulseOpacity, { toValue: 0, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                    Animated.timing(pulseOpacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
                ]),
            ])
        ).start();
    }, []);

    const getProviderPos = () => {
        const totalSegments = ROUTE_WAYPOINTS.length - 1;
        const segIndex = Math.min(Math.floor(providerProgress * totalSegments), totalSegments - 1);
        const segProgress = (providerProgress * totalSegments) - segIndex;
        const from = ROUTE_WAYPOINTS[segIndex];
        const to = ROUTE_WAYPOINTS[Math.min(segIndex + 1, totalSegments)];
        return {
            x: from.x + (to.x - from.x) * segProgress,
            y: from.y + (to.y - from.y) * segProgress,
        };
    };

    const getBearing = () => {
        const pos = getProviderPos();
        const dx = USER_POS.x - pos.x;
        const dy = USER_POS.y - pos.y;
        return (Math.atan2(dx, -dy) * 180) / Math.PI;
    };

    const providerPos = getProviderPos();
    const bearing = getBearing();

    return (
        <View style={styles.container}>
            {/* Road grid */}
            <View style={styles.gridOverlay}>
                {[15, 28, 42, 58, 72, 85].map((pct, i) => (
                    <View key={`h${i}`} style={[styles.roadH, { top: `${pct}%` as any }]} />
                ))}
                {[12, 25, 38, 52, 68, 82].map((pct, i) => (
                    <View key={`v${i}`} style={[styles.roadV, { left: `${pct}%` as any }]} />
                ))}
                <View style={[styles.roadH, { top: '34%' as any, width: '60%', left: '20%', transform: [{ rotate: '15deg' }] }]} />
                <View style={[styles.roadH, { top: '66%' as any, width: '50%', left: '25%', transform: [{ rotate: '-12deg' }] }]} />
            </View>

            {/* Buildings */}
            {[
                { t: '8%', l: '5%', w: 40, h: 28 },
                { t: '16%', l: '58%', w: 48, h: 32 },
                { t: '35%', l: '8%', w: 36, h: 44 },
                { t: '44%', l: '62%', w: 52, h: 28 },
                { t: '65%', l: '30%', w: 44, h: 36 },
                { t: '75%', l: '70%', w: 36, h: 24 },
                { t: '82%', l: '10%', w: 48, h: 20 },
            ].map((b, i) => (
                <View key={`b${i}`} style={[styles.building, {
                    top: b.t as any, left: b.l as any, width: b.w, height: b.h,
                }]} />
            ))}

            {/* Route polyline */}
            {showRoute && (
                <View style={styles.routeContainer}>
                    {ROUTE_WAYPOINTS.map((wp, i) => {
                        if (i === 0) return null;
                        const prev = ROUTE_WAYPOINTS[i - 1];
                        const dx = (wp.x - prev.x) * width;
                        const dy = (wp.y - prev.y) * height;
                        const length = Math.sqrt(dx * dx + dy * dy);
                        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                        return (
                            <View key={`r${i}`} style={[styles.routeSegment, {
                                left: prev.x * width, top: prev.y * height,
                                width: length, transform: [{ rotate: `${angle}deg` }],
                            }]} />
                        );
                    })}
                </View>
            )}

            {/* User location (pulsing dot) */}
            <View style={[styles.userPos, {
                left: USER_POS.x * width - 20,
                top: USER_POS.y * height - 20,
            }]}>
                <Animated.View style={[styles.userPulse, {
                    transform: [{ scale: pulseScale }],
                    opacity: pulseOpacity,
                }]} />
                <View style={styles.userDot}>
                    <View style={styles.userDotCore} />
                </View>
            </View>

            {/* Provider marker — uses Car icon per user request */}
            {showRoute && !isSearching && (
                <View style={[styles.providerMarker, {
                    left: providerPos.x * width - 22,
                    top: providerPos.y * height - 22,
                }]}>
                    <View style={[styles.providerIconWrap, {
                        transform: [{ rotate: `${bearing}deg` }],
                    }]}>
                        <Car size={22} color={colors.background.primary} strokeWidth={2.5} fill={colors.voltage} />
                    </View>
                </View>
            )}

            {/* Searching radar */}
            {isSearching && (
                <View style={styles.searchingOverlay}>
                    <Animated.View style={[styles.searchPulse, {
                        transform: [{ scale: pulseScale }],
                        opacity: pulseOpacity,
                    }]} />
                    <View style={styles.searchDot}>
                        <Navigation size={20} color={colors.voltage} strokeWidth={2} />
                    </View>
                </View>
            )}

            {/* Dim overlay */}
            {dimmed && <View style={styles.dimOverlay} />}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.primary },
    gridOverlay: { ...StyleSheet.absoluteFillObject },
    roadH: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: colors.background.secondary },
    roadV: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: colors.background.secondary },
    building: { position: 'absolute', backgroundColor: '#141414', borderRadius: 3, borderWidth: 1, borderColor: '#1E1E1E' },
    routeContainer: { ...StyleSheet.absoluteFillObject, zIndex: 5 },
    routeSegment: {
        position: 'absolute', height: 4, backgroundColor: colors.voltage,
        borderRadius: 2, transformOrigin: 'left center',
        shadowColor: colors.voltage, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6, shadowRadius: 8, elevation: 4,
    },
    userPos: { position: 'absolute', zIndex: 15, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    userPulse: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: colors.voltage },
    userDot: {
        width: 24, height: 24, borderRadius: 12, backgroundColor: colors.background.primary,
        borderWidth: 4, borderColor: colors.voltage, alignItems: 'center', justifyContent: 'center',
    },
    userDotCore: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.voltage },
    providerMarker: { position: 'absolute', zIndex: 20, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    providerIconWrap: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: 'rgba(15, 15, 15, 0.9)', borderWidth: 2, borderColor: colors.voltage,
        alignItems: 'center', justifyContent: 'center',
    },
    searchingOverlay: { position: 'absolute', top: '40%' as any, left: '50%' as any, marginLeft: -30, marginTop: -30, alignItems: 'center', zIndex: 25 },
    searchPulse: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: colors.voltageGlow },
    searchDot: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: 'rgba(15, 15, 15, 0.9)', borderWidth: 2, borderColor: colors.voltage,
        alignItems: 'center', justifyContent: 'center',
    },
    dimOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay.light, zIndex: 30 },
});

export default DarkMap;
