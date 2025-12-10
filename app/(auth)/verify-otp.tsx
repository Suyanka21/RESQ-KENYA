// ⚡ ResQ Kenya - OTP Verification Screen (Voltage Premium)
import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, borderRadius, spacing } from '../../theme/voltage-premium';
import { useAuth } from '../../services/AuthContext';
import { verifyOTP, sendOTP } from '../../services/auth.service';

export default function VerifyOTPScreen() {
    const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(60);

    const inputRefs = useRef<Array<TextInput | null>>([]);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            router.replace('/(customer)');
        }
    }, [isAuthenticated, authLoading]);

    useEffect(() => {
        // Countdown timer for resend
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const handleOtpChange = (text: string, index: number) => {
        if (text.length > 1) {
            // Handle paste
            const digits = text.replace(/\D/g, '').slice(0, 6).split('');
            const newOtp = [...otp];
            digits.forEach((digit, i) => {
                if (index + i < 6) {
                    newOtp[index + i] = digit;
                }
            });
            setOtp(newOtp);
            const nextIndex = Math.min(index + digits.length, 5);
            inputRefs.current[nextIndex]?.focus();
        } else {
            const newOtp = [...otp];
            newOtp[index] = text.replace(/\D/g, '');
            setOtp(newOtp);

            // Auto-focus next input
            if (text && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        }
        setError('');
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const isOtpComplete = otp.every(digit => digit !== '');

    const handleVerify = async () => {
        if (!isOtpComplete) return;

        setIsLoading(true);
        setError('');

        try {
            const fullOtp = otp.join('');
            console.log('Verifying OTP:', fullOtp, 'for', phoneNumber);

            // Development mode: accept test code 123456
            if (fullOtp === '123456') {
                console.log('Test OTP accepted - skipping Firebase auth in dev mode');
                router.replace('/(customer)');
                return;
            }

            // Production mode: use Firebase auth
            const result = await verifyOTP(fullOtp);

            if (result.success && result.user) {
                console.log('OTP verified successfully, user:', result.user.uid);
                router.replace('/(customer)');
            } else {
                setError(result.error || 'Invalid code. Please try again.');
            }
        } catch (err: any) {
            console.error('Verification error:', err);
            setError(err.message || 'Verification failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;

        setResendTimer(60);
        setOtp(['', '', '', '', '', '']);
        setError('');
        console.log('Resending OTP to:', phoneNumber);

        // Production mode: uncomment to use real OTP
        // const result = await sendOTP(phoneNumber as string, 'recaptcha-container');
        // if (!result.success) {
        //     setError(result.error || 'Failed to resend code');
        // }
    };

    if (authLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.voltage} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                {/* Back Button */}
                <Pressable
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backText}>← Back</Text>
                </Pressable>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Verify your number</Text>
                    <Text style={styles.subtitle}>
                        Enter the 6-digit code sent to{'\n'}
                        <Text style={styles.phoneNumber}>{phoneNumber}</Text>
                    </Text>
                </View>

                {/* Development Notice */}
                <View style={styles.devNotice}>
                    <Text style={styles.devText}>✅ Test Code: 123456</Text>
                </View>

                {/* OTP Input */}
                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => { inputRefs.current[index] = ref; }}
                            style={[
                                styles.otpInput,
                                digit ? styles.otpInputFilled : null
                            ]}
                            keyboardType="number-pad"
                            maxLength={6}
                            value={digit}
                            onChangeText={(text) => handleOtpChange(text, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            selectTextOnFocus
                        />
                    ))}
                </View>

                {/* Error */}
                {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : null}

                {/* Verify Button */}
                <Pressable
                    style={({ pressed }) => [
                        styles.verifyButton,
                        isOtpComplete ? styles.verifyButtonActive : styles.verifyButtonDisabled,
                        pressed && isOtpComplete && styles.verifyButtonPressed
                    ]}
                    onPress={handleVerify}
                    disabled={!isOtpComplete || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={colors.charcoal[900]} />
                    ) : (
                        <Text style={[
                            styles.verifyButtonText,
                            isOtpComplete ? styles.verifyButtonTextActive : styles.verifyButtonTextDisabled
                        ]}>
                            Verify
                        </Text>
                    )}
                </Pressable>

                {/* Resend */}
                <View style={styles.resendContainer}>
                    {resendTimer > 0 ? (
                        <Text style={styles.resendTimerText}>
                            Resend code in <Text style={styles.resendTimerHighlight}>{resendTimer}s</Text>
                        </Text>
                    ) : (
                        <Pressable onPress={handleResend}>
                            <Text style={styles.resendText}>Resend Code</Text>
                        </Pressable>
                    )}
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.charcoal[900],
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.charcoal[900],
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    backButton: {
        marginBottom: spacing.xl,
    },
    backText: {
        color: colors.voltage,
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: colors.text.secondary,
        lineHeight: 24,
    },
    phoneNumber: {
        color: colors.voltage,
        fontWeight: '600',
    },
    devNotice: {
        backgroundColor: `${colors.success}15`,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: `${colors.success}30`,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    devText: {
        color: colors.success,
        fontSize: 14,
        fontWeight: '600',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    otpInput: {
        width: 48,
        height: 56,
        backgroundColor: colors.charcoal[800],
        borderRadius: borderRadius.lg,
        textAlign: 'center',
        color: colors.text.primary,
        fontSize: 24,
        fontWeight: '700',
        borderWidth: 1,
        borderColor: colors.charcoal[600],
    },
    otpInputFilled: {
        borderColor: colors.voltage,
    },
    errorText: {
        color: colors.emergency,
        fontSize: 14,
        marginBottom: spacing.md,
    },
    verifyButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifyButtonActive: {
        backgroundColor: colors.voltage,
    },
    verifyButtonDisabled: {
        backgroundColor: colors.charcoal[600],
    },
    verifyButtonPressed: {
        backgroundColor: colors.voltageDeep,
        transform: [{ scale: 0.98 }],
    },
    verifyButtonText: {
        fontSize: 18,
        fontWeight: '700',
    },
    verifyButtonTextActive: {
        color: colors.charcoal[900],
    },
    verifyButtonTextDisabled: {
        color: colors.text.muted,
    },
    resendContainer: {
        marginTop: spacing.lg,
        alignItems: 'center',
    },
    resendTimerText: {
        color: colors.text.muted,
        fontSize: 14,
    },
    resendTimerHighlight: {
        color: colors.voltage,
        fontWeight: '600',
    },
    resendText: {
        color: colors.voltage,
        fontSize: 16,
        fontWeight: '600',
    },
});
