// ResQ Kenya - Customer Wallet Screen
// M-Pesa balance, payment methods, and transaction history

import { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/voltage-premium';

// Mock wallet data
const MOCK_WALLET = {
    balance: 4500,
    pendingPayouts: 0,
    lastTopUp: new Date(Date.now() - 86400000 * 2), // 2 days ago
};

const MOCK_TRANSACTIONS = [
    { id: '1', type: 'topup', description: 'M-Pesa Top Up', amount: 2000, date: new Date(Date.now() - 86400000 * 2), status: 'completed' },
    { id: '2', type: 'payment', description: 'Towing Service - Westlands', amount: -3500, date: new Date(Date.now() - 86400000 * 5), status: 'completed' },
    { id: '3', type: 'refund', description: 'Cancelled Request Refund', amount: 1500, date: new Date(Date.now() - 86400000 * 7), status: 'completed' },
    { id: '4', type: 'payment', description: 'Battery Jump - Kilimani', amount: -1500, date: new Date(Date.now() - 86400000 * 10), status: 'completed' },
    { id: '5', type: 'topup', description: 'M-Pesa Top Up', amount: 5000, date: new Date(Date.now() - 86400000 * 12), status: 'completed' },
];

const PAYMENT_METHODS = [
    { id: '1', type: 'mpesa', name: 'Safaricom M-Pesa', phone: '07** *** 892', isPrimary: true },
];

export default function WalletScreen() {
    const [isTopUpLoading, setIsTopUpLoading] = useState(false);

    const handleTopUp = () => {
        setIsTopUpLoading(true);
        // Simulate top up flow
        setTimeout(() => setIsTopUpLoading(false), 2000);
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'topup': return '💳';
            case 'payment': return '🚛';
            case 'refund': return '↩️';
            default: return '💰';
        }
    };

    return (
        <View className="flex-1 bg-charcoal-900">
            {/* Header */}
            <View className="px-6 pt-16 pb-6 bg-charcoal-800 border-b border-charcoal-600">
                <Text className="text-white text-2xl font-bold">Wallet</Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                {/* Balance Card */}
                <View className="bg-charcoal-800 rounded-2xl p-6 mb-6 border border-charcoal-600 relative overflow-hidden">
                    {/* Gradient overlay */}
                    <View
                        className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
                        style={{ backgroundColor: colors.success, transform: [{ translateX: 40 }, { translateY: -40 }] }}
                    />

                    <View className="relative z-10">
                        <Text className="text-white/60 text-sm mb-1">M-Pesa Connected Balance</Text>
                        <Text className="text-white text-4xl font-bold mb-6">
                            KES {MOCK_WALLET.balance.toLocaleString()}.00
                        </Text>

                        <View className="flex-row">
                            <Pressable
                                className="flex-row items-center bg-success px-5 py-3 rounded-xl mr-3"
                                onPress={handleTopUp}
                            >
                                {isTopUpLoading ? (
                                    <ActivityIndicator size="small" color={colors.charcoal[900]} />
                                ) : (
                                    <>
                                        <Text className="text-xl mr-2">➕</Text>
                                        <Text className="text-charcoal-900 font-bold">Top Up</Text>
                                    </>
                                )}
                            </Pressable>
                            <Pressable className="flex-row items-center bg-charcoal-700 px-5 py-3 rounded-xl border border-charcoal-600">
                                <Text className="text-xl mr-2">📊</Text>
                                <Text className="text-white font-semibold">History</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View className="flex-row mb-6">
                    <View className="flex-1 bg-charcoal-800 rounded-xl p-4 mr-2 border border-charcoal-600">
                        <Text className="text-white/60 text-xs mb-1">Last Top Up</Text>
                        <Text className="text-white font-bold">{formatDate(MOCK_WALLET.lastTopUp)}</Text>
                    </View>
                    <View className="flex-1 bg-charcoal-800 rounded-xl p-4 ml-2 border border-charcoal-600">
                        <Text className="text-white/60 text-xs mb-1">This Month Spent</Text>
                        <Text className="text-emergency font-bold">KES 5,000</Text>
                    </View>
                </View>

                {/* Payment Methods */}
                <Text className="text-white font-bold text-lg mb-3">Payment Methods</Text>
                <View className="bg-charcoal-800 rounded-xl border border-charcoal-600 mb-6">
                    {PAYMENT_METHODS.map((method, index) => (
                        <View
                            key={method.id}
                            className={`flex-row items-center p-4 ${index < PAYMENT_METHODS.length - 1 ? 'border-b border-charcoal-600' : ''
                                }`}
                        >
                            <View className="w-12 h-8 bg-success rounded items-center justify-center mr-4">
                                <Text className="text-white font-bold text-xs">M-PESA</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-medium">{method.name}</Text>
                                <Text className="text-white/50 text-sm">Connected: {method.phone}</Text>
                            </View>
                            {method.isPrimary && (
                                <View className="bg-success/20 px-2 py-1 rounded">
                                    <Text className="text-success text-xs font-bold">PRIMARY</Text>
                                </View>
                            )}
                        </View>
                    ))}

                    {/* Add Payment Method */}
                    <Pressable className="flex-row items-center p-4 border-t border-charcoal-600">
                        <View className="w-12 h-8 bg-charcoal-700 rounded items-center justify-center mr-4">
                            <Text className="text-voltage text-lg">+</Text>
                        </View>
                        <Text className="text-voltage font-medium">Add Payment Method</Text>
                    </Pressable>
                </View>

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
                                <Text className="text-lg">{getTransactionIcon(tx.type)}</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-medium">{tx.description}</Text>
                                <Text className="text-white/50 text-xs">{formatDate(tx.date)}</Text>
                            </View>
                            <Text className={`font-bold ${tx.amount >= 0 ? 'text-success' : 'text-white'}`}>
                                {tx.amount >= 0 ? '+' : ''}KES {Math.abs(tx.amount).toLocaleString()}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* ResQ Plus Promo */}
                <View className="bg-voltage/10 border border-voltage/30 rounded-xl p-4 mb-8">
                    <View className="flex-row items-center mb-2">
                        <Text className="text-xl mr-2">👑</Text>
                        <Text className="text-voltage font-bold">ResQ Plus Members</Text>
                    </View>
                    <Text className="text-white/70 text-sm mb-3">
                        Get 10% cashback on all services and priority support.
                    </Text>
                    <Pressable className="bg-voltage py-3 rounded-xl">
                        <Text className="text-charcoal-900 text-center font-bold">Upgrade for KES 2,500/mo</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}
