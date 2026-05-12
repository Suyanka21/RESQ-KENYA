// ResQ Kenya - Payment Modal Component
// M-Pesa STK Push payment flow

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    initiatePayment,
    formatAmount,
    validatePhoneNumber,
    formatPhoneForMpesa,
    subscribeToPaymentStatus,
    PaymentStatus,
} from '../../services/payment.service';
import { colors } from '../../theme/voltage-premium';

/**
 * Phase 4 (audit-v2 §N-CRIT-5) — STK push UX timeout.
 *
 * Safaricom Daraja's STK push prompts the customer's handset and
 * gives them up to ~75 seconds to enter the M-PIN. We use 90 seconds
 * to give a safety margin for callback latency. The previous
 * implementation hardcoded a 5-second `setTimeout` that fabricated
 * success — the audit's archetype "shows fake state" bug. Now the
 * UI subscribes to `payment_requests/{idempotencyKey}` for the real
 * server status and only times out if no callback arrives within
 * `PAYMENT_TIMEOUT_SECONDS`.
 */
const PAYMENT_TIMEOUT_SECONDS = 90;
const PAYMENT_SUCCESS_HOLD_MS = 1500;

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
    const [countdown, setCountdown] = useState(PAYMENT_TIMEOUT_SECONDS);
    const [receipt, setReceipt] = useState<string | undefined>(undefined);

    // Track the live `payment_requests/{idempotencyKey}` subscription
    // so we can tear it down on unmount, modal close, or success.
    const unsubRef = useRef<null | (() => void)>(null);
    const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Cleanup helper — invoked on every state transition that ends a
    // pending payment, plus on unmount.
    //
    // CodeRabbit feedback (PR #9): wrapped in `useCallback` because
    // this helper is referenced by multiple effects + the
    // `subscribeToPaymentStatus` error callback. An unstable
    // reference would re-run unmount-cleanup effects on every
    // render.
    const teardownSubscription = useCallback(() => {
        if (unsubRef.current) {
            unsubRef.current();
            unsubRef.current = null;
        }
        if (successTimerRef.current) {
            clearTimeout(successTimerRef.current);
            successTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => teardownSubscription();
    }, [teardownSubscription]);

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            setStatus('idle');
            setError('');
            setCountdown(PAYMENT_TIMEOUT_SECONDS);
            setReceipt(undefined);
            if (defaultPhone) setPhoneNumber(defaultPhone);
        } else {
            teardownSubscription();
        }
    }, [visible, defaultPhone, teardownSubscription]);

    // Countdown timer when waiting
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (status === 'waiting' && countdown > 0) {
            timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        } else if (countdown === 0 && status === 'waiting') {
            // 90s elapsed without a server-side completion — Daraja
            // never called us back, or the customer never entered
            // their M-PIN. Tear down the subscription so a late
            // callback cannot fire onSuccess after the modal has
            // shown a failure state.
            teardownSubscription();
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

            if (result.success && result.idempotencyKey) {
                setStatus('waiting');
                setCountdown(PAYMENT_TIMEOUT_SECONDS);

                // Phase 4 (audit-v2 §N-CRIT-5): subscribe to the
                // server-truth status of this STK push instead of
                // fabricating success after a fixed delay.
                teardownSubscription();
                unsubRef.current = subscribeToPaymentStatus(
                    result.idempotencyKey,
                    (statusUpdate) => {
                        if (statusUpdate.status === 'completed') {
                            const receiptNumber =
                                statusUpdate.mpesaReceiptNumber ?? result.checkoutRequestID;
                            setReceipt(receiptNumber);
                            setStatus('success');
                            // Hold the success state briefly for UX
                            // before handing back control.
                            successTimerRef.current = setTimeout(() => {
                                onSuccess(receiptNumber);
                            }, PAYMENT_SUCCESS_HOLD_MS);
                            // The subscription has fulfilled its
                            // purpose; release Firestore listener.
                            if (unsubRef.current) {
                                unsubRef.current();
                                unsubRef.current = null;
                            }
                        } else if (statusUpdate.status === 'failed' || statusUpdate.status === 'cancelled') {
                            teardownSubscription();
                            setStatus('failed');
                            setError(
                                statusUpdate.status === 'cancelled'
                                    ? 'Payment was cancelled on your phone.'
                                    : 'Payment failed. Please try again.'
                            );
                        }
                    },
                    // CodeRabbit feedback (PR #9): surface listener
                    // errors instead of waiting 90s for the timeout.
                    // Most likely cause is a rules denial on the
                    // payment_requests row, which is actionable.
                    (listenerError) => {
                        teardownSubscription();
                        setStatus('failed');
                        setError(
                            `Could not track payment: ${listenerError.message}. Please contact support.`
                        );
                    }
                );
            } else if (!result.success) {
                setStatus('failed');
                setError(result.error || 'Payment initiation failed');
            } else {
                // CodeRabbit feedback (PR #9): success=true with no
                // idempotencyKey is an invariant violation — the
                // backend contract guarantees one is echoed on every
                // success. Surface it as a distinct failure so the
                // bug is visible rather than hidden in a generic
                // "initiation failed" message.
                console.error('[PaymentModal] initiatePayment returned success without idempotencyKey');
                setStatus('failed');
                setError('Payment service returned an unexpected response. Please try again.');
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
                                <View className="px-4 py-2 rounded-lg" style={{ backgroundColor: colors.service.fuel }}>
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
                                    placeholderTextColor={colors.text.opacity30}
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
                                className="py-4 rounded-xl"
                                style={{ backgroundColor: validatePhoneNumber(phoneNumber) ? colors.service.fuel : colors.background.border }}
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
                                style={{ transform: [{ scale: pulseAnim }], backgroundColor: `${colors.service.fuel}33` }}
                                className="w-20 h-20 rounded-full items-center justify-center mb-4"
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
