// ResQ Kenya - Database Test Screen
// Test and seed the Firestore database
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../theme/voltage-premium';
import {
    seedProviders,
    seedTestUser,
    seedSampleRequests,
    seedAll,
    getOnlineProviderCount,
    findNearestProviders,
    getUserRequests,
} from '../services';

// Nairobi CBD coordinates for testing
const NAIROBI_CBD = { lat: -1.2921, lng: 36.8219 };

export default function DatabaseTestScreen() {
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<string[]>([]);
    const [providerCount, setProviderCount] = useState<number | null>(null);

    const addResult = (message: string) => {
        setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const handleSeedAll = async () => {
        setIsLoading(true);
        setResults([]);
        addResult('Starting full database seed...');

        try {
            await seedAll();
            addResult('✅ All data seeded successfully!');
        } catch (error: any) {
            addResult(`❌ Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSeedProviders = async () => {
        setIsLoading(true);
        addResult('Seeding providers...');

        try {
            await seedProviders();
            addResult('✅ Providers seeded!');
        } catch (error: any) {
            addResult(`❌ Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSeedUser = async () => {
        setIsLoading(true);
        addResult('Creating test user...');

        try {
            await seedTestUser();
            addResult('✅ Test user created!');
        } catch (error: any) {
            addResult(`❌ Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestQuery = async () => {
        setIsLoading(true);
        addResult('Testing provider query...');

        try {
            // Get online provider count
            const count = await getOnlineProviderCount();
            setProviderCount(count);
            addResult(`Found ${count} online providers`);

            // Test nearby search for towing
            const nearby = await findNearestProviders(
                'towing',
                NAIROBI_CBD.lat,
                NAIROBI_CBD.lng,
                10 // 10km radius
            );

            addResult(`Found ${nearby.length} towing providers within 10km:`);
            nearby.forEach(p => {
                addResult(`  - ${p.displayName} (${p.distance}km away)`);
            });

            addResult('✅ Query test complete!');
        } catch (error: any) {
            addResult(`❌ Query error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const ActionButton = ({
        title,
        onPress,
        variant = 'primary'
    }: {
        title: string;
        onPress: () => void;
        variant?: 'primary' | 'secondary';
    }) => (
        <Pressable
            className={`py-3 px-4 rounded-xl mb-2 ${variant === 'primary' ? 'bg-voltage' : 'bg-charcoal-700'
                }`}
            onPress={onPress}
            disabled={isLoading}
        >
            <Text className={`text-center font-semibold ${variant === 'primary' ? 'text-charcoal-900' : 'text-white'
                }`}>
                {title}
            </Text>
        </Pressable>
    );

    return (
        <View className="flex-1 bg-charcoal-900">
            {/* Header */}
            <View className="px-6 pt-16 pb-4 bg-charcoal-800 border-b border-charcoal-600">
                <Pressable className="mb-4" onPress={() => router.back()}>
                    <Text className="text-voltage">← Back</Text>
                </Pressable>
                <Text className="text-voltage text-2xl font-bold">Database Tools</Text>
                <Text className="text-white/60 text-sm mt-1">Seed and test Firestore data</Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                {/* Status Banner */}
                {providerCount !== null && (
                    <View className="bg-success/20 border border-success rounded-xl p-3 mb-4">
                        <Text className="text-success font-medium">
                            📊 {providerCount} online providers in database
                        </Text>
                    </View>
                )}

                {/* Seed Actions */}
                <Text className="text-white font-bold text-lg mb-3">Seed Data</Text>
                <ActionButton title="🌱 Seed All Data" onPress={handleSeedAll} />
                <ActionButton title="👷 Seed Providers Only" onPress={handleSeedProviders} variant="secondary" />
                <ActionButton title="👤 Create Test User" onPress={handleSeedUser} variant="secondary" />

                {/* Query Tests */}
                <Text className="text-white font-bold text-lg mt-6 mb-3">Test Queries</Text>
                <ActionButton title="🔍 Test Provider Search" onPress={handleTestQuery} variant="secondary" />

                {/* Loading Indicator */}
                {isLoading && (
                    <View className="items-center py-4">
                        <ActivityIndicator size="large" color={colors.voltage} />
                        <Text className="text-white/60 mt-2">Processing...</Text>
                    </View>
                )}

                {/* Results Log */}
                {results.length > 0 && (
                    <View className="mt-6 mb-8">
                        <Text className="text-white font-bold text-lg mb-3">Results Log</Text>
                        <View className="bg-charcoal-800 rounded-xl p-3 border border-charcoal-600">
                            {results.map((result, index) => (
                                <Text
                                    key={index}
                                    className={`text-sm font-mono ${result.includes('✅') ? 'text-success' :
                                        result.includes('❌') ? 'text-emergency' :
                                            'text-white/70'
                                        }`}
                                >
                                    {result}
                                </Text>
                            ))}
                        </View>
                    </View>
                )}

                {/* Instructions */}
                <View className="bg-charcoal-800 rounded-xl p-4 mb-8 border border-charcoal-600">
                    <Text className="text-voltage font-bold mb-2">ℹ️ Instructions</Text>
                    <Text className="text-white/70 text-sm leading-5">
                        1. Click "Seed All Data" to populate Firestore{'\n'}
                        2. Use "Test Provider Search" to verify queries work{'\n'}
                        3. Check Firebase Console to see the data{'\n'}
                        {'\n'}
                        Note: Make sure your Firebase rules allow writes for testing.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
