// ⚡ ResQ Kenya - Welcome Screen (Debug Mode)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { colors } from '../theme/voltage-premium';

export default function WelcomeScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Debug: Welcome Screen Loaded</Text>
            <Link href="/(auth)/login">
                <Text style={styles.link}>Go to Login</Text>
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.charcoal[900],
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: '#FFFFFF',
        fontSize: 24,
        marginBottom: 20,
    },
    link: {
        color: colors.voltage,
        fontSize: 18,
    }
});
