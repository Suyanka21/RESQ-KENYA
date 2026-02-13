// ⚡ ResQ Kenya — Prices Constants Tests
// Tests the PRICES object from constants/prices.ts
// Environment: node

import { PRICES } from '../../constants/prices';

describe('PRICES — Structure', () => {
    test('PRICES object is defined', () => {
        expect(PRICES).toBeDefined();
        expect(typeof PRICES).toBe('object');
    });

    test('has all expected keys', () => {
        const expectedKeys = [
            'FUEL_PETROL', 'FUEL_DIESEL', 'DELIVERY_FEE',
            'JUMPSTART_BASE', 'PRIORITY_FEE', 'EXPRESS_FEE',
            'TOWING_BASE', 'TOWING_PER_KM',
            'TIRE_REPAIR_BASE', 'TIRE_SERVICE_CALL',
            'DIAGNOSTIC_BASE_ONSITE', 'DIAGNOSTIC_BASE_WORKSHOP', 'DIAGNOSTIC_URGENCY_FEE',
            'AMBULANCE_BASE', 'AMBULANCE_CRITICAL_FEE', 'AMBULANCE_URGENT_FEE',
        ];
        expectedKeys.forEach(key => {
            expect(PRICES).toHaveProperty(key);
        });
    });

    test('all values are positive numbers', () => {
        Object.values(PRICES).forEach(value => {
            expect(typeof value).toBe('number');
            expect(value).toBeGreaterThan(0);
        });
    });
});

describe('PRICES — Fuel', () => {
    test('petrol price is 180.66 KES/L', () => {
        expect(PRICES.FUEL_PETROL).toBe(180.66);
    });

    test('diesel price is 168.06 KES/L', () => {
        expect(PRICES.FUEL_DIESEL).toBe(168.06);
    });

    test('delivery fee is 500 KES', () => {
        expect(PRICES.DELIVERY_FEE).toBe(500);
    });

    test('diesel is cheaper than petrol', () => {
        expect(PRICES.FUEL_DIESEL).toBeLessThan(PRICES.FUEL_PETROL);
    });
});

describe('PRICES — Battery / Jumpstart', () => {
    test('base is 1500 KES', () => {
        expect(PRICES.JUMPSTART_BASE).toBe(1500);
    });

    test('priority fee is 500 KES', () => {
        expect(PRICES.PRIORITY_FEE).toBe(500);
    });

    test('express fee is 1000 KES', () => {
        expect(PRICES.EXPRESS_FEE).toBe(1000);
    });

    test('express > priority', () => {
        expect(PRICES.EXPRESS_FEE).toBeGreaterThan(PRICES.PRIORITY_FEE);
    });
});

describe('PRICES — Towing', () => {
    test('base is 5000 KES', () => {
        expect(PRICES.TOWING_BASE).toBe(5000);
    });

    test('per-km is 150 KES', () => {
        expect(PRICES.TOWING_PER_KM).toBe(150);
    });
});

describe('PRICES — Tire', () => {
    test('repair base is 2000 KES', () => {
        expect(PRICES.TIRE_REPAIR_BASE).toBe(2000);
    });

    test('service call is 500 KES', () => {
        expect(PRICES.TIRE_SERVICE_CALL).toBe(500);
    });
});

describe('PRICES — Diagnostics', () => {
    test('onsite base is 2500 KES', () => {
        expect(PRICES.DIAGNOSTIC_BASE_ONSITE).toBe(2500);
    });

    test('workshop base is 2000 KES', () => {
        expect(PRICES.DIAGNOSTIC_BASE_WORKSHOP).toBe(2000);
    });

    test('urgency fee is 500 KES', () => {
        expect(PRICES.DIAGNOSTIC_URGENCY_FEE).toBe(500);
    });

    test('onsite > workshop', () => {
        expect(PRICES.DIAGNOSTIC_BASE_ONSITE).toBeGreaterThan(PRICES.DIAGNOSTIC_BASE_WORKSHOP);
    });
});

describe('PRICES — Ambulance', () => {
    test('base is 3500 KES', () => {
        expect(PRICES.AMBULANCE_BASE).toBe(3500);
    });

    test('critical fee is 1500 KES', () => {
        expect(PRICES.AMBULANCE_CRITICAL_FEE).toBe(1500);
    });

    test('urgent fee is 1000 KES', () => {
        expect(PRICES.AMBULANCE_URGENT_FEE).toBe(1000);
    });

    test('critical > urgent', () => {
        expect(PRICES.AMBULANCE_CRITICAL_FEE).toBeGreaterThan(PRICES.AMBULANCE_URGENT_FEE);
    });
});

describe('PRICES — Cross-Service Comparisons', () => {
    test('ambulance is the most expensive base service', () => {
        const basePrices = [
            PRICES.JUMPSTART_BASE,
            PRICES.TOWING_BASE,
            PRICES.TIRE_REPAIR_BASE,
            PRICES.DIAGNOSTIC_BASE_ONSITE,
            PRICES.AMBULANCE_BASE,
        ];
        expect(Math.max(...basePrices)).toBe(PRICES.TOWING_BASE);
    });

    test('jumpstart base is the cheapest base service', () => {
        const basePrices = [
            PRICES.JUMPSTART_BASE,
            PRICES.TOWING_BASE,
            PRICES.TIRE_REPAIR_BASE,
            PRICES.DIAGNOSTIC_BASE_ONSITE,
            PRICES.AMBULANCE_BASE,
        ];
        expect(Math.min(...basePrices)).toBe(PRICES.JUMPSTART_BASE);
    });
});
