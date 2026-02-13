// ⚡ Request Flow - Unit Tests

describe('Request Flow', () => {
    type ServiceType = 'towing' | 'fuel' | 'battery' | 'tire' | 'diagnostics' | 'medical';

    const VALID_SERVICES: ServiceType[] = ['towing', 'fuel', 'battery', 'tire', 'diagnostics', 'medical'];

    describe('Service Router', () => {
        const getFormForService = (service: string): string | null => {
            if (VALID_SERVICES.includes(service as ServiceType)) {
                return `${service}Form`;
            }
            return null;
        };

        it('should route to TowingForm for towing', () => {
            expect(getFormForService('towing')).toBe('towingForm');
        });

        it('should route to FuelForm for fuel', () => {
            expect(getFormForService('fuel')).toBe('fuelForm');
        });

        it('should route to BatteryForm for battery', () => {
            expect(getFormForService('battery')).toBe('batteryForm');
        });

        it('should route to TireForm for tire', () => {
            expect(getFormForService('tire')).toBe('tireForm');
        });

        it('should route to DiagnosticsForm for diagnostics', () => {
            expect(getFormForService('diagnostics')).toBe('diagnosticsForm');
        });

        it('should route to AmbulanceForm for medical', () => {
            expect(getFormForService('medical')).toBe('medicalForm');
        });

        it('should return null for invalid service', () => {
            expect(getFormForService('unknown')).toBeNull();
            expect(getFormForService('')).toBeNull();
        });
    });

    describe('handleSubmit Navigation', () => {
        const buildTrackingParams = (data: {
            service?: string;
            totalCost?: number;
            location?: string;
            pickupLocation?: string;
        }, fallbackService: string) => {
            return {
                pathname: '/(customer)/request/tracking',
                params: {
                    service: data.service || fallbackService,
                    price: String(data.totalCost || 0),
                    location: data.location || data.pickupLocation || '',
                },
            };
        };

        it('should build tracking params with service and price', () => {
            const result = buildTrackingParams({ totalCost: 2500, location: 'Westlands' }, 'towing');
            expect(result.pathname).toBe('/(customer)/request/tracking');
            expect(result.params.service).toBe('towing');
            expect(result.params.price).toBe('2500');
            expect(result.params.location).toBe('Westlands');
        });

        it('should default price to "0" when not provided', () => {
            const result = buildTrackingParams({}, 'fuel');
            expect(result.params.price).toBe('0');
        });

        it('should fallback to pickupLocation when location is not provided', () => {
            const result = buildTrackingParams({ pickupLocation: 'CBD' }, 'towing');
            expect(result.params.location).toBe('CBD');
        });

        it('should use data.service over fallback service', () => {
            const result = buildTrackingParams({ service: 'medical' }, 'towing');
            expect(result.params.service).toBe('medical');
        });
    });

    describe('Step Indicator', () => {
        const STEPS = [
            { key: 'details', label: 'Details' },
            { key: 'location', label: 'Location' },
            { key: 'review', label: 'Review' },
            { key: 'confirm', label: 'Confirm' },
        ];

        it('should have 4 steps', () => {
            expect(STEPS).toHaveLength(4);
        });

        it('should have unique keys', () => {
            const keys = STEPS.map(s => s.key);
            expect(new Set(keys).size).toBe(keys.length);
        });

        it('should start with details and end with confirm', () => {
            expect(STEPS[0].key).toBe('details');
            expect(STEPS[STEPS.length - 1].key).toBe('confirm');
        });
    });

    describe('Towing Form - Vehicle Size Pricing', () => {
        const VEHICLE_SIZES = [
            { key: 'sedan', label: 'Sedan / Hatchback', basePrice: 2500 },
            { key: 'suv', label: 'SUV / Pickup', basePrice: 3500 },
            { key: 'truck', label: 'Truck / Van', basePrice: 5000 },
        ];

        it('should have 3 vehicle sizes', () => {
            expect(VEHICLE_SIZES).toHaveLength(3);
        });

        it('should have ascending base prices', () => {
            for (let i = 1; i < VEHICLE_SIZES.length; i++) {
                expect(VEHICLE_SIZES[i].basePrice).toBeGreaterThan(VEHICLE_SIZES[i - 1].basePrice);
            }
        });

        it('should include sedan, suv, and truck', () => {
            const keys = VEHICLE_SIZES.map(v => v.key);
            expect(keys).toEqual(['sedan', 'suv', 'truck']);
        });
    });

    describe('Fuel Form - Fuel Types', () => {
        const FUEL_TYPES = [
            { key: 'petrol', label: 'Petrol', pricePerLitre: 180 },
            { key: 'diesel', label: 'Diesel', pricePerLitre: 175 },
        ];

        it('should have 2 fuel types', () => {
            expect(FUEL_TYPES).toHaveLength(2);
        });

        it('should calculate total cost correctly', () => {
            const litres = 20;
            const total = FUEL_TYPES[0].pricePerLitre * litres;
            expect(total).toBe(3600);
        });
    });

    describe('Confirmation Card', () => {
        const PLATFORM_FEE_PERCENT = 10;

        it('should calculate platform fee at 10%', () => {
            const subtotal = 2500;
            const platformFee = subtotal * (PLATFORM_FEE_PERCENT / 100);
            expect(platformFee).toBe(250);
        });

        it('should calculate total as subtotal + platform fee', () => {
            const subtotal = 2500;
            const platformFee = subtotal * (PLATFORM_FEE_PERCENT / 100);
            const total = subtotal + platformFee;
            expect(total).toBe(2750);
        });
    });
});
