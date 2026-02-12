// ⚡ ResQ Kenya - Service Complete Screen
// Celebration animation, star rating, payment summary, quick actions.

import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, Pressable, StyleSheet, Animated, Easing, ScrollView, Alert, Share, Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Star, CheckCircle, Download, FileText, MessageCircle,
    Home, Clock, PhoneCall, ChevronRight,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../../../../theme/voltage-premium';

const { width } = Dimensions.get('window');

export default function CompleteScreen() {
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ serviceType?: string; price?: string }>();
    const serviceType = params.serviceType || 'Service Request';
    const price = params.price ? parseInt(params.price, 10) : 0;

    const [rating, setRating] = useState(0);
    const [feedbackSent, setFeedbackSent] = useState(false);

    // Celebration animation
    const checkScale = useRef(new Animated.Value(0)).current;
    const checkBg = useRef(new Animated.Value(0)).current;
    const confettiOps = useRef([...Array(6)].map(() => new Animated.Value(0))).current;
    const confettiTrans = useRef([...Array(6)].map(() => new Animated.ValueXY({ x: 0, y: 0 }))).current;

    useEffect(() => {
        // Check bounce
        Animated.spring(checkScale, { toValue: 1, tension: 40, friction: 5, useNativeDriver: true }).start();
        // Background glow
        Animated.timing(checkBg, { toValue: 1, duration: 600, useNativeDriver: false }).start();

        // Confetti particle burst
        confettiOps.forEach((op, i) => {
            setTimeout(() => {
                Animated.parallel([
                    Animated.timing(op, { toValue: 1, duration: 200, useNativeDriver: true }),
                    Animated.timing(confettiTrans[i], {
                        toValue: { x: (Math.random() - 0.5) * 100, y: -(40 + Math.random() * 60) },
                        duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true,
                    }),
                ]).start(() => {
                    Animated.timing(op, { toValue: 0, duration: 400, useNativeDriver: true }).start();
                });
            }, i * 120);
        });
    }, []);

    // Payment breakdown
    const baseCost = price || 4500;
    const platformFee = Math.round(baseCost * 0.10);
    const processingFee = Math.round(baseCost * 0.05);
    const conservationFee = Math.round(baseCost * 0.15);
    const total = baseCost + platformFee + processingFee + conservationFee;

    const handleSubmitRating = () => {
        if (rating === 0) {
            Alert.alert('Rating Required', 'Please select a star rating before submitting.');
            return;
        }
        setFeedbackSent(true);
        Alert.alert('Thank You!', `You rated this service ${rating} star${rating > 1 ? 's' : ''}. Your feedback helps us improve.`);
    };

    const handleDownloadReceipt = () => {
        Alert.alert('Download Receipt', 'Receipt #RQ-8921 will be saved to your device.', [
            { text: 'Download PDF', onPress: () => Alert.alert('Saved', 'Receipt downloaded to your Files.') },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const handleViewReceipt = () => {
        Alert.alert('Receipt #RQ-8921', [
            `Service: ${serviceType}`,
            `Base Cost: KES ${baseCost.toLocaleString()}`,
            `Platform Fee (10%): KES ${platformFee.toLocaleString()}`,
            `Processing (5%): KES ${processingFee.toLocaleString()}`,
            `Conservation (15%): KES ${conservationFee.toLocaleString()}`,
            `Total: KES ${total.toLocaleString()}`,
        ].join('\n'));
    };

    const handleContactSupport = () => {
        Alert.alert('Contact Support', 'How would you like to reach us?', [
            { text: 'Call Support', onPress: () => Alert.alert('Support', 'Calling +254 800 RESQ...') },
            { text: 'Chat Support', onPress: () => Alert.alert('Support', 'Opening support chat...') },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const handleShareExperience = () => {
        Share.share({
            message: `I just had an amazing ${serviceType} experience with ResQ Kenya! 🔧⚡ Fast, professional, and conservation-focused. Highly recommend!`,
        }).catch(() => { });
    };

    return (
        <View style={styles.root}>
            <StatusBar style="light" />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Celebration Area */}
                <View style={styles.celebrationArea}>
                    {/* Confetti particles */}
                    {confettiOps.map((op, i) => (
                        <Animated.View key={i} style={[styles.confetti, {
                            opacity: op,
                            transform: confettiTrans[i].getTranslateTransform(),
                            backgroundColor: [colors.voltage, colors.status.success, colors.status.info, '#FF6B6B', '#9B59B6', '#1ABC9C'][i],
                        }]} />
                    ))}

                    {/* Check Icon */}
                    <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
                        <CheckCircle size={40} color={colors.text.onBrand} strokeWidth={2} fill={colors.status.success} />
                    </Animated.View>

                    <Text style={styles.completeTitle}>Service Complete!</Text>
                    <Text style={styles.completeSubtitle}>{serviceType} successfully completed</Text>

                    {/* Duration + Download */}
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Clock size={14} color={colors.text.secondary} />
                            <Text style={styles.metaText}>14 min</Text>
                        </View>
                        <View style={styles.metaDot} />
                        <Pressable
                            style={styles.metaItem}
                            onPress={handleDownloadReceipt}
                            accessibilityLabel="Download receipt" accessibilityRole="button"
                        >
                            <Download size={14} color={colors.voltage} />
                            <Text style={[styles.metaText, { color: colors.voltage }]}>Download receipt</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Star Rating */}
                <View style={styles.ratingCard}>
                    <Text style={styles.ratingTitle}>How was your experience?</Text>
                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map(n => (
                            <Pressable
                                key={n}
                                onPress={() => !feedbackSent && setRating(n)}
                                accessibilityLabel={`Rate ${n} star${n > 1 ? 's' : ''}`}
                                style={({ pressed }) => [pressed && { transform: [{ scale: 1.15 }] }]}
                            >
                                <Star
                                    size={36}
                                    color={n <= rating ? colors.voltage : colors.text.disabled}
                                    fill={n <= rating ? colors.voltage : 'transparent'}
                                    strokeWidth={1.5}
                                />
                            </Pressable>
                        ))}
                    </View>

                    {!feedbackSent && (
                        <Pressable
                            style={({ pressed }) => [styles.submitRatingBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                            onPress={handleSubmitRating}
                            accessibilityLabel="Submit rating" accessibilityRole="button"
                        >
                            <Text style={styles.submitRatingText}>Submit Rating</Text>
                        </Pressable>
                    )}
                    {feedbackSent && (
                        <Text style={styles.feedbackSentText}>Thank you for your feedback! ⭐</Text>
                    )}
                </View>

                {/* Payment Summary */}
                <View style={styles.paymentCard}>
                    <Text style={styles.paymentTitle}>Payment Summary</Text>

                    {[
                        { label: 'Service Cost (70% Host)', value: `KES ${baseCost.toLocaleString()}` },
                        { label: 'Platform Fee (10%)', value: `KES ${platformFee.toLocaleString()}` },
                        { label: 'Processing Fee (5%)', value: `KES ${processingFee.toLocaleString()}` },
                        { label: 'Conservation Fund (15%)', value: `KES ${conservationFee.toLocaleString()}`, highlight: true },
                    ].map((row, i) => (
                        <View key={i} style={styles.paymentRow}>
                            <Text style={[styles.paymentLabel, row.highlight && { color: colors.status.success }]}>{row.label}</Text>
                            <Text style={[styles.paymentValue, row.highlight && { color: colors.status.success }]}>{row.value}</Text>
                        </View>
                    ))}

                    <View style={styles.paymentDivider} />
                    <View style={styles.paymentRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>KES {total.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsCard}>
                    <Text style={styles.actionsTitle}>QUICK ACTIONS</Text>

                    <Pressable
                        style={({ pressed }) => [styles.actionRow, pressed && { backgroundColor: colors.background.tertiary }]}
                        onPress={() => router.replace('/(customer)')}
                        accessibilityLabel="Return home" accessibilityRole="button"
                    >
                        <View style={styles.actionIconWrap}>
                            <Home size={18} color={colors.voltage} />
                        </View>
                        <Text style={styles.actionLabel}>Return Home</Text>
                        <ChevronRight size={16} color={colors.text.tertiary} />
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [styles.actionRow, pressed && { backgroundColor: colors.background.tertiary }]}
                        onPress={handleViewReceipt}
                        accessibilityLabel="View receipt" accessibilityRole="button"
                    >
                        <View style={styles.actionIconWrap}>
                            <FileText size={18} color={colors.voltage} />
                        </View>
                        <Text style={styles.actionLabel}>View Receipt</Text>
                        <ChevronRight size={16} color={colors.text.tertiary} />
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [styles.actionRow, pressed && { backgroundColor: colors.background.tertiary }]}
                        onPress={handleContactSupport}
                        accessibilityLabel="Contact support" accessibilityRole="button"
                    >
                        <View style={styles.actionIconWrap}>
                            <PhoneCall size={18} color={colors.voltage} />
                        </View>
                        <Text style={styles.actionLabel}>Contact Support</Text>
                        <ChevronRight size={16} color={colors.text.tertiary} />
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [styles.actionRow, pressed && { backgroundColor: colors.background.tertiary }]}
                        onPress={handleShareExperience}
                        accessibilityLabel="Share your experience" accessibilityRole="button"
                    >
                        <View style={styles.actionIconWrap}>
                            <MessageCircle size={18} color={colors.voltage} />
                        </View>
                        <Text style={styles.actionLabel}>Share Experience</Text>
                        <ChevronRight size={16} color={colors.text.tertiary} />
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },

    // Celebration
    celebrationArea: { alignItems: 'center', marginBottom: 32, position: 'relative' },
    confetti: { position: 'absolute', width: 8, height: 8, borderRadius: 4, top: 40 },
    checkCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(0,230,118,0.15)', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
    },
    completeTitle: { fontSize: 28, fontWeight: '700', color: colors.text.primary, marginBottom: 4 },
    completeSubtitle: { fontSize: 16, color: colors.text.secondary, marginBottom: 12 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 14, color: colors.text.secondary },
    metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.text.disabled },

    // Rating
    ratingCard: {
        backgroundColor: colors.background.secondary, borderRadius: 16,
        padding: 24, borderWidth: 1, borderColor: colors.background.border, marginBottom: 20,
        alignItems: 'center',
    },
    ratingTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary, marginBottom: 16 },
    starsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    submitRatingBtn: {
        backgroundColor: colors.voltage, paddingHorizontal: 32, paddingVertical: 12,
        borderRadius: 999,
    },
    submitRatingText: { fontSize: 16, fontWeight: '700', color: colors.text.onBrand },
    feedbackSentText: { fontSize: 14, color: colors.status.success, fontWeight: '500' },

    // Payment
    paymentCard: {
        backgroundColor: colors.background.secondary, borderRadius: 16,
        padding: 20, borderWidth: 1, borderColor: colors.background.border, marginBottom: 20,
    },
    paymentTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginBottom: 16 },
    paymentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    paymentLabel: { fontSize: 14, color: colors.text.secondary },
    paymentValue: { fontSize: 14, color: colors.text.primary, fontFamily: 'monospace' },
    paymentDivider: { height: 1, backgroundColor: colors.background.border, marginVertical: 8 },
    totalLabel: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
    totalValue: { fontSize: 18, fontWeight: '700', color: colors.voltage, fontFamily: 'monospace' },

    // Quick Actions
    actionsCard: {
        backgroundColor: colors.background.secondary, borderRadius: 16,
        padding: 20, borderWidth: 1, borderColor: colors.background.border, marginBottom: 20,
    },
    actionsTitle: { fontSize: 12, fontWeight: '700', color: colors.text.secondary, letterSpacing: 0.5, marginBottom: 12 },
    actionRow: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: colors.background.border,
    },
    actionIconWrap: {
        width: 36, height: 36, borderRadius: 8,
        backgroundColor: colors.interactive.focus,
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    actionLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: colors.text.primary },
});
