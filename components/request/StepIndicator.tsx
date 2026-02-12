// ⚡ ResQ Kenya - Step Indicator Component
// Premium 3-step progress indicator for service request flows

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme/voltage-premium';

interface StepIndicatorProps {
    currentStep: number;
    steps?: string[];
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
    currentStep,
    steps = ['Details', 'Location', 'Confirm']
}) => {
    return (
        <View style={styles.container}>
            {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = currentStep === stepNumber;
                const isComplete = currentStep > stepNumber;

                return (
                    <React.Fragment key={step}>
                        {/* Step */}
                        <View style={styles.stepContainer}>
                            <View style={[
                                styles.stepCircle,
                                isActive && styles.stepCircleActive,
                                isComplete && styles.stepCircleComplete
                            ]}>
                                {isComplete ? (
                                    <Check size={14} color="#FFF" strokeWidth={3} />
                                ) : (
                                    <Text style={[
                                        styles.stepNumber,
                                        isActive && styles.stepNumberActive
                                    ]}>
                                        {stepNumber}
                                    </Text>
                                )}
                            </View>
                            <Text style={[
                                styles.stepLabel,
                                isActive && styles.stepLabelActive,
                                isComplete && styles.stepLabelComplete
                            ]}>
                                {step}
                            </Text>
                        </View>

                        {/* Line between steps */}
                        {index < steps.length - 1 && (
                            <View style={[
                                styles.line,
                                isComplete && styles.lineComplete
                            ]} />
                        )}
                    </React.Fragment>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
    },
    stepContainer: {
        alignItems: 'center',
        gap: spacing.xs,
    },
    stepCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.charcoal[700],
        borderWidth: 2,
        borderColor: colors.charcoal[600],
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepCircleActive: {
        backgroundColor: colors.voltage,
        borderColor: colors.voltage,
    },
    stepCircleComplete: {
        backgroundColor: colors.success,
        borderColor: colors.success,
    },
    stepNumber: {
        color: colors.text.muted,
        fontSize: 12,
        fontWeight: '600',
    },
    stepNumberActive: {
        color: colors.charcoal[900],
    },
    stepLabel: {
        color: colors.text.muted,
        fontSize: 11,
        fontWeight: '500',
    },
    stepLabelActive: {
        color: colors.voltage,
        fontWeight: '600',
    },
    stepLabelComplete: {
        color: colors.success,
    },
    line: {
        flex: 1,
        height: 2,
        backgroundColor: colors.charcoal[600],
        marginHorizontal: spacing.sm,
        marginBottom: spacing.lg,
    },
    lineComplete: {
        backgroundColor: colors.success,
    },
});

export default StepIndicator;
