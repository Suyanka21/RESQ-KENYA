// ResQ Kenya - Provider Settings Screen
import { View, Text, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { colors } from '../../theme/voltage-premium';

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
        icon,
        title,
        subtitle,
        onPress,
        rightElement,
    }: {
        icon: string;
        title: string;
        subtitle?: string;
        onPress?: () => void;
        rightElement?: React.ReactNode;
    }) => (
        <Pressable
            className="flex-row items-center bg-charcoal-800 px-4 py-4 border-b border-charcoal-600"
            onPress={onPress}
            disabled={!onPress}
        >
            <Text className="text-xl mr-4">{icon}</Text>
            <View className="flex-1">
                <Text className="text-white font-medium">{title}</Text>
                {subtitle && <Text className="text-white/50 text-sm">{subtitle}</Text>}
            </View>
            {rightElement || (onPress && <Text className="text-white/50">→</Text>)}
        </Pressable>
    );

    return (
        <View className="flex-1 bg-charcoal-900">
            {/* Header */}
            <View className="px-6 pt-16 pb-6 bg-charcoal-800 border-b border-charcoal-600">
                <Text className="text-white text-2xl font-bold">Settings</Text>
            </View>

            <ScrollView className="flex-1">
                {/* Profile Section */}
                <View className="p-6 flex-row items-center bg-charcoal-800 border-b border-charcoal-600">
                    <View className="w-16 h-16 bg-voltage rounded-full items-center justify-center mr-4">
                        <Text className="text-charcoal-900 text-2xl font-bold">JT</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-white text-lg font-bold">John's Towing Services</Text>
                        <Text className="text-white/60">+254 700 000 001</Text>
                        <View className="flex-row items-center mt-1">
                            <Text className="text-voltage">⭐ 4.8</Text>
                            <Text className="text-white/40 mx-2">•</Text>
                            <Text className="text-white/60">156 services</Text>
                        </View>
                    </View>
                </View>

                {/* Account */}
                <Text className="text-white/60 text-sm px-6 pt-6 pb-2 font-medium">Account</Text>
                <SettingItem icon="👤" title="Edit Profile" onPress={() => { }} />
                <SettingItem icon="🚗" title="Vehicle Details" subtitle="Tow Truck • KCA 123A" onPress={() => { }} />
                <SettingItem icon="📄" title="Documents" subtitle="All verified ✓" onPress={() => { }} />
                <SettingItem icon="💳" title="Payment Methods" subtitle="M-Pesa •••• 0001" onPress={() => { }} />

                {/* Notifications */}
                <Text className="text-white/60 text-sm px-6 pt-6 pb-2 font-medium">Notifications</Text>
                <SettingItem
                    icon="🔔"
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
                    icon="🔊"
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
                <Text className="text-white/60 text-sm px-6 pt-6 pb-2 font-medium">Preferences</Text>
                <SettingItem
                    icon="⚡"
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
                <SettingItem icon="📍" title="Service Area" subtitle="15 km radius" onPress={() => { }} />
                <SettingItem icon="🛠️" title="Service Types" subtitle="Towing, Tire, Battery" onPress={() => { }} />

                {/* Support */}
                <Text className="text-white/60 text-sm px-6 pt-6 pb-2 font-medium">Support</Text>
                <SettingItem icon="💬" title="Help Center" onPress={() => { }} />
                <SettingItem icon="📞" title="Contact Support" onPress={() => { }} />
                <SettingItem icon="📋" title="Terms & Conditions" onPress={() => { }} />
                <SettingItem icon="🔒" title="Privacy Policy" onPress={() => { }} />

                {/* Sign Out */}
                <Pressable
                    className="mx-6 my-6 py-4 rounded-xl border border-emergency"
                    onPress={handleLogout}
                >
                    <Text className="text-emergency text-center font-semibold">Sign Out</Text>
                </Pressable>

                {/* App Version */}
                <Text className="text-white/30 text-center text-xs mb-8">
                    ResQ Provider v1.0.0
                </Text>
            </ScrollView>
        </View>
    );
}
