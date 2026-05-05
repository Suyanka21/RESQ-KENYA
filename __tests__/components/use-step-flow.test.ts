/**
 * Phase 6 (TDD): useStepFlow hook contract.
 *
 * We use `react-test-renderer.create` to render a tiny harness component
 * that exposes the hook result via a ref, so we can assert without
 * depending on @testing-library/react-hooks (incompatible with React 19).
 */

import * as React from 'react';
import * as renderer from 'react-test-renderer';
import { useStepFlow, UseStepFlowResult } from '../../components/request/use-step-flow';

interface HarnessProps {
    steps: readonly string[];
    canProceed: (s: string) => boolean;
    onResult: (r: UseStepFlowResult<string>) => void;
}

function Harness({ steps, canProceed, onResult }: HarnessProps): null {
    const result = useStepFlow({ steps, canProceed });
    onResult(result);
    return null;
}

describe('useStepFlow', () => {
    it('starts on the first step and reports counts', () => {
        let captured: UseStepFlowResult<string> | null = null;
        renderer.act(() => {
            renderer.create(
                React.createElement(Harness, {
                    steps: ['a', 'b', 'c'],
                    canProceed: () => true,
                    onResult: (r) => { captured = r; },
                })
            );
        });
        expect(captured).not.toBeNull();
        expect(captured!.currentStep).toBe('a');
        expect(captured!.currentIndex).toBe(1);
        expect(captured!.totalSteps).toBe(3);
        expect(captured!.isFirst).toBe(true);
        expect(captured!.isLast).toBe(false);
    });

    it('does not advance when canProceed returns false', () => {
        let captured: UseStepFlowResult<string> | null = null;
        renderer.act(() => {
            renderer.create(
                React.createElement(Harness, {
                    steps: ['a', 'b'],
                    canProceed: () => false,
                    onResult: (r) => { captured = r; },
                })
            );
        });
        renderer.act(() => { captured!.next(); });
        expect(captured!.currentStep).toBe('a');
        expect(captured!.canAdvance).toBe(false);
    });

    it('advances and goes back across steps', () => {
        let captured: UseStepFlowResult<string> | null = null;
        renderer.act(() => {
            renderer.create(
                React.createElement(Harness, {
                    steps: ['a', 'b', 'c'],
                    canProceed: () => true,
                    onResult: (r) => { captured = r; },
                })
            );
        });
        renderer.act(() => { captured!.next(); });
        expect(captured!.currentStep).toBe('b');
        renderer.act(() => { captured!.next(); });
        expect(captured!.currentStep).toBe('c');
        expect(captured!.isLast).toBe(true);
        renderer.act(() => { captured!.back(); });
        expect(captured!.currentStep).toBe('b');
    });

    it('next is a no-op on the last step', () => {
        let captured: UseStepFlowResult<string> | null = null;
        renderer.act(() => {
            renderer.create(
                React.createElement(Harness, {
                    steps: ['only'],
                    canProceed: () => true,
                    onResult: (r) => { captured = r; },
                })
            );
        });
        renderer.act(() => { captured!.next(); });
        expect(captured!.currentStep).toBe('only');
        expect(captured!.isLast).toBe(true);
    });

    it('back is a no-op on the first step', () => {
        let captured: UseStepFlowResult<string> | null = null;
        renderer.act(() => {
            renderer.create(
                React.createElement(Harness, {
                    steps: ['a', 'b'],
                    canProceed: () => true,
                    onResult: (r) => { captured = r; },
                })
            );
        });
        renderer.act(() => { captured!.back(); });
        expect(captured!.currentStep).toBe('a');
    });

    it('submit toggles isSubmitting and resolves', async () => {
        let captured: UseStepFlowResult<string> | null = null;
        renderer.act(() => {
            renderer.create(
                React.createElement(Harness, {
                    steps: ['a'],
                    canProceed: () => true,
                    onResult: (r) => { captured = r; },
                })
            );
        });
        let resolveSubmit!: () => void;
        const submitPromise = new Promise<void>((resolve) => { resolveSubmit = resolve; });
        let submitResult: Promise<void> | undefined;
        renderer.act(() => {
            submitResult = captured!.submit(() => submitPromise);
        });
        expect(captured!.isSubmitting).toBe(true);
        await renderer.act(async () => {
            resolveSubmit();
            await submitResult;
        });
        expect(captured!.isSubmitting).toBe(false);
    });

    it('throws when steps is empty', () => {
        expect(() => {
            renderer.act(() => {
                renderer.create(
                    React.createElement(Harness, {
                        steps: [],
                        canProceed: () => true,
                        onResult: () => undefined,
                    })
                );
            });
        }).toThrow(/steps must not be empty/);
    });
});
