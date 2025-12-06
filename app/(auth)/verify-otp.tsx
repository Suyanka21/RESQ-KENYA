// ResQ Kenya - OTP Verification Screen
import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../services/AuthContext';

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

            // For development/testing, accept test code
            if (fullOtp === '123456') {
                // Simulate successful auth for testing
                console.log('Test OTP accepted - would authenticate in production');

                // In production, this would verify with Firebase
                // For now, navigate to customer dashboard
                router.replace('/(customer)');
                return;
            }

            // Real verification would happen here
            // const credential = PhoneAuthProvider.credential(verificationId, fullOtp);
            // await signInWithCredential(auth, credential);

            setError('Invalid code. Use 123456 for testing.');
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
        // In production: await sendOTP(phoneNumber);
    };

    if (authLoading) {
        return (
            <View className="flex-1 bg-charcoal-900 items-center justify-center">
                <ActivityIndicator size="large" color="#FFD60A" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-charcoal-900"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View className="flex-1 px-6 pt-20">
                {/* Back Button */}
                <Pressable
                    className="mb-8"
                    onPress={() => router.back()}
                >
                    <Text className="text-voltage text-base">← Back</Text>
                </Pressable>

                {/* Header */}
                <View className="mb-8">
                    <Text className="text-3xl font-bold text-white mb-2">
                        Verify your number
                    </Text>
                    <Text className="text-white/60 text-base">
                        Enter the 6-digit code sent to{'\n'}
                        <Text className="text-voltage font-semibold">{phoneNumber}</Text>
                    </Text>
                </View>

                {/* Development Notice */}
                <View className="bg-success/10 rounded-xl p-3 mb-6 border border-success/20">
                    <Text className="text-success text-sm font-medium">✅ Test Code: 123456</Text>
                </View>

                {/* OTP Input */}
                <View className="flex-row justify-between mb-6">
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => { inputRefs.current[index] = ref; }}
                            className={`w-12 h-14 bg-charcoal-800 rounded-xl text-center text-white text-2xl font-bold border ${digit ? 'border-voltage' : 'border-charcoal-600'
                                }`}
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
                    <Text className="text-emergency text-sm mb-4">{error}</Text>
                ) : null}

                {/* Verify Button */}
                <Pressable
                    className={`w-full py-4 rounded-xl ${isOtpComplete ? 'bg-voltage' : 'bg-charcoal-600'
                        }`}
                    onPress={handleVerify}
                    disabled={!isOtpComplete || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#0F0F0F" />
                    ) : (
                        <Text className={`text-center font-bold text-lg ${isOtpComplete ? 'text-charcoal-900' : 'text-white/50'
                            }`}>
                            Verify
                        </Text>
                    )}
                </Pressable>

                {/* Resend */}
                <View className="mt-6 items-center">
                    {resendTimer > 0 ? (
                        <Text className="text-white/50 text-sm">
                            Resend code in <Text className="text-voltage font-semibold">{resendTimer}s</Text>
                        </Text>
                    ) : (
                        <Pressable onPress={handleResend}>
                            <Text className="text-voltage font-semibold text-base">
                                Resend Code
                            </Text>
                        </Pressable>
                    )}
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
