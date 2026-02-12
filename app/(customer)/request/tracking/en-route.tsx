// ⚡ ResQ Kenya - En Route Screen
// Provider found, traveling to customer. Progress steps, distance tracker, call/message.
// Uses Car icon (not truck) per user request. Buttons match back-button toggle effect.

import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, Pressable, StyleSheet, Animated, Easing, ScrollView, Dimensions, Alert, Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Phone, MessageSquare, Check, Clock, Car, ChevronLeft,
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

const { width, height } = Dimensions.get('window');
const TOTAL_DISTANCE = 2.4; // km

export default function EnRouteScreen() {
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ serviceType?: string; price?: string }>();
    const serviceType = params.serviceType || 'Service Request';

    const [distance, setDistance] = useState(TOTAL_DISTANCE);
    const [progress, setProgress] = useState(30);

    // Simulate movement
    useEffect(() => {
        const interval = setInterval(() => {
            setDistance(prev => Math.max(0, prev - 0.2));
            setProgress(prev => Math.min(100, prev + 2.5));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Trigger arrival transition
    useEffect(() => {
        if (distance <= 0.2) {
            const timeout = setTimeout(() => {
                router.replace({
                    pathname: '/(customer)/request/tracking/arriving',
                    params: { serviceType, price: params.price },
                });
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [distance]);

    const providerProgress = Math.min(progress / 100, 1);
    const etaMinutes = Math.ceil(distance * 3);

    // Provider follows pre-computed Nairobi road waypoints
    const providerLocation = getPointAlongRoute(providerProgress);
    const traveledRoute = getTraveledRoute(providerProgress);
    const remainingRoute = getRemainingRoute(providerProgress);

    const steps: Step[] = [
        { label: 'Matched', status: 'completed' },
        { label: 'En Route', status: 'active' },
        { label: 'Nearby', status: 'pending' },
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

            {/* Top Status Banner */}
            <View style={[styles.banner, { paddingTop: insets.top }]}>
                <View style={styles.bannerContent}>
                    <View style={styles.bannerCheck}>
                        <Check size={12} color={colors.text.onBrand} strokeWidth={3} />
                    </View>
                    <Text style={styles.bannerText}>Provider Found! En Route to You</Text>
                </View>
            </View>

            {/* Map View (flex: 1 → approximately 50%) */}
            <View style={styles.mapArea}>
                <TrackingMap
                    customerLocation={DEMO_CUSTOMER_LOC}
                    providerLocation={providerLocation}
                    showRoute
                    serviceType={serviceType.toLowerCase()}
                    distance={distance}
                    eta={etaMinutes * 60}
                    routeCoordinates={remainingRoute}
                    traveledCoordinates={traveledRoute}
                />

                {/* ETA Overlay */}
                <View style={styles.etaBadge}>
                    <Clock size={16} color={colors.voltage} />
                    <Text style={styles.etaText}>Arriving in {etaMinutes} mins</Text>
                </View>

                {/* Back button */}
                <Pressable
                    style={({ pressed }) => [styles.backBtn, { top: 16 }, pressed && { backgroundColor: colors.background.tertiary, transform: [{ scale: 0.9 }] }]}
                    onPress={() => router.back()}
                    accessibilityLabel="Go back" accessibilityRole="button"
                >
                    <ChevronLeft size={22} color={colors.text.primary} strokeWidth={2} />
                </Pressable>
            </View>

            {/* Bottom Card */}
            <View style={styles.bottomCard}>
                {/* Progress Steps */}
                <ProgressSteps steps={steps} />

                <ScrollView
                    style={styles.scrollArea}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Provider Info */}
                    <ProviderCard serviceType={serviceType} />

                    {/* Distance Tracker */}
                    <View style={styles.distanceCard}>
                        <View style={styles.distanceHeader}>
                            <Text style={styles.distanceLabel}>EST. DISTANCE</Text>
                            <Text style={styles.distanceValue}>{Math.max(0, distance).toFixed(1)} km</Text>
                        </View>
                        <View style={styles.distanceTrack}>
                            <View style={[styles.distanceFill, { width: `${progress}%` as any }]} />
                        </View>
                        <View style={styles.distanceFooter}>
                            <Text style={styles.distanceMeta}>
                                Distance covered: {(TOTAL_DISTANCE * (progress / 100)).toFixed(1)} km
                            </Text>
                            <Text style={[styles.distanceMeta, { color: colors.voltage }]}>
                                Remaining: {Math.max(0, distance).toFixed(1)} km
                            </Text>
                        </View>
                    </View>

                    {/* Action Buttons — match back-button toggle effect */}
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

                    {/* Cancel */}
                    <Pressable
                        style={({ pressed }) => [styles.cancelLink, pressed && { opacity: 0.6 }]}
                        onPress={() => router.back()}
                        accessibilityLabel="Cancel request" accessibilityRole="button"
                    >
                        <Text style={styles.cancelText}>Cancel request</Text>
                    </Pressable>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary },

    // Banner
    banner: { backgroundColor: colors.interactive.focus, borderBottomWidth: 2, borderBottomColor: colors.voltage, zIndex: 30 },
    bannerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
    bannerCheck: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.status.success, alignItems: 'center', justifyContent: 'center' },
    bannerText: { fontSize: 16, fontWeight: '700', color: colors.text.primary },

    // Map
    mapArea: { flex: 1, position: 'relative' },
    etaBadge: {
        position: 'absolute', top: 16, right: 16,
        backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.voltage,
        borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8,
        flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 20,
    },
    etaText: { fontSize: 14, fontWeight: '700', color: colors.voltage },
    backBtn: {
        position: 'absolute', left: 16, zIndex: 20,
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: colors.text.opacity20,
        alignItems: 'center', justifyContent: 'center',
    },

    // Bottom Card
    bottomCard: {
        backgroundColor: colors.background.secondary, borderTopLeftRadius: 24, borderTopRightRadius: 24,
        borderTopWidth: 1, borderTopColor: colors.background.border,
        height: '45%' as any, minHeight: 380,
    },
    scrollArea: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },

    // Distance
    distanceCard: {
        backgroundColor: colors.background.tertiary, borderRadius: 12, padding: 16,
        borderWidth: 1, borderColor: colors.background.border, marginBottom: 24,
    },
    distanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
    distanceLabel: { fontSize: 12, fontWeight: '500', color: colors.text.secondary, letterSpacing: 0.5 },
    distanceValue: { fontSize: 24, fontWeight: '700', color: colors.voltage },
    distanceTrack: { height: 8, backgroundColor: colors.background.secondary, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    distanceFill: { height: '100%' as any, backgroundColor: colors.voltage, borderRadius: 4 },
    distanceFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    distanceMeta: { fontSize: 10, color: colors.text.secondary },

    // Buttons — match the toggle effect from other screens
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

    // Cancel
    cancelLink: { alignItems: 'center', paddingVertical: 8 },
    cancelText: { fontSize: 14, fontWeight: '500', color: colors.status.error },
});
