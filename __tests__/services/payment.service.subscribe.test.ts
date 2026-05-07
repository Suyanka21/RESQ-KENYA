/**
 * Phase 4 (audit-v2 §N-CRIT-5) — contract test for the live payment
 * status subscription.
 *
 * The bug this guards against is real: the payment_requests collection
 * in Firestore is keyed by `idempotencyKey`, not the customer-facing
 * `requestId`. The pre-fix wrapper used `requestId` as the doc id,
 * which meant the customer's UI subscribed to a non-existent document
 * and never observed the real M-Pesa outcome — leaving the modal
 * dependent on a hardcoded `setTimeout` fake-success path.
 *
 * Skills: TDD (the test pins the storage-key contract), API-and-
 * Interface-Design (parameter name matches the storage key), Source-
 * Driven Development (Firestore `payment_requests` schema is the
 * source of truth — see `functions/src/mpesa/stkPush.ts:220`).
 */

const mockOnSnapshot = jest.fn();
const mockDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
    doc: (...args: unknown[]) => mockDoc(...args),
    onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
}));
jest.mock('firebase/functions', () => ({
    getFunctions: jest.fn(() => ({})),
    httpsCallable: jest.fn(),
}));
jest.mock('../../config/firebase', () => ({
    __esModule: true,
    default: { name: 'test-app' },
    db: { __mock_db__: true },
}));

describe('payment.service / subscribeToPaymentStatus — contract', () => {
    beforeEach(() => {
        mockOnSnapshot.mockReset();
        mockDoc.mockReset();
        jest.resetModules();
    });

    function loadSubscribe(): typeof import('../../services/payment.service').subscribeToPaymentStatus {
        return require('../../services/payment.service').subscribeToPaymentStatus;
    }

    it('subscribes to payment_requests/{idempotencyKey} (NOT /{requestId})', () => {
        // Audit §N-CRIT-5: the fix renames the parameter and hits the
        // correct doc id. If a future change reverts to `requestId`,
        // this test catches it because the mocked `doc()` would then
        // see the wrong primary key.
        mockDoc.mockReturnValue({ __ref: 'payment_requests/idem-1234567890' });
        mockOnSnapshot.mockReturnValue(() => undefined);

        const subscribe = loadSubscribe();
        subscribe('idem-1234567890', () => undefined);

        expect(mockDoc).toHaveBeenCalledTimes(1);
        const [, collectionPath, docId] = mockDoc.mock.calls[0];
        expect(collectionPath).toBe('payment_requests');
        expect(docId).toBe('idem-1234567890');
    });

    it('returns the unsubscribe function from onSnapshot for cleanup', () => {
        const unsub = jest.fn();
        mockOnSnapshot.mockReturnValue(unsub);
        mockDoc.mockReturnValue({ __ref: 'payment_requests/idem-x' });

        const subscribe = loadSubscribe();
        const cleanup = subscribe('idem-x', () => undefined);

        expect(cleanup).toBe(unsub);
    });

    it('forwards completed status with mpesaReceiptNumber to the callback', () => {
        // Capture the snapshot handler so we can drive it manually.
        let snapshotHandler: ((snap: unknown) => void) | null = null;
        mockOnSnapshot.mockImplementation((_ref, handler) => {
            snapshotHandler = handler as (snap: unknown) => void;
            return () => undefined;
        });
        mockDoc.mockReturnValue({ __ref: 'payment_requests/idem-y' });

        const subscribe = loadSubscribe();
        const cb = jest.fn();
        subscribe('idem-y', cb);

        // Drive a "completed" snapshot.
        snapshotHandler!({
            exists: () => true,
            data: () => ({
                status: 'completed',
                mpesaReceiptNumber: 'MPS123ABC',
                transactionDate: '20260506141500',
            }),
        });

        expect(cb).toHaveBeenCalledWith({
            status: 'completed',
            mpesaReceiptNumber: 'MPS123ABC',
            transactionDate: '20260506141500',
        });
    });

    it('forwards failed status to the callback so the UI can show a real error', () => {
        let snapshotHandler: ((snap: unknown) => void) | null = null;
        mockOnSnapshot.mockImplementation((_ref, handler) => {
            snapshotHandler = handler as (snap: unknown) => void;
            return () => undefined;
        });
        mockDoc.mockReturnValue({ __ref: 'payment_requests/idem-z' });

        const subscribe = loadSubscribe();
        const cb = jest.fn();
        subscribe('idem-z', cb);

        snapshotHandler!({
            exists: () => true,
            data: () => ({ status: 'failed' }),
        });

        expect(cb).toHaveBeenCalledWith({
            status: 'failed',
            mpesaReceiptNumber: undefined,
            transactionDate: undefined,
        });
    });

    it('does not call the callback for non-existent documents', () => {
        let snapshotHandler: ((snap: unknown) => void) | null = null;
        mockOnSnapshot.mockImplementation((_ref, handler) => {
            snapshotHandler = handler as (snap: unknown) => void;
            return () => undefined;
        });
        mockDoc.mockReturnValue({ __ref: 'payment_requests/idem-missing' });

        const subscribe = loadSubscribe();
        const cb = jest.fn();
        subscribe('idem-missing', cb);

        snapshotHandler!({
            exists: () => false,
            data: () => undefined,
        });

        expect(cb).not.toHaveBeenCalled();
    });
});
