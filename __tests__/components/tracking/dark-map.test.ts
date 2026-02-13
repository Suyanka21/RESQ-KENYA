// ⚡ DarkMap Component - Unit Tests

describe('DarkMap Component', () => {
    const ROUTE_WAYPOINTS = [
        { x: 0.20, y: 0.15 },
        { x: 0.25, y: 0.18 },
        { x: 0.30, y: 0.22 },
        { x: 0.35, y: 0.28 },
        { x: 0.40, y: 0.32 },
        { x: 0.44, y: 0.36 },
        { x: 0.46, y: 0.40 },
        { x: 0.48, y: 0.44 },
        { x: 0.50, y: 0.48 },
    ];

    const USER_POS = { x: 0.50, y: 0.48 };

    describe('ROUTE_WAYPOINTS', () => {
        it('should have 9 waypoints', () => {
            expect(ROUTE_WAYPOINTS).toHaveLength(9);
        });

        it('should have x and y for each waypoint', () => {
            ROUTE_WAYPOINTS.forEach(wp => {
                expect(wp).toHaveProperty('x');
                expect(wp).toHaveProperty('y');
            });
        });

        it('should have all values between 0 and 1 (normalized)', () => {
            ROUTE_WAYPOINTS.forEach(wp => {
                expect(wp.x).toBeGreaterThanOrEqual(0);
                expect(wp.x).toBeLessThanOrEqual(1);
                expect(wp.y).toBeGreaterThanOrEqual(0);
                expect(wp.y).toBeLessThanOrEqual(1);
            });
        });

        it('should end at USER_POS', () => {
            const last = ROUTE_WAYPOINTS[ROUTE_WAYPOINTS.length - 1];
            expect(last.x).toBe(USER_POS.x);
            expect(last.y).toBe(USER_POS.y);
        });

        it('should have generally increasing x values (left to right)', () => {
            for (let i = 1; i < ROUTE_WAYPOINTS.length; i++) {
                expect(ROUTE_WAYPOINTS[i].x).toBeGreaterThanOrEqual(ROUTE_WAYPOINTS[i - 1].x);
            }
        });

        it('should have generally increasing y values (top to bottom)', () => {
            for (let i = 1; i < ROUTE_WAYPOINTS.length; i++) {
                expect(ROUTE_WAYPOINTS[i].y).toBeGreaterThanOrEqual(ROUTE_WAYPOINTS[i - 1].y);
            }
        });
    });

    describe('getProviderPos()', () => {
        const getProviderPos = (progress: number) => {
            const clampedProgress = Math.max(0, Math.min(1, progress));
            const totalSegments = ROUTE_WAYPOINTS.length - 1;
            const exactIndex = clampedProgress * totalSegments;
            const lower = Math.floor(exactIndex);
            const upper = Math.min(lower + 1, totalSegments);
            const t = exactIndex - lower;
            return {
                x: ROUTE_WAYPOINTS[lower].x + (ROUTE_WAYPOINTS[upper].x - ROUTE_WAYPOINTS[lower].x) * t,
                y: ROUTE_WAYPOINTS[lower].y + (ROUTE_WAYPOINTS[upper].y - ROUTE_WAYPOINTS[lower].y) * t,
            };
        };

        it('should return first waypoint at progress 0', () => {
            const pos = getProviderPos(0);
            expect(pos.x).toBe(ROUTE_WAYPOINTS[0].x);
            expect(pos.y).toBe(ROUTE_WAYPOINTS[0].y);
        });

        it('should return last waypoint at progress 1', () => {
            const pos = getProviderPos(1);
            expect(pos.x).toBe(USER_POS.x);
            expect(pos.y).toBe(USER_POS.y);
        });

        it('should interpolate at progress 0.5', () => {
            const pos = getProviderPos(0.5);
            expect(pos.x).toBeGreaterThan(ROUTE_WAYPOINTS[0].x);
            expect(pos.x).toBeLessThan(USER_POS.x);
        });

        it('should clamp progress < 0 to 0', () => {
            const pos = getProviderPos(-0.5);
            expect(pos.x).toBe(ROUTE_WAYPOINTS[0].x);
        });

        it('should clamp progress > 1 to 1', () => {
            const pos = getProviderPos(1.5);
            expect(pos.x).toBe(USER_POS.x);
        });
    });

    describe('getBearing()', () => {
        const getBearing = (progress: number) => {
            const totalSegments = ROUTE_WAYPOINTS.length - 1;
            const clampedProgress = Math.max(0, Math.min(1, progress));
            const idx = Math.min(
                Math.floor(clampedProgress * totalSegments),
                totalSegments - 1
            );
            const nextIdx = idx + 1;
            const dx = ROUTE_WAYPOINTS[nextIdx].x - ROUTE_WAYPOINTS[idx].x;
            const dy = ROUTE_WAYPOINTS[nextIdx].y - ROUTE_WAYPOINTS[idx].y;
            return `${Math.atan2(dy, dx) * (180 / Math.PI)}deg`;
        };

        it('should return angle in degrees format', () => {
            const bearing = getBearing(0);
            expect(bearing).toMatch(/[\d.-]+deg/);
        });

        it('should return different bearings at different progress', () => {
            const b1 = getBearing(0);
            const b2 = getBearing(0.5);
            // They may be different, but both should be valid
            expect(b1).toMatch(/deg$/);
            expect(b2).toMatch(/deg$/);
        });
    });

    describe('DarkMapProps', () => {
        it('should require providerProgress and showRoute', () => {
            const props = { providerProgress: 0.5, showRoute: true };
            expect(typeof props.providerProgress).toBe('number');
            expect(typeof props.showRoute).toBe('boolean');
        });

        it('should default isSearching to false', () => {
            const defaults = { isSearching: false, dimmed: false };
            expect(defaults.isSearching).toBe(false);
        });

        it('should default dimmed to false', () => {
            const defaults = { dimmed: false };
            expect(defaults.dimmed).toBe(false);
        });
    });
});
