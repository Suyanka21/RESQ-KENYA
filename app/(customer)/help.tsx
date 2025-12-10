// ResQ Kenya - Help Center Screen
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing } from '../../theme/voltage-premium';

const FAQ_ITEMS = [
    {
        question: 'How do I request a service?',
        answer: 'From the home screen, tap on any service card (Towing, Fuel, Battery, etc.) to start a request. Follow the prompts to enter your details and confirm.'
    },
    {
        question: 'How do I pay for services?',
        answer: 'We accept M-Pesa payments. You can add funds to your wallet or pay directly when requesting a service.'
    },
    {
        question: 'How long does it take for help to arrive?',
        answer: 'Our average response time is 15-30 minutes depending on your location and traffic conditions.'
    },
    {
        question: 'Can I cancel a request?',
        answer: 'Yes, you can cancel a request before a provider is assigned. Note that cancellations after assignment may incur a small fee.'
    },
    {
        question: 'How do I add a vehicle?',
        answer: 'Go to Settings > Saved Vehicles > Add New Vehicle. Enter your vehicle details including make, model, and registration.'
    },
    {
        question: 'Is my data secure?',
        answer: 'Yes, we use industry-standard encryption to protect your personal and payment information.'
    },
];

export default function HelpCenterScreen() {
    const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backIcon}>←</Text>
                </Pressable>
                <Text style={styles.headerTitle}>Help Center</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {/* Contact Section */}
                <View style={styles.contactCard}>
                    <Text style={styles.contactTitle}>Need immediate help?</Text>
                    <Text style={styles.contactText}>Our support team is available 24/7</Text>
                    <View style={styles.contactButtons}>
                        <Pressable style={styles.contactBtn}>
                            <Text style={styles.contactBtnIcon}>📞</Text>
                            <Text style={styles.contactBtnText}>Call Support</Text>
                        </Pressable>
                        <Pressable style={[styles.contactBtn, styles.contactBtnSecondary]}>
                            <Text style={styles.contactBtnIcon}>💬</Text>
                            <Text style={styles.contactBtnText}>Live Chat</Text>
                        </Pressable>
                    </View>
                </View>

                {/* FAQ Section */}
                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                {FAQ_ITEMS.map((item, index) => (
                    <Pressable
                        key={index}
                        style={styles.faqItem}
                        onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    >
                        <View style={styles.faqHeader}>
                            <Text style={styles.faqQuestion}>{item.question}</Text>
                            <Text style={[styles.faqArrow, expandedFaq === index && styles.faqArrowExpanded]}>›</Text>
                        </View>
                        {expandedFaq === index && (
                            <Text style={styles.faqAnswer}>{item.answer}</Text>
                        )}
                    </Pressable>
                ))}

                {/* Email Support */}
                <View style={styles.emailSection}>
                    <Text style={styles.emailTitle}>Still have questions?</Text>
                    <Text style={styles.emailText}>Email us at support@resq.co.ke</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.charcoal[900] },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.charcoal[700],
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    backIcon: { color: colors.text.primary, fontSize: 24 },
    headerTitle: { color: colors.text.primary, fontSize: 18, fontWeight: '700' },
    content: { flex: 1 },
    contentContainer: { padding: spacing.lg, paddingBottom: 100 },

    contactCard: {
        backgroundColor: colors.charcoal[800],
        borderRadius: 16,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: `${colors.voltage}40`,
        marginBottom: spacing.xl,
    },
    contactTitle: { color: colors.text.primary, fontSize: 18, fontWeight: '700', marginBottom: 8 },
    contactText: { color: colors.text.secondary, marginBottom: spacing.lg },
    contactButtons: { flexDirection: 'row', gap: spacing.md },
    contactBtn: {
        flex: 1,
        backgroundColor: colors.voltage,
        borderRadius: 12,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    contactBtnSecondary: { backgroundColor: colors.charcoal[700] },
    contactBtnIcon: { fontSize: 16 },
    contactBtnText: { color: colors.charcoal[900], fontWeight: '600' },

    sectionTitle: {
        color: colors.text.secondary,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: spacing.md,
        marginTop: spacing.lg,
    },
    faqItem: {
        backgroundColor: colors.charcoal[800],
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.charcoal[700],
    },
    faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    faqQuestion: { color: colors.text.primary, fontWeight: '600', flex: 1, paddingRight: spacing.md },
    faqArrow: { color: colors.text.secondary, fontSize: 18 },
    faqArrowExpanded: { transform: [{ rotate: '90deg' }] },
    faqAnswer: { color: colors.text.secondary, marginTop: spacing.md, lineHeight: 20 },

    emailSection: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        marginTop: spacing.lg,
    },
    emailTitle: { color: colors.text.primary, fontWeight: '600', marginBottom: 8 },
    emailText: { color: colors.voltage },
});
