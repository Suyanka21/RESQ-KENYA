// ⚡ ResQ Kenya - Dynamic Service Request Route
// Routes to the correct service form based on [service] param

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, AlertTriangle } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../../../theme/voltage-premium';
import { TowingForm } from '../../../components/request/forms/TowingForm';
import { FuelForm } from '../../../components/request/forms/FuelForm';
import { BatteryForm } from '../../../components/request/forms/BatteryForm';
import { TireForm } from '../../../components/request/forms/TireForm';
import { DiagnosticsForm } from '../../../components/request/forms/DiagnosticsForm';
import { AmbulanceForm } from '../../../components/request/forms/AmbulanceForm';
import { createServiceRequest, generateIdempotencyKey } from '../../../services/customer.service';
import { getCurrentLocation, NAIROBI_DEFAULT } from '../../../services/location.service';

import { isValidServiceType, type ServiceType } from '../../../types/api';

/**
 * Phase 4 (audit-v2 §F-CRIT-1) — normalise the legacy form `service`
 * field to the canonical ServiceType used by the backend callable.
 * AmbulanceForm historically emitted `'medical'`; the backend's
 * `ServiceType` union uses `'ambulance'`. Centralise the mapping so
 * forms remain stable while the contract advances.
 *
 * CodeRabbit feedback (PR #9): the previous body did `raw as
 * ServiceType` which silently accepts any string and lets a typo in
 * the route param hit the backend (where it would be rejected with a
 * cryptic 400). Validate with `isValidServiceType` instead and
 * return `null` for unknown values; callers must handle that case
 * explicitly.
 */
function normaliseServiceType(
    formService: string | undefined,
    routeService: string | undefined
): ServiceType | null {
    const raw = (formService || routeService || '').toLowerCase();
    const candidate = raw === 'medical' ? 'ambulance' : raw;
    return isValidServiceType(candidate) ? candidate : null;
}

/**
 * Sanitise a form-supplied price string into a typed `Pricing`
 * payload. Strips commas / currency markers, then validates via
 * Number.isFinite plus a non-negative check. Anything else returns
 * `undefined` so the caller can omit `pricing` rather than send NaN
 * across the wire. See CodeRabbit feedback comment for context.
 */
function parsePricing(rawCost: unknown):
    | { baseServiceFee: number; total: number }
    | undefined {
    if (rawCost === undefined || rawCost === null || rawCost === '') return undefined;
    const cleaned =
        typeof rawCost === 'number'
            ? rawCost
            : Number(String(rawCost).replace(/[^\d.-]/g, ''));
    if (!Number.isFinite(cleaned) || cleaned < 0) return undefined;
    return { baseServiceFee: cleaned, total: cleaned };
}

export default function ServiceRequestScreen() {
    const { service } = useLocalSearchParams<{ service: string }>();
    const [submitting, setSubmitting] = useState(false);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(customer)');
        }
    };

    /**
     * Phase 4 (audit-v2 §F-CRIT-1) — actually create the request on
     * the backend before navigating to the tracking screen. Pre-fix
     * this just navigated locally with a price string, so the
     * tracking screens had no real `requestId` to subscribe against
     * (the root cause of F-CRIT-2). The flow now:
     *
     *   1. Capture the user's current GPS via expo-location
     *      (fallback: NAIROBI_DEFAULT — still better than no
     *      coordinates because the server geohashes from this).
     *   2. Build a `CreateServiceRequestInput` with a fresh
     *      `idempotencyKey` (centralised in types/api.ts).
     *   3. Call `createServiceRequest`, which proxies to the
     *      canonical `createServiceRequest` Cloud Function.
     *   4. On success, navigate to tracking with the real
     *      `requestId`. On failure, show an Alert (no silent
     *      drop) so the user can retry.
     *
     * Skills: API-and-Interface-Design (typed input via
     * CreateServiceRequestInput), Frontend-UI-Engineering (loading
     * state via `submitting`, clear failure feedback), Security-and-
     * Hardening (idempotencyKey prevents duplicate dispatch on
     * retry), Source-Driven-Development (expo-location docs for
     * permission gates).
     */
    const handleSubmit = async (data: any) => {
        if (submitting) return;
        setSubmitting(true);

        const canonicalService = normaliseServiceType(data?.service, service);
        if (!canonicalService) {
            // CodeRabbit feedback (PR #9): surface the contract
            // violation early instead of round-tripping a 400.
            setSubmitting(false);
            Alert.alert(
                'Unknown service',
                'This service is not currently supported. Please choose another service from the dashboard.',
                [{ text: 'OK' }]
            );
            return;
        }
        const addressText: string = data?.location || data?.pickupLocation || '';
        const dropoff: string | undefined = data?.dropoffLocation;

        try {
            // 1. GPS — fallback to Nairobi default if permission denied.
            let coords;
            try {
                coords = await getCurrentLocation();
            } catch {
                coords = NAIROBI_DEFAULT;
            }

            // 2. Build the typed input. `serviceDetails` carries the
            //    form-specific payload through to the backend.
            const input = {
                serviceType: canonicalService,
                customerLocation: {
                    coordinates: coords,
                    address: addressText || 'Unknown',
                    ...(dropoff ? { instructions: `Drop-off: ${dropoff}` } : {}),
                },
                // CodeRabbit feedback (PR #9): the previous body
                // passed `Number(data.totalCost)` straight through,
                // so any non-numeric string from the form ('1,500',
                // 'KES 1500', '') would arrive at the backend as
                // NaN — bypassing the typed Pricing contract and
                // poisoning downstream M-Pesa amount validation.
                // Sanitize commas/currency prefixes, parse, and only
                // include `pricing` when the result is finite and
                // non-negative.
                pricing: parsePricing(data?.totalCost),
                serviceDetails: data,
                idempotencyKey: generateIdempotencyKey(),
            };

            // 3. Call the canonical Cloud Function via the service
            //    wrapper.
            const result = await createServiceRequest(input);

            if (!result.success || !result.requestId) {
                Alert.alert(
                    'Could not create request',
                    result.error || 'Please check your connection and try again.',
                    [{ text: 'OK' }]
                );
                return;
            }

            // 4. Navigate to tracking with the REAL requestId so the
            //    tracking screens (F-CRIT-2 fix) can subscribe to
            //    requests/{id} and activeRequests/{id}.
            router.push({
                pathname: '/(customer)/request/tracking',
                params: {
                    requestId: result.requestId,
                    service: canonicalService,
                    price: String(data?.totalCost || 0),
                    location: addressText,
                },
            });
        } catch (err: any) {
            Alert.alert(
                'Could not create request',
                err?.message || 'An unexpected error occurred. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setSubmitting(false);
        }
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
        case 'ambulance':
            return <AmbulanceForm onSubmit={handleSubmit} onBack={handleBack} />;
        default:
            // Fallback for unknown service types
            return (
                <View style={styles.errorContainer}>
                    <View style={styles.errorHeader}>
                        <Pressable onPress={handleBack} style={({ pressed }) => [styles.backButton, pressed && { backgroundColor: colors.background.tertiary, transform: [{ scale: 0.9 }] }]} accessibilityLabel="Go back" accessibilityRole="button">
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
    errorContainer: { flex: 1, backgroundColor: colors.background.primary },
    errorHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.md, paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: spacing.sm,
        backgroundColor: colors.background.secondary, borderBottomWidth: 1, borderBottomColor: colors.background.border,
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
    errorButtonText: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold as any, color: colors.text.onBrand },
});
