// ⚡ ResQ Kenya — Service Forms Unit Tests
// Tests validation and pricing logic for all 6 service request forms
// Environment: node (no DOM/React rendering)

import { PRICES } from '../../../constants/prices';

// ============================================================
// Shared form helpers (mirrors logic extracted from form components)
// ============================================================

/** Towing cost = base + distance × per-km rate */
const calcTowingCost = (distanceKm: number) =>
    PRICES.TOWING_BASE + distanceKm * PRICES.TOWING_PER_KM;

/** Fuel cost = litres × rate + delivery fee */
const calcFuelCost = (litres: number, type: 'petrol' | 'diesel') => {
    const rate = type === 'petrol' ? PRICES.FUEL_PETROL : PRICES.FUEL_DIESEL;
    return litres * rate + PRICES.DELIVERY_FEE;
};

/** Battery cost = base + urgency surcharge */
const calcBatteryCost = (urgency: 'standard' | 'priority' | 'express') => {
    const fees: Record<string, number> = {
        standard: 0,
        priority: PRICES.PRIORITY_FEE,
        express: PRICES.EXPRESS_FEE,
    };
    return PRICES.JUMPSTART_BASE + (fees[urgency] ?? 0);
};

/** Tire cost = repair base + service call */
const calcTireCost = () => PRICES.TIRE_REPAIR_BASE + PRICES.TIRE_SERVICE_CALL;

/** Diagnostics cost = base (onsite/workshop) + urgency fee */
const calcDiagCost = (type: 'onsite' | 'workshop', urgency: 'standard' | 'urgent') => {
    const base = type === 'onsite' ? PRICES.DIAGNOSTIC_BASE_ONSITE : PRICES.DIAGNOSTIC_BASE_WORKSHOP;
    const fee = urgency === 'urgent' ? PRICES.DIAGNOSTIC_URGENCY_FEE : 0;
    return base + fee;
};

/** Ambulance cost = base + triage surcharge */
const calcAmbulanceCost = (triage: 'critical' | 'urgent' | 'non_emergency') => {
    const fees: Record<string, number> = {
        critical: PRICES.AMBULANCE_CRITICAL_FEE,
        urgent: PRICES.AMBULANCE_URGENT_FEE,
        non_emergency: 0,
    };
    return PRICES.AMBULANCE_BASE + (fees[triage] ?? 0);
};

// ============================================================
// Form data constants (mirrors source component constants)
// ============================================================

const VEHICLE_TYPES = ['sedan', 'suv', 'truck', 'van', 'motorcycle', 'other'];
const FUEL_AMOUNTS = [5, 10, 15, 20, 30, 40, 50, 60];
const URGENCY_OPTIONS = ['standard', 'priority', 'express'];
const ISSUE_TYPES = ['flat', 'burst', 'install', 'unsure'];
const TIRE_POSITIONS = ['front-left', 'front-right', 'rear-left', 'rear-right'] as const;
const SYMPTOMS = ['engine_noise', 'wont_start', 'overheating', 'warning_light', 'vibration', 'smoke'];
const TRIAGE_LEVELS = ['critical', 'urgent', 'non_emergency'];

// ============================================================
// canProceed helpers (mirrors each form's validation logic)
// ============================================================

// Towing: step 1 needs pickup + dropoff; step 2 needs plate
const towingCanProceed = (step: number, pickup: string, dropoff: string, plate: string) => {
    if (step === 1) return pickup.length > 0 && dropoff.length > 0;
    if (step === 2) return plate.length > 0;
    return true;
};

// Fuel: step 1 needs amount > 0; step 2 needs location
const fuelCanProceed = (step: number, amount: number, location: string) => {
    if (step === 1) return amount > 0;
    if (step === 2) return location.length > 0;
    return true;
};

// Battery: step 1 always true; step 2 needs location
const batteryCanProceed = (step: number, location: string) => {
    if (step === 1) return true;
    if (step === 2) return location.length > 0;
    return true;
};

// Tire: step 1 needs location; step 2 needs issue + tires selected
const tireCanProceed = (step: number, location: string, issue: string | null, tires: string[]) => {
    if (step === 1) return location.length > 0;
    if (step === 2) return issue !== null && tires.length > 0;
    return true;
};

// Diagnostics: step 1 needs location; step 2 needs symptoms
const diagCanProceed = (step: number, location: string, symptoms: string[]) => {
    if (step === 1) return location.length > 0;
    if (step === 2) return symptoms.length > 0;
    return true;
};

// Ambulance: step 1 needs location; step 2 needs condition
const ambulanceCanProceed = (step: number, location: string, condition: string) => {
    if (step === 1) return location.length > 0;
    if (step === 2) return condition.length > 0;
    return true;
};

// ============================================================
// TESTS
// ============================================================

describe('Service Forms — Shared Constants', () => {
    test('VEHICLE_TYPES has 6 entries', () => {
        expect(VEHICLE_TYPES).toHaveLength(6);
        expect(VEHICLE_TYPES).toContain('sedan');
        expect(VEHICLE_TYPES).toContain('motorcycle');
    });

    test('FUEL_AMOUNTS has 8 presets', () => {
        expect(FUEL_AMOUNTS).toHaveLength(8);
        expect(FUEL_AMOUNTS[0]).toBe(5);
        expect(FUEL_AMOUNTS[FUEL_AMOUNTS.length - 1]).toBe(60);
    });

    test('URGENCY_OPTIONS has 3 levels', () => {
        expect(URGENCY_OPTIONS).toEqual(['standard', 'priority', 'express']);
    });

    test('ISSUE_TYPES has 4 entries', () => {
        expect(ISSUE_TYPES).toEqual(['flat', 'burst', 'install', 'unsure']);
    });

    test('TIRE_POSITIONS has 4 corners', () => {
        expect(TIRE_POSITIONS).toHaveLength(4);
    });

    test('SYMPTOMS has 6 diagnostic symptoms', () => {
        expect(SYMPTOMS).toHaveLength(6);
        expect(SYMPTOMS).toContain('overheating');
    });

    test('TRIAGE_LEVELS has 3 levels', () => {
        expect(TRIAGE_LEVELS).toEqual(['critical', 'urgent', 'non_emergency']);
    });
});

describe('TowingForm — Cost Calculation', () => {
    test('base + per-km for 12 km', () => {
        const cost = calcTowingCost(12);
        expect(cost).toBe(PRICES.TOWING_BASE + 12 * PRICES.TOWING_PER_KM);
    });

    test('zero distance returns base only', () => {
        expect(calcTowingCost(0)).toBe(PRICES.TOWING_BASE);
    });

    test('high distance scales linearly', () => {
        const cost50 = calcTowingCost(50);
        const cost100 = calcTowingCost(100);
        expect(cost100 - cost50).toBe(50 * PRICES.TOWING_PER_KM);
    });
});

describe('TowingForm — canProceed', () => {
    test('step 1 requires both pickup and dropoff', () => {
        expect(towingCanProceed(1, '', '', '')).toBe(false);
        expect(towingCanProceed(1, 'Nairobi', '', '')).toBe(false);
        expect(towingCanProceed(1, '', 'Mombasa', '')).toBe(false);
        expect(towingCanProceed(1, 'Nairobi', 'Mombasa', '')).toBe(true);
    });

    test('step 2 requires vehicle plate', () => {
        expect(towingCanProceed(2, '', '', '')).toBe(false);
        expect(towingCanProceed(2, '', '', 'KDA 123A')).toBe(true);
    });

    test('step 3 always true', () => {
        expect(towingCanProceed(3, '', '', '')).toBe(true);
    });
});

describe('FuelForm — Cost Calculation', () => {
    test('petrol: 20L', () => {
        const cost = calcFuelCost(20, 'petrol');
        expect(cost).toBe(20 * PRICES.FUEL_PETROL + PRICES.DELIVERY_FEE);
    });

    test('diesel: 40L', () => {
        const cost = calcFuelCost(40, 'diesel');
        expect(cost).toBe(40 * PRICES.FUEL_DIESEL + PRICES.DELIVERY_FEE);
    });

    test('diesel is cheaper per litre than petrol', () => {
        expect(PRICES.FUEL_DIESEL).toBeLessThan(PRICES.FUEL_PETROL);
    });
});

describe('FuelForm — canProceed', () => {
    test('step 1 requires amount > 0', () => {
        expect(fuelCanProceed(1, 0, '')).toBe(false);
        expect(fuelCanProceed(1, 20, '')).toBe(true);
    });

    test('step 2 requires location', () => {
        expect(fuelCanProceed(2, 20, '')).toBe(false);
        expect(fuelCanProceed(2, 20, 'CBD')).toBe(true);
    });
});

describe('BatteryForm — Cost Calculation', () => {
    test('standard has no surcharge', () => {
        expect(calcBatteryCost('standard')).toBe(PRICES.JUMPSTART_BASE);
    });

    test('priority adds priority fee', () => {
        expect(calcBatteryCost('priority')).toBe(PRICES.JUMPSTART_BASE + PRICES.PRIORITY_FEE);
    });

    test('express adds express fee', () => {
        expect(calcBatteryCost('express')).toBe(PRICES.JUMPSTART_BASE + PRICES.EXPRESS_FEE);
    });

    test('express > priority > standard', () => {
        expect(calcBatteryCost('express')).toBeGreaterThan(calcBatteryCost('priority'));
        expect(calcBatteryCost('priority')).toBeGreaterThan(calcBatteryCost('standard'));
    });
});

describe('BatteryForm — canProceed', () => {
    test('step 1 always proceeds', () => {
        expect(batteryCanProceed(1, '')).toBe(true);
    });

    test('step 2 requires location', () => {
        expect(batteryCanProceed(2, '')).toBe(false);
        expect(batteryCanProceed(2, 'Westlands')).toBe(true);
    });
});

describe('TireForm — Cost Calculation', () => {
    test('total = base + service call', () => {
        expect(calcTireCost()).toBe(PRICES.TIRE_REPAIR_BASE + PRICES.TIRE_SERVICE_CALL);
    });
});

describe('TireForm — canProceed', () => {
    test('step 1 requires location', () => {
        expect(tireCanProceed(1, '', null, [])).toBe(false);
        expect(tireCanProceed(1, 'Thika Road', null, [])).toBe(true);
    });

    test('step 2 requires issue AND selected tires', () => {
        expect(tireCanProceed(2, '', null, [])).toBe(false);
        expect(tireCanProceed(2, '', 'flat', [])).toBe(false);
        expect(tireCanProceed(2, '', null, ['front-left'])).toBe(false);
        expect(tireCanProceed(2, '', 'flat', ['front-left'])).toBe(true);
    });

    test('step 3 always true', () => {
        expect(tireCanProceed(3, '', null, [])).toBe(true);
    });
});

describe('TireForm — Tire Toggle Logic', () => {
    test('toggle adds and removes tires', () => {
        let selected: string[] = [];
        const toggle = (tire: string) => {
            selected = selected.includes(tire)
                ? selected.filter(t => t !== tire)
                : [...selected, tire];
        };

        toggle('front-left');
        expect(selected).toEqual(['front-left']);

        toggle('rear-right');
        expect(selected).toEqual(['front-left', 'rear-right']);

        toggle('front-left');
        expect(selected).toEqual(['rear-right']);
    });
});

describe('DiagnosticsForm — Cost Calculation', () => {
    test('onsite standard', () => {
        expect(calcDiagCost('onsite', 'standard')).toBe(PRICES.DIAGNOSTIC_BASE_ONSITE);
    });

    test('workshop standard', () => {
        expect(calcDiagCost('workshop', 'standard')).toBe(PRICES.DIAGNOSTIC_BASE_WORKSHOP);
    });

    test('onsite urgent adds fee', () => {
        expect(calcDiagCost('onsite', 'urgent')).toBe(
            PRICES.DIAGNOSTIC_BASE_ONSITE + PRICES.DIAGNOSTIC_URGENCY_FEE
        );
    });

    test('onsite costs more than workshop', () => {
        expect(PRICES.DIAGNOSTIC_BASE_ONSITE).toBeGreaterThan(PRICES.DIAGNOSTIC_BASE_WORKSHOP);
    });
});

describe('DiagnosticsForm — canProceed', () => {
    test('step 1 requires location', () => {
        expect(diagCanProceed(1, '', [])).toBe(false);
        expect(diagCanProceed(1, 'Karen', [])).toBe(true);
    });

    test('step 2 requires at least one symptom', () => {
        expect(diagCanProceed(2, '', [])).toBe(false);
        expect(diagCanProceed(2, '', ['engine_noise'])).toBe(true);
    });
});

describe('DiagnosticsForm — Symptom Toggle', () => {
    test('toggleSymptom adds and removes', () => {
        let symptoms: string[] = [];
        const toggle = (id: string) => {
            symptoms = symptoms.includes(id)
                ? symptoms.filter(s => s !== id)
                : [...symptoms, id];
        };

        toggle('smoke');
        expect(symptoms).toContain('smoke');

        toggle('vibration');
        expect(symptoms).toHaveLength(2);

        toggle('smoke');
        expect(symptoms).toEqual(['vibration']);
    });
});

describe('AmbulanceForm — Cost Calculation', () => {
    test('non-emergency is base only', () => {
        expect(calcAmbulanceCost('non_emergency')).toBe(PRICES.AMBULANCE_BASE);
    });

    test('urgent adds urgent fee', () => {
        expect(calcAmbulanceCost('urgent')).toBe(
            PRICES.AMBULANCE_BASE + PRICES.AMBULANCE_URGENT_FEE
        );
    });

    test('critical adds critical fee', () => {
        expect(calcAmbulanceCost('critical')).toBe(
            PRICES.AMBULANCE_BASE + PRICES.AMBULANCE_CRITICAL_FEE
        );
    });

    test('critical > urgent > non_emergency', () => {
        expect(calcAmbulanceCost('critical')).toBeGreaterThan(calcAmbulanceCost('urgent'));
        expect(calcAmbulanceCost('urgent')).toBeGreaterThan(calcAmbulanceCost('non_emergency'));
    });
});

describe('AmbulanceForm — canProceed', () => {
    test('step 1 requires location', () => {
        expect(ambulanceCanProceed(1, '', '')).toBe(false);
        expect(ambulanceCanProceed(1, 'Kenyatta Hospital', '')).toBe(true);
    });

    test('step 2 requires condition description', () => {
        expect(ambulanceCanProceed(2, '', '')).toBe(false);
        expect(ambulanceCanProceed(2, '', 'Chest pain')).toBe(true);
    });

    test('step 3 always true', () => {
        expect(ambulanceCanProceed(3, '', '')).toBe(true);
    });
});
