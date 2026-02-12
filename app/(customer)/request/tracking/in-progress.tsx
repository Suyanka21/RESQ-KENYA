// ⚡ ResQ Kenya - Service In Progress Screen
// Timer, service timeline, live updates feed, report link.

import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, Pressable, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Clock, CheckCircle, Activity, AlertTriangle, Wrench,
    ChevronLeft,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import TrackingMap from '../../../../components/maps/TrackingMap';
import ProgressSteps from '../../../../components/tracking/ProgressSteps';
import type { Step } from '../../../../components/tracking/ProgressSteps';
import { colors } from '../../../../theme/voltage-premium';

interface UpdateItem {
    id: number;
    time: string;
    text: string;
    type: 'info' | 'progress' | 'alert';
}

export default function InProgressScreen() {
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ serviceType?: string; price?: string }>();
    const serviceType = params.serviceType || 'Service Request';

    const [elapsed, setElapsed] = useState(0);
    const [updates, setUpdates] = useState<UpdateItem[]>([
        { id: 1, time: '12:04 PM', text: 'Provider has started working on your vehicle', type: 'info' },
        { id: 2, time: '12:06 PM', text: 'Inspecting engine components', type: 'progress' },
        { id: 3, time: '12:12 PM', text: 'Issue identified and repair in progress', type: 'alert' },
    ]);

    // Timer
    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Simulate new update
    useEffect(() => {
        const timer = setTimeout(() => {
            setUpdates(prev => [...prev, {
                id: prev.length + 1,
                time: '12:18 PM',
                text: 'Replacement part installed, testing...',
                type: 'progress',
            }]);
        }, 8000);
        return () => clearTimeout(timer);
    }, []);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const steps: Step[] = [
        { label: 'Matched', status: 'completed' },
        { label: 'Arrived', status: 'completed' },
        { label: 'Working', status: 'active' },
        { label: 'Done', status: 'pending' },
    ];

    const getUpdateIcon = (type: 'info' | 'progress' | 'alert') => {
        switch (type) {
            case 'progress': return <Activity size={14} color={colors.voltage} />;
            case 'alert': return <AlertTriangle size={14} color={colors.status.warning} />;
            default: return <CheckCircle size={14} color={colors.status.success} />;
        }
    };

    const handleReportIssue = () => {
        Alert.alert(
            'Report an Issue',
            'What would you like to report?',
            [
                { text: 'Safety Concern', onPress: () => Alert.alert('Reported', 'Our safety team will contact you shortly.') },
                { text: 'Service Quality', onPress: () => Alert.alert('Reported', 'Your feedback has been noted. We\'ll follow up after service completion.') },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const handleCompleteDemo = () => {
        router.replace({
            pathname: '/(customer)/request/tracking/complete',
            params: { serviceType, price: params.price },
        });
    };

    return (
        <View style={styles.root}>
            <StatusBar style="light" />

            {/* Map Area (compact, 20%) */}
            <View style={styles.mapArea}>
                <TrackingMap
                    customerLocation={{ latitude: -1.2921, longitude: 36.8219 }}
                    providerLocation={{ latitude: -1.2923, longitude: 36.8218 }}
                    showRoute={false}
                    serviceType={serviceType.toLowerCase()}
                />
                {/* In-progress badge */}
                <View style={styles.inProgressBadge}>
                    <Wrench size={16} color={colors.voltage} />
                    <Text style={styles.inProgressText}>Service In Progress</Text>
                </View>
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
                {/* Top row */}
                <View style={[styles.topRow, { paddingTop: 0 }]}>
                    <Pressable
                        style={({ pressed }) => [styles.backBtn, pressed && { backgroundColor: colors.background.tertiary, transform: [{ scale: 0.9 }] }]}
                        onPress={() => router.back()}
                        accessibilityLabel="Go back" accessibilityRole="button"
                    >
                        <ChevronLeft size={22} color={colors.text.primary} strokeWidth={2} />
                    </Pressable>
                    <Text style={styles.screenTitle}>{serviceType}</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ProgressSteps steps={steps} />

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Timer */}
                    <View style={styles.timerCard}>
                        <Clock size={20} color={colors.voltage} />
                        <View style={styles.timerTextGroup}>
                            <Text style={styles.timerLabel}>Time Elapsed</Text>
                            <Text style={styles.timerValue}>{formatTime(elapsed)}</Text>
                        </View>
                    </View>

                    {/* Service Timeline */}
                    <View style={styles.timelineCard}>
                        <Text style={styles.sectionTitle}>SERVICE TIMELINE</Text>
                        {updates.map((update, idx) => (
                            <View key={update.id} style={styles.timelineItem}>
                                {/* Connector line */}
                                {idx < updates.length - 1 && <View style={styles.timelineLine} />}
                                {/* Dot */}
                                <View style={[styles.timelineDot,
                                update.type === 'alert' && { backgroundColor: colors.status.warning },
                                update.type === 'progress' && { backgroundColor: colors.voltage },
                                ]} />
                                {/* Content */}
                                <View style={styles.timelineContent}>
                                    <View style={styles.timelineTop}>
                                        {getUpdateIcon(update.type)}
                                        <Text style={styles.timelineTime}>{update.time}</Text>
                                    </View>
                                    <Text style={styles.timelineText}>{update.text}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Live Updates */}
                    <View style={styles.liveCard}>
                        <View style={styles.liveHeader}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveTitle}>Last Update</Text>
                        </View>
                        <Text style={styles.liveText}>
                            {updates[updates.length - 1]?.text || 'Waiting for updates...'}
                        </Text>
                    </View>

                    {/* Report Issue + Demo Button */}
                    <View style={styles.footerActions}>
                        <Pressable
                            style={({ pressed }) => [styles.reportLink, pressed && { opacity: 0.6 }]}
                            onPress={handleReportIssue}
                            accessibilityLabel="Report an issue" accessibilityRole="button"
                        >
                            <AlertTriangle size={14} color={colors.status.error} />
                            <Text style={styles.reportText}>Report an issue</Text>
                        </Pressable>

                        {/* Demo: Fast-forward to completion */}
                        <Pressable
                            style={({ pressed }) => [styles.demoBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]}
                            onPress={handleCompleteDemo}
                            accessibilityLabel="Skip to completion demo" accessibilityRole="button"
                        >
                            <Text style={styles.demoBtnText}>▶ Demo: Complete Service</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary },

    // Map (compact)
    mapArea: { height: '20%' as any, width: '100%', borderBottomWidth: 1, borderBottomColor: colors.background.border, position: 'relative' },
    inProgressBadge: {
        position: 'absolute', top: '50%' as any, left: '50%' as any,
        marginLeft: -80, marginTop: -20,
        backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.voltage,
        borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8,
        flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 40,
    },
    inProgressText: { fontSize: 14, fontWeight: '700', color: colors.voltage },

    // Content
    mainContent: { flex: 1, backgroundColor: colors.background.secondary, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    backBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: colors.text.opacity20,
        alignItems: 'center', justifyContent: 'center',
    },
    screenTitle: { fontSize: 17, fontWeight: '700', color: colors.text.primary },
    scrollContent: { padding: 20, paddingBottom: 40 },

    // Timer
    timerCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: colors.background.tertiary, borderRadius: 12,
        padding: 16, borderWidth: 1, borderColor: colors.background.border, marginBottom: 20,
    },
    timerTextGroup: { gap: 2 },
    timerLabel: { fontSize: 12, color: colors.text.secondary },
    timerValue: { fontSize: 24, fontWeight: '700', color: colors.text.primary, fontFamily: 'monospace' },

    // Timeline
    timelineCard: {
        backgroundColor: colors.background.tertiary, borderRadius: 12,
        padding: 16, borderWidth: 1, borderColor: colors.background.border, marginBottom: 20,
    },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.text.secondary, letterSpacing: 0.5, marginBottom: 16 },
    timelineItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, position: 'relative', paddingBottom: 20 },
    timelineLine: { position: 'absolute', left: 5, top: 12, bottom: 0, width: 2, backgroundColor: colors.background.border },
    timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.status.success, marginTop: 2, zIndex: 5 },
    timelineContent: {
        flex: 1, backgroundColor: colors.background.primary,
        padding: 12, marginLeft: 8, borderWidth: 1, borderColor: colors.background.border, maxWidth: '85%' as any,
        borderRadius: 8,
    },
    timelineTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    timelineTime: { fontSize: 12, color: colors.text.tertiary },
    timelineText: { fontSize: 14, color: colors.text.primary, lineHeight: 20 },

    // Live updates
    liveCard: {
        backgroundColor: colors.interactive.focus, borderRadius: 12,
        padding: 16, borderWidth: 1, borderColor: colors.voltage, marginBottom: 24,
    },
    liveHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.status.success },
    liveTitle: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
    liveText: { fontSize: 14, color: colors.text.secondary, lineHeight: 20 },

    // Footer actions
    footerActions: { alignItems: 'center', gap: 16 },
    reportLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
    reportText: { fontSize: 14, color: colors.status.error, fontWeight: '500' },
    demoBtn: {
        backgroundColor: colors.voltage, paddingHorizontal: 24, paddingVertical: 12,
        borderRadius: 999,
    },
    demoBtnText: { fontSize: 14, fontWeight: '700', color: colors.text.onBrand },
});
