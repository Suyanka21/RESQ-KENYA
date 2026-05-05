/**
 * RequestFormShell — Phase 4 shared scaffold for multi-step service
 * request forms.
 *
 * Skills: Frontend-UI-Engineering (consistent header/step indicator/CTA
 * layout that follows the Voltage Premium design system), API-and-
 * Interface-Design (single composable shell rather than re-implementing
 * the same chrome in every form).
 *
 * The shell owns the navigation chrome (header, back button, step
 * indicator, footer CTA). The caller renders the body via
 * `renderStep(stepId)` and wires the step flow with `useStepFlow`.
 *
 * It deliberately does NOT own form state or validation — each form has
 * its own data shape. We only ask for `canProceed` per step.
 */

import React, { ReactNode } from 'react';
import {
    View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../../theme/voltage-premium';
import { StepIndicator } from './StepIndicator';
import type { UseStepFlowResult } from './use-step-flow';

export interface RequestFormShellProps<TStepId extends string> {
    title: string;
    flow: UseStepFlowResult<TStepId>;
    /** Friendly labels for the StepIndicator, in the same order as flow.steps. */
    stepLabels: readonly string[];
    /** Render the body for the given step id. */
    renderStep: (stepId: TStepId) => ReactNode;
    /** Called when the user taps the footer CTA on the last step. */
    onSubmit: () => Promise<void> | void;
    /** Called when back is pressed and we're already on the first step. */
    onCancel: () => void;
    /** Override the default CTA labels per step. Defaults: "Continue" / "Confirm". */
    ctaLabels?: { next?: string; submit?: string };
}

export function RequestFormShell<TStepId extends string>(
    props: RequestFormShellProps<TStepId>
) {
    const { title, flow, stepLabels, renderStep, onSubmit, onCancel, ctaLabels } = props;

    const handleBack = () => {
        if (flow.isFirst) onCancel();
        else flow.back();
    };

    const handleCta = () => {
        if (flow.isLast) {
            void flow.submit(onSubmit);
        } else {
            flow.next();
        }
    };

    const ctaLabel = flow.isLast
        ? (ctaLabels?.submit ?? 'Confirm')
        : (ctaLabels?.next ?? 'Continue');

    const ctaDisabled = flow.isSubmitting || (!flow.isLast && !flow.canAdvance);

    return (
        <View style={styles.container} testID="request-form-shell">
            <View style={styles.header}>
                <Pressable
                    onPress={handleBack}
                    style={styles.backButton}
                    accessibilityLabel="Go back"
                    accessibilityRole="button"
                    testID="request-form-shell-back"
                >
                    <ChevronLeft size={24} color={colors.text.primary} strokeWidth={2} />
                </Pressable>
                <Text style={styles.headerTitle}>{title}</Text>
                <View style={styles.headerSpacer} />
            </View>

            <StepIndicator currentStep={flow.currentIndex} steps={[...stepLabels]} />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {renderStep(flow.currentStep)}
            </ScrollView>

            <View style={styles.footer}>
                <Pressable
                    onPress={handleCta}
                    disabled={ctaDisabled}
                    style={[styles.cta, ctaDisabled && styles.ctaDisabled]}
                    accessibilityLabel={ctaLabel}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: ctaDisabled }}
                    testID="request-form-shell-cta"
                >
                    {flow.isSubmitting ? (
                        <ActivityIndicator color={colors.charcoal[900]} />
                    ) : (
                        <Text style={styles.ctaLabel}>{ctaLabel}</Text>
                    )}
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.charcoal[900],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.full,
        backgroundColor: colors.charcoal[800],
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: typography.mobile.subsection.size,
        lineHeight: typography.mobile.subsection.lineHeight,
        fontWeight: typography.mobile.subsection.weight as '600',
        color: colors.text.primary,
    },
    headerSpacer: {
        width: 40,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
    footer: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.xl,
        backgroundColor: colors.charcoal[900],
        borderTopWidth: 1,
        borderTopColor: colors.charcoal[800],
    },
    cta: {
        height: 56,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.voltage,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ctaDisabled: {
        opacity: 0.4,
    },
    ctaLabel: {
        fontSize: typography.mobile.button.size,
        lineHeight: typography.mobile.button.lineHeight,
        fontWeight: typography.mobile.button.weight as '600',
        color: colors.charcoal[900],
    },
});

export default RequestFormShell;
