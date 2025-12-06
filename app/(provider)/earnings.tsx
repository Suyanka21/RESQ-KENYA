// ResQ Kenya - Provider Earnings Screen
import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { colors } from '../../theme/voltage-premium';

// Mock earnings data
const MOCK_EARNINGS = {
    today: 7500,
    thisWeek: 32500,
    thisMonth: 125000,
    pending: 4500,
};

const MOCK_TRANSACTIONS = [
    { id: '1', type: 'towing', amount: 3500, date: new Date(), status: 'completed' },
    { id: '2', type: 'tire', amount: 1500, date: new Date(Date.now() - 3600000), status: 'completed' },
    { id: '3', type: 'battery', amount: 2500, date: new Date(Date.now() - 7200000), status: 'completed' },
    { id: '4', type: 'towing', amount: 4000, date: new Date(Date.now() - 86400000), status: 'completed' },
    { id: '5', type: 'fuel', amount: 1200, date: new Date(Date.now() - 172800000), status: 'completed' },
];

export default function ProviderEarningsScreen() {
    const [activePeriod, setActivePeriod] = useState<'today' | 'week' | 'month'>('today');

    const getActiveEarnings = () => {
        switch (activePeriod) {
            case 'today': return MOCK_EARNINGS.today;
            case 'week': return MOCK_EARNINGS.thisWeek;
            case 'month': return MOCK_EARNINGS.thisMonth;
        }
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - date.getTime()) / 3600000);

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffHours / 24)}d ago`;
    };

    const getServiceEmoji = (type: string) => {
        const emojis: Record<string, string> = {
            towing: '🚛', tire: '🔧', battery: '⚡',
            fuel: '⛽', diagnostics: '🔍', ambulance: '🚑',
        };
        return emojis[type] || '🔧';
    };

    return (
        <View className="flex-1 bg-charcoal-900">
            {/* Header */}
            <View className="px-6 pt-16 pb-6 bg-charcoal-800 border-b border-charcoal-600">
                <Text className="text-white text-2xl font-bold mb-4">Earnings</Text>

                {/* Period Selector */}
                <View className="flex-row bg-charcoal-700 rounded-xl p-1">
                    {(['today', 'week', 'month'] as const).map(period => (
                        <Pressable
                            key={period}
                            className={`flex-1 py-2 rounded-lg ${activePeriod === period ? 'bg-voltage' : ''
                                }`}
                            onPress={() => setActivePeriod(period)}
                        >
                            <Text className={`text-center text-sm font-medium capitalize ${activePeriod === period ? 'text-charcoal-900' : 'text-white/60'
                                }`}>
                                {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'Today'}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                {/* Main Earnings Card */}
                <View className="bg-voltage rounded-2xl p-6 mb-6">
                    <Text className="text-charcoal-900/60 text-sm mb-1">
                        {activePeriod === 'today' ? "Today's" : activePeriod === 'week' ? "This Week's" : "This Month's"} Earnings
                    </Text>
                    <Text className="text-charcoal-900 text-4xl font-bold">
                        KES {getActiveEarnings().toLocaleString()}
                    </Text>
                    <View className="flex-row mt-4 pt-4 border-t border-charcoal-900/20">
                        <View className="flex-1">
                            <Text className="text-charcoal-900/60 text-xs">Pending</Text>
                            <Text className="text-charcoal-900 font-bold">
                                KES {MOCK_EARNINGS.pending.toLocaleString()}
                            </Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-charcoal-900/60 text-xs">Jobs</Text>
                            <Text className="text-charcoal-900 font-bold">
                                {activePeriod === 'today' ? 3 : activePeriod === 'week' ? 12 : 45}
                            </Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-charcoal-900/60 text-xs">Rating</Text>
                            <Text className="text-charcoal-900 font-bold">4.9 ⭐</Text>
                        </View>
                    </View>
                </View>

                {/* Withdraw Button */}
                <Pressable className="bg-success py-4 rounded-xl mb-6">
                    <Text className="text-white text-center font-bold text-lg">
                        💳 Withdraw to M-Pesa
                    </Text>
                </Pressable>

                {/* Transaction History */}
                <Text className="text-white font-bold text-lg mb-3">Recent Transactions</Text>
                <View className="bg-charcoal-800 rounded-xl border border-charcoal-600 mb-8">
                    {MOCK_TRANSACTIONS.map((tx, index) => (
                        <View
                            key={tx.id}
                            className={`flex-row items-center p-4 ${index < MOCK_TRANSACTIONS.length - 1 ? 'border-b border-charcoal-600' : ''
                                }`}
                        >
                            <View className="w-10 h-10 bg-charcoal-700 rounded-full items-center justify-center mr-3">
                                <Text className="text-lg">{getServiceEmoji(tx.type)}</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-medium capitalize">{tx.type} Service</Text>
                                <Text className="text-white/50 text-xs">{formatTime(tx.date)}</Text>
                            </View>
                            <Text className="text-success font-bold">
                                +KES {tx.amount.toLocaleString()}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}
