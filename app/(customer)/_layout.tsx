// ResQ Kenya - Customer Layout
// Premium tab bar with Lucide icons.
// Phase 4: mounts EmergencySOS as a layout-level FAB so the button is
// available on every customer screen without each screen having to
// instantiate it.

import React from "react";
import { Tabs, Redirect } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import { Home, Clock, Wallet, User } from "lucide-react-native";
import { colors, spacing } from "../../theme/voltage-premium";
import EmergencySOS from "../../components/EmergencySOS";
import { recordSosEvent, type SosEventType } from "../../services/sos.service";
import { useAuth } from "../../services/AuthContext";

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

function handleSosTrigger(type: SosEventType) {
    // Phase 4 (audit-v2 §N-MED-7) — record the SOS server-side so it
    // is observable, attributable to a user, and can be auto-escalated
    // by a future contact-fanout worker. EmergencySOS.tsx still
    // dials the configured emergency line via Linking.openURL — that
    // path is independent so a network failure here does NOT block
    // the dial.
    //
    // Fire-and-forget: we do not `await` here because the modal's
    // onClose path must run synchronously to dismiss the countdown UI.
    void recordSosEvent(type, null);
}

export default function CustomerLayout() {
    // Phase 4 (audit-v3 §CRIT-1) — route-level auth guard. The splash at
    // app/index.tsx redirects on auth state, but it only runs when the user
    // enters via `/`. Deep-linking straight to `/(customer)` or any nested
    // tab (wallet, history, profile) used to bypass the splash entirely
    // because expo-router file-based routing exposes every .tsx file in
    // app/(customer)/ as a reachable URL regardless of what app/_layout.tsx
    // declares. The guard below is the authoritative gate for this group.
    const { isAuthenticated, isLoading, userRole } = useAuth();

    // While the AuthProvider is still resolving the Firebase session, render
    // nothing rather than the tab chrome. The splash on `/` is already
    // mounted in parallel and will navigate once loading completes.
    if (isLoading) return null;
    if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
    // A provider account opening a customer URL should be routed to their
    // own surface — the customer screens render mocked customer chrome that
    // would otherwise mislead a provider.
    if (userRole === 'provider') return <Redirect href="/(provider)" />;

    return (
        <View style={styles.layoutRoot}>
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.charcoal[900],
                    borderTopColor: colors.charcoal[700],
                    borderTopWidth: 1,
                    height: Platform.OS === 'ios' ? 88 : 70,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
                    paddingTop: spacing.sm,
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
        <View style={styles.sosFabWrapper} pointerEvents="box-none">
            <EmergencySOS onEmergencyTrigger={handleSosTrigger} />
        </View>
        </View>
    );
}

const styles = StyleSheet.create({
    layoutRoot: {
        flex: 1,
    },
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
    sosFabWrapper: {
        position: 'absolute',
        right: spacing.md,
        bottom: Platform.OS === 'ios' ? 110 : 90,
    },
});
