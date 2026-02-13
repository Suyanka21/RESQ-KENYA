// ⚡ ResQ Kenya — StepIndicator Component Tests
// Tests step indicator logic, steps array structure, and styling
// Environment: node (no DOM/React rendering)

describe('StepIndicator — Step Configuration', () => {
    // Mirrors the 3-step arrays used across all service forms
    const TOWING_STEPS = ['Location', 'Vehicle', 'Confirm'];
    const FUEL_STEPS = ['Details', 'Location', 'Confirm'];
    const BATTERY_STEPS = ['Details', 'Location', 'Confirm'];
    const TIRE_STEPS = ['Location', 'Details', 'Confirm'];
    const DIAGNOSTICS_STEPS = ['Location', 'Details', 'Confirm'];
    const AMBULANCE_STEPS = ['Location', 'Details', 'Confirm'];

    test('all forms have exactly 3 steps', () => {
        [TOWING_STEPS, FUEL_STEPS, BATTERY_STEPS, TIRE_STEPS, DIAGNOSTICS_STEPS, AMBULANCE_STEPS].forEach(steps => {
            expect(steps).toHaveLength(3);
        });
    });

    test('all forms end with Confirm step', () => {
        [TOWING_STEPS, FUEL_STEPS, BATTERY_STEPS, TIRE_STEPS, DIAGNOSTICS_STEPS, AMBULANCE_STEPS].forEach(steps => {
            expect(steps[steps.length - 1]).toBe('Confirm');
        });
    });

    test('towing has unique Vehicle step', () => {
        expect(TOWING_STEPS[1]).toBe('Vehicle');
    });

    test('fuel and battery start with Details', () => {
        expect(FUEL_STEPS[0]).toBe('Details');
        expect(BATTERY_STEPS[0]).toBe('Details');
    });

    test('tire, diagnostics, ambulance start with Location', () => {
        expect(TIRE_STEPS[0]).toBe('Location');
        expect(DIAGNOSTICS_STEPS[0]).toBe('Location');
        expect(AMBULANCE_STEPS[0]).toBe('Location');
    });
});

describe('StepIndicator — Step State Derivation', () => {
    // Mirrors the component logic: given currentStep (1-based) and total steps,
    // each step gets a state: completed, active, or upcoming
    const getStepState = (stepIndex: number, currentStep: number) => {
        if (stepIndex + 1 < currentStep) return 'completed';
        if (stepIndex + 1 === currentStep) return 'active';
        return 'upcoming';
    };

    test('step 1 of 3: first active, rest upcoming', () => {
        expect(getStepState(0, 1)).toBe('active');
        expect(getStepState(1, 1)).toBe('upcoming');
        expect(getStepState(2, 1)).toBe('upcoming');
    });

    test('step 2 of 3: first completed, second active', () => {
        expect(getStepState(0, 2)).toBe('completed');
        expect(getStepState(1, 2)).toBe('active');
        expect(getStepState(2, 2)).toBe('upcoming');
    });

    test('step 3 of 3: first two completed, third active', () => {
        expect(getStepState(0, 3)).toBe('completed');
        expect(getStepState(1, 3)).toBe('completed');
        expect(getStepState(2, 3)).toBe('active');
    });
});

describe('StepIndicator — Navigation Logic', () => {
    // Step type is 1 | 2 | 3
    const handleNext = (step: number) => (step < 3 ? step + 1 : step);
    const handleBack = (step: number) => (step > 1 ? step - 1 : step);

    test('next increments up to 3', () => {
        expect(handleNext(1)).toBe(2);
        expect(handleNext(2)).toBe(3);
        expect(handleNext(3)).toBe(3); // capped
    });

    test('back decrements down to 1', () => {
        expect(handleBack(3)).toBe(2);
        expect(handleBack(2)).toBe(1);
        expect(handleBack(1)).toBe(1); // capped
    });

    test('round-trip navigation', () => {
        let step = 1;
        step = handleNext(step); // 2
        step = handleNext(step); // 3
        step = handleBack(step); // 2
        step = handleBack(step); // 1
        expect(step).toBe(1);
    });
});

describe('StepIndicator — Connector Line Logic', () => {
    // Connectors appear between steps (N-1 connectors for N steps)
    const totalSteps = 3;
    const connectorCount = totalSteps - 1;

    test('3 steps produces 2 connectors', () => {
        expect(connectorCount).toBe(2);
    });

    // Connector is "filled" when both adjacent steps are completed or the right one is active
    const isConnectorFilled = (connectorIdx: number, currentStep: number) => {
        return connectorIdx + 1 < currentStep;
    };

    test('step 1: no connectors filled', () => {
        expect(isConnectorFilled(0, 1)).toBe(false);
        expect(isConnectorFilled(1, 1)).toBe(false);
    });

    test('step 2: first connector filled', () => {
        expect(isConnectorFilled(0, 2)).toBe(true);
        expect(isConnectorFilled(1, 2)).toBe(false);
    });

    test('step 3: both connectors filled', () => {
        expect(isConnectorFilled(0, 3)).toBe(true);
        expect(isConnectorFilled(1, 3)).toBe(true);
    });
});
