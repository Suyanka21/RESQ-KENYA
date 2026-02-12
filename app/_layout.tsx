// ResQ Kenya - Root Layout (Expo Router)
import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text } from "react-native";
import { Zap } from "lucide-react-native";
import { AuthProvider } from "../services/AuthContext";
import { colors, spacing } from "../theme/voltage-premium";
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

    render() {
        if (this.state.hasError) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.primary, padding: spacing.xl }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                        <Zap size={24} color={colors.voltage} fill={colors.voltage} strokeWidth={1} />
                        <Text style={{ color: colors.voltage, fontSize: 24, fontWeight: 'bold', marginLeft: 4 }}>
                            ResQ Kenya
                        </Text>
                    </View>
                    <Text style={{ color: colors.status.error, fontSize: 18, marginBottom: spacing.sm }}>
                        App Error
                    </Text>
                    <Text style={{ color: colors.text.primary, fontSize: 14, textAlign: 'center' }}>
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </Text>
                    <Text style={{ color: colors.text.secondary, fontSize: 12, marginTop: spacing.xl, textAlign: 'center' }}>
                        Check console for details
                    </Text>
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
