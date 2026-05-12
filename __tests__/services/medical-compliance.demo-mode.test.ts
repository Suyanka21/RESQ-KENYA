/**
 * Phase 4 (audit-v2 §N-CRIT-3) — medical-compliance demo-mode flag.
 *
 * The previous module hardcoded `USE_DEMO_MODE = true`, so production
 * builds silently fabricated medical-provider registrations, audit
 * logs, and incident reports. The audit ranked this CRITICAL on the
 * safety override (medical, life-safety, regulatory). This test pins
 * the corrected behavior:
 *   - default OFF (production talks to the real backend)
 *   - opt-in via `EXPO_PUBLIC_DEMO_MODE='true'`
 *   - runtime toggle via `setMedicalDemoMode` for tests / staging
 *
 * Skills: TDD (the regression here would silently re-enable
 * fabrication; the test pins it), Security-and-Hardening (default-OFF
 * for life-safety surfaces).
 */

import {
    isMedicalDemoMode,
    setMedicalDemoMode,
    registerMedicalProvider,
    generateIncidentReport,
} from '../../services/medical-compliance.service';

describe('medical-compliance demo-mode flag (audit-v2 §N-CRIT-3)', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        // Suppress expected error logging when the non-demo path
        // exercises the real Firestore client (no emulator in unit
        // tests). We assert on the result, not the log.
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        setMedicalDemoMode(false);
    });

    it('defaults to OFF (production safety: no fabricated registrations)', () => {
        // CodeRabbit feedback (PR #9): the previous body called
        // `setMedicalDemoMode(false)` first, which made the assertion
        // tautological (the setter set the value the assertion then
        // read back). Reload the module fresh so the assertion
        // exercises the actual initial state.
        jest.resetModules();
        const fresh = require('../../services/medical-compliance.service');
        expect(fresh.isMedicalDemoMode()).toBe(false);
    });

    it('setMedicalDemoMode(true) opts in for local development / tests', () => {
        setMedicalDemoMode(true);
        expect(isMedicalDemoMode()).toBe(true);
    });

    it('setMedicalDemoMode(false) returns to production behavior', () => {
        setMedicalDemoMode(true);
        setMedicalDemoMode(false);
        expect(isMedicalDemoMode()).toBe(false);
    });

    it('demo ON returns a fabricated providerId (intended dev behavior)', async () => {
        setMedicalDemoMode(true);
        const result = await registerMedicalProvider({
            emtLevel: 'emt_basic',
            yearsExperience: 2,
            specializations: [],
            certifications: [],
            insuranceInfo: {
                provider: 'Demo Co',
                policyNumber: 'D-1',
                coverage: 'personal',
                coverageAmount: 1000,
                expiryDate: '2030-01-01',
                documentUrl: 'about:blank',
            },
        });
        expect(result.success).toBe(true);
        expect(result.providerId).toMatch(/^demo_medical_/);
    });

    it('demo OFF surfaces a backend failure rather than silently faking success', async () => {
        // In the unit-test environment there is no emulator wiring, so
        // the real httpsCallable path will reject. The contract under
        // test is that the function does NOT short-circuit to a fake
        // `{ success: true }` — it propagates the failure so the UI
        // can show a real error.
        setMedicalDemoMode(false);
        const result = await generateIncidentReport('provider-1', {
            requestId: 'req-1',
            patientOutcome: 'transported',
            treatmentProvided: ['cpr'],
            notes: 'unit-test',
        });
        // Either it throws (caught by the function and turned into
        // success:false), or the real call fails — what we *forbid*
        // is success:true with a fabricated reportId.
        if (result.success) {
            // Forbid the fabricated dev-pattern id when demo is OFF.
            expect(result.reportId).not.toMatch(/^report_\d+$/);
        } else {
            // CodeRabbit feedback (PR #9): tightened from the
            // tautological `expect(result.success).toBe(false)` —
            // assert the failure carries an actionable error and
            // never an opportunistic reportId.
            expect(typeof result.error === 'string' && result.error.length > 0).toBe(true);
            expect((result as { reportId?: unknown }).reportId).toBeUndefined();
        }
    });
});
