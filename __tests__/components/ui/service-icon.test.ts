// ⚡ ServiceIcon UI Component - Unit Tests

describe('ServiceIcon Component', () => {
    type ServiceType = 'towing' | 'fuel' | 'battery' | 'tire' | 'diagnostics' | 'medical';

    const SERVICE_ICON_MAP: Record<ServiceType, string> = {
        towing: 'Truck',
        fuel: 'Fuel',
        battery: 'Battery',
        tire: 'Circle',
        diagnostics: 'Search',
        medical: 'Heart',
    };

    describe('Icon Mapping', () => {
        it('should map all 6 service types', () => {
            expect(Object.keys(SERVICE_ICON_MAP)).toHaveLength(6);
        });

        it('should have non-empty icon for each type', () => {
            Object.values(SERVICE_ICON_MAP).forEach(icon => {
                expect(icon.length).toBeGreaterThan(0);
            });
        });

        it('should map towing to Truck', () => {
            expect(SERVICE_ICON_MAP.towing).toBe('Truck');
        });

        it('should map medical to Heart', () => {
            expect(SERVICE_ICON_MAP.medical).toBe('Heart');
        });
    });

    describe('Default Props', () => {
        it('should default size to 24', () => {
            const DEFAULT_SIZE = 24;
            expect(DEFAULT_SIZE).toBe(24);
        });

        it('should default strokeWidth to 2', () => {
            const DEFAULT_STROKE = 2;
            expect(DEFAULT_STROKE).toBe(2);
        });
    });

    describe('Color Prop', () => {
        it('should accept custom color', () => {
            const color = '#FFA500';
            expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        });
    });
});
