// ResQ Kenya - Root Layout (Expo Router)
import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { AuthProvider } from "../services/AuthContext";

export default function RootLayout() {
    return (
        <AuthProvider>
            <View className="flex-1 bg-charcoal-900">
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
    );
}
