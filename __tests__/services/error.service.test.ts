// ResQ Kenya - Error Service Test Suite
// Tests for error handling, logging, and user-friendly messages

import {
    getUserFriendlyMessage,
    isNetworkError,
} from '../../services/error.service';

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    collection: jest.fn(),
    addDoc: jest.fn(() => Promise.resolve({ id: 'mock-id' })),
    serverTimestamp: jest.fn(() => new Date()),
}));

jest.mock('../../config/firebase', () => ({
    db: {},
}));

// Mock react-native Platform
jest.mock('react-native', () => ({
    Platform: {
        OS: 'ios',
    },
}));

describe('services/error.service', () => {

    // =========================================================================
    // getUserFriendlyMessage Tests
    // =========================================================================
    describe('getUserFriendlyMessage', () => {

        it('should return friendly message for network errors', () => {
            const message = getUserFriendlyMessage(new Error('Network error'), 'network');
            expect(message.toLowerCase()).toContain('connect');
        });

        it('should return friendly message for auth errors', () => {
            const message = getUserFriendlyMessage('Invalid credentials', 'auth');
            expect(message.length).toBeGreaterThan(0);
        });

        it('should return friendly message for payment errors', () => {
            const message = getUserFriendlyMessage('Payment failed', 'payment');
            expect(message.length).toBeGreaterThan(0);
        });

        it('should return friendly message for location errors', () => {
            const message = getUserFriendlyMessage('Location unavailable', 'location');
            expect(message.length).toBeGreaterThan(0);
        });

        it('should handle string error input', () => {
            const message = getUserFriendlyMessage('Some error occurred', 'unknown');
            expect(message.length).toBeGreaterThan(0);
        });

        it('should handle Error object input', () => {
            const message = getUserFriendlyMessage(new Error('Test error'), 'unknown');
            expect(message.length).toBeGreaterThan(0);
        });

        it('should not expose technical details', () => {
            const message = getUserFriendlyMessage(new Error('ECONNREFUSED 127.0.0.1:5000'), 'network');
            expect(message).not.toContain('ECONNREFUSED');
            expect(message).not.toContain('127.0.0.1');
        });
    });

    // =========================================================================
    // isNetworkError Tests
    // =========================================================================
    describe('isNetworkError', () => {

        it('should detect network error by message', () => {
            expect(isNetworkError(new Error('Network request failed'))).toBe(true);
            expect(isNetworkError(new Error('net::ERR_INTERNET_DISCONNECTED'))).toBe(true);
        });

        it('should detect timeout errors', () => {
            expect(isNetworkError(new Error('timeout'))).toBe(true);
            expect(isNetworkError(new Error('Request timeout'))).toBe(true);
        });

        it('should detect fetch errors', () => {
            expect(isNetworkError(new Error('fetch failed'))).toBe(true);
        });

        it('should detect ECONNREFUSED errors', () => {
            expect(isNetworkError(new Error('ECONNREFUSED'))).toBe(true);
        });

        it('should return false for non-network errors', () => {
            expect(isNetworkError(new Error('Invalid input'))).toBe(false);
            expect(isNetworkError(new Error('User not found'))).toBe(false);
        });

        it('should handle null/undefined input', () => {
            expect(isNetworkError(null)).toBe(false);
            expect(isNetworkError(undefined)).toBe(false);
        });

        it('should handle string input (returns false - no .message property)', () => {
            // Plain strings don't have .message property, so they are not detected as network errors
            // Use Error objects for proper network error detection
            expect(isNetworkError('Network error')).toBe(false);
            expect(isNetworkError('Random error')).toBe(false);
        });
    });

    // =========================================================================
    // Service Function Exports
    // =========================================================================
    describe('service functions', () => {

        it('should export setLoggingUserId function', () => {
            const { setLoggingUserId } = require('../../services/error.service');
            expect(typeof setLoggingUserId).toBe('function');
        });

        it('should export logDebug function', () => {
            const { logDebug } = require('../../services/error.service');
            expect(typeof logDebug).toBe('function');
        });

        it('should export logInfo function', () => {
            const { logInfo } = require('../../services/error.service');
            expect(typeof logInfo).toBe('function');
        });

        it('should export logWarning function', () => {
            const { logWarning } = require('../../services/error.service');
            expect(typeof logWarning).toBe('function');
        });

        it('should export logError function', () => {
            const { logError } = require('../../services/error.service');
            expect(typeof logError).toBe('function');
        });

        it('should export logCritical function', () => {
            const { logCritical } = require('../../services/error.service');
            expect(typeof logCritical).toBe('function');
        });

        it('should export withErrorHandling function', () => {
            const { withErrorHandling } = require('../../services/error.service');
            expect(typeof withErrorHandling).toBe('function');
        });

        it('should export setupGlobalErrorHandler function', () => {
            const { setupGlobalErrorHandler } = require('../../services/error.service');
            expect(typeof setupGlobalErrorHandler).toBe('function');
        });

        it('should export retryWithBackoff function', () => {
            const { retryWithBackoff } = require('../../services/error.service');
            expect(typeof retryWithBackoff).toBe('function');
        });

        it('should export captureComponentError function', () => {
            const { captureComponentError } = require('../../services/error.service');
            expect(typeof captureComponentError).toBe('function');
        });
    });

    // =========================================================================
    // Default Export
    // =========================================================================
    describe('default export', () => {

        it('should export default object with all functions', () => {
            const errorService = require('../../services/error.service').default;
            expect(errorService).toBeDefined();
            expect(typeof errorService.logError).toBe('function');
            expect(typeof errorService.logCritical).toBe('function');
            expect(typeof errorService.getUserFriendlyMessage).toBe('function');
        });
    });
});
