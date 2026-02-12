// ResQ Kenya - Customer Service Test Suite
// Tests for customer-facing service operations

import {
    calculateServicePrice,
    formatETA,
    calculateDistance,
} from '../../services/customer.service';

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
    updateDoc: jest.fn(),
}));

jest.mock('../../config/firebase', () => ({
    db: {},
    default: {},
}));

describe('services/customer.service', () => {

    // =========================================================================
    // calculateServicePrice Tests
    // =========================================================================
    describe('calculateServicePrice', () => {

        it('should calculate towing service price', () => {
            const price = calculateServicePrice('towing');
            expect(price.basePrice).toBeGreaterThan(0);
            expect(price.total).toBeGreaterThan(0);
            expect(price.platformFee).toBeGreaterThan(0);
        });

        it('should calculate battery jumpstart price', () => {
            const price = calculateServicePrice('battery');
            expect(price.basePrice).toBeGreaterThan(0);
            expect(price.total).toBe(price.basePrice + price.distanceFee + price.platformFee);
        });

        it('should calculate tire repair price', () => {
            const price = calculateServicePrice('tire');
            expect(price.basePrice).toBeGreaterThan(0);
        });

        it('should calculate fuel delivery price', () => {
            const price = calculateServicePrice('fuel', { fuelAmount: 20 });
            expect(price.basePrice).toBeGreaterThan(0);
        });

        it('should calculate diagnostics price', () => {
            const price = calculateServicePrice('diagnostics');
            expect(price.basePrice).toBeGreaterThan(0);
        });

        it('should add distance fee when distance is provided', () => {
            const priceWithDistance = calculateServicePrice('towing', { distance: 10 });
            const priceNoDistance = calculateServicePrice('towing');
            expect(priceWithDistance.distanceFee).toBeGreaterThan(priceNoDistance.distanceFee);
        });

        it('should handle unknown service type with zero pricing', () => {
            const price = calculateServicePrice('unknown');
            expect(price.total).toBe(0);
            expect(price.basePrice).toBe(0);
        });

        it('should return total as sum of components', () => {
            const price = calculateServicePrice('towing', { distance: 5 });
            expect(price.total).toBe(price.basePrice + price.distanceFee + price.platformFee);
        });
    });

    // =========================================================================
    // formatETA Tests
    // =========================================================================
    describe('formatETA', () => {

        it('should format minutes less than 60', () => {
            expect(formatETA(5)).toBe('5 mins');
            expect(formatETA(15)).toBe('15 mins');
            expect(formatETA(45)).toBe('45 mins');
        });

        it('should format exactly 60 minutes as 1 hour', () => {
            expect(formatETA(60)).toBe('1h');
        });

        it('should format hours and minutes', () => {
            expect(formatETA(75)).toBe('1h 15m');
            expect(formatETA(120)).toBe('2h');
            expect(formatETA(150)).toBe('2h 30m');
        });

        it('should handle 0 minutes (arriving now)', () => {
            expect(formatETA(0)).toBe('Arriving now');
        });

        it('should handle 1 minute', () => {
            expect(formatETA(1)).toBe('1 min');
        });
    });

    // =========================================================================
    // calculateDistance Tests
    // =========================================================================
    describe('calculateDistance', () => {

        it('should return 0 for same coordinates', () => {
            const distance = calculateDistance(-1.2864, 36.8172, -1.2864, 36.8172);
            expect(distance).toBe(0);
        });

        it('should calculate distance between Nairobi CBD and JKIA', () => {
            // Nairobi CBD to JKIA is approximately 15-18 km
            const distance = calculateDistance(-1.2864, 36.8172, -1.3192, 36.9276);
            expect(distance).toBeGreaterThan(10);
            expect(distance).toBeLessThan(20);
        });

        it('should calculate distance between two Nairobi points', () => {
            // Westlands to CBD is approximately 3-5 km
            const distance = calculateDistance(-1.2635, 36.8032, -1.2864, 36.8172);
            expect(distance).toBeGreaterThan(2);
            expect(distance).toBeLessThan(10);
        });

        it('should return positive distance regardless of order', () => {
            const dist1 = calculateDistance(-1.2864, 36.8172, -1.3192, 36.9276);
            const dist2 = calculateDistance(-1.3192, 36.9276, -1.2864, 36.8172);
            expect(Math.abs(dist1 - dist2)).toBeLessThan(0.1);
        });

        it('should handle negative latitudes (southern hemisphere)', () => {
            const distance = calculateDistance(-1.0, 36.0, -2.0, 37.0);
            expect(distance).toBeGreaterThan(0);
        });
    });

    // =========================================================================
    // Service Function Exports
    // =========================================================================
    describe('service functions', () => {

        it('should export createServiceRequest function', () => {
            const { createServiceRequest } = require('../../services/customer.service');
            expect(typeof createServiceRequest).toBe('function');
        });

        it('should export cancelServiceRequest function', () => {
            const { cancelServiceRequest } = require('../../services/customer.service');
            expect(typeof cancelServiceRequest).toBe('function');
        });

        it('should export subscribeToRequest function', () => {
            const { subscribeToRequest } = require('../../services/customer.service');
            expect(typeof subscribeToRequest).toBe('function');
        });

        it('should export getRequestHistory function', () => {
            const { getRequestHistory } = require('../../services/customer.service');
            expect(typeof getRequestHistory).toBe('function');
        });

        it('should export addRating function', () => {
            const { addRating } = require('../../services/customer.service');
            expect(typeof addRating).toBe('function');
        });

        it('should export setDemoMode function', () => {
            const { setDemoMode } = require('../../services/customer.service');
            expect(typeof setDemoMode).toBe('function');
        });
    });
});
