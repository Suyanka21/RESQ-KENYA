// ⚡ ResQ Kenya - Progress Steps Component (Shared)
// Horizontal step indicator for tracking lifecycle screens

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '../../theme/voltage-premium';

export type StepStatus = 'completed' | 'active' | 'pending';
export interface Step {
    label: string;
    status: StepStatus;
}

interface ProgressStepsProps {
    steps: Step[];
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({ steps }) => {
    // Calculate progress line width
    const activeIdx = steps.findIndex(s => s.status === 'active');
    const completedCount = steps.filter(s => s.status === 'completed').length;
    const progressPercent = activeIdx >= 0
        ? ((activeIdx) / (steps.length - 1)) * 100
        : ((completedCount) / (steps.length - 1)) * 100;

    return (
        <View style={styles.container}>
            {/* Background line */}
            <View style={styles.bgLine} />
            {/* Active progress line */}
            <View style={[styles.activeLine, { width: `${progressPercent}%` as any }]} />

            {steps.map((step, idx) => (
                <View key={idx} style={styles.stepCol}>
                    <View style={[
                        styles.dot,
                        step.status === 'completed' && styles.dotCompleted,
                        step.status === 'active' && styles.dotActive,
                    ]}>
                        {step.status === 'completed' && (
                            <Check size={10} color={colors.text.onBrand} strokeWidth={3} />
                        )}
                        {step.status === 'active' && (
                            <View style={styles.dotPulse} />
                        )}
                    </View>
                    <Text style={[
                        styles.label,
                        step.status === 'completed' && styles.labelCompleted,
                        step.status === 'active' && styles.labelActive,
                    ]}>
                        {step.label}
                    </Text>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 32, paddingVertical: 20, position: 'relative',
        borderBottomWidth: 1, borderBottomColor: colors.background.border,
    },
    bgLine: {
        position: 'absolute', top: '50%' as any, left: 32, right: 32,
        height: 2, backgroundColor: colors.background.border, marginTop: -10,
    },
    activeLine: {
        position: 'absolute', top: '50%' as any, left: 32,
        height: 2, backgroundColor: colors.voltage, marginTop: -10,
    },
    stepCol: { alignItems: 'center', gap: 8, backgroundColor: colors.background.secondary, paddingHorizontal: 6 },
    dot: {
        width: 20, height: 20, borderRadius: 10, backgroundColor: colors.background.border,
        borderWidth: 2, borderColor: colors.text.disabled,
        alignItems: 'center', justifyContent: 'center', zIndex: 5,
    },
    dotCompleted: { backgroundColor: colors.status.success, borderColor: colors.status.success },
    dotActive: {
        backgroundColor: colors.voltage, borderColor: colors.voltage,
        shadowColor: colors.voltage, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5, shadowRadius: 10, elevation: 6,
        transform: [{ scale: 1.25 }],
    },
    dotPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.text.onBrand },
    label: { fontSize: 10, fontWeight: '500', color: colors.text.tertiary },
    labelCompleted: { color: colors.status.success },
    labelActive: { color: colors.voltage, fontWeight: '700' },
});

export default ProgressSteps;
