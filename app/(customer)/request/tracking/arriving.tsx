// ⚡ ResQ Kenya - Arriving Screen
// Provider is almost at the customer location. Countdown, preparation tips.

import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, Pressable, StyleSheet, Animated, Easing, ScrollView, Alert, Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    MapPin, Phone, MessageSquare, ChevronLeft, Bell,
    Flashlight, Shield, FileText,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import TrackingMap from '../../../../components/maps/TrackingMap';
import ProgressSteps from '../../../../components/tracking/ProgressSteps';
import ProviderCard from '../../../../components/tracking/ProviderCard';
import type { Step } from '../../../../components/tracking/ProgressSteps';
import { colors } from '../../../../theme/voltage-premium';
import {
    DEMO_CUSTOMER_LOC,
    getPointAlongRoute,
    getTraveledRoute,
    getRemainingRoute,
} from '../../../../constants/nairobiRoutes';

export default function ArrivingScreen() {
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ serviceType?: string; price?: string }>();
    const serviceType = params.serviceType || 'Service Request';

    const [countdown, setCountdown] = useState(60);
    const hasNavigated = useRef(false);

    // Pulse for arriving banner
    const bannerOpacity = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(bannerOpacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
                Animated.timing(bannerOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    // Countdown timer
    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Navigate when countdown reaches 0 — deferred to avoid setState-during-render
    useEffect(() => {
        if (countdown <= 0 && !hasNavigated.current) {
            hasNavigated.current = true;
            const timer = setTimeout(() => {
                router.replace({
                    pathname: '/(customer)/request/tracking/in-progress',
                    params: { serviceType, price: params.price },
                });
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const steps: Step[] = [
        { label: 'Matched', status: 'completed' },
        { label: 'En Route', status: 'completed' },
        { label: 'Nearby', status: 'active' },
        { label: 'Arrived', status: 'pending' },
    ];

    const handleCallProvider = () => {
        Linking.openURL('tel:+254700000000').catch(() => {
            Alert.alert('Call Provider', 'Unable to open dialer. Provider number: +254 700 000 000');
        });
    };

    const handleMessageProvider = () => {
        Alert.alert('Message Provider', 'In-app messaging coming soon. You can call the provider directly.', [
            { text: 'Call Instead', onPress: handleCallProvider },
            { text: 'OK', style: 'cancel' },
        ]);
    };

    return (
        <View style={styles.root}>
            <StatusBar style="light" />

            {/* Pulsing Alert Banner */}
            <Animated.View style={[styles.banner, { paddingTop: insets.top, opacity: bannerOpacity }]}>
                <View style={styles.bannerContent}>
                    <Bell size={18} color={colors.voltage} strokeWidth={2} />
                    <Text style={styles.bannerText}>Provider Arriving Soon!</Text>
                </View>
            </Animated.View>

            {/* Map */}
            <View style={styles.mapArea}>
                <TrackingMap
                    customerLocation={DEMO_CUSTOMER_LOC}
                    providerLocation={getPointAlongRoute(0.95)}
                    showRoute
                    serviceType={serviceType.toLowerCase()}
                    distance={0.3}
                    eta={countdown}
                    routeCoordinates={getRemainingRoute(0.95)}
                    traveledCoordinates={getTraveledRoute(0.95)}
                />
                <Pressable
                    style={({ pressed }) => [styles.backBtn, { top: 16 }, pressed && { backgroundColor: colors.background.tertiary, transform: [{ scale: 0.9 }] }]}
                    onPress={() => router.back()}
                    accessibilityLabel="Go back" accessibilityRole="button"
                >
                    <ChevronLeft size={22} color={colors.text.primary} strokeWidth={2} />
                </Pressable>

                {/* Countdown */}
                <View style={styles.countdownBadge}>
                    <Text style={styles.countdownNum}>{countdown}</Text>
                    <Text style={styles.countdownLabel}>seconds away</Text>
                </View>
            </View>

            {/* Bottom Card */}
            <View style={styles.bottomCard}>
                <ProgressSteps steps={steps} />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Compact Provider Card */}
                    <ProviderCard compact />

                    {/* Preparation Tips */}
                    <View style={styles.tipsCard}>
                        <Text style={styles.tipsTitle}>PREPARATION TIPS</Text>
                        <View style={styles.tipsList}>
                            {[
                                { icon: MapPin, text: 'Be visible at your location' },
                                { icon: Flashlight, text: 'Use flashlight if dark' },
                                { icon: Shield, text: 'Keep valuables secure' },
                                { icon: FileText, text: 'Have vehicle docs ready' },
                            ].map(({ icon: Icon, text }, i) => (
                                <View key={i} style={styles.tipRow}>
                                    <Icon size={16} color={colors.voltage} />
                                    <Text style={styles.tipText}>{text}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.buttonsRow}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.callBtn,
                                pressed && { backgroundColor: '#00C853', transform: [{ scale: 0.95 }] },
                            ]}
                            onPress={handleCallProvider}
                            accessibilityLabel="Call provider" accessibilityRole="button"
                        >
                            <Phone size={20} color={colors.text.onBrand} strokeWidth={2} />
                            <Text style={styles.callBtnText}>Call</Text>
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.msgBtn,
                                pressed && { backgroundColor: colors.interactive.focus, transform: [{ scale: 0.95 }] },
                            ]}
                            onPress={handleMessageProvider}
                            accessibilityLabel="Message provider" accessibilityRole="button"
                        >
                            <MessageSquare size={20} color={colors.voltage} strokeWidth={2} />
                            <Text style={styles.msgBtnText}>Message</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary },

    // Banner
    banner: { backgroundColor: colors.interactive.focus, borderBottomWidth: 2, borderBottomColor: colors.voltage, zIndex: 30 },
    bannerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
    bannerText: { fontSize: 16, fontWeight: '700', color: colors.voltage },

    // Map
    mapArea: {
        height: '45%' as any, minHeight: 380,
        borderBottomWidth: 1, borderBottomColor: colors.background.border, position: 'relative',
    },
    backBtn: {
        position: 'absolute', left: 16, zIndex: 20,
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: colors.text.opacity20,
        alignItems: 'center', justifyContent: 'center',
    },
    countdownBadge: {
        position: 'absolute', bottom: 20, alignSelf: 'center',
        backgroundColor: colors.background.secondary, borderWidth: 2, borderColor: colors.voltage,
        paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16,
        alignItems: 'center', zIndex: 15,
        shadowColor: colors.voltage, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
    },
    countdownNum: { fontSize: 28, fontWeight: '700', color: colors.voltage, fontFamily: 'monospace' },
    countdownLabel: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },

    // Bottom Card
    bottomCard: {
        flex: 1, backgroundColor: colors.background.secondary,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        borderTopWidth: 1, borderTopColor: colors.background.border,
    },
    scrollContent: { padding: 20, paddingBottom: 40 },

    // Tips
    tipsCard: {
        backgroundColor: colors.background.tertiary, borderRadius: 12,
        padding: 16, borderWidth: 1, borderColor: colors.background.border, marginBottom: 24,
    },
    tipsTitle: { fontSize: 12, fontWeight: '700', color: colors.text.secondary, letterSpacing: 0.5, marginBottom: 12 },
    tipsList: { gap: 10 },
    tipRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    tipText: { fontSize: 14, color: colors.text.primary },

    // Buttons
    buttonsRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    callBtn: {
        flex: 1, height: 56, borderRadius: 12, backgroundColor: colors.status.success,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        shadowColor: colors.status.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4,
    },
    callBtnText: { fontSize: 16, fontWeight: '700', color: colors.text.onBrand },
    msgBtn: {
        flex: 1, height: 56, borderRadius: 12, backgroundColor: 'transparent',
        borderWidth: 2, borderColor: colors.voltage,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    msgBtnText: { fontSize: 16, fontWeight: '700', color: colors.voltage },
});
