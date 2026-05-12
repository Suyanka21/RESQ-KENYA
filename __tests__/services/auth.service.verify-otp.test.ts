/**
 * Phase 4.14 (CodeRabbit post-merge feedback PR #9) — regression test.
 *
 * Asserts that `services/auth.service.ts:verifyOTP` returns `{success:
 * true}` even when the best-effort `createUserProfile` step fails.
 * Before this fix, a transient Firestore hiccup on the profile-seed
 * (rules denial, quota, offline) would surface as `success:false`
 * even though Firebase Auth had already succeeded — the caller would
 * loop back to the OTP screen with a stale confirmationResult and the
 * user would be stuck.
 *
 * Skills: TDD (failing-path regression for a fixed bug),
 * TRUSTLESS-AUDITOR (silent stuck-flow is exactly the "real user,
 * no recovery path" scenario), API-and-Interface-Design (verifyOTP's
 * contract is "success iff Firebase Auth succeeded", nothing else).
 */

const mockConfirm = jest.fn();
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockSignInWithPhoneNumber = jest.fn();

jest.mock('firebase/auth', () => ({
    RecaptchaVerifier: jest.fn().mockImplementation(() => ({})),
    PhoneAuthProvider: jest.fn(),
    signInWithCredential: jest.fn(),
    signInWithPhoneNumber: (...args: unknown[]) => mockSignInWithPhoneNumber(...args),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(() => ({})),
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
    setDoc: (...args: unknown[]) => mockSetDoc(...args),
    serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
}));

jest.mock('../../config/firebase', () => ({
    __esModule: true,
    default: { name: 'test-app' },
    db: {},
    auth: { name: 'test-auth' },
}));

describe('verifyOTP — profile-seed failure isolation', () => {
    let originalWindow: unknown;

    beforeAll(() => {
        // sendOTP only takes the wire path when `typeof window !==
        // 'undefined' && recaptchaContainerId`. Jest's `node`
        // testEnvironment has no window; stub one for the duration
        // of this suite.
        originalWindow = (globalThis as { window?: unknown }).window;
        (globalThis as { window: unknown }).window = {};
    });

    afterAll(() => {
        (globalThis as { window?: unknown }).window = originalWindow;
    });

    beforeEach(() => {
        mockConfirm.mockReset();
        mockGetDoc.mockReset();
        mockSetDoc.mockReset();
        mockSignInWithPhoneNumber.mockReset();
        jest.resetModules();
    });

    function loadAuthService(): typeof import('../../services/auth.service') {
        return require('../../services/auth.service');
    }

    async function primeConfirmation(authService: typeof import('../../services/auth.service')): Promise<void> {
        mockSignInWithPhoneNumber.mockResolvedValueOnce({ confirm: mockConfirm });
        const sendResult = await authService.sendOTP('+254712345678', 'recaptcha-container');
        expect(sendResult.success).toBe(true);
        expect(authService.hasPendingOtpConfirmation()).toBe(true);
    }

    it('returns success when createUserProfile throws (best-effort isolation)', async () => {
        // Simulate Firestore failure on the profile read — replicates
        // rules denial, quota exhausted, offline, etc.
        mockGetDoc.mockRejectedValueOnce(new Error('FIRESTORE_UNAVAILABLE'));
        mockConfirm.mockResolvedValueOnce({
            user: { uid: 'uid_1', phoneNumber: '+254712345678' },
        });

        const authService = loadAuthService();
        await primeConfirmation(authService);

        const result = await authService.verifyOTP('123456');

        expect(result.success).toBe(true);
        expect(result.user?.uid).toBe('uid_1');
        expect(result.error).toBeUndefined();
        // The profile-seed was attempted exactly once and rejected;
        // verifyOTP swallowed the throw rather than propagating it.
        expect(mockGetDoc).toHaveBeenCalledTimes(1);
        // The one-shot confirmationResult is cleared even when
        // createUserProfile fails (see PR #9 commit 3 — clears
        // BEFORE the profile-seed so a retry triggers a fresh
        // sendOTP path).
        expect(authService.hasPendingOtpConfirmation()).toBe(false);
    });

    it('still fails when Firebase Auth itself rejects (contract preserved)', async () => {
        mockConfirm.mockRejectedValueOnce({
            code: 'auth/invalid-verification-code',
            message: 'Bad code',
        });

        const authService = loadAuthService();
        await primeConfirmation(authService);

        const result = await authService.verifyOTP('000000');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid code. Please try again.');
        // The profile-seed should never have been attempted because
        // the auth gate rejected first.
        expect(mockGetDoc).not.toHaveBeenCalled();
    });
});
