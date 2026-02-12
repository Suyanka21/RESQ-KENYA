// ResQ Kenya - Emergency SOS Component
// One-tap emergency button with Kenya emergency numbers

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Animated,
    StyleSheet,
    Vibration,
    Linking,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Kenya Emergency Numbers
export const KENYA_EMERGENCY_NUMBERS = {
    general: '999',
    gsmStandard: '112',
    redCross: '1199',
    stJohnAmbulance: '0800720990',
    emergencyPlus: '0800723253',
} as const;

interface EmergencySOSProps {
    onEmergencyTrigger: (emergencyType: 'medical' | 'fire' | 'police') => void;
    userLocation?: { latitude: number; longitude: number };
    disabled?: boolean;
}

export default function EmergencySOS({
    onEmergencyTrigger,
    userLocation,
    disabled = false,
}: EmergencySOSProps) {
    const [showModal, setShowModal] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [selectedType, setSelectedType] = useState<'medical' | 'fire' | 'police'>('medical');

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const countdownTimer = useRef<NodeJS.Timeout | null>(null);

    // Pulse animation for SOS button
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    // Countdown effect
    useEffect(() => {
        if (isCountingDown && countdown > 0) {
            // Vibrate on each second
            Vibration.vibrate(200);

            countdownTimer.current = setTimeout(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (isCountingDown && countdown === 0) {
            // Trigger emergency
            triggerEmergency();
        }

        return () => {
            if (countdownTimer.current) {
                clearTimeout(countdownTimer.current);
            }
        };
    }, [isCountingDown, countdown]);

    const handleSOSPress = () => {
        if (disabled) return;
        Vibration.vibrate(100);
        setShowModal(true);
    };

    const startCountdown = (type: 'medical' | 'fire' | 'police') => {
        setSelectedType(type);
        setIsCountingDown(true);
        setCountdown(5);
        Vibration.vibrate([0, 500, 200, 500]); // Pattern vibration
    };

    const cancelCountdown = () => {
        setIsCountingDown(false);
        setCountdown(5);
        if (countdownTimer.current) {
            clearTimeout(countdownTimer.current);
        }
    };

    const triggerEmergency = () => {
        setIsCountingDown(false);
        setShowModal(false);
        Vibration.vibrate([0, 1000]); // Long vibration
        onEmergencyTrigger(selectedType);
    };

    const callEmergencyNumber = async (number: string) => {
        const phoneUrl = Platform.OS === 'android' ? `tel:${number}` : `telprompt:${number}`;
        try {
            const supported = await Linking.canOpenURL(phoneUrl);
            if (supported) {
                await Linking.openURL(phoneUrl);
            } else {
                Alert.alert('Error', 'Phone calls not supported on this device');
            }
        } catch (error) {
            console.error('Error making call:', error);
            Alert.alert('Error', 'Could not make the call');
        }
    };

    return (
        <>
            {/* SOS Button */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                    style={[styles.sosButton, disabled && styles.sosButtonDisabled]}
                    onPress={handleSOSPress}
                    disabled={disabled}
                    activeOpacity={0.8}
                >
                    <Ionicons name="warning" size={28} color="#FFFFFF" />
                    <Text style={styles.sosButtonText}>SOS</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Emergency Modal */}
            <Modal
                visible={showModal}
                transparent
                animationType="slide"
                onRequestClose={() => !isCountingDown && setShowModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {!isCountingDown ? (
                            <>
                                <Text style={styles.modalTitle}>Emergency SOS</Text>
                                <Text style={styles.modalSubtitle}>
                                    Select the type of emergency
                                </Text>

                                {/* Emergency Type Buttons */}
                                <View style={styles.emergencyTypes}>
                                    <TouchableOpacity
                                        style={[styles.emergencyTypeButton, styles.medicalButton]}
                                        onPress={() => startCountdown('medical')}
                                    >
                                        <Ionicons name="medkit" size={32} color="#FFFFFF" />
                                        <Text style={styles.emergencyTypeText}>Medical</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.emergencyTypeButton, styles.fireButton]}
                                        onPress={() => startCountdown('fire')}
                                    >
                                        <Ionicons name="flame" size={32} color="#FFFFFF" />
                                        <Text style={styles.emergencyTypeText}>Fire</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.emergencyTypeButton, styles.policeButton]}
                                        onPress={() => startCountdown('police')}
                                    >
                                        <Ionicons name="shield" size={32} color="#FFFFFF" />
                                        <Text style={styles.emergencyTypeText}>Police</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Quick Call Buttons */}
                                <View style={styles.quickCallSection}>
                                    <Text style={styles.quickCallTitle}>Quick Call</Text>
                                    <View style={styles.quickCallButtons}>
                                        <TouchableOpacity
                                            style={styles.quickCallButton}
                                            onPress={() => callEmergencyNumber(KENYA_EMERGENCY_NUMBERS.general)}
                                        >
                                            <Text style={styles.quickCallNumber}>999</Text>
                                            <Text style={styles.quickCallLabel}>Police/Ambulance</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.quickCallButton}
                                            onPress={() => callEmergencyNumber(KENYA_EMERGENCY_NUMBERS.redCross)}
                                        >
                                            <Text style={styles.quickCallNumber}>1199</Text>
                                            <Text style={styles.quickCallLabel}>Kenya Red Cross</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.quickCallButton}
                                            onPress={() => callEmergencyNumber(KENYA_EMERGENCY_NUMBERS.gsmStandard)}
                                        >
                                            <Text style={styles.quickCallNumber}>112</Text>
                                            <Text style={styles.quickCallLabel}>GSM Emergency</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Cancel Button */}
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => setShowModal(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            /* Countdown View */
                            <View style={styles.countdownContainer}>
                                <Text style={styles.countdownTitle}>Sending SOS in</Text>
                                <Text style={styles.countdownNumber}>{countdown}</Text>
                                <Text style={styles.countdownSubtitle}>
                                    Tap below to cancel
                                </Text>

                                <TouchableOpacity
                                    style={styles.abortButton}
                                    onPress={cancelCountdown}
                                >
                                    <Text style={styles.abortButtonText}>CANCEL</Text>
                                </TouchableOpacity>

                                <Text style={styles.countdownInfo}>
                                    {selectedType === 'medical' && 'Medical emergency will be dispatched'}
                                    {selectedType === 'fire' && 'Fire emergency will be reported'}
                                    {selectedType === 'police' && 'Police emergency will be reported'}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    sosButton: {
        backgroundColor: '#FF3B30',
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
    },
    sosButtonDisabled: {
        backgroundColor: '#999999',
        shadowColor: '#999999',
    },
    sosButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    emergencyTypes: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    emergencyTypeButton: {
        flex: 1,
        marginHorizontal: 6,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
    },
    medicalButton: {
        backgroundColor: '#FF3B30',
    },
    fireButton: {
        backgroundColor: '#FF9500',
    },
    policeButton: {
        backgroundColor: '#007AFF',
    },
    emergencyTypeText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
    },
    quickCallSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E',
    },
    quickCallTitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 12,
    },
    quickCallButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    quickCallButton: {
        flex: 1,
        marginHorizontal: 4,
        padding: 12,
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
        alignItems: 'center',
    },
    quickCallNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FF9500',
    },
    quickCallLabel: {
        fontSize: 11,
        color: '#8E8E93',
        marginTop: 4,
        textAlign: 'center',
    },
    cancelButton: {
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#2C2C2E',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    countdownContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    countdownTitle: {
        fontSize: 20,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    countdownNumber: {
        fontSize: 96,
        fontWeight: '700',
        color: '#FF3B30',
        marginVertical: 20,
    },
    countdownSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 20,
    },
    abortButton: {
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 48,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FF3B30',
    },
    abortButtonText: {
        color: '#FF3B30',
        fontSize: 18,
        fontWeight: '700',
    },
    countdownInfo: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 24,
        textAlign: 'center',
    },
});
