// ⚡ ResQ Kenya - Tracking Lifecycle Layout
// Stack coordinator for the 5 tracking lifecycle screens
import { Stack } from "expo-router";
import { colors } from "../../../../theme/voltage-premium";

export default function TrackingLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background.primary },
                animation: 'fade',
            }}
        />
    );
}
