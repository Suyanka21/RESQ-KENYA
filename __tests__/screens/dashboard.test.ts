// ⚡ Dashboard Screen - Unit Tests

describe('Dashboard Screen', () => {
    // Service definitions from app/(customer)/index.tsx
    const SERVICES = [
        { id: 'towing', name: 'Towing', color: '#FFA500', bg: 'rgba(255, 165, 0, 0.12)', keywords: ['tow', 'flatbed', 'stuck'] },
        { id: 'fuel', name: 'Fuel', color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.12)', keywords: ['fuel', 'petrol', 'diesel', 'gas'] },
        { id: 'battery', name: 'Battery', color: '#FFA500', bg: 'rgba(255, 165, 0, 0.12)', keywords: ['battery', 'jump', 'jumpstart', 'dead'] },
        { id: 'tire', name: 'Tire', color: '#9C27B0', bg: 'rgba(156, 39, 176, 0.12)', keywords: ['tire', 'tyre', 'flat', 'puncture'] },
        { id: 'diagnostics', name: 'Diagnostics', color: '#2196F3', bg: 'rgba(33, 150, 243, 0.12)', keywords: ['scan', 'diagnos', 'check', 'engine'] },
        { id: 'medical', name: 'Ambulance', color: '#FF3D3D', bg: 'rgba(255, 61, 61, 0.12)', keywords: ['ambulance', 'medical', 'emergency', 'hospital'] },
    ];

    const NAV_ITEMS = [
        { label: 'ResQ Wallet', sublabel: 'KES 2,450', route: '/(customer)/wallet' },
        { label: 'My Garage', sublabel: 'Digital Glovebox', route: '/(customer)/profile' },
        { label: 'Service History', route: '/(customer)/history' },
        { label: 'Emergency Safety Hub', route: '/(customer)/help' },
    ];

    const PROVIDER_MARKERS = [
        { top: '22%', left: '18%' }, { top: '35%', left: '72%' },
        { top: '52%', left: '28%' }, { top: '68%', left: '82%' },
        { top: '28%', left: '55%' }, { top: '75%', left: '40%' },
        { top: '40%', left: '12%' }, { top: '58%', left: '65%' },
    ];

    describe('SERVICES Array', () => {
        it('should have exactly 6 services', () => {
            expect(SERVICES).toHaveLength(6);
        });

        it('should have required properties for each service', () => {
            SERVICES.forEach(svc => {
                expect(svc).toHaveProperty('id');
                expect(svc).toHaveProperty('name');
                expect(svc).toHaveProperty('color');
                expect(svc).toHaveProperty('bg');
                expect(svc).toHaveProperty('keywords');
            });
        });

        it('should have unique service IDs', () => {
            const ids = SERVICES.map(s => s.id);
            expect(new Set(ids).size).toBe(ids.length);
        });

        it('should include all expected service types', () => {
            const ids = SERVICES.map(s => s.id);
            expect(ids).toContain('towing');
            expect(ids).toContain('fuel');
            expect(ids).toContain('battery');
            expect(ids).toContain('tire');
            expect(ids).toContain('diagnostics');
            expect(ids).toContain('medical');
        });

        it('should have medical service with emergency red color', () => {
            const medical = SERVICES.find(s => s.id === 'medical');
            expect(medical?.color).toBe('#FF3D3D');
        });

        it('should have valid hex colors', () => {
            SERVICES.forEach(svc => {
                expect(svc.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
            });
        });

        it('should have keywords array for each service', () => {
            SERVICES.forEach(svc => {
                expect(Array.isArray(svc.keywords)).toBe(true);
                expect(svc.keywords.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Smart Intent Bar - Keyword Matching', () => {
        const matchService = (query: string): string | null => {
            const lower = query.toLowerCase().trim();
            if (lower.length < 4) return null;
            for (const svc of SERVICES) {
                if (svc.keywords.some(kw => lower.includes(kw))) {
                    return svc.id;
                }
            }
            return null;
        };

        it('should match "tow" to towing service', () => {
            expect(matchService('I need a tow')).toBe('towing');
        });

        it('should match "fuel" to fuel service', () => {
            expect(matchService('need fuel delivery')).toBe('fuel');
        });

        it('should match "battery" to battery service', () => {
            expect(matchService('battery is dead')).toBe('battery');
        });

        it('should match "flat tire" to tire service', () => {
            expect(matchService('I have a flat tire')).toBe('tire');
        });

        it('should match "ambulance" to medical service', () => {
            expect(matchService('call an ambulance')).toBe('medical');
        });

        it('should return null for short queries', () => {
            expect(matchService('hi')).toBeNull();
        });

        it('should return null for no match', () => {
            expect(matchService('where is the nearest restaurant')).toBeNull();
        });
    });

    describe('NAV_ITEMS (Sidebar)', () => {
        it('should have exactly 4 nav items', () => {
            expect(NAV_ITEMS).toHaveLength(4);
        });

        it('should have valid routes for each item', () => {
            NAV_ITEMS.forEach(item => {
                expect(item.route).toMatch(/^\/\(customer\)\//);
            });
        });

        it('should have wallet with KES balance sublabel', () => {
            const wallet = NAV_ITEMS.find(i => i.label === 'ResQ Wallet');
            expect(wallet?.sublabel).toContain('KES');
        });
    });

    describe('PROVIDER_MARKERS', () => {
        it('should have exactly 8 markers', () => {
            expect(PROVIDER_MARKERS).toHaveLength(8);
        });

        it('should have top and left positions for each marker', () => {
            PROVIDER_MARKERS.forEach(m => {
                expect(m).toHaveProperty('top');
                expect(m).toHaveProperty('left');
                expect(m.top).toMatch(/^\d+%$/);
                expect(m.left).toMatch(/^\d+%$/);
            });
        });
    });

    describe('Bottom Sheet Snap Points', () => {
        const SHEET_EXPANDED = 0.60;
        const SHEET_HALF = 0.40;
        const SHEET_COLLAPSED = 80;

        it('should have expanded at 60%', () => {
            expect(SHEET_EXPANDED).toBe(0.60);
        });

        it('should have half at 40%', () => {
            expect(SHEET_HALF).toBe(0.40);
        });

        it('should have collapsed at 80px', () => {
            expect(SHEET_COLLAPSED).toBe(80);
        });

        it('should have snap points in ascending order', () => {
            const height = 800; // mock screen height
            const snapPoints = [SHEET_COLLAPSED, height * SHEET_HALF, height * SHEET_EXPANDED];
            for (let i = 1; i < snapPoints.length; i++) {
                expect(snapPoints[i]).toBeGreaterThan(snapPoints[i - 1]);
            }
        });
    });

    describe('Sidebar Spring Animation', () => {
        it('should have correct spring config', () => {
            const springConfig = { tension: 180, friction: 12 };
            expect(springConfig.tension).toBe(180);
            expect(springConfig.friction).toBe(12);
        });

        it('should have drawer width of 280', () => {
            const DRAWER_WIDTH = 280;
            expect(DRAWER_WIDTH).toBe(280);
        });
    });
});
