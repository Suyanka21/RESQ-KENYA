// ⚡ ResQ Kenya - Phone Login Screen (Voltage Premium)
import { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { router } from 'expo-router';
import Button from '../../components/ui/Button';
import { PhoneInput } from '../../components/ui/Input';
import { formatPhoneNumber } from '../../services/auth.service';
import { colors, borderRadius, spacing, shadows } from '../../theme/voltage-premium';

export default function LoginScreen() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const isValidPhone = () => {
        const cleaned = phoneNumber.replace(/\D/g, '');
        if (cleaned.startsWith('0')) {
            return cleaned.length === 10;
        }
        return cleaned.length === 9;
    };

    const getDisplayNumber = () => {
        return formatPhoneNumber(phoneNumber);
    };

    const handleSendOTP = async () => {
        if (!isValidPhone()) {
            setError('Please enter a valid Kenyan phone number');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const fullNumber = formatPhoneNumber(phoneNumber);
            console.log('Initiating OTP for:', fullNumber);

            // Navigate to OTP verification
            router.push({
                pathname: '/(auth)/verify-otp',
                params: { phoneNumber: fullNumber }
            });
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to send verification code');
        } finally {
            setIsLoading(false);
        }
    };

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
                    <Text style={styles.title}>
                        Welcome to <Text style={styles.voltageText}>ResQ</Text>
                    </Text>
                    <Text style={styles.subtitle}>
                        Enter your phone number to continue
                    </Text>
                </View>

                {/* Phone Input */}
                <View style={styles.inputSection}>
                    <PhoneInput
                        value={phoneNumber}
                        onChangeText={(text) => {
                            setPhoneNumber(text);
                            setError('');
                        }}
                        error={error}
                    />

                    {isValidPhone() && (
                        <Text style={styles.previewText}>
                            Will send to: {getDisplayNumber()}
                        </Text>
                    )}
                </View>

                {/* Development Notice */}
                <View style={styles.devNotice}>
                    <Text style={styles.devTitle}>📱 Development Mode</Text>
                    <Text style={styles.devText}>
                        Use test phone: +254 700 000 001{'\n'}
                        Test OTP: 123456
                    </Text>
                </View>

                {/* Info Text */}
                <Text style={styles.infoText}>
                    We'll send you a verification code via SMS to confirm your number.
                </Text>

                {/* Continue Button */}
                <Button
                    title={isLoading ? 'Sending...' : 'Continue'}
                    onPress={handleSendOTP}
                    disabled={!isValidPhone()}
                    loading={isLoading}
                    size="lg"
                    fullWidth
                    icon={<Text style={styles.buttonIcon}>→</Text>}
                    iconPosition="right"
                />

                {/* Terms */}
                <Text style={styles.termsText}>
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.charcoal[900],
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    backButton: {
        marginBottom: spacing.lg,
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
        fontSize: 32,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 8,
    },
    voltageText: {
        color: colors.voltage,
    },
    subtitle: {
        fontSize: 16,
        color: colors.text.secondary,
    },
    inputSection: {
        marginBottom: spacing.lg,
    },
    previewText: {
        color: colors.voltage,
        fontSize: 13,
        marginTop: -8,
        opacity: 0.8,
    },
    devNotice: {
        backgroundColor: `${colors.voltage}15`,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: `${colors.voltage}30`,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    devTitle: {
        color: colors.voltage,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    devText: {
        color: colors.text.secondary,
        fontSize: 12,
        lineHeight: 18,
    },
    infoText: {
        color: colors.text.muted,
        fontSize: 14,
        marginBottom: spacing.lg,
        lineHeight: 20,
    },
    buttonIcon: {
        color: colors.charcoal[900],
        fontSize: 18,
        fontWeight: '700',
    },
    termsText: {
        color: colors.text.muted,
        fontSize: 12,
        textAlign: 'center',
        marginTop: spacing.lg,
        lineHeight: 18,
        paddingHorizontal: spacing.lg,
    },
});
