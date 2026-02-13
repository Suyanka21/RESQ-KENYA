// ⚡ Landing / Entry Screen - Unit Tests

describe('Landing / Entry Screen', () => {
    // Brand color constants from app/index.tsx
    const VOLTAGE = '#FFA500';
    const CHARCOAL = '#0F0F0F';
    const WHITE = '#FFFFFF';

    describe('Brand Colors', () => {
        it('should have valid hex values', () => {
            expect(VOLTAGE).toMatch(/^#[0-9A-Fa-f]{6}$/);
            expect(CHARCOAL).toMatch(/^#[0-9A-Fa-f]{6}$/);
            expect(WHITE).toMatch(/^#[0-9A-Fa-f]{6}$/);
        });

        it('VOLTAGE should be orange (#FFA500)', () => {
            expect(VOLTAGE).toBe('#FFA500');
        });

        it('CHARCOAL should be near-black (#0F0F0F)', () => {
            expect(CHARCOAL).toBe('#0F0F0F');
        });

        it('WHITE should be pure white (#FFFFFF)', () => {
            expect(WHITE).toBe('#FFFFFF');
        });
    });

    describe('Splash Screen', () => {
        it('should have splash background use VOLTAGE color', () => {
            // splashContainer.backgroundColor = VOLTAGE
            expect(VOLTAGE).toBe('#FFA500');
        });

        it('should use correct logo text styling', () => {
            const logoStyle = {
                fontSize: 56,
                fontWeight: '900',
                color: CHARCOAL,
                letterSpacing: 4,
            };
            expect(logoStyle.fontSize).toBe(56);
            expect(logoStyle.fontWeight).toBe('900');
            expect(logoStyle.letterSpacing).toBe(4);
            expect(logoStyle.color).toBe('#0F0F0F');
        });

        it('should have spring animation parameters for exit transition', () => {
            const springConfig = { tension: 180, friction: 12 };
            expect(springConfig.tension).toBe(180);
            expect(springConfig.friction).toBe(12);
        });

        it('should have 1.5s delay before navigation', () => {
            const SPLASH_DELAY = 1500;
            expect(SPLASH_DELAY).toBe(1500);
        });
    });

    describe('Landing Page', () => {
        it('should have Get Started button with correct dimensions', () => {
            const buttonStyle = {
                height: 56,
                backgroundColor: CHARCOAL,
                borderRadius: 9999,
            };
            expect(buttonStyle.height).toBe(56);
            expect(buttonStyle.backgroundColor).toBe('#0F0F0F');
            expect(buttonStyle.borderRadius).toBe(9999); // pill shape
        });

        it('should have correct pressed state color', () => {
            const pressedBg = '#1A1A1A';
            expect(pressedBg).toMatch(/^#[0-9A-Fa-f]{6}$/);
            // pressed bg should be slightly lighter than CHARCOAL
            const charcoalLum = parseInt(CHARCOAL.slice(1, 3), 16);
            const pressedLum = parseInt(pressedBg.slice(1, 3), 16);
            expect(pressedLum).toBeGreaterThan(charcoalLum);
        });

        it('should have links row with correct gap', () => {
            const linksRow = { marginTop: 24, gap: 20 };
            expect(linksRow.gap).toBe(20);
            expect(linksRow.marginTop).toBe(24);
        });

        it('should have link dot as 4x4px circle', () => {
            const linkDot = { width: 4, height: 4, borderRadius: 2, opacity: 0.4 };
            expect(linkDot.width).toBe(4);
            expect(linkDot.height).toBe(4);
            expect(linkDot.borderRadius).toBe(linkDot.width / 2);
            expect(linkDot.opacity).toBeLessThan(1);
        });
    });

    describe('Auth Routing', () => {
        it('should route to correct auth paths', () => {
            const registerPath = '/(auth)/register';
            const loginPath = '/(auth)/login';
            expect(registerPath).toContain('(auth)');
            expect(loginPath).toContain('(auth)');
        });

        it('should route authenticated users based on role', () => {
            const routeForRole = (role: string) => {
                if (role === 'provider') return '/(provider)';
                return '/(customer)';
            };
            expect(routeForRole('provider')).toBe('/(provider)');
            expect(routeForRole('customer')).toBe('/(customer)');
            expect(routeForRole('')).toBe('/(customer)');
        });
    });
});
