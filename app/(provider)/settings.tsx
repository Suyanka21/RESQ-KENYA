// ⚡ ResQ Kenya - Provider Settings Screen
// Converted from NativeWind to StyleSheet for consistency

import { View, Text, ScrollView, Pressable, Switch, Alert, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { colors, spacing, borderRadius } from '../../theme/voltage-premium';

export default function ProviderSettingsScreen() {
    const [notifications, setNotifications] = useState(true);
    const [soundAlerts, setSoundAlerts] = useState(true);
    const [autoAccept, setAutoAccept] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: () => router.replace('/') },
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
                        <Text style={styles.profileAvatarText}>JT</Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>John's Towing Services</Text>
                        <Text style={styles.profilePhone}>+254 700 000 001</Text>
                        <View style={styles.profileStats}>
                            <Text style={styles.profileRating}>★ 4.8</Text>
                            <Text style={styles.profileDot}>•</Text>
                            <Text style={styles.profileServices}>156 services</Text>
                        </View>
                    </View>
                </View>

                {/* Account */}
                <Text style={styles.sectionTitle}>Account</Text>
                <SettingItem title="Edit Profile" onPress={() => { }} />
                <SettingItem title="Vehicle Details" subtitle="Tow Truck • KCA 123A" onPress={() => { }} />
                <SettingItem title="Documents" subtitle="All verified ✓" onPress={() => { }} />
                <SettingItem title="Payment Methods" subtitle="M-Pesa •••• 0001" onPress={() => { }} />

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
