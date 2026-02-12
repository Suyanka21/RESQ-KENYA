// ⚡ ResQ Kenya - Dynamic Service Request Route
// Routes to the correct service form based on [service] param

import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, AlertTriangle } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../../../theme/voltage-premium';
import { TowingForm } from '../../../components/request/forms/TowingForm';
import { FuelForm } from '../../../components/request/forms/FuelForm';
import { BatteryForm } from '../../../components/request/forms/BatteryForm';
import { TireForm } from '../../../components/request/forms/TireForm';
import { DiagnosticsForm } from '../../../components/request/forms/DiagnosticsForm';
import { AmbulanceForm } from '../../../components/request/forms/AmbulanceForm';

type ServiceType = 'towing' | 'fuel' | 'battery' | 'tire' | 'diagnostics' | 'medical';

export default function ServiceRequestScreen() {
    const { service } = useLocalSearchParams<{ service: string }>();

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(customer)');
        }
    };

    const handleSubmit = (data: any) => {
        // Navigate to tracking screen with service data
        router.push({
            pathname: '/(customer)/request/tracking',
            params: {
                service: data.service || service,
                price: String(data.totalCost || 0),
                location: data.location || data.pickupLocation || '',
            },
        });
    };

    // Render the correct form based on service param
    switch (service as ServiceType) {
        case 'towing':
            return <TowingForm onSubmit={handleSubmit} onBack={handleBack} />;
        case 'fuel':
            return <FuelForm onSubmit={handleSubmit} onBack={handleBack} />;
        case 'battery':
            return <BatteryForm onSubmit={handleSubmit} onBack={handleBack} />;
        case 'tire':
            return <TireForm onSubmit={handleSubmit} onBack={handleBack} />;
        case 'diagnostics':
            return <DiagnosticsForm onSubmit={handleSubmit} onBack={handleBack} />;
        case 'medical':
            return <AmbulanceForm onSubmit={handleSubmit} onBack={handleBack} />;
        default:
            // Fallback for unknown service types
            return (
                <View style={styles.errorContainer}>
                    <View style={styles.errorHeader}>
                        <Pressable onPress={handleBack} style={({ pressed }) => [styles.backButton, pressed && { backgroundColor: colors.charcoal[700], transform: [{ scale: 0.9 }] }]} accessibilityLabel="Go back" accessibilityRole="button">
                            <ChevronLeft size={24} color={colors.text.primary} strokeWidth={2} />
                        </Pressable>
                        <Text style={styles.headerTitle}>Service</Text>
                        <View style={{ width: 44 }} />
                    </View>
                    <View style={styles.errorContent}>
                        <AlertTriangle size={48} color={colors.voltage} strokeWidth={2} />
                        <Text style={styles.errorTitle}>Service Not Found</Text>
                        <Text style={styles.errorDesc}>
                            The service "{service}" is not available. Please go back and select a valid service.
                        </Text>
                        <Pressable
                            style={({ pressed }) => [styles.errorButton, pressed && { opacity: 0.9 }]}
                            onPress={handleBack}
                        >
                            <Text style={styles.errorButtonText}>Go Back</Text>
                        </Pressable>
                    </View>
                </View>
            );
    }
}

const styles = StyleSheet.create({
    errorContainer: { flex: 1, backgroundColor: colors.charcoal[900] },
    errorHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.md, paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: spacing.sm,
        backgroundColor: colors.charcoal[800], borderBottomWidth: 1, borderBottomColor: colors.charcoal[700],
    },
    backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.text.primary },
    errorContent: {
        flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md,
    },
    errorTitle: { fontSize: 22, fontWeight: '700', color: colors.text.primary },
    errorDesc: { fontSize: 14, color: colors.text.secondary, textAlign: 'center', lineHeight: 22 },
    errorButton: {
        marginTop: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
        backgroundColor: colors.voltage, borderRadius: borderRadius.xl,
    },
    errorButtonText: { fontSize: 16, fontWeight: '700', color: colors.charcoal[900] },
});
