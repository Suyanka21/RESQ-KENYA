// ResQ Kenya - Profile Screen
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../services/AuthContext";

const MenuItem = ({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) => (
    <Pressable
        className="flex-row items-center bg-charcoal-800 rounded-xl px-4 py-4 mb-2 border border-charcoal-600 active:border-voltage"
        onPress={onPress}
    >
        <Text className="text-xl mr-4">{icon}</Text>
        <Text className="text-white flex-1">{label}</Text>
        <Text className="text-white/50">→</Text>
    </Pressable>
);

export default function ProfileScreen() {
    const { user, signOut, isAuthenticated } = useAuth();

    const handleLogout = async () => {
        try {
            await signOut();
            router.replace('/');
        } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
        }
    };

    // Get user initials
    const getInitials = () => {
        if (user?.displayName) {
            return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return 'U';
    };

    // Format phone number for display
    const getPhoneDisplay = () => {
        if (user?.phoneNumber) {
            return user.phoneNumber;
        }
        return 'No phone set';
    };

    return (
        <View className="flex-1 bg-charcoal-900">
            {/* Header */}
            <View className="px-6 pt-16 pb-6 bg-charcoal-800 border-b border-charcoal-600">
                <View className="flex-row items-center">
                    <View className="w-16 h-16 bg-voltage rounded-full items-center justify-center mr-4">
                        <Text className="text-charcoal-900 text-2xl font-bold">{getInitials()}</Text>
                    </View>
                    <View>
                        <Text className="text-white text-xl font-bold">
                            {user?.displayName || 'ResQ User'}
                        </Text>
                        <Text className="text-white/60">{getPhoneDisplay()}</Text>
                    </View>
                </View>

                {/* Membership Badge */}
                <View className="flex-row items-center mt-4 bg-charcoal-700 rounded-xl px-4 py-3">
                    <Text className="text-voltage mr-2">👑</Text>
                    <Text className="text-white flex-1 capitalize">{user?.membership || 'Basic'} Member</Text>
                    <Text className="text-voltage text-sm font-semibold">Upgrade</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                <Text className="text-white/60 text-sm mb-3 font-medium">Account</Text>
                <MenuItem
                    icon="🚗"
                    label="My Vehicles"
                    onPress={() => router.push('/(customer)/vehicles')}
                />
                <MenuItem icon="📍" label="Saved Locations" />
                <MenuItem icon="👥" label="Emergency Contacts" />
                <MenuItem icon="💳" label="Payment Methods" onPress={() => router.push('/(customer)/wallet')} />

                <Text className="text-white/60 text-sm mb-3 mt-6 font-medium">Support</Text>
                <MenuItem icon="💬" label="Help Center" />
                <MenuItem icon="📞" label="Contact Support" />
                <MenuItem icon="⭐" label="Rate the App" />

                <Text className="text-white/60 text-sm mb-3 mt-6 font-medium">Legal</Text>
                <MenuItem icon="📄" label="Terms of Service" />
                <MenuItem icon="🔒" label="Privacy Policy" />

                {/* Debug Info (dev only) */}
                <View className="bg-charcoal-800 rounded-xl p-3 mt-6 border border-charcoal-600">
                    <Text className="text-white/40 text-xs font-mono">
                        Auth: {isAuthenticated ? '✅' : '❌'}{'\n'}
                        UID: {user?.id || 'N/A'}
                    </Text>
                </View>

                <Pressable
                    className="flex-row items-center justify-center py-4 mt-6 mb-8"
                    onPress={handleLogout}
                >
                    <Text className="text-emergency font-semibold">Sign Out</Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}
