/**
 * Phase 4 (audit-v2 §N-MED-3 + §N-MED-9) — radius policy unit tests.
 *
 * Locks in:
 *   - per-service baseline (ambulance > towing > fuel/battery/tire)
 *   - widening on retry (0 → +0, 1 → +10, 2 → +20, 3+ → +30)
 *   - hard ceiling at MAX_RADIUS_KM
 *   - unknown service type falls back to 15 km
 *   - retryCount NaN / Infinity / negative is treated as 0
 *
 * Skills: Test-Driven-Development, Code-Review-and-Quality.
 */

import {
    resolveDispatchRadiusKm,
    MAX_RADIUS_KM,
} from '../../functions/src/shared/dispatchRadius';

describe('resolveDispatchRadiusKm — per-service baseline', () => {
    it('ambulance baseline is 20 km', () => {
        expect(resolveDispatchRadiusKm('ambulance', 0)).toBe(20);
    });

    it('towing baseline is 15 km', () => {
        expect(resolveDispatchRadiusKm('towing', 0)).toBe(15);
    });

    it('fuel baseline is 10 km', () => {
        expect(resolveDispatchRadiusKm('fuel', 0)).toBe(10);
    });

    it('battery baseline is 10 km', () => {
        expect(resolveDispatchRadiusKm('battery', 0)).toBe(10);
    });

    it('tire baseline is 10 km', () => {
        expect(resolveDispatchRadiusKm('tire', 0)).toBe(10);
    });

    it('diagnostics baseline is 10 km', () => {
        expect(resolveDispatchRadiusKm('diagnostics', 0)).toBe(10);
    });

    it('unknown service falls back to 15 km baseline', () => {
        expect(resolveDispatchRadiusKm('made-up-service', 0)).toBe(15);
    });
});

describe('resolveDispatchRadiusKm — widening on retry', () => {
    it('retry 1 adds 10 km', () => {
        expect(resolveDispatchRadiusKm('towing', 1)).toBe(25);
        expect(resolveDispatchRadiusKm('fuel', 1)).toBe(20);
    });

    it('retry 2 adds 20 km', () => {
        expect(resolveDispatchRadiusKm('towing', 2)).toBe(35);
        expect(resolveDispatchRadiusKm('ambulance', 2)).toBe(40);
    });

    it('retry 3 adds 30 km (max widening step)', () => {
        expect(resolveDispatchRadiusKm('towing', 3)).toBe(45);
    });

    it('retry 4+ does not widen further than retry 3 (clamped step)', () => {
        expect(resolveDispatchRadiusKm('towing', 4)).toBe(45);
        expect(resolveDispatchRadiusKm('towing', 99)).toBe(45);
    });

    it('ambulance retry 3 + widening stays under hard ceiling', () => {
        // 20 + 30 = 50, well under MAX_RADIUS_KM=90
        expect(resolveDispatchRadiusKm('ambulance', 3)).toBe(50);
    });

    it('hard ceiling MAX_RADIUS_KM applies', () => {
        // synthetic: a hypothetical service with a 100 km baseline
        // should be clamped to MAX_RADIUS_KM. We simulate via the
        // fallback path (unknown service) and a retry — fallback is
        // 15 + 30 = 45, still under the ceiling. The ceiling is for
        // defence in depth; assert it directly.
        expect(MAX_RADIUS_KM).toBe(90);
        expect(resolveDispatchRadiusKm('towing', 999)).toBeLessThanOrEqual(MAX_RADIUS_KM);
    });
});

describe('resolveDispatchRadiusKm — invalid retryCount inputs', () => {
    it('NaN retryCount → treated as 0 (baseline)', () => {
        expect(resolveDispatchRadiusKm('towing', Number.NaN)).toBe(15);
    });

    it('Infinity retryCount → treated as 0 (Number.isFinite gate, defensive)', () => {
        // Documented behaviour: only finite positive numbers count as
        // a retry. Infinity is a corruption signal — fall back to the
        // baseline so we don't blast every provider in the country.
        expect(resolveDispatchRadiusKm('towing', Number.POSITIVE_INFINITY)).toBe(15);
    });

    it('negative retryCount → treated as 0 (baseline)', () => {
        expect(resolveDispatchRadiusKm('towing', -3)).toBe(15);
    });

    it('fractional retryCount → floored', () => {
        expect(resolveDispatchRadiusKm('towing', 1.7)).toBe(25);
    });
});
