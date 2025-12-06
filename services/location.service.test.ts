// Location Service - Comprehensive Unit Tests
// Using require() for Jest compatibility
const Location = require('expo-location');

describe('Location Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Expo Location Mock', () => {
        it('should have requestForegroundPermissionsAsync defined', () => {
            expect(Location.requestForegroundPermissionsAsync).toBeDefined();
        });

        it('should have getCurrentPositionAsync defined', () => {
            expect(Location.getCurrentPositionAsync).toBeDefined();
        });

        it('should return coordinates from getCurrentPositionAsync', async () => {
            const position = await Location.getCurrentPositionAsync({});
            expect(position).toHaveProperty('coords');
            expect(position.coords).toHaveProperty('latitude');
            expect(position.coords).toHaveProperty('longitude');
        });
    });

    describe('Distance Calculation', () => {
        const calculateDistance = (
            lat1: number, lon1: number,
            lat2: number, lon2: number
        ): number => {
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        it('should calculate distance between two Nairobi locations', () => {
            const distance = calculateDistance(-1.2673, 36.8114, -1.2864, 36.8172);
            expect(distance).toBeGreaterThan(2);
            expect(distance).toBeLessThan(5);
        });

        it('should return 0 for same location', () => {
            const distance = calculateDistance(-1.2921, 36.8219, -1.2921, 36.8219);
            expect(distance).toBe(0);
        });

        it('should calculate long distances correctly', () => {
            const distance = calculateDistance(-1.2921, 36.8219, -4.0435, 39.6682);
            expect(distance).toBeGreaterThan(400);
            expect(distance).toBeLessThan(550);
        });
    });

    describe('ETA Calculation', () => {
        const calculateETA = (distanceKm: number, speedKmh: number = 30): number => {
            if (distanceKm <= 0 || speedKmh <= 0) return 0;
            return Math.ceil((distanceKm / speedKmh) * 60);
        };

        it('should calculate correct ETA for short distances', () => {
            expect(calculateETA(3, 30)).toBe(6);
        });

        it('should calculate correct ETA for longer distances', () => {
            expect(calculateETA(15, 30)).toBe(30);
        });

        it('should round up partial minutes', () => {
            expect(calculateETA(4, 30)).toBe(8);
        });

        it('should handle zero distance', () => {
            expect(calculateETA(0, 30)).toBe(0);
        });
    });

    describe('Nairobi Bounds Check', () => {
        const isInNairobi = (lat: number, lon: number): boolean => {
            return lat >= -1.45 && lat <= -1.15 &&
                lon >= 36.65 && lon <= 37.05;
        };

        it('should return true for CBD', () => {
            expect(isInNairobi(-1.2864, 36.8172)).toBe(true);
        });

        it('should return true for Westlands', () => {
            expect(isInNairobi(-1.2673, 36.8114)).toBe(true);
        });

        it('should return false for Mombasa', () => {
            expect(isInNairobi(-4.0435, 39.6682)).toBe(false);
        });
    });
});
