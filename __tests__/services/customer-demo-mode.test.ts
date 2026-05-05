/**
 * CodeRabbit PR #3 (comment 15) regression tests:
 * the demo-mode flag MUST default to OFF when `EXPO_PUBLIC_DEMO_MODE`
 * is unset / undefined / any value other than the literal opt-in.
 *
 * Production builds of a React Native app frequently have either an
 * undefined `process.env` or one that is missing every `EXPO_PUBLIC_*`
 * variable that wasn't set at build time. The previous IIFE returned
 * `flag !== 'false'`, which silently flipped to demo-mode-ON in those
 * builds, bypassing every Cloud Function. This suite locks in the
 * default-OFF posture.
 */

describe('customer.service demo-mode default', () => {
    const PROCESS_ENV_KEY = 'EXPO_PUBLIC_DEMO_MODE';
    let originalValue: string | undefined;

    beforeEach(() => {
        originalValue = process.env[PROCESS_ENV_KEY];
        delete process.env[PROCESS_ENV_KEY];
        // Force the module to re-evaluate the IIFE on every reload.
        jest.resetModules();
    });

    afterEach(() => {
        if (originalValue === undefined) {
            delete process.env[PROCESS_ENV_KEY];
        } else {
            process.env[PROCESS_ENV_KEY] = originalValue;
        }
    });

    it('defaults to OFF when the env var is undefined', () => {
        const { isDemoMode } = require('../../services/customer.service');
        expect(isDemoMode()).toBe(false);
    });

    it('defaults to OFF when the env var is an empty string', () => {
        process.env[PROCESS_ENV_KEY] = '';
        const { isDemoMode } = require('../../services/customer.service');
        expect(isDemoMode()).toBe(false);
    });

    it('defaults to OFF when the env var is the literal "false"', () => {
        process.env[PROCESS_ENV_KEY] = 'false';
        const { isDemoMode } = require('../../services/customer.service');
        expect(isDemoMode()).toBe(false);
    });

    it('defaults to OFF for arbitrary non-truthy strings', () => {
        process.env[PROCESS_ENV_KEY] = 'yes';
        const { isDemoMode } = require('../../services/customer.service');
        expect(isDemoMode()).toBe(false);
    });

    it('opts IN only for the literal "true"', () => {
        process.env[PROCESS_ENV_KEY] = 'true';
        const { isDemoMode } = require('../../services/customer.service');
        expect(isDemoMode()).toBe(true);
    });

    it('also opts IN for the literal "1"', () => {
        process.env[PROCESS_ENV_KEY] = '1';
        const { isDemoMode } = require('../../services/customer.service');
        expect(isDemoMode()).toBe(true);
    });

    it('setDemoMode(true) overrides the runtime default for tests', () => {
        const customer = require('../../services/customer.service');
        expect(customer.isDemoMode()).toBe(false);
        customer.setDemoMode(true);
        expect(customer.isDemoMode()).toBe(true);
        customer.setDemoMode(false);
        expect(customer.isDemoMode()).toBe(false);
    });
});
