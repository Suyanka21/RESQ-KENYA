// ResQ Kenya - Customer Layout
import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/voltage-premium";

// Tab icon component with proper StyleSheet styling for web compatibility
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => (
    <Text style={[styles.tabIcon, focused ? styles.tabIconFocused : styles.tabIconInactive]}>
        {name}
    </Text>
);

export default function CustomerLayout() {
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
                    paddingTop: 10,
                },
                tabBarActiveTintColor: colors.voltage,
                tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ focused }) => <TabIcon name="🏠" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: "History",
                    tabBarIcon: ({ focused }) => <TabIcon name="📋" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="wallet"
                options={{
                    title: "Wallet",
                    tabBarIcon: ({ focused }) => <TabIcon name="💳" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ focused }) => <TabIcon name="👤" focused={focused} />,
                }}
            />
            {/* Hide request folder from tabs */}
            <Tabs.Screen
                name="request"
                options={{
                    href: null,
                }}
            />
            {/* Hide vehicles screen from tabs */}
            <Tabs.Screen
                name="vehicles"
                options={{
                    href: null,
                }}
            />
            {/* Hide help screen from tabs */}
            <Tabs.Screen
                name="help"
                options={{
                    href: null,
                }}
            />
            {/* Hide terms screen from tabs */}
            <Tabs.Screen
                name="terms"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabIcon: {
        fontSize: 18,
    },
    tabIconFocused: {
        color: colors.voltage,
    },
    tabIconInactive: {
        color: 'rgba(255, 255, 255, 0.5)',
    },
});
