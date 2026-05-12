// ResQ Kenya - Root Layout (Expo Router)
import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text, Pressable } from "react-native";
import { Zap, RefreshCw } from "lucide-react-native";
import { AuthProvider } from "../services/AuthContext";
import { colors, spacing, borderRadius, touchTargets } from "../theme/voltage-premium";
import React from "react";

class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('App Error Boundary caught error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.primary, padding: spacing.xl }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                        <Zap size={24} color={colors.voltage} fill={colors.voltage} strokeWidth={1} />
                        <Text style={{ color: colors.voltage, fontSize: 24, fontWeight: 'bold', marginLeft: spacing.xs }}>
                            ResQ Kenya
                        </Text>
                    </View>
                    <Text style={{ color: colors.status.error, fontSize: 18, marginBottom: spacing.sm }}>
                        App Error
                    </Text>
                    <Text style={{ color: colors.text.primary, fontSize: 14, textAlign: 'center', marginBottom: spacing.xl }}>
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </Text>
                    <Pressable
                        onPress={this.handleReset}
                        accessibilityLabel="Try again"
                        accessibilityRole="button"
                        style={({ pressed }) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: spacing.sm,
                            paddingHorizontal: spacing.lg,
                            minHeight: touchTargets.standard,
                            borderRadius: borderRadius.lg,
                            backgroundColor: colors.voltage,
                            opacity: pressed ? 0.85 : 1,
                        })}
                    >
                        <RefreshCw size={18} color={colors.text.onBrand} strokeWidth={2.5} />
                        <Text style={{ color: colors.text.onBrand, fontSize: 14, fontWeight: '700' }}>
                            Try Again
                        </Text>
                    </Pressable>
                </View>
            );
        }

        return this.props.children;
    }
}

export default function RootLayout() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
                    <StatusBar style="light" />
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: colors.background.primary },
                            animation: 'slide_from_right',
                        }}
                    >
                        <Stack.Screen name="index" />
                        {/* Phase 4 (audit-v3 §HIGH-2) — debug routes are
                            gated AT THE COMPONENT LEVEL inside
                            firebase-test.tsx and database-test.tsx via
                            `if (!__DEV__) return <Redirect />`. The
                            previous gate here only controlled the
                            navigator entry, not the file-based route
                            itself — expo-router auto-discovers every
                            .tsx in app/ regardless of <Stack.Screen>
                            declarations, so production users could
                            deep-link to /firebase-test and
                            /database-test. The component-level guard
                            is the authoritative one. We still register
                            them here unconditionally so transitions are
                            consistent across dev/prod. */}
                        <Stack.Screen name="firebase-test" />
                        <Stack.Screen name="database-test" />
                        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                        <Stack.Screen name="(customer)" options={{ headerShown: false }} />
                        <Stack.Screen name="(provider)" options={{ headerShown: false }} />
                    </Stack>
                </View>
            </AuthProvider>
        </ErrorBoundary>
    );
}
