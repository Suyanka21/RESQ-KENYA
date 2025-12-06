// ResQ Kenya - Provider Tab Layout
import { Tabs } from "expo-router";
import { View, Text } from "react-native";
import { colors } from "../../theme/voltage-premium";

const TabIcon = ({ icon, label, focused }: { icon: string; label: string; focused: boolean }) => (
    <View className="items-center pt-2">
        <Text className={`text-xl ${focused ? '' : 'opacity-50'}`}>{icon}</Text>
        <Text className={`text-xs mt-1 ${focused ? 'text-voltage font-semibold' : 'text-white/50'}`}>
            {label}
        </Text>
    </View>
);

export default function ProviderLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.charcoal[800],
                    borderTopColor: colors.charcoal[600],
                    borderTopWidth: 1,
                    height: 70,
                    paddingBottom: 10,
                },
                tabBarShowLabel: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="🏠" label="Dashboard" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="requests"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="📋" label="Requests" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="earnings"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="💰" label="Earnings" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="⚙️" label="Settings" focused={focused} />
                    ),
                }}
            />
        </Tabs>
    );
}
