// ⚡ ResQ Kenya - Searching Screen
// Radar rings, rotating messages, expandable summary, progress bar

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, Pressable, StyleSheet, Animated, Easing, Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, MapPin, ChevronDown, ChevronUp, X, ChevronLeft, Wrench } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import TrackingMap from '../../../../components/maps/TrackingMap';
import { colors } from '../../../../theme/voltage-premium';

const { width } = Dimensions.get('window');

const LOADING_MESSAGES = [
    'Finding the closest available provider...',
    'Checking provider availability...',
    'Confirming service match...',
];

export default function SearchingScreen() {
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ serviceType?: string; price?: string }>();
    const serviceType = params.serviceType || 'Service Request';
    const price = params.price ? parseInt(params.price, 10) : 0;

    // --- State ---
    const [messageIdx, setMessageIdx] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    // --- Animations ---
    const ring1 = useRef(new Animated.Value(0.5)).current;
    const ring1Op = useRef(new Animated.Value(0.4)).current;
    const ring2 = useRef(new Animated.Value(0.5)).current;
    const ring2Op = useRef(new Animated.Value(0.3)).current;
    const ring3 = useRef(new Animated.Value(0.5)).current;
    const ring3Op = useRef(new Animated.Value(0.2)).current;

    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    const progressSlide = useRef(new Animated.Value(0)).current;

    // Radar rings
    useEffect(() => {
        const makeRing = (scale: Animated.Value, opacity: Animated.Value, delay: number) => {
            setTimeout(() => {
                Animated.loop(
                    Animated.parallel([
                        Animated.sequence([
                            Animated.timing(scale, { toValue: 2.5, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                            Animated.timing(scale, { toValue: 0.5, duration: 0, useNativeDriver: true }),
                        ]),
                        Animated.sequence([
                            Animated.timing(opacity, { toValue: 0, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                            Animated.timing(opacity, { toValue: 0.4, duration: 0, useNativeDriver: true }),
                        ]),
                    ])
                ).start();
            }, delay);
        };
        makeRing(ring1, ring1Op, 0);
        makeRing(ring2, ring2Op, 700);
        makeRing(ring3, ring3Op, 1400);
    }, []);

    // Bouncing dots
    useEffect(() => {
        const bounce = (dot: Animated.Value, delay: number) => {
            setTimeout(() => {
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(dot, { toValue: -10, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                        Animated.timing(dot, { toValue: 0, duration: 300, easing: Easing.in(Easing.ease), useNativeDriver: true }),
                        Animated.delay(400),
                    ])
                ).start();
            }, delay);
        };
        bounce(dot1, 0);
        bounce(dot2, 200);
        bounce(dot3, 400);
    }, []);

    // Sliding progress bar
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(progressSlide, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
                Animated.timing(progressSlide, { toValue: 0, duration: 0, useNativeDriver: false }),
            ])
        ).start();
    }, []);

    // Rotating messages
    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Auto-transition after 9 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace({
                pathname: '/(customer)/request/tracking/en-route',
                params: { serviceType, price: String(price) },
            });
        }, 9000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.root}>
            <StatusBar style="light" />

            {/* Map Area (30%) */}
            <View style={styles.mapArea}>
                <TrackingMap
                    customerLocation={{ latitude: -1.2921, longitude: 36.8219 }}
                    isLoading
                    serviceType={serviceType.toLowerCase()}
                />

                {/* Radar rings overlay */}
                <View style={styles.radarCenter}>
                    <Animated.View style={[styles.radarRing, { transform: [{ scale: ring1 }], opacity: ring1Op }]} />
                    <Animated.View style={[styles.radarRing, styles.radarRing2, { transform: [{ scale: ring2 }], opacity: ring2Op }]} />
                    <Animated.View style={[styles.radarRing, styles.radarRing3, { transform: [{ scale: ring3 }], opacity: ring3Op }]} />
                    {/* Blue user pin */}
                    <View style={styles.userPin} />
                    <View style={styles.userPinPulse} />
                </View>
            </View>

            {/* Main Content Area */}
            <View style={styles.content}>
                {/* Top bar */}
                <View style={[styles.topBar, { paddingTop: insets.top > 0 ? 8 : 16 }]}>
                    <Pressable
                        style={({ pressed }) => [styles.topBtn, pressed && { backgroundColor: colors.background.tertiary, transform: [{ scale: 0.9 }] }]}
                        onPress={() => router.back()}
                        accessibilityLabel="Go back" accessibilityRole="button"
                    >
                        <ChevronLeft size={22} color={colors.text.primary} strokeWidth={2} />
                    </Pressable>
                    <Text style={styles.topTitle}>Finding Provider</Text>
                    <Pressable
                        style={({ pressed }) => [styles.topBtn, pressed && { backgroundColor: colors.background.tertiary, transform: [{ scale: 0.9 }] }]}
                        onPress={() => router.back()}
                        accessibilityLabel="Cancel" accessibilityRole="button"
                    >
                        <X size={20} color={colors.text.primary} strokeWidth={2} />
                    </Pressable>
                </View>

                {/* Animated radar icon */}
                <View style={styles.radarIconWrap}>
                    <View style={styles.radarIconCircle}>
                        <Search size={32} color={colors.voltage} strokeWidth={2} />
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>Finding Provider</Text>
                <Text style={styles.subtitle}>Searching for available providers nearby</Text>

                {/* Bouncing dots */}
                <View style={styles.dotsRow}>
                    <Animated.View style={[styles.dot, { transform: [{ translateY: dot1 }] }]} />
                    <Animated.View style={[styles.dot, { transform: [{ translateY: dot2 }] }]} />
                    <Animated.View style={[styles.dot, { transform: [{ translateY: dot3 }] }]} />
                </View>

                {/* Search Progress Card */}
                <View style={styles.progressCard}>
                    <View style={styles.progressRow}>
                        <Text style={styles.progressLabel}>Search radius</Text>
                        <Text style={styles.expandingText}>Expanding...</Text>
                    </View>
                    <View style={styles.progressTrack}>
                        <Animated.View style={[styles.progressFill, {
                            left: progressSlide.interpolate({ inputRange: [0, 1], outputRange: ['-40%', '100%'] }),
                            width: '40%',
                        }]} />
                    </View>
                    <View style={styles.progressRow}>
                        <Text style={styles.progressLabel}>Providers in area</Text>
                        <Text style={styles.checkingText}>Checking...</Text>
                    </View>
                </View>

                {/* Expandable Service Summary */}
                <Pressable
                    style={[styles.summaryCard, isExpanded && styles.summaryCardExpanded]}
                    onPress={() => setIsExpanded(!isExpanded)}
                    accessibilityLabel="Toggle service details"
                >
                    <View style={styles.summaryHeader}>
                        <View style={styles.summaryIconWrap}>
                            <Wrench size={20} color={colors.voltage} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.summaryTitle}>{serviceType}</Text>
                            <View style={styles.summaryLocation}>
                                <MapPin size={12} color={colors.text.secondary} />
                                <Text style={styles.summaryLocationText} numberOfLines={1}>Nairobi, Kenya</Text>
                            </View>
                        </View>
                        <View style={styles.summaryRight}>
                            <Text style={styles.summaryPrice}>KES {price.toLocaleString()}</Text>
                            {isExpanded
                                ? <ChevronUp size={16} color={colors.text.secondary} />
                                : <ChevronDown size={16} color={colors.text.secondary} />
                            }
                        </View>
                    </View>

                    {isExpanded && (
                        <View style={styles.summaryDetails}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryDetailLabel}>Request ID</Text>
                                <Text style={styles.summaryDetailValue}>#RQ-8921</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryDetailLabel}>Payment Method</Text>
                                <Text style={styles.summaryDetailValue}>Cash / M-Pesa</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryDetailLabel}>Status</Text>
                                <Text style={[styles.summaryDetailValue, { color: colors.voltage }]}>Broadcasting request...</Text>
                            </View>
                        </View>
                    )}
                </Pressable>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.rotatingMsg}>{LOADING_MESSAGES[messageIdx]}</Text>
                    <Pressable
                        style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]}
                        onPress={() => router.back()}
                        accessibilityLabel="Cancel request" accessibilityRole="button"
                    >
                        <Text style={styles.cancelText}>Cancel Request</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary },
    mapArea: { height: '30%' as any, width: '100%', borderBottomWidth: 1, borderBottomColor: colors.background.border },

    // Radar overlay
    radarCenter: { position: 'absolute', top: '50%' as any, left: '50%' as any, marginLeft: -60, marginTop: -60, width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
    radarRing: { position: 'absolute', width: 128, height: 128, borderRadius: 64, borderWidth: 1, borderColor: colors.voltageGlow, backgroundColor: 'rgba(255,165,0,0.1)' },
    radarRing2: { width: 180, height: 180, borderRadius: 90, borderColor: 'rgba(255,165,0,0.25)', backgroundColor: 'transparent' },
    radarRing3: { width: 240, height: 240, borderRadius: 120, borderColor: 'rgba(255,165,0,0.15)', backgroundColor: 'transparent' },
    userPin: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.status.info, shadowColor: colors.status.info, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 6, zIndex: 20 },
    userPinPulse: { position: 'absolute', width: 32, height: 32, borderRadius: 16, backgroundColor: colors.status.infoGlow },

    // Content
    content: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 0, paddingBottom: 32 },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 0, marginBottom: 8 },
    topBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.text.opacity20, alignItems: 'center', justifyContent: 'center' },
    topTitle: { fontSize: 17, fontWeight: '700', color: colors.text.primary, letterSpacing: 0.3 },

    // Radar icon
    radarIconWrap: { marginBottom: 16 },
    radarIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,165,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,165,0,0.3)', alignItems: 'center', justifyContent: 'center' },

    // Text
    title: { fontSize: 24, fontWeight: '700', color: colors.text.primary, marginBottom: 4 },
    subtitle: { fontSize: 16, color: colors.text.secondary, marginBottom: 8 },

    // Dots
    dotsRow: { flexDirection: 'row', gap: 6, marginBottom: 24 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.voltage },

    // Progress card
    progressCard: {
        width: '100%', backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.background.border,
        borderLeftWidth: 3, borderLeftColor: colors.voltage, borderRadius: 12, padding: 16, marginBottom: 12,
    },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    progressLabel: { fontSize: 14, color: colors.text.secondary },
    expandingText: { fontSize: 12, color: colors.text.primary, fontFamily: 'monospace' },
    progressTrack: { height: 6, backgroundColor: colors.background.border, borderRadius: 3, overflow: 'hidden', marginVertical: 12, position: 'relative' },
    progressFill: { position: 'absolute', top: 0, bottom: 0, backgroundColor: colors.voltage, borderRadius: 3 },
    checkingText: { fontSize: 12, color: colors.voltage },

    // Summary card
    summaryCard: { width: '100%', backgroundColor: colors.background.tertiary, borderRadius: 12, borderWidth: 1, borderColor: colors.background.border, padding: 12 },
    summaryCardExpanded: { padding: 16 },
    summaryHeader: { flexDirection: 'row', alignItems: 'center' },
    summaryIconWrap: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.charcoal[500], alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    summaryTitle: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
    summaryLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    summaryLocationText: { fontSize: 12, color: colors.text.secondary, maxWidth: 150 },
    summaryRight: { alignItems: 'flex-end' },
    summaryPrice: { fontSize: 14, fontWeight: '700', color: colors.voltage, fontFamily: 'monospace' },
    summaryDetails: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.charcoal[500], gap: 8 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryDetailLabel: { fontSize: 12, color: colors.text.secondary },
    summaryDetailValue: { fontSize: 12, color: colors.text.primary, fontFamily: 'monospace' },

    // Footer
    footer: { marginTop: 'auto' as any, alignItems: 'center', gap: 24, width: '100%' },
    rotatingMsg: { fontSize: 14, color: colors.text.secondary, fontWeight: '500', textAlign: 'center' },
    cancelBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
    cancelText: { fontSize: 16, fontWeight: '700', color: colors.status.error },
});
