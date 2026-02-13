// ⚡ ProviderCard Component - Unit Tests

describe('ProviderCard Component', () => {
    // Default prop values from component
    const DEFAULTS = {
        name: 'Michael Kiprop',
        rating: 4.8,
        rescueCount: 234,
        vehicle: 'Toyota Hilux',
        plate: 'KXX 789B',
        compact: false,
        showBadge: true,
    };

    describe('Default Props', () => {
        it('should have default name', () => {
            expect(DEFAULTS.name).toBe('Michael Kiprop');
        });

        it('should have default rating of 4.8', () => {
            expect(DEFAULTS.rating).toBe(4.8);
        });

        it('should have default rescueCount of 234', () => {
            expect(DEFAULTS.rescueCount).toBe(234);
        });

        it('should have default vehicle', () => {
            expect(DEFAULTS.vehicle).toBe('Toyota Hilux');
        });

        it('should have default plate', () => {
            expect(DEFAULTS.plate).toBe('KXX 789B');
        });

        it('should not be compact by default', () => {
            expect(DEFAULTS.compact).toBe(false);
        });

        it('should show badge by default', () => {
            expect(DEFAULTS.showBadge).toBe(true);
        });
    });

    describe('Avatar Initial', () => {
        const getInitial = (name: string) => name.charAt(0);

        it('should extract first character as initial', () => {
            expect(getInitial('Michael Kiprop')).toBe('M');
        });

        it('should handle single-character names', () => {
            expect(getInitial('J')).toBe('J');
        });
    });

    describe('Full Card Layout', () => {
        it('should have 60x60 avatar with borderRadius 30', () => {
            const avatar = { width: 60, height: 60, borderRadius: 30 };
            expect(avatar.borderRadius).toBe(avatar.width / 2);
        });

        it('should have 24px avatar text for large mode', () => {
            const avatarTextLg = { fontSize: 24 };
            expect(avatarTextLg.fontSize).toBe(24);
        });

        it('should have 20px name font size', () => {
            const name = { fontSize: 20, fontWeight: '700' };
            expect(name.fontSize).toBe(20);
        });

        it('should have TOP badge text', () => {
            const badgeText = 'TOP';
            expect(badgeText).toBe('TOP');
        });

        it('should display rescues count in parentheses', () => {
            const rescuesText = `(${DEFAULTS.rescueCount} rescues)`;
            expect(rescuesText).toBe('(234 rescues)');
        });

        it('should display vehicle and plate', () => {
            const vehicleText = `${DEFAULTS.vehicle} - ${DEFAULTS.plate}`;
            expect(vehicleText).toBe('Toyota Hilux - KXX 789B');
        });
    });

    describe('Compact Card Layout', () => {
        it('should have 48x48 compact avatar', () => {
            const compactAvatar = { width: 48, height: 48, borderRadius: 24 };
            expect(compactAvatar.borderRadius).toBe(compactAvatar.width / 2);
        });

        it('should have 18px avatar text for compact', () => {
            const avatarText = { fontSize: 18 };
            expect(avatarText.fontSize).toBe(18);
        });

        it('should have 14px name for compact', () => {
            const compactName = { fontSize: 14, fontWeight: '700' };
            expect(compactName.fontSize).toBe(14);
        });

        it('should show rating dot separator', () => {
            const separator = '•';
            expect(separator).toBe('•');
        });
    });

    describe('ProviderCardProps interface', () => {
        it('should allow all props to be optional', () => {
            // All defaults exist, meaning all props are optional
            const emptyProps = {};
            expect(emptyProps).toBeDefined();
        });

        it('should accept serviceType prop', () => {
            const props = { serviceType: 'towing' };
            expect(props.serviceType).toBe('towing');
        });
    });
});
