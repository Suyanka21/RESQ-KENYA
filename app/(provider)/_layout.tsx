// ResQ Kenya - Provider Tab Layout
import { Tabs, Redirect } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Home, ClipboardList, Wallet, Settings } from "lucide-react-native";
import { colors, spacing } from "../../theme/voltage-premium";
import { useAuth } from "../../services/AuthContext";

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
    // Phase 4 (audit-v3 §CRIT-1) — same rationale as the customer layout.
    // The splash at app/index.tsx is not a sufficient gate; expo-router
    // exposes every .tsx file in app/(provider)/ regardless. Enforce here.
    const { isAuthenticated, isLoading, userRole } = useAuth();

    if (isLoading) return null;
    if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
    if (userRole !== 'provider') return <Redirect href="/(customer)" />;

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
            {/* Phase 4 (audit-v3 §MED-3) — internal screens that should
                only be reached via in-app navigation, not as tab entries.
                Without href:null, expo-router auto-discovers every .tsx in
                this directory and adds it to the tab bar (alphabetical),
                which was leaking `active-job`, `medical-dashboard`, and
                `medical-onboarding` as visible tabs. Mirror the pattern
                used by `(customer)/_layout.tsx` for request/vehicles/help. */}
            <Tabs.Screen name="active-job" options={{ href: null }} />
            <Tabs.Screen name="medical-dashboard" options={{ href: null }} />
            <Tabs.Screen name="medical-onboarding" options={{ href: null }} />
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
