/**
 * useStepFlow — Phase 4 hook for multi-step request forms.
 *
 * Skills: Frontend-UI-Engineering (composable hook for form scaffolds),
 * Test-Driven Development (pure logic; no React Native primitives required
 * to test).
 *
 * The hook owns:
 *   - which step is currently visible (1-indexed),
 *   - whether the user can advance from the current step (a per-step
 *     `canProceed` predicate the caller supplies),
 *   - submit-in-flight state so the shell can disable the CTA.
 *
 * It does NOT own form values — those stay in the calling form, so we
 * don't need to abstract the data shape.
 *
 * Convention: the last step is the "Confirm" step. `next()` only moves
 * forward when there is another step; on the last step the shell calls
 * `submit(handler)` instead.
 */

import { useCallback, useMemo, useState } from 'react';

export interface UseStepFlowOptions<TStepId extends string> {
    /** Ordered list of step ids. Length determines `totalSteps`. */
    steps: readonly TStepId[];
    /** Called to validate whether the current step can advance. */
    canProceed: (stepId: TStepId) => boolean;
    /** Optional initial step id; defaults to the first step. */
    initialStep?: TStepId;
}

export interface UseStepFlowResult<TStepId extends string> {
    currentStep: TStepId;
    currentIndex: number; // 1-indexed
    totalSteps: number;
    isFirst: boolean;
    isLast: boolean;
    canAdvance: boolean;
    isSubmitting: boolean;
    next: () => void;
    back: () => void;
    /**
     * Run the submit handler. Tracks `isSubmitting` for the duration so
     * the shell can disable the CTA. Errors propagate so the caller can
     * surface them; we always reset `isSubmitting` in `finally`.
     */
    submit: (handler: () => Promise<void> | void) => Promise<void>;
}

export function useStepFlow<TStepId extends string>(
    options: UseStepFlowOptions<TStepId>
): UseStepFlowResult<TStepId> {
    const { steps, canProceed, initialStep } = options;
    if (steps.length === 0) {
        throw new Error('useStepFlow: steps must not be empty');
    }

    const [currentStep, setCurrentStep] = useState<TStepId>(initialStep ?? steps[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentIndex = steps.indexOf(currentStep) + 1;
    const totalSteps = steps.length;
    const isFirst = currentIndex === 1;
    const isLast = currentIndex === totalSteps;

    const canAdvance = useMemo(() => canProceed(currentStep), [canProceed, currentStep]);

    const next = useCallback(() => {
        if (isLast || !canAdvance) return;
        const idx = steps.indexOf(currentStep);
        setCurrentStep(steps[idx + 1]);
    }, [canAdvance, currentStep, isLast, steps]);

    const back = useCallback(() => {
        if (isFirst) return;
        const idx = steps.indexOf(currentStep);
        setCurrentStep(steps[idx - 1]);
    }, [currentStep, isFirst, steps]);

    const submit = useCallback(async (handler: () => Promise<void> | void): Promise<void> => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await handler();
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting]);

    return {
        currentStep,
        currentIndex,
        totalSteps,
        isFirst,
        isLast,
        canAdvance,
        isSubmitting,
        next,
        back,
        submit,
    };
}
