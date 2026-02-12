// ResQ Kenya - Auth Layout
import { Stack } from "expo-router";
import { colors } from "../../theme/voltage-premium";

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background.primary },
                animation: 'slide_from_right',
            }}
        />
    );
}
