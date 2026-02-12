// ResQ Kenya - Provider Tab Layout
import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Home, ClipboardList, Wallet, Settings } from "lucide-react-native";
import { colors, spacing } from "../../theme/voltage-premium";

// Lucide icon-based TabIcon component (replaces emoji icons per design system)
const TabIcon = ({
    IconComponent,
    focused
}: {
    IconComponent: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
    focused: boolean;
}) => (
    <View style={styles.tabIconContainer}>
        <IconComponent
            size={24}
            color={focused ? colors.voltage : colors.text.muted}
            strokeWidth={focused ? 2.5 : 2}
        />
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
                    paddingBottom: spacing.sm,
                },
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
                tabBarActiveTintColor: colors.voltage,
                tabBarInactiveTintColor: colors.text.muted,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Dashboard",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon IconComponent={Home} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="requests"
                options={{
                    title: "Requests",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon IconComponent={ClipboardList} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="earnings"
                options={{
                    title: "Earnings",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon IconComponent={Wallet} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: "Settings",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon IconComponent={Settings} focused={focused} />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: spacing.xs,
    },
});
