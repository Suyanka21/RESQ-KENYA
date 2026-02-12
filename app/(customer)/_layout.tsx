// ResQ Kenya - Customer Layout
// Premium tab bar with Lucide icons

import { Tabs } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import { Home, Clock, Wallet, User } from "lucide-react-native";
import { colors, spacing } from "../../theme/voltage-premium";

// Tab Icon Component with Lucide icons
const TabIcon = ({
    icon: Icon,
    focused
}: {
    icon: typeof Home;
    focused: boolean
}) => (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
        <Icon
            size={22}
            color={focused ? colors.voltage : colors.text.muted}
            strokeWidth={focused ? 2.5 : 2}
        />
    </View>
);

export default function CustomerLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.charcoal[900],
                    borderTopColor: colors.charcoal[700],
                    borderTopWidth: 1,
                    height: Platform.OS === 'ios' ? 88 : 70,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
                    paddingTop: 8,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarActiveTintColor: colors.voltage,
                tabBarInactiveTintColor: colors.text.muted,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    letterSpacing: 0.3,
                    marginTop: 2,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ focused }) => <TabIcon icon={Home} focused={focused} />,
                    tabBarStyle: { display: 'none' },
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: "History",
                    tabBarIcon: ({ focused }) => <TabIcon icon={Clock} focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="wallet"
                options={{
                    title: "Wallet",
                    tabBarIcon: ({ focused }) => <TabIcon icon={Wallet} focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ focused }) => <TabIcon icon={User} focused={focused} />,
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
    iconContainer: {
        width: 40,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainerActive: {
        backgroundColor: `${colors.voltage}20`,
    },
});
