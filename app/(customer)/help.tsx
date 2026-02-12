// ⚡ ResQ Kenya - Help & Support Screen
// Converted from: DESIGN RES Q/components/SupportScreen.tsx (Google Stitch)
// Phase 2.5 UI Enhancement - Agent 2.5

import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, StyleSheet, Pressable, ScrollView,
    Animated, Easing, Platform, Linking
} from 'react-native';
import { router } from 'expo-router';
import {
    ArrowLeft, MessageSquare, Phone, Search, CreditCard,
    AlertTriangle, User, Users, Shield, Smartphone,
    ChevronDown, ChevronUp, Mail, ChevronRight,
    ThumbsUp, ThumbsDown, Headphones
} from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../../theme/voltage-premium';
import { StatusBar } from 'expo-status-bar';

const TOPICS = [
    { id: 'payment', Icon: CreditCard, title: 'Payment Issues', subtitle: 'Billing & refunds', color: '#FFA500' },
    { id: 'service', Icon: AlertTriangle, title: 'Service Issues', subtitle: 'Problems during service', color: '#FF9800' },
    { id: 'account', Icon: User, title: 'Account Settings', subtitle: 'Profile & preferences', color: '#2196F3' },
    { id: 'provider', Icon: Users, title: 'Provider Questions', subtitle: 'About service providers', color: '#00E676' },
    { id: 'safety', Icon: Shield, title: 'Safety & Security', subtitle: 'Privacy & protection', color: '#9C27B0' },
    { id: 'app', Icon: Smartphone, title: 'Using the App', subtitle: 'How-to guides', color: '#FFA500' },
];

const FAQS = [
    {
        id: 'cancel',
        question: 'How do I cancel a service request?',
        answer: "You can cancel a service request from the tracking screen before the provider arrives. Go to the active service screen, tap 'Cancel Request', and confirm. Cancellation fees may apply if the provider is already en route."
    },
    {
        id: 'refund',
        question: 'How long does it take for a refund?',
        answer: "Refunds are processed within 24-48 hours of cancellation. Depending on your payment method (M-Pesa or Card), it may take an additional 1-3 business days to reflect in your account."
    },
    {
        id: 'provider_req',
        question: 'Can I request a specific provider?',
        answer: "Currently, our system automatically matches you with the nearest available provider to ensure the fastest response time. You cannot manually select a specific provider at this time."
    },
    {
        id: 'payment_methods',
        question: 'What payment methods are accepted?',
        answer: "We accept M-Pesa, Visa, Mastercard, and cash payments. You can manage your payment methods in the Wallet section of the app."
    },
    {
        id: 'data_protection',
        question: 'How is my data protected?',
        answer: "We use bank-grade 256-bit encryption to protect your personal and payment information. We do not share your data with third parties without your consent."
    },
];

export default function HelpScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
    const [searchFocused, setSearchFocused] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    }, []);

    const filteredFaqs = searchQuery.trim()
        ? FAQS.filter(f =>
            f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : FAQS;

    const toggleFaq = (id: string) => {
        setExpandedFaq(expandedFaq === id ? null : id);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <Animated.View style={[styles.wrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        onPress={() => router.back()}
                        style={styles.headerButton}
                        accessibilityLabel="Go back"
                        accessibilityRole="button"
                    >
                        <ArrowLeft size={20} color={colors.voltage} strokeWidth={2} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Help & Support</Text>
                    <Pressable
                        style={styles.headerButton}
                        accessibilityLabel="Chat support"
                        accessibilityRole="button"
                    >
                        <MessageSquare size={24} color={colors.voltage} strokeWidth={2} />
                    </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Hero Card */}
                    <View style={styles.heroCard}>
                        <View style={styles.heroContent}>
                            <View style={styles.heroIconWrap}>
                                <Headphones size={24} color={colors.voltage} strokeWidth={2} />
                            </View>
                            <View style={styles.heroTextBlock}>
                                <Text style={styles.heroTitle}>We're Here to Help</Text>
                                <Text style={styles.heroSubtitle}>24/7 customer support available</Text>
                                <View style={styles.responseTimeBadge}>
                                    <Text style={styles.responseTimeText}>Average response: {'<'} 5 min</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.quickActionRow}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.liveChatButton,
                                pressed && { transform: [{ scale: 0.95 }] }
                            ]}
                            accessibilityLabel="Start live chat"
                            accessibilityRole="button"
                        >
                            <MessageSquare size={20} color={colors.background.primary} strokeWidth={2.5} />
                            <Text style={styles.liveChatText}>Live Chat</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [
                                styles.callButton,
                                pressed && { transform: [{ scale: 0.95 }] }
                            ]}
                            onPress={() => Linking.openURL('tel:+254712345678')}
                            accessibilityLabel="Call support"
                            accessibilityRole="button"
                        >
                            <Phone size={20} color="#00E676" strokeWidth={2.5} />
                            <Text style={styles.callText}>Call Support</Text>
                        </Pressable>
                    </View>

                    {/* Emergency line */}
                    <View style={styles.emergencyRow}>
                        <AlertTriangle size={12} color="#FF3D3D" strokeWidth={2.5} />
                        <Text style={styles.emergencyText}>Emergency line: 999 (Kenya)</Text>
                    </View>

                    {/* Search Bar */}
                    <View style={[styles.searchContainer, searchFocused && styles.searchContainerFocused]}>
                        <Search size={20} color={colors.text.tertiary} strokeWidth={2} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search for help..."
                            placeholderTextColor={colors.text.tertiary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            accessibilityLabel="Search help topics"
                        />
                    </View>

                    {/* Popular Topics */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Popular Topics</Text>
                        <View style={styles.topicGrid}>
                            {TOPICS.map((topic) => (
                                <Pressable
                                    key={topic.id}
                                    style={[styles.topicCard, { borderLeftColor: topic.color }]}
                                    accessibilityLabel={topic.title}
                                    accessibilityRole="button"
                                >
                                    <topic.Icon size={32} color={topic.color} strokeWidth={1.5} />
                                    <View style={styles.topicTextBlock}>
                                        <Text style={styles.topicTitle}>{topic.title}</Text>
                                        <Text style={styles.topicSubtitle}>{topic.subtitle}</Text>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* FAQs */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                        <View style={styles.faqList}>
                            {filteredFaqs.map((faq, idx) => {
                                const isExpanded = expandedFaq === faq.id;
                                return (
                                    <View
                                        key={faq.id}
                                        style={[
                                            styles.faqItem,
                                            idx === 0 && styles.faqItemFirst,
                                            idx === filteredFaqs.length - 1 && styles.faqItemLast,
                                            idx < filteredFaqs.length - 1 && styles.faqItemBorder,
                                        ]}
                                    >
                                        <Pressable
                                            onPress={() => toggleFaq(faq.id)}
                                            style={styles.faqHeader}
                                            accessibilityLabel={faq.question}
                                            accessibilityRole="button"
                                        >
                                            <Text style={styles.faqQuestion}>{faq.question}</Text>
                                            {isExpanded
                                                ? <ChevronUp size={20} color={colors.text.tertiary} />
                                                : <ChevronDown size={20} color={colors.text.tertiary} />
                                            }
                                        </Pressable>
                                        {isExpanded && (
                                            <View style={styles.faqBody}>
                                                <View style={styles.faqDivider} />
                                                <Text style={styles.faqAnswer}>{faq.answer}</Text>
                                                <View style={styles.faqFeedbackRow}>
                                                    <Text style={styles.faqFeedbackLabel}>Was this helpful?</Text>
                                                    <View style={styles.faqFeedbackButtons}>
                                                        <Pressable accessibilityLabel="Yes, helpful" accessibilityRole="button">
                                                            <ThumbsUp size={16} color={colors.text.tertiary} strokeWidth={2} />
                                                        </Pressable>
                                                        <Pressable accessibilityLabel="No, not helpful" accessibilityRole="button">
                                                            <ThumbsDown size={16} color={colors.text.tertiary} strokeWidth={2} />
                                                        </Pressable>
                                                    </View>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* More Ways to Get Help */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>More Ways to Get Help</Text>

                        <Pressable
                            style={styles.contactCard}
                            onPress={() => Linking.openURL('mailto:support@resq.co.ke')}
                            accessibilityLabel="Email support"
                            accessibilityRole="button"
                        >
                            <View style={[styles.contactIconWrap, { backgroundColor: `${colors.voltage}15` }]}>
                                <Mail size={20} color={colors.voltage} strokeWidth={2} />
                            </View>
                            <View style={styles.contactTextBlock}>
                                <Text style={styles.contactTitle}>Email Support</Text>
                                <Text style={styles.contactSubtitle}>support@resq.co.ke</Text>
                            </View>
                            <ChevronRight size={20} color={colors.text.tertiary} strokeWidth={2} />
                        </Pressable>

                        <Pressable
                            style={styles.contactCard}
                            onPress={() => Linking.openURL('https://wa.me/254712345678')}
                            accessibilityLabel="WhatsApp support"
                            accessibilityRole="button"
                        >
                            <View style={[styles.contactIconWrap, { backgroundColor: 'rgba(0, 230, 118, 0.1)' }]}>
                                <MessageSquare size={20} color="#00E676" strokeWidth={2} />
                            </View>
                            <View style={styles.contactTextBlock}>
                                <Text style={styles.contactTitle}>WhatsApp</Text>
                                <Text style={styles.contactSubtitle}>+254 712 345 678</Text>
                            </View>
                            <ChevronRight size={20} color={colors.text.tertiary} strokeWidth={2} />
                        </Pressable>
                    </View>

                    {/* Report Problem */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Report a Problem</Text>
                        <Pressable
                            style={({ pressed }) => [
                                styles.reportButton,
                                pressed && { backgroundColor: 'rgba(255, 61, 61, 0.05)' }
                            ]}
                            accessibilityLabel="Report a safety issue or incident"
                            accessibilityRole="button"
                        >
                            <AlertTriangle size={20} color="#FF3D3D" strokeWidth={2} />
                            <Text style={styles.reportButtonText}>Report a Safety Issue or Incident</Text>
                        </Pressable>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <View style={styles.footerBrand}>
                            <View style={styles.footerBrandIcon}>
                                <Text style={styles.footerBrandLetter}>R</Text>
                            </View>
                            <Text style={styles.footerBrandName}>ResQ Kenya</Text>
                        </View>
                        <Text style={styles.footerVersion}>Version 1.0.0 (Build 123)</Text>
                        <View style={styles.footerLinks}>
                            <Pressable
                                onPress={() => router.push('/(customer)/terms')}
                                accessibilityLabel="Terms of Service"
                                accessibilityRole="link"
                            >
                                <Text style={styles.footerLinkText}>Terms of Service</Text>
                            </Pressable>
                            <Text style={styles.footerDivider}>|</Text>
                            <Pressable accessibilityLabel="Privacy Policy" accessibilityRole="link">
                                <Text style={styles.footerLinkText}>Privacy Policy</Text>
                            </Pressable>
                            <Text style={styles.footerDivider}>|</Text>
                            <Pressable accessibilityLabel="Licenses" accessibilityRole="link">
                                <Text style={styles.footerLinkText}>Licenses</Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>

                {/* Floating Chat Button */}
                <Pressable
                    style={({ pressed }) => [
                        styles.chatFab,
                        pressed && { transform: [{ scale: 0.95 }] }
                    ]}
                    accessibilityLabel="Open live chat"
                    accessibilityRole="button"
                >
                    <MessageSquare size={24} color={colors.text.primary} fill={colors.text.primary} strokeWidth={0} />
                    <View style={styles.chatFabDot} />
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    wrapper: { flex: 1 },

    // Header
    header: {
        height: 60,
        paddingHorizontal: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: colors.charcoal[700],
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: '700',
        color: colors.text.primary,
    },
    scrollContent: {
        paddingBottom: 100,
    },

    // Hero card
    heroCard: {
        margin: spacing.md,
        padding: spacing.lg,
        borderRadius: borderRadius['2xl'],
        borderWidth: 1,
        borderColor: colors.background.border,
        backgroundColor: colors.background.secondary,
        overflow: 'hidden',
    },
    heroContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
    },
    heroIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: `${colors.voltage}15`,
        borderWidth: 1,
        borderColor: `${colors.voltage}33`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroTextBlock: {
        flex: 1,
    },
    heroTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    heroSubtitle: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        marginBottom: spacing.sm,
    },
    responseTimeBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderRadius: borderRadius.xl,
        backgroundColor: 'rgba(0, 230, 118, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(0, 230, 118, 0.2)',
    },
    responseTimeText: {
        fontSize: typography.fontSize.xs,
        fontWeight: '500',
        color: '#00E676',
    },

    // Quick actions
    quickActionRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
    },
    liveChatButton: {
        flex: 1,
        height: 56,
        backgroundColor: colors.voltage,
        borderRadius: borderRadius.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        ...shadows.button,
    },
    liveChatText: {
        fontSize: typography.fontSize.base,
        fontWeight: '700',
        color: colors.background.primary,
    },
    callButton: {
        flex: 1,
        height: 56,
        borderWidth: 2,
        borderColor: '#00E676',
        borderRadius: borderRadius.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    callText: {
        fontSize: typography.fontSize.base,
        fontWeight: '700',
        color: '#00E676',
    },

    // Emergency
    emergencyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginBottom: spacing.lg,
    },
    emergencyText: {
        fontSize: typography.fontSize.xs,
        fontWeight: '700',
        color: '#FF3D3D',
    },

    // Search
    searchContainer: {
        marginHorizontal: spacing.md,
        marginBottom: spacing.lg,
        height: 56,
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.background.border,
        borderRadius: borderRadius.xl,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
    },
    searchContainerFocused: {
        borderColor: colors.voltage,
        ...shadows.focusRing,
    },
    searchInput: {
        flex: 1,
        fontSize: typography.fontSize.base,
        color: colors.text.primary,
        height: '100%',
    },

    // Section
    section: {
        paddingHorizontal: spacing.md,
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.md,
    },

    // Topic grid
    topicGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    topicCard: {
        width: '48.5%',
        height: 110,
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.background.border,
        borderLeftWidth: 3,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        justifyContent: 'space-between',
    },
    topicTextBlock: {},
    topicTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: '700',
        color: colors.text.primary,
    },
    topicSubtitle: {
        fontSize: typography.fontSize.xs,
        color: colors.text.tertiary,
        marginTop: 2,
    },

    // FAQ
    faqList: {
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
    },
    faqItem: {
        backgroundColor: colors.background.secondary,
    },
    faqItemFirst: {
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
    },
    faqItemLast: {
        borderBottomLeftRadius: borderRadius.xl,
        borderBottomRightRadius: borderRadius.xl,
    },
    faqItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.background.border,
    },
    faqHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
    },
    faqQuestion: {
        flex: 1,
        fontSize: typography.fontSize.sm,
        fontWeight: '500',
        color: colors.text.primary,
        paddingRight: spacing.md,
    },
    faqBody: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
    faqDivider: {
        height: 1,
        backgroundColor: colors.background.border,
        marginBottom: spacing.sm,
    },
    faqAnswer: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        lineHeight: 22,
        marginBottom: spacing.md,
    },
    faqFeedbackRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    faqFeedbackLabel: {
        fontSize: typography.fontSize.xs,
        color: colors.text.tertiary,
    },
    faqFeedbackButtons: {
        flexDirection: 'row',
        gap: spacing.sm,
    },

    // Contact cards
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.background.border,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        gap: spacing.md,
        marginBottom: spacing.sm,
    },
    contactIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contactTextBlock: {
        flex: 1,
    },
    contactTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: '700',
        color: colors.text.primary,
    },
    contactSubtitle: {
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
        marginTop: 2,
    },

    // Report button
    reportButton: {
        width: '100%',
        height: 64,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#FF3D3D',
        borderRadius: borderRadius.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    reportButtonText: {
        fontSize: typography.fontSize.sm,
        fontWeight: '700',
        color: '#FF3D3D',
    },

    // Footer
    footer: {
        backgroundColor: colors.background.secondary,
        borderTopWidth: 1,
        borderTopColor: colors.background.border,
        padding: spacing.lg,
        alignItems: 'center',
    },
    footerBrand: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    footerBrandIcon: {
        width: 24,
        height: 24,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.voltage,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerBrandLetter: {
        fontSize: 12,
        fontWeight: '900',
        color: colors.background.primary,
    },
    footerBrandName: {
        fontSize: typography.fontSize.base,
        fontWeight: '700',
        color: colors.text.primary,
    },
    footerVersion: {
        fontSize: typography.fontSize.xs,
        color: colors.text.tertiary,
        marginBottom: spacing.sm,
    },
    footerLinks: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    footerLinkText: {
        fontSize: typography.fontSize.xs,
        fontWeight: '500',
        color: colors.voltage,
    },
    footerDivider: {
        fontSize: typography.fontSize.xs,
        color: colors.text.tertiary,
    },

    // Chat FAB
    chatFab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.voltage,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.button,
        zIndex: 40,
    },
    chatFabDot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FF3D3D',
        borderWidth: 2,
        borderColor: colors.voltage,
    },
});
