// ResQ Kenya - Root Layout (Expo Router)
import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text } from "react-native";
import { AuthProvider } from "../services/AuthContext";
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
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F0F', padding: 20 }}>
                    <Text style={{ color: '#FFD60A', fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>
                        ⚡ ResQ Kenya
                    </Text>
                    <Text style={{ color: '#FF3D3D', fontSize: 18, marginBottom: 10 }}>
                        App Error
                    </Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, textAlign: 'center' }}>
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </Text>
                    <Text style={{ color: '#A0A0A0', fontSize: 12, marginTop: 20, textAlign: 'center' }}>
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
                <View style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
                    <StatusBar style="light" />
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: '#0F0F0F' },
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
