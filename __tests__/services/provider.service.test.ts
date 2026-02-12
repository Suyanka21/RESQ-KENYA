// ResQ Kenya - Provider Service Test Suite
// Tests for provider-side operations

import {
    calculateDistance,
    estimateETA,
} from '../../services/provider.service';

// Mock Firebase modules
jest.mock('firebase/functions', () => ({
    getFunctions: jest.fn(() => ({})),
    httpsCallable: jest.fn(() => jest.fn()),
}));

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    onSnapshot: jest.fn(),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
}));

jest.mock('../../config/firebase', () => ({
    db: {},
    default: {},
}));

describe('services/provider.service', () => {

    // =========================================================================
    // calculateDistance Tests (Haversine formula)
    // =========================================================================
    describe('calculateDistance', () => {

        it('should return 0 for same coordinates', () => {
            const distance = calculateDistance(-1.2864, 36.8172, -1.2864, 36.8172);
            expect(distance).toBe(0);
        });

        it('should calculate distance Nairobi CBD to JKIA (~15-18 km)', () => {
            // Nairobi CBD: -1.2864, 36.8172
            // JKIA: -1.3192, 36.9276
            const distance = calculateDistance(-1.2864, 36.8172, -1.3192, 36.9276);
            expect(distance).toBeGreaterThan(10);
            expect(distance).toBeLessThan(20);
        });

        it('should calculate distance Westlands to CBD (~3-5 km)', () => {
            // Westlands: -1.2635, 36.8032
            // CBD: -1.2864, 36.8172
            const distance = calculateDistance(-1.2635, 36.8032, -1.2864, 36.8172);
            expect(distance).toBeGreaterThan(2);
            expect(distance).toBeLessThan(6);
        });

        it('should calculate distance Karen to CBD (~15 km)', () => {
            // Karen: -1.3167, 36.7100
            // CBD: -1.2864, 36.8172
            const distance = calculateDistance(-1.3167, 36.7100, -1.2864, 36.8172);
            expect(distance).toBeGreaterThan(10);
            expect(distance).toBeLessThan(20);
        });

        it('should return same distance regardless of point order', () => {
            const dist1 = calculateDistance(-1.2864, 36.8172, -1.3192, 36.9276);
            const dist2 = calculateDistance(-1.3192, 36.9276, -1.2864, 36.8172);
            expect(Math.abs(dist1 - dist2)).toBeLessThan(0.01);
        });

        it('should handle equator crossing', () => {
            const distance = calculateDistance(-0.5, 36.8, 0.5, 36.8);
            expect(distance).toBeGreaterThan(100); // ~111 km
            expect(distance).toBeLessThan(120);
        });

        it('should return positive values', () => {
            const distance = calculateDistance(-1.2864, 36.8172, -1.5, 37.0);
            expect(distance).toBeGreaterThan(0);
        });
    });

    // =========================================================================
    // estimateETA Tests (30 km/h average Nairobi speed)
    // =========================================================================
    describe('estimateETA', () => {

        it('should estimate 10 minutes for 5 km', () => {
            const eta = estimateETA(5);
            expect(eta).toBe(10); // 5 km at 30 km/h = 10 min
        });

        it('should estimate 30 minutes for 15 km', () => {
            const eta = estimateETA(15);
            expect(eta).toBe(30); // 15 km at 30 km/h = 30 min
        });

        it('should estimate 60 minutes for 30 km', () => {
            const eta = estimateETA(30);
            expect(eta).toBe(60); // 30 km at 30 km/h = 60 min
        });

        it('should round up to nearest minute', () => {
            // 7 km at 30 km/h = 14 min
            const eta = estimateETA(7);
            expect(eta).toBe(14);
        });

        it('should handle 0 distance', () => {
            const eta = estimateETA(0);
            expect(eta).toBe(0);
        });

        it('should handle small distances', () => {
            const eta = estimateETA(0.5);
            expect(eta).toBe(1); // Minimum 1 minute
        });

        it('should handle large distances', () => {
            const eta = estimateETA(100);
            expect(eta).toBe(200); // 100 km at 30 km/h = 200 min
        });
    });

    // =========================================================================
    // Service Function Exports
    // =========================================================================
    describe('service functions', () => {

        it('should export updateLocation function', () => {
            const { updateLocation } = require('../../services/provider.service');
            expect(typeof updateLocation).toBe('function');
        });

        it('should export setAvailability function', () => {
            const { setAvailability } = require('../../services/provider.service');
            expect(typeof setAvailability).toBe('function');
        });

        it('should export acceptRequest function', () => {
            const { acceptRequest } = require('../../services/provider.service');
            expect(typeof acceptRequest).toBe('function');
        });

        it('should export updateRequestStatus function', () => {
            const { updateRequestStatus } = require('../../services/provider.service');
            expect(typeof updateRequestStatus).toBe('function');
        });

        it('should export getNearbyRequests function', () => {
            const { getNearbyRequests } = require('../../services/provider.service');
            expect(typeof getNearbyRequests).toBe('function');
        });

        it('should export subscribeToRequest function', () => {
            const { subscribeToRequest } = require('../../services/provider.service');
            expect(typeof subscribeToRequest).toBe('function');
        });

        it('should export subscribeToNearbyRequests function', () => {
            const { subscribeToNearbyRequests } = require('../../services/provider.service');
            expect(typeof subscribeToNearbyRequests).toBe('function');
        });

        it('should export getRequestHistory function', () => {
            const { getRequestHistory } = require('../../services/provider.service');
            expect(typeof getRequestHistory).toBe('function');
        });

        it('should export getEarningsSummary function', () => {
            const { getEarningsSummary } = require('../../services/provider.service');
            expect(typeof getEarningsSummary).toBe('function');
        });
    });
});
