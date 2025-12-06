// ResQ Kenya - Payment Modal Component
// M-Pesa STK Push payment flow

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    Pressable,
    TextInput,
    ActivityIndicator,
    Animated,
} from 'react-native';
import {
    initiatePaymentDemo as initiatePayment,
    formatAmount,
    validatePhoneNumber,
    formatPhoneForMpesa,
    PaymentStatus,
} from '../../services/payment.service';
import { colors } from '../../theme/voltage-premium';

interface PaymentModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: (receiptNumber?: string) => void;
    amount: number;
    requestId: string;
    defaultPhone?: string;
    serviceName?: string;
}

export default function PaymentModal({
    visible,
    onClose,
    onSuccess,
    amount,
    requestId,
    defaultPhone = '',
    serviceName = 'Service',
}: PaymentModalProps) {
    const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
    const [status, setStatus] = useState<'idle' | 'sending' | 'waiting' | 'success' | 'failed'>('idle');
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(60);

    const pulseAnim = new Animated.Value(1);

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            setStatus('idle');
            setError('');
            setCountdown(60);
            if (defaultPhone) setPhoneNumber(defaultPhone);
        }
    }, [visible]);

    // Countdown timer when waiting
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (status === 'waiting' && countdown > 0) {
            timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        } else if (countdown === 0 && status === 'waiting') {
            setStatus('failed');
            setError('Payment timed out. Please try again.');
        }
        return () => clearTimeout(timer);
    }, [status, countdown]);

    // Pulse animation for waiting state
    useEffect(() => {
        if (status === 'waiting') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [status]);

    const handlePhoneChange = (text: string) => {
        // Allow only digits
        const cleaned = text.replace(/[^\d]/g, '');
        setPhoneNumber(cleaned);
        setError('');
    };

    const handlePay = async () => {
        if (!validatePhoneNumber(phoneNumber)) {
            setError('Please enter a valid Kenyan phone number');
            return;
        }

        setStatus('sending');
        setError('');

        try {
            const result = await initiatePayment({
                requestId,
                amount,
                phoneNumber: formatPhoneForMpesa(phoneNumber),
                description: `ResQ ${serviceName} Payment`,
            });

            if (result.success) {
                setStatus('waiting');
                setCountdown(60);

                // Simulate successful payment after 5 seconds (demo)
                setTimeout(() => {
                    setStatus('success');
                    setTimeout(() => onSuccess(result.checkoutRequestID), 1500);
                }, 5000);
            } else {
                setStatus('failed');
                setError(result.error || 'Payment initiation failed');
            }
        } catch (err: any) {
            setStatus('failed');
            setError(err.message || 'An error occurred');
        }
    };

    const getPhoneDisplayValue = () => {
        if (phoneNumber.length === 0) return '';
        if (phoneNumber.startsWith('0')) return phoneNumber;
        return phoneNumber;
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={status === 'waiting' ? undefined : onClose}
        >
            <View className="flex-1 bg-black/80 justify-end">
                <View className="bg-charcoal-800 rounded-t-3xl px-6 pt-6 pb-10">
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-white text-xl font-bold">Payment</Text>
                        {status !== 'waiting' && status !== 'success' && (
                            <Pressable onPress={onClose}>
                                <Text className="text-white/60 text-2xl">×</Text>
                            </Pressable>
                        )}
                    </View>

                    {/* Amount Display */}
                    <View className="bg-charcoal-700 rounded-xl p-4 mb-6 items-center">
                        <Text className="text-white/60 text-sm mb-1">Total Amount</Text>
                        <Text className="text-voltage text-3xl font-bold">
                            {formatAmount(amount)}
                        </Text>
                        <Text className="text-white/50 text-sm mt-1">{serviceName}</Text>
                    </View>

                    {/* Content based on status */}
                    {status === 'idle' || status === 'failed' ? (
                        <>
                            {/* M-Pesa Logo/Badge */}
                            <View className="flex-row items-center justify-center mb-4">
                                <View className="bg-[#4CAF50] px-4 py-2 rounded-lg">
                                    <Text className="text-white font-bold">M-PESA</Text>
                                </View>
                            </View>

                            {/* Phone Input */}
                            <Text className="text-white/70 text-sm mb-2">M-Pesa Phone Number</Text>
                            <View className="flex-row items-center bg-charcoal-900 rounded-xl border border-charcoal-600 mb-4">
                                <View className="px-4 py-4 border-r border-charcoal-600">
                                    <Text className="text-white font-semibold">🇰🇪 +254</Text>
                                </View>
                                <TextInput
                                    className="flex-1 px-4 py-4 text-white text-lg"
                                    placeholder="712 345 678"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    keyboardType="phone-pad"
                                    value={getPhoneDisplayValue()}
                                    onChangeText={handlePhoneChange}
                                    maxLength={10}
                                />
                            </View>

                            {/* Error Message */}
                            {error && (
                                <View className="bg-emergency/20 rounded-lg p-3 mb-4">
                                    <Text className="text-emergency text-sm">{error}</Text>
                                </View>
                            )}

                            {/* Pay Button */}
                            <Pressable
                                className={`py-4 rounded-xl ${validatePhoneNumber(phoneNumber) ? 'bg-[#4CAF50]' : 'bg-charcoal-600'
                                    }`}
                                onPress={handlePay}
                                disabled={!validatePhoneNumber(phoneNumber)}
                            >
                                <Text className="text-white text-center font-bold text-lg">
                                    Pay with M-Pesa
                                </Text>
                            </Pressable>

                            {/* Info Text */}
                            <Text className="text-white/40 text-xs text-center mt-4">
                                You'll receive an M-Pesa prompt on your phone to complete payment
                            </Text>
                        </>
                    ) : status === 'sending' ? (
                        <View className="items-center py-8">
                            <ActivityIndicator size="large" color={colors.voltage} />
                            <Text className="text-white mt-4">Sending payment request...</Text>
                        </View>
                    ) : status === 'waiting' ? (
                        <View className="items-center py-8">
                            {/* Animated Phone Icon */}
                            <Animated.View
                                style={{ transform: [{ scale: pulseAnim }] }}
                                className="w-20 h-20 bg-[#4CAF50]/20 rounded-full items-center justify-center mb-4"
                            >
                                <Text className="text-4xl">📱</Text>
                            </Animated.View>

                            <Text className="text-white text-lg font-semibold mb-2">
                                Check Your Phone
                            </Text>
                            <Text className="text-white/60 text-center mb-4">
                                Enter your M-Pesa PIN to complete{'\n'}the payment of {formatAmount(amount)}
                            </Text>

                            {/* Countdown */}
                            <View className="bg-charcoal-700 px-4 py-2 rounded-full">
                                <Text className="text-voltage font-semibold">
                                    Waiting... {countdown}s
                                </Text>
                            </View>
                        </View>
                    ) : status === 'success' ? (
                        <View className="items-center py-8">
                            <View className="w-20 h-20 bg-success/20 rounded-full items-center justify-center mb-4">
                                <Text className="text-4xl">✅</Text>
                            </View>
                            <Text className="text-success text-xl font-bold mb-2">
                                Payment Successful!
                            </Text>
                            <Text className="text-white/60 text-center">
                                Your payment of {formatAmount(amount)} has been received
                            </Text>
                        </View>
                    ) : null}
                </View>
            </View>
        </Modal>
    );
}
