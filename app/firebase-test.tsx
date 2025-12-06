// ResQ Kenya - Firebase Connection Test Screen
// This screen tests if Firebase is properly configured
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';

// Test Firebase imports
let firebaseApp: any = null;
let firebaseError: string | null = null;

try {
    const firebase = require('../config/firebase');
    firebaseApp = firebase.default;
} catch (error: any) {
    firebaseError = error.message;
}

interface ConfigCheck {
    name: string;
    envVar: string;
    value: string | undefined;
    isSet: boolean;
}

export default function FirebaseTestScreen() {
    const [checks, setChecks] = useState<ConfigCheck[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<'checking' | 'success' | 'error'>('checking');
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        verifyConfig();
    }, []);

    const verifyConfig = () => {
        // Check environment variables
        const envVars = [
            { name: 'API Key', envVar: 'EXPO_PUBLIC_FIREBASE_API_KEY' },
            { name: 'Auth Domain', envVar: 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN' },
            { name: 'Project ID', envVar: 'EXPO_PUBLIC_FIREBASE_PROJECT_ID' },
            { name: 'Storage Bucket', envVar: 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET' },
            { name: 'Messaging Sender ID', envVar: 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID' },
            { name: 'App ID', envVar: 'EXPO_PUBLIC_FIREBASE_APP_ID' },
            { name: 'Database URL', envVar: 'EXPO_PUBLIC_FIREBASE_DATABASE_URL' },
        ];

        const checkResults: ConfigCheck[] = envVars.map(({ name, envVar }) => {
            const value = process.env[envVar];
            return {
                name,
                envVar,
                value: value ? `${value.substring(0, 8)}...` : undefined,
                isSet: !!value && value.length > 0,
            };
        });

        setChecks(checkResults);

        // Check Firebase initialization
        if (firebaseError) {
            setConnectionStatus('error');
            setErrorMessage(firebaseError);
        } else if (firebaseApp) {
            try {
                const projectId = firebaseApp.options?.projectId;
                if (projectId) {
                    setConnectionStatus('success');
                } else {
                    setConnectionStatus('error');
                    setErrorMessage('Firebase initialized but no project ID found');
                }
            } catch (error: any) {
                setConnectionStatus('error');
                setErrorMessage(error.message);
            }
        } else {
            setConnectionStatus('error');
            setErrorMessage('Firebase app not initialized');
        }
    };

    const allConfigured = checks.every(c => c.isSet);

    return (
        <View className="flex-1 bg-charcoal-900">
            {/* Header */}
            <View className="px-6 pt-16 pb-4 bg-charcoal-800 border-b border-charcoal-600">
                <Pressable className="mb-4" onPress={() => router.back()}>
                    <Text className="text-voltage">← Back</Text>
                </Pressable>
                <Text className="text-white text-2xl font-bold">Firebase Config Test</Text>
                <Text className="text-white/60 text-sm mt-1">Verify your Firebase setup</Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                {/* Connection Status */}
                <View className={`p-4 rounded-xl mb-6 border ${connectionStatus === 'success'
                        ? 'bg-success/20 border-success'
                        : connectionStatus === 'error'
                            ? 'bg-emergency/20 border-emergency'
                            : 'bg-charcoal-800 border-charcoal-600'
                    }`}>
                    <Text className={`font-bold text-lg ${connectionStatus === 'success' ? 'text-success' :
                            connectionStatus === 'error' ? 'text-emergency' : 'text-white'
                        }`}>
                        {connectionStatus === 'success' ? '✅ Firebase Connected' :
                            connectionStatus === 'error' ? '❌ Connection Failed' :
                                '⏳ Checking...'}
                    </Text>
                    {connectionStatus === 'success' && firebaseApp?.options?.projectId && (
                        <Text className="text-white/70 text-sm mt-1">
                            Project: {firebaseApp.options.projectId}
                        </Text>
                    )}
                    {connectionStatus === 'error' && errorMessage && (
                        <Text className="text-white/70 text-sm mt-2">{errorMessage}</Text>
                    )}
                </View>

                {/* Environment Variables Check */}
                <Text className="text-white font-bold text-lg mb-3">Environment Variables</Text>
                <View className="bg-charcoal-800 rounded-xl border border-charcoal-600 mb-6">
                    {checks.map((check, index) => (
                        <View
                            key={check.envVar}
                            className={`flex-row items-center p-4 ${index !== checks.length - 1 ? 'border-b border-charcoal-600' : ''
                                }`}
                        >
                            <Text className={`text-xl mr-3 ${check.isSet ? '' : ''}`}>
                                {check.isSet ? '✅' : '❌'}
                            </Text>
                            <View className="flex-1">
                                <Text className="text-white font-medium">{check.name}</Text>
                                <Text className="text-white/50 text-xs">{check.envVar}</Text>
                            </View>
                            <Text className={`text-sm ${check.isSet ? 'text-success' : 'text-emergency'}`}>
                                {check.isSet ? check.value : 'Not Set'}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Summary */}
                <View className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-600 mb-8">
                    <Text className="text-white font-bold mb-2">Summary</Text>
                    <Text className="text-white/70 text-sm leading-5">
                        {allConfigured
                            ? 'All environment variables are set. Firebase should be ready to use.'
                            : 'Some environment variables are missing. Check your .env.local file and ensure all variables have the EXPO_PUBLIC_ prefix.'}
                    </Text>
                </View>

                {/* Instructions if error */}
                {!allConfigured && (
                    <View className="bg-voltage/10 rounded-xl p-4 border border-voltage/30 mb-8">
                        <Text className="text-voltage font-bold mb-2">Required .env.local Format</Text>
                        <View className="bg-charcoal-900 rounded-lg p-3 mt-2">
                            <Text className="text-white/80 text-xs font-mono leading-5">
                                EXPO_PUBLIC_FIREBASE_API_KEY=xxx{'\n'}
                                EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com{'\n'}
                                EXPO_PUBLIC_FIREBASE_PROJECT_ID=xxx{'\n'}
                                EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com{'\n'}
                                EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx{'\n'}
                                EXPO_PUBLIC_FIREBASE_APP_ID=xxx{'\n'}
                                EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://xxx.firebaseio.com
                            </Text>
                        </View>
                    </View>
                )}

                {/* Retry Button */}
                <Pressable
                    className="bg-voltage py-4 rounded-xl mb-8"
                    onPress={verifyConfig}
                >
                    <Text className="text-charcoal-900 text-center font-bold">
                        Retry Check
                    </Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}
