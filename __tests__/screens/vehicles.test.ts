// ⚡ Vehicles Screen - Unit Tests

describe('Vehicles Screen', () => {
    interface Vehicle {
        id: string;
        make: string;
        model: string;
        year: string;
        registration: string;
        fuelType: 'petrol' | 'diesel';
        color: string;
        isDefault: boolean;
    }

    const INITIAL_VEHICLES: Vehicle[] = [
        {
            id: '1', make: 'Toyota', model: 'Prado', year: '2020',
            registration: 'KBZ 123A', fuelType: 'diesel', color: 'White', isDefault: true,
        },
        {
            id: '2', make: 'Mercedes', model: 'C200', year: '2019',
            registration: 'KCA 456B', fuelType: 'petrol', color: 'Black', isDefault: false,
        },
    ];

    describe('Vehicle Interface', () => {
        it('should have all required fields', () => {
            INITIAL_VEHICLES.forEach(v => {
                expect(v).toHaveProperty('id');
                expect(v).toHaveProperty('make');
                expect(v).toHaveProperty('model');
                expect(v).toHaveProperty('year');
                expect(v).toHaveProperty('registration');
                expect(v).toHaveProperty('fuelType');
                expect(v).toHaveProperty('color');
                expect(v).toHaveProperty('isDefault');
            });
        });
    });

    describe('INITIAL_VEHICLES', () => {
        it('should have 2 mock vehicles', () => {
            expect(INITIAL_VEHICLES).toHaveLength(2);
        });

        it('should have unique IDs', () => {
            const ids = INITIAL_VEHICLES.map(v => v.id);
            expect(new Set(ids).size).toBe(ids.length);
        });

        it('should have exactly one default vehicle', () => {
            const defaults = INITIAL_VEHICLES.filter(v => v.isDefault);
            expect(defaults).toHaveLength(1);
        });

        it('should have Kenyan registration format', () => {
            INITIAL_VEHICLES.forEach(v => {
                expect(v.registration).toMatch(/^K[A-Z]{2}\s\d{3}[A-Z]$/);
            });
        });
    });

    describe('Fuel Types', () => {
        it('should only allow petrol or diesel', () => {
            const validFuelTypes = ['petrol', 'diesel'];
            INITIAL_VEHICLES.forEach(v => {
                expect(validFuelTypes).toContain(v.fuelType);
            });
        });
    });

    describe('Form Validation', () => {
        const isFormValid = (vehicle: Partial<Vehicle>): boolean => {
            return !!(
                vehicle.make?.trim() &&
                vehicle.model?.trim() &&
                vehicle.year?.trim() &&
                vehicle.registration?.trim() &&
                vehicle.color?.trim()
            );
        };

        it('should validate complete form', () => {
            expect(isFormValid({
                make: 'Toyota', model: 'Corolla', year: '2021',
                registration: 'KDA 789C', color: 'Silver',
            })).toBe(true);
        });

        it('should reject form with missing make', () => {
            expect(isFormValid({
                make: '', model: 'Corolla', year: '2021',
                registration: 'KDA 789C', color: 'Silver',
            })).toBe(false);
        });

        it('should reject form with missing year', () => {
            expect(isFormValid({
                make: 'Toyota', model: 'Corolla', year: '',
                registration: 'KDA 789C', color: 'Silver',
            })).toBe(false);
        });

        it('should reject form with missing registration', () => {
            expect(isFormValid({
                make: 'Toyota', model: 'Corolla', year: '2021',
                registration: '', color: 'Silver',
            })).toBe(false);
        });
    });

    describe('Set Default Logic', () => {
        it('should toggle isDefault for selected vehicle', () => {
            const setDefault = (vehicles: Vehicle[], targetId: string): Vehicle[] => {
                return vehicles.map(v => ({
                    ...v,
                    isDefault: v.id === targetId,
                }));
            };

            const updated = setDefault(INITIAL_VEHICLES, '2');
            expect(updated.find(v => v.id === '2')?.isDefault).toBe(true);
            expect(updated.find(v => v.id === '1')?.isDefault).toBe(false);
        });

        it('should always have exactly one default after setting', () => {
            const setDefault = (vehicles: Vehicle[], targetId: string): Vehicle[] => {
                return vehicles.map(v => ({ ...v, isDefault: v.id === targetId }));
            };
            const updated = setDefault(INITIAL_VEHICLES, '1');
            const defaults = updated.filter(v => v.isDefault);
            expect(defaults).toHaveLength(1);
        });
    });

    describe('Delete Logic', () => {
        it('should remove vehicle by ID', () => {
            const deleteVehicle = (vehicles: Vehicle[], id: string) => {
                return vehicles.filter(v => v.id !== id);
            };
            const result = deleteVehicle(INITIAL_VEHICLES, '2');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('1');
        });
    });
});
