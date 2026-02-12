// ResQ Kenya - Provider Active Job Screen
// Displays active service request with navigation and status updates

import { useState, useEffect, useRef } from 'react';
import {
    View, Text, Pressable, ActivityIndicator, Alert,
    Linking, Platform, StyleSheet
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Map, Phone, MessageCircle } from 'lucide-react-native';
import { ServiceIcon } from '../../components/ui/ServiceIcon';
import {
    acceptRequest,
    updateRequestStatus,
    updateLocation,
    subscribeToRequest,
    calculateDistance,
    estimateETA
} from '../../services/provider.service';
import { getCurrentLocation, startLocationUpdates } from '../../services/location.service';
import { colors, spacing, borderRadius, SERVICE_TYPES } from '../../theme/voltage-premium';
import type { ServiceRequest, GeoLocation } from '../../types';

type JobStatus = 'accepted' | 'enroute' | 'arrived' | 'inProgress' | 'completed';

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; nextStatus?: JobStatus; nextLabel?: string }> = {
    accepted: { label: 'Heading to Customer', color: colors.warning, nextStatus: 'enroute', nextLabel: 'Start Navigation' },
    enroute: { label: 'En Route', color: colors.info, nextStatus: 'arrived', nextLabel: 'I\'ve Arrived' },
    arrived: { label: 'At Location', color: colors.success, nextStatus: 'inProgress', nextLabel: 'Start Service' },
    inProgress: { label: 'Service In Progress', color: colors.voltage, nextStatus: 'completed', nextLabel: 'Complete Job' },
    completed: { label: 'Completed', color: colors.success },
};

export default function ActiveJobScreen() {
    const { requestId } = useLocalSearchParams<{ requestId: string }>();
    const [request, setRequest] = useState<ServiceRequest | null>(null);
    const [currentStatus, setCurrentStatus] = useState<JobStatus>('accepted');
    const [isLoading, setIsLoading] = useState(false);
    const [providerLocation, setProviderLocation] = useState<GeoLocation | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [eta, setEta] = useState<number | null>(null);
    const locationUpdateInterval = useRef<NodeJS.Timeout | null>(null);

    // Subscribe to request updates
    useEffect(() => {
        if (!requestId) return;

        const unsubscribe = subscribeToRequest(requestId, (updatedRequest) => {
            if (updatedRequest) {
                setRequest(updatedRequest);
                setCurrentStatus(updatedRequest.status as JobStatus);
            }
        });

        return () => unsubscribe();
    }, [requestId]);

    // Start location updates when job is active
    useEffect(() => {
        const startTracking = async () => {
            const location = await getCurrentLocation();
            setProviderLocation(location);

            // Update location every 10 seconds
            locationUpdateInterval.current = setInterval(async () => {
                const newLocation = await getCurrentLocation();
                setProviderLocation(newLocation);

                // Send to backend
                await updateLocation(
                    newLocation.latitude,
                    newLocation.longitude,
                    newLocation.heading,
                    newLocation.speed
                );

                // Calculate distance to customer
                if (request?.customerLocation?.coordinates) {
                    const dist = calculateDistance(
                        newLocation.latitude,
                        newLocation.longitude,
                        request.customerLocation.coordinates.latitude,
                        request.customerLocation.coordinates.longitude
                    );
                    setDistance(dist);
                    setEta(estimateETA(dist));
                }
            }, 10000);
        };

        if (currentStatus !== 'completed') {
            startTracking();
        }

        return () => {
            if (locationUpdateInterval.current) {
                clearInterval(locationUpdateInterval.current);
            }
        };
    }, [currentStatus, request]);

    const handleStatusUpdate = async () => {
        const config = STATUS_CONFIG[currentStatus];
        if (!config.nextStatus || !requestId) return;

        setIsLoading(true);
        try {
            const result = await updateRequestStatus(requestId, config.nextStatus);
            if (result.success) {
                setCurrentStatus(config.nextStatus);

                if (config.nextStatus === 'completed') {
                    Alert.alert(
                        '🎉 Job Completed!',
                        'Great work! The customer will now process payment.',
                        [{ text: 'Back to Dashboard', onPress: () => router.back() }]
                    );
                }
            } else {
                Alert.alert('Error', 'Failed to update status. Please try again.');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong.');
        } finally {
            setIsLoading(false);
        }
    };

    const openNavigation = () => {
        if (!request?.customerLocation?.coordinates) return;

        const { latitude, longitude } = request.customerLocation.coordinates;
        const scheme = Platform.select({ ios: 'maps:', android: 'geo:' });
        const url = Platform.select({
            ios: `maps:0,0?daddr=${latitude},${longitude}`,
            android: `geo:0,0?q=${latitude},${longitude}(Customer Location)`,
            default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
        });

        Linking.openURL(url as string);
    };

    const callCustomer = () => {
        // In production, get customer phone from request data
        Alert.alert('Call Customer', 'This would dial the customer\'s phone number.');
    };

    if (!request) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={colors.voltage} />
            </View>
        );
    }

    const service = SERVICE_TYPES[request.serviceType as keyof typeof SERVICE_TYPES];
    const statusConfig = STATUS_CONFIG[currentStatus];

    return (
        <View style={styles.container}>
            {/* Status Header */}
            <LinearGradient
                colors={[statusConfig.color + '30', colors.charcoal[900]]}
                style={styles.header}
            >
                <View style={styles.statusBadge}>
                    <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
                    <Text style={styles.statusText}>{statusConfig.label}</Text>
                </View>

                {/* Service Info */}
                <View style={styles.serviceInfo}>
                    <ServiceIcon type={request.serviceType as any} size={48} color={colors.voltage} />
                    <Text style={styles.serviceName}>{service?.name || request.serviceType}</Text>
                </View>

                {/* ETA/Distance */}
                {distance !== null && eta !== null && currentStatus !== 'completed' && (
                    <View style={styles.etaContainer}>
                        <View style={styles.etaItem}>
                            <Text style={styles.etaValue}>{distance}</Text>
                            <Text style={styles.etaLabel}>km</Text>
                        </View>
                        <View style={styles.etaDivider} />
                        <View style={styles.etaItem}>
                            <Text style={styles.etaValue}>{eta}</Text>
                            <Text style={styles.etaLabel}>min</Text>
                        </View>
                    </View>
                )}
            </LinearGradient>

            {/* Customer Location */}
            <View style={styles.locationCard}>
                <MapPin size={24} color={colors.voltage} strokeWidth={2} />
                <View style={styles.locationInfo}>
                    <Text style={styles.locationLabel}>Customer Location</Text>
                    <Text style={styles.locationAddress}>
                        {request.customerLocation.address || 'Location pending...'}
                    </Text>
                    {request.customerLocation.landmark && (
                        <Text style={styles.locationLandmark}>
                            Near: {request.customerLocation.landmark}
                        </Text>
                    )}
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsRow}>
                <Pressable style={styles.actionBtn} onPress={openNavigation}>
                    <Map size={24} color={colors.voltage} strokeWidth={2} />
                    <Text style={styles.actionLabel}>Navigate</Text>
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={callCustomer}>
                    <Phone size={24} color={colors.voltage} strokeWidth={2} />
                    <Text style={styles.actionLabel}>Call</Text>
                </Pressable>
                <Pressable style={styles.actionBtn}>
                    <MessageCircle size={24} color={colors.voltage} strokeWidth={2} />
                    <Text style={styles.actionLabel}>Message</Text>
                </Pressable>
            </View>

            {/* Pricing */}
            <View style={styles.pricingCard}>
                <Text style={styles.pricingLabel}>Estimated Earnings</Text>
                <Text style={styles.pricingValue}>
                    KES {((request.pricing?.total || 0) * 0.75).toLocaleString()}
                </Text>
                <Text style={styles.pricingNote}>75% of KES {request.pricing?.total?.toLocaleString()}</Text>
            </View>

            {/* Status Update Button */}
            {statusConfig.nextStatus && (
                <Pressable
                    style={[
                        styles.updateButton,
                        { backgroundColor: statusConfig.color },
                        isLoading && styles.buttonDisabled
                    ]}
                    onPress={handleStatusUpdate}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={colors.text.primary} />
                    ) : (
                        <Text style={styles.updateButtonText}>{statusConfig.nextLabel}</Text>
                    )}
                </Pressable>
            )}

            {/* Cancel Option */}
            {currentStatus !== 'completed' && currentStatus !== 'inProgress' && (
                <Pressable
                    style={styles.cancelButton}
                    onPress={() => {
                        Alert.alert(
                            'Cancel Job?',
                            'Are you sure you want to cancel this job? This may affect your rating.',
                            [
                                { text: 'No, Keep Job', style: 'cancel' },
                                {
                                    text: 'Yes, Cancel',
                                    style: 'destructive',
                                    onPress: async () => {
                                        await updateRequestStatus(requestId!, 'cancelled');
                                        router.back();
                                    }
                                },
                            ]
                        );
                    }}
                >
                    <Text style={styles.cancelButtonText}>Cancel Job</Text>
                </Pressable>
            )}
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.charcoal[900],
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.charcoal[800],
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        marginBottom: spacing.md,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: spacing.sm,
    },
    statusText: {
        color: colors.text.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    serviceInfo: {
        alignItems: 'center',
    },
    serviceEmoji: {
        fontSize: 48,
        marginBottom: spacing.sm,
    },
    serviceName: {
        color: colors.text.primary,
        fontSize: 24,
        fontWeight: '700',
    },
    etaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.lg,
        backgroundColor: colors.charcoal[800],
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
    },
    etaItem: {
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },
    etaValue: {
        color: colors.voltage,
        fontSize: 28,
        fontWeight: '700',
    },
    etaLabel: {
        color: colors.text.muted,
        fontSize: 12,
    },
    etaDivider: {
        width: 1,
        height: 40,
        backgroundColor: colors.charcoal[600],
    },
    locationCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.charcoal[800],
        marginHorizontal: spacing.lg,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
    },
    locationIcon: {
        fontSize: 24,
        marginRight: spacing.md,
    },
    locationInfo: {
        flex: 1,
    },
    locationLabel: {
        color: colors.text.muted,
        fontSize: 12,
        marginBottom: 2,
    },
    locationAddress: {
        color: colors.text.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    locationLandmark: {
        color: colors.text.secondary,
        fontSize: 13,
        marginTop: 2,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: spacing.lg,
        marginVertical: spacing.md,
    },
    actionBtn: {
        alignItems: 'center',
        backgroundColor: colors.charcoal[700],
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.lg,
    },
    actionIcon: {
        fontSize: 24,
        marginBottom: spacing.xs,
    },
    actionLabel: {
        color: colors.text.secondary,
        fontSize: 12,
    },
    pricingCard: {
        backgroundColor: colors.charcoal[800],
        marginHorizontal: spacing.lg,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.voltage + '30',
    },
    pricingLabel: {
        color: colors.text.muted,
        fontSize: 12,
    },
    pricingValue: {
        color: colors.voltage,
        fontSize: 32,
        fontWeight: '700',
        marginVertical: spacing.xs,
    },
    pricingNote: {
        color: colors.text.muted,
        fontSize: 12,
    },
    updateButton: {
        marginHorizontal: spacing.lg,
        marginTop: spacing.xl,
        paddingVertical: 18,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    updateButtonText: {
        color: colors.text.primary,
        fontSize: 18,
        fontWeight: '700',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    cancelButton: {
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: colors.emergency,
        fontSize: 14,
    },
});
