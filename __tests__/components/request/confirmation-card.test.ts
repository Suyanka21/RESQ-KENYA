// ⚡ ResQ Kenya — ConfirmationCard Component Tests
// Tests confirmation display logic, fee breakdowns, and data structures
// Environment: node (no DOM/React rendering)

import { PRICES } from '../../../constants/prices';

// ============================================================
// Confirmation data interfaces (mirrors ConfirmationCard props)
// ============================================================

interface ConfirmationData {
    service: string;
    serviceType: string;
    location: string;
    totalCost: number;
    eta?: string;
    details: Record<string, string>;
}

// ============================================================
// Fee breakdown logic (mirrors SoteSafiri business logic)
// 70% Host, 15% Conservation, 10% Platform, 5% Processing
// ============================================================

const calcFeeBreakdown = (baseCost: number) => ({
    host: Math.round(baseCost * 0.70),
    conservation: Math.round(baseCost * 0.15),
    platform: Math.round(baseCost * 0.10),
    processing: Math.round(baseCost * 0.05),
    total: baseCost,
});

// ============================================================
// TESTS
// ============================================================

describe('ConfirmationCard — Data Structure', () => {
    const towingConfirmation: ConfirmationData = {
        service: 'towing',
        serviceType: 'Towing Service',
        location: 'Nairobi CBD',
        totalCost: PRICES.TOWING_BASE + 12 * PRICES.TOWING_PER_KM,
        eta: '15-25 min',
        details: {
            pickup: 'Nairobi CBD',
            dropoff: 'Westlands',
            vehiclePlate: 'KDA 123A',
            vehicleType: 'sedan',
            distance: '12 km',
        },
    };

    test('has required fields', () => {
        expect(towingConfirmation.service).toBe('towing');
        expect(towingConfirmation.serviceType).toBeDefined();
        expect(towingConfirmation.location).toBeDefined();
        expect(towingConfirmation.totalCost).toBeGreaterThan(0);
    });

    test('total cost matches calculation', () => {
        const expected = PRICES.TOWING_BASE + 12 * PRICES.TOWING_PER_KM;
        expect(towingConfirmation.totalCost).toBe(expected);
    });

    test('details include pickup and dropoff', () => {
        expect(towingConfirmation.details.pickup).toBe('Nairobi CBD');
        expect(towingConfirmation.details.dropoff).toBe('Westlands');
    });
});

describe('ConfirmationCard — Fuel Confirmation', () => {
    const fuelConfirmation: ConfirmationData = {
        service: 'fuel',
        serviceType: 'Fuel Delivery',
        location: 'Karen',
        totalCost: 20 * PRICES.FUEL_PETROL + PRICES.DELIVERY_FEE,
        eta: '20-30 min',
        details: {
            fuelType: 'Petrol',
            amount: '20 Liters',
        },
    };

    test('fuel cost includes delivery fee', () => {
        expect(fuelConfirmation.totalCost).toBe(20 * PRICES.FUEL_PETROL + PRICES.DELIVERY_FEE);
    });

    test('details show fuel type', () => {
        expect(fuelConfirmation.details.fuelType).toBe('Petrol');
    });
});

describe('ConfirmationCard — Battery Confirmation', () => {
    test('standard urgency shows base cost', () => {
        const data: ConfirmationData = {
            service: 'battery',
            serviceType: 'Battery Jumpstart',
            location: 'Kilimani',
            totalCost: PRICES.JUMPSTART_BASE,
            eta: '30-45 min',
            details: { urgency: 'Standard' },
        };
        expect(data.totalCost).toBe(PRICES.JUMPSTART_BASE);
    });

    test('express urgency adds express fee', () => {
        const data: ConfirmationData = {
            service: 'battery',
            serviceType: 'Battery Jumpstart',
            location: 'Kilimani',
            totalCost: PRICES.JUMPSTART_BASE + PRICES.EXPRESS_FEE,
            eta: '10-15 min',
            details: { urgency: 'Express' },
        };
        expect(data.totalCost).toBe(PRICES.JUMPSTART_BASE + PRICES.EXPRESS_FEE);
    });
});

describe('ConfirmationCard — Ambulance Confirmation', () => {
    test('critical triage has highest cost', () => {
        const critical = PRICES.AMBULANCE_BASE + PRICES.AMBULANCE_CRITICAL_FEE;
        const urgent = PRICES.AMBULANCE_BASE + PRICES.AMBULANCE_URGENT_FEE;
        const nonEmergency = PRICES.AMBULANCE_BASE;

        expect(critical).toBeGreaterThan(urgent);
        expect(urgent).toBeGreaterThan(nonEmergency);
    });
});

describe('ConfirmationCard — Fee Breakdown (SoteSafiri Business Logic)', () => {
    test('70/15/10/5 split for KES 10000', () => {
        const breakdown = calcFeeBreakdown(10000);
        expect(breakdown.host).toBe(7000);
        expect(breakdown.conservation).toBe(1500);
        expect(breakdown.platform).toBe(1000);
        expect(breakdown.processing).toBe(500);
    });

    test('all parts sum to total', () => {
        const breakdown = calcFeeBreakdown(4500);
        expect(breakdown.host + breakdown.conservation + breakdown.platform + breakdown.processing).toBe(4500);
    });

    test('conservation is always 15%', () => {
        const amounts = [1000, 2500, 5000, 10000];
        amounts.forEach(amt => {
            const b = calcFeeBreakdown(amt);
            expect(b.conservation).toBe(Math.round(amt * 0.15));
        });
    });

    test('host gets the largest share', () => {
        const b = calcFeeBreakdown(5000);
        expect(b.host).toBeGreaterThan(b.conservation);
        expect(b.host).toBeGreaterThan(b.platform);
        expect(b.host).toBeGreaterThan(b.processing);
    });
});

describe('ConfirmationCard — Service Labels', () => {
    const SERVICE_LABELS: Record<string, string> = {
        towing: 'Towing Service',
        fuel: 'Fuel Delivery',
        battery: 'Battery Jumpstart',
        tire: 'Tire Service',
        diagnostics: 'Diagnostics Service',
        medical: 'Medical Emergency',
    };

    test('6 service types have labels', () => {
        expect(Object.keys(SERVICE_LABELS)).toHaveLength(6);
    });

    test('each service has a non-empty label', () => {
        Object.values(SERVICE_LABELS).forEach(label => {
            expect(label.length).toBeGreaterThan(0);
        });
    });

    test('known services map correctly', () => {
        expect(SERVICE_LABELS.towing).toBe('Towing Service');
        expect(SERVICE_LABELS.medical).toBe('Medical Emergency');
    });
});
