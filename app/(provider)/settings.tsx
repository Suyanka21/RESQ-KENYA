// ⚡ ResQ Kenya - Provider Settings Screen
// Converted from NativeWind to StyleSheet for consistency

import { View, Text, ScrollView, Pressable, Switch, Alert, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { colors, spacing, borderRadius } from '../../theme/voltage-premium';
import { useAuth } from '../../services/AuthContext';
import { deriveInitials } from '../../components/dashboard/SidebarDrawer.helpers';

export default function ProviderSettingsScreen() {
    const { user, provider, signOut } = useAuth();
    const [notifications, setNotifications] = useState(true);
    const [soundAlerts, setSoundAlerts] = useState(true);
    const [autoAccept, setAutoAccept] = useState(false);

    // Phase 4 (audit-v3 §MOCK-SWEEP) — resolve provider chrome from
    // the AuthContext rather than the previous "John's Towing Services"
    // / "+254 700 000 001" / "★ 4.8 · 156 services" / "Tow Truck KCA
    // 123A" / "M-Pesa •••• 0001" / "JT" placeholders that shipped to
    // every provider regardless of identity.
    const providerDisplayName: string =
        provider?.displayName?.trim() ||
        user?.displayName?.trim() ||
        'Provider';
    const providerPhone: string = provider?.phoneNumber || user?.phoneNumber || '';
    const providerInitials = deriveInitials(providerDisplayName);
    const providerRating = provider?.rating ?? 0;
    const providerServices = provider?.totalServices ?? 0;
    const providerVehicleType = provider?.vehicle?.type || '';
    const providerVehiclePlate = provider?.vehicle?.licensePlate || '';
    const providerVehicleSummary =
        providerVehicleType && providerVehiclePlate
            ? `${providerVehicleType} • ${providerVehiclePlate}`
            : 'Not yet configured';

    const handleLogout = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        // Phase 4 (audit-v3, CodeRabbit) — keep
                        // navigation inside the try block so a failed
                        // signOut() doesn't bounce the provider to
                        // the splash while still authenticated.
                        try {
                            await signOut();
                            router.replace('/');
                        } catch (err) {
                            console.warn('[provider/settings] sign out failed:', err);
                            Alert.alert('Sign Out Failed', 'Please try again.');
                        }
                    },
                },
            ]
        );
    };

    const SettingItem = ({
        title,
        subtitle,
        onPress,
        rightElement,
    }: {
        title: string;
        subtitle?: string;
        onPress?: () => void;
        rightElement?: React.ReactNode;
    }) => (
        <Pressable
            style={styles.settingItem}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            {rightElement || (onPress && <Text style={styles.settingArrow}>→</Text>)}
        </Pressable>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Profile Section */}
                <View style={styles.profileCard}>
                    <View style={styles.profileAvatar}>
                        <Text style={styles.profileAvatarText}>{providerInitials}</Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{providerDisplayName}</Text>
                        <Text style={styles.profilePhone}>{providerPhone || '—'}</Text>
                        <View style={styles.profileStats}>
                            <Text style={styles.profileRating}>
                                {providerRating > 0 ? `★ ${providerRating.toFixed(1)}` : '★ —'}
                            </Text>
                            <Text style={styles.profileDot}>•</Text>
                            <Text style={styles.profileServices}>
                                {providerServices} service{providerServices === 1 ? '' : 's'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Account */}
                <Text style={styles.sectionTitle}>Account</Text>
                <SettingItem title="Edit Profile" onPress={() => { }} />
                <SettingItem title="Vehicle Details" subtitle={providerVehicleSummary} onPress={() => { }} />
                <SettingItem
                    title="Documents"
                    subtitle={provider?.verificationStatus === 'verified' ? 'All verified ✓' : 'Pending verification'}
                    onPress={() => { }}
                />
                <SettingItem title="Payment Methods" subtitle="Not yet configured" onPress={() => { }} />

                {/* Notifications */}
                <Text style={styles.sectionTitle}>Notifications</Text>
                <SettingItem
                    title="Push Notifications"
                    rightElement={
                        <Switch
                            value={notifications}
                            onValueChange={setNotifications}
                            trackColor={{ false: colors.charcoal[600], true: colors.voltage }}
                        />
                    }
                />
                <SettingItem
                    title="Sound Alerts"
                    rightElement={
                        <Switch
                            value={soundAlerts}
                            onValueChange={setSoundAlerts}
                            trackColor={{ false: colors.charcoal[600], true: colors.voltage }}
                        />
                    }
                />

                {/* Preferences */}
                <Text style={styles.sectionTitle}>Preferences</Text>
                <SettingItem
                    title="Auto-Accept Requests"
                    subtitle="Automatically accept nearby requests"
                    rightElement={
                        <Switch
                            value={autoAccept}
                            onValueChange={setAutoAccept}
                            trackColor={{ false: colors.charcoal[600], true: colors.voltage }}
                        />
                    }
                />
                <SettingItem title="Service Area" subtitle="15 km radius" onPress={() => { }} />
                <SettingItem title="Service Types" subtitle="Towing, Tire, Battery" onPress={() => { }} />

                {/* Support */}
                <Text style={styles.sectionTitle}>Support</Text>
                <SettingItem title="Help Center" onPress={() => { }} />
                <SettingItem title="Contact Support" onPress={() => { }} />
                <SettingItem title="Terms & Conditions" onPress={() => { }} />
                <SettingItem title="Privacy Policy" onPress={() => { }} />

                {/* Sign Out */}
                <Pressable style={styles.signOutButton} onPress={handleLogout}>
                    <Text style={styles.signOutButtonText}>Sign Out</Text>
                </Pressable>

                {/* App Version */}
                <Text style={styles.versionText}>ResQ Provider v1.0.0</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.charcoal[900],
    },

    // Header
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 70 : 50,
        paddingBottom: spacing.lg,
        backgroundColor: colors.charcoal[800],
        borderBottomWidth: 1,
        borderBottomColor: colors.charcoal[600],
    },
    headerTitle: {
        color: colors.text.primary,
        fontSize: 24,
        fontWeight: '700',
    },

    // Scroll
    scrollView: {
        flex: 1,
    },

    // Profile Card
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        backgroundColor: colors.charcoal[800],
        borderBottomWidth: 1,
        borderBottomColor: colors.charcoal[600],
    },
    profileAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.voltage,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    profileAvatarText: {
        color: colors.charcoal[900],
        fontSize: 24,
        fontWeight: '700',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        color: colors.text.primary,
        fontSize: 18,
        fontWeight: '700',
    },
    profilePhone: {
        color: colors.text.secondary,
    },
    profileStats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    profileRating: {
        color: colors.voltage,
    },
    profileDot: {
        color: colors.text.muted,
        marginHorizontal: spacing.sm,
    },
    profileServices: {
        color: colors.text.secondary,
    },

    // Section Title
    sectionTitle: {
        color: colors.text.secondary,
        fontSize: 14,
        fontWeight: '500',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.sm,
    },

    // Setting Item
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.charcoal[800],
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.charcoal[600],
    },
    settingInfo: {
        flex: 1,
    },
    settingTitle: {
        color: colors.text.primary,
        fontWeight: '500',
    },
    settingSubtitle: {
        color: colors.text.muted,
        fontSize: 14,
    },
    settingArrow: {
        color: colors.text.muted,
    },

    // Sign Out
    signOutButton: {
        marginHorizontal: spacing.lg,
        marginVertical: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.emergency,
    },
    signOutButtonText: {
        color: colors.emergency,
        textAlign: 'center',
        fontWeight: '600',
    },

    // Version
    versionText: {
        color: colors.text.muted,
        textAlign: 'center',
        fontSize: 12,
        marginBottom: spacing.xl,
    },
});
