// ResQ Kenya - Terms & Privacy Screen
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing } from '../../theme/voltage-premium';

export default function TermsPrivacyScreen() {
    const [activeTab, setActiveTab] = React.useState<'terms' | 'privacy'>('terms');

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backIcon}>←</Text>
                </Pressable>
                <Text style={styles.headerTitle}>Terms & Privacy</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <Pressable
                    style={[styles.tab, activeTab === 'terms' && styles.tabActive]}
                    onPress={() => setActiveTab('terms')}
                >
                    <Text style={[styles.tabText, activeTab === 'terms' && styles.tabTextActive]}>Terms of Service</Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'privacy' && styles.tabActive]}
                    onPress={() => setActiveTab('privacy')}
                >
                    <Text style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>Privacy Policy</Text>
                </Pressable>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {activeTab === 'terms' ? (
                    <>
                        <Text style={styles.lastUpdated}>Last updated: December 2024</Text>

                        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                        <Text style={styles.paragraph}>
                            By accessing and using the ResQ Kenya application, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this service.
                        </Text>

                        <Text style={styles.sectionTitle}>2. Service Description</Text>
                        <Text style={styles.paragraph}>
                            ResQ Kenya provides on-demand roadside assistance services including but not limited to towing, fuel delivery, battery jump-start, tire repair, and emergency medical services. Our platform connects users with service providers in real-time.
                        </Text>

                        <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
                        <Text style={styles.paragraph}>
                            Users agree to provide accurate information when requesting services, maintain their account security, and treat service providers with respect. Misuse of the platform may result in account suspension.
                        </Text>

                        <Text style={styles.sectionTitle}>4. Payment Terms</Text>
                        <Text style={styles.paragraph}>
                            All payments are processed through M-Pesa. Users agree to pay for services rendered at the rates displayed at the time of request. Cancellation fees may apply for requests cancelled after a provider has been dispatched.
                        </Text>

                        <Text style={styles.sectionTitle}>5. Limitation of Liability</Text>
                        <Text style={styles.paragraph}>
                            ResQ Kenya acts as an intermediary platform and is not liable for the actions of independent service providers. We make every effort to ensure quality service but cannot guarantee outcomes.
                        </Text>

                        <Text style={styles.sectionTitle}>6. Contact</Text>
                        <Text style={styles.paragraph}>
                            For questions about these terms, contact us at legal@resq.co.ke
                        </Text>
                    </>
                ) : (
                    <>
                        <Text style={styles.lastUpdated}>Last updated: December 2024</Text>

                        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
                        <Text style={styles.paragraph}>
                            We collect information you provide directly, including name, phone number, email, vehicle details, and payment information. We also collect location data to provide our services effectively.
                        </Text>

                        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
                        <Text style={styles.paragraph}>
                            Your information is used to provide and improve our services, process payments, communicate with you, and ensure safety. We may also use data for analytics to enhance user experience.
                        </Text>

                        <Text style={styles.sectionTitle}>3. Information Sharing</Text>
                        <Text style={styles.paragraph}>
                            We share necessary information with service providers to fulfill your requests. We do not sell your personal data. We may share data with law enforcement when legally required.
                        </Text>

                        <Text style={styles.sectionTitle}>4. Data Security</Text>
                        <Text style={styles.paragraph}>
                            We implement industry-standard security measures to protect your data, including encryption and secure servers. However, no method of transmission over the Internet is 100% secure.
                        </Text>

                        <Text style={styles.sectionTitle}>5. Your Rights</Text>
                        <Text style={styles.paragraph}>
                            You have the right to access, correct, or delete your personal data. You can manage your preferences in the app settings or contact us at privacy@resq.co.ke.
                        </Text>

                        <Text style={styles.sectionTitle}>6. Cookies & Tracking</Text>
                        <Text style={styles.paragraph}>
                            We use cookies and similar technologies to improve user experience and analyze usage patterns. You can manage cookie preferences in your device settings.
                        </Text>
                    </>
                )}
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

    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: colors.charcoal[700],
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: colors.voltage },
    tabText: { color: colors.text.secondary, fontWeight: '600' },
    tabTextActive: { color: colors.voltage },

    content: { flex: 1 },
    contentContainer: { padding: spacing.lg, paddingBottom: 100 },

    lastUpdated: {
        color: colors.text.muted,
        fontSize: 12,
        marginBottom: spacing.xl,
        fontStyle: 'italic',
    },
    sectionTitle: {
        color: colors.text.primary,
        fontSize: 16,
        fontWeight: '700',
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    paragraph: {
        color: colors.text.secondary,
        lineHeight: 22,
        marginBottom: spacing.md,
    },
});
