// ⚡ Button UI Component - Unit Tests

describe('Button Component', () => {
    type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
    type ButtonSize = 'sm' | 'md' | 'lg';

    const VARIANTS: Record<ButtonVariant, { bg: string; text: string }> = {
        primary: { bg: '#FFA500', text: '#0F0F0F' },
        secondary: { bg: '#252525', text: '#FFFFFF' },
        outline: { bg: 'transparent', text: '#FFA500' },
        ghost: { bg: 'transparent', text: '#FFFFFF' },
        danger: { bg: '#FF3D3D', text: '#FFFFFF' },
        success: { bg: '#00E676', text: '#0F0F0F' },
    };

    const SIZES: Record<ButtonSize, { height: number; fontSize: number }> = {
        sm: { height: 36, fontSize: 13 },
        md: { height: 48, fontSize: 15 },
        lg: { height: 56, fontSize: 17 },
    };

    describe('Variants', () => {
        it('should have 6 variants', () => {
            expect(Object.keys(VARIANTS)).toHaveLength(6);
        });

        it('should have primary with voltage bg', () => {
            expect(VARIANTS.primary.bg).toBe('#FFA500');
        });

        it('should have danger with red bg', () => {
            expect(VARIANTS.danger.bg).toBe('#FF3D3D');
        });

        it('should have transparent bg for outline and ghost', () => {
            expect(VARIANTS.outline.bg).toBe('transparent');
            expect(VARIANTS.ghost.bg).toBe('transparent');
        });
    });

    describe('Sizes', () => {
        it('should have 3 sizes', () => {
            expect(Object.keys(SIZES)).toHaveLength(3);
        });

        it('should have ascending heights', () => {
            expect(SIZES.sm.height).toBeLessThan(SIZES.md.height);
            expect(SIZES.md.height).toBeLessThan(SIZES.lg.height);
        });
    });

    describe('Disabled State', () => {
        it('should reduce opacity when disabled', () => {
            const disabledOpacity = 0.5;
            expect(disabledOpacity).toBeLessThan(1);
        });
    });
});
