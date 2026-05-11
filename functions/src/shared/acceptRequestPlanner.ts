/**
 * Phase 4 (audit-v2 §N-HIGH-9) — `acceptServiceRequest` invariant planner.
 *
 * The original `acceptServiceRequest` callable interleaved five invariant
 * checks with the Firestore transaction body. That meant the invariant
 * logic was effectively untestable without a real emulator harness — and
 * the audit's documented worst case (a future regression that re-introduces
 * a missing gate) would not be caught by CI.
 *
 * This module extracts the **pure decision** from the transaction:
 *   - Input: the request + provider doc data (already read inside the
 *     callable's `runTransaction`), the callerId, the requestId.
 *   - Output: either `{kind:'accept', requestUpdate, providerUpdate}` or
 *     `{kind:'reject', code, message}`.
 *
 * The live callable still wraps this planner in a transaction so the
 * accept→pin write is atomic — the planner only DECIDES, it never reads
 * or writes Firestore itself.
 *
 * Skills: Code-Simplification (single-responsibility split — pure
 * decision separated from side effects), Test-Driven-Development (the
 * five invariants now have a 1:1 unit test each), Code-Review-and-Quality
 * (named codes / messages match the original `HttpsError` so wire-level
 * behaviour is byte-identical), Security-and-Hardening (every invariant
 * mapped to an explicit reject path; default-deny if anything is
 * unrecognized).
 *
 * Confidence: CONFIRMED — the planner mirrors the existing live invariant
 * check order exactly. Tests against this module exercise the same
 * branches the production callable runs.
 */

export type AcceptRequestRejectionCode =
    | 'unauthenticated'        // no auth context
    | 'invalid-argument'       // missing/invalid requestId
    | 'not-found'              // request doc does not exist
    | 'permission-denied'      // caller has no provider doc
    | 'already-assigned'       // request status !== 'pending'
    | 'not-verified'           // provider.verificationStatus !== 'verified'
    | 'not-online'             // provider.availability.isOnline !== true
    | 'service-type-mismatch'  // provider.serviceTypes lacks this serviceType
    | 'already-busy';          // provider.availability.currentRequestId set

export interface AcceptRequestRejection {
    kind: 'reject';
    code: AcceptRequestRejectionCode;
    message: string;
}

/**
 * The plan's positive outcome carries the two Firestore patches the
 * callable should write inside the same transaction. Patches use raw
 * field-path strings so the caller can pass them straight to
 * `transaction.update`. `acceptedAtSentinel` is a deferred marker the
 * caller resolves to `FieldValue.serverTimestamp()` — kept opaque here
 * so the planner has no admin SDK dependency.
 */
export interface AcceptRequestAcceptance {
    kind: 'accept';
    requestUpdate: {
        providerId: string;
        status: 'accepted';
        acceptedAtSentinel: 'server-timestamp';
        updatedAtSentinel: 'server-timestamp';
    };
    providerUpdate: {
        'availability.currentRequestId': string;
    };
}

export type AcceptRequestPlan = AcceptRequestAcceptance | AcceptRequestRejection;

/**
 * Minimal duck-typed slice of the request doc the planner needs.
 * Anything else lives on the doc but is irrelevant to invariant
 * enforcement.
 */
export interface RequestSlice {
    status?: unknown;
    serviceType?: unknown;
}

/**
 * Minimal duck-typed slice of the provider doc the planner needs.
 */
export interface ProviderSlice {
    verificationStatus?: unknown;
    serviceTypes?: unknown;
    availability?: {
        isOnline?: unknown;
        currentRequestId?: unknown;
    };
}

export interface AcceptRequestInput {
    requestId: string;
    providerId: string;
    request: RequestSlice | null;
    provider: ProviderSlice | null;
}

/**
 * Apply the five invariants from `acceptServiceRequest` in the same
 * order the live callable runs them. Return the first failure, or a
 * positive acceptance plan if all five pass.
 *
 * Order matters for backward compatibility — clients rely on which
 * `HttpsError` they get for telemetry / UI branching.
 */
export function planAcceptServiceRequest(input: AcceptRequestInput): AcceptRequestPlan {
    const { requestId, providerId, request, provider } = input;

    // Boundary: callable enforces these before invoking the planner.
    if (typeof requestId !== 'string' || requestId.length === 0) {
        return { kind: 'reject', code: 'invalid-argument', message: 'requestId is required' };
    }
    if (typeof providerId !== 'string' || providerId.length === 0) {
        return { kind: 'reject', code: 'unauthenticated', message: 'User must be authenticated' };
    }

    if (request === null) {
        return { kind: 'reject', code: 'not-found', message: 'Request not found' };
    }
    if (provider === null) {
        return {
            kind: 'reject',
            code: 'permission-denied',
            message: 'Caller is not registered as a provider',
        };
    }

    // (5) Request must still be pending.
    if (request.status !== 'pending') {
        return { kind: 'reject', code: 'already-assigned', message: 'Request already assigned' };
    }

    // (1) Verification gate.
    if (provider.verificationStatus !== 'verified') {
        return { kind: 'reject', code: 'not-verified', message: 'Provider is not verified' };
    }

    // (2) Online gate.
    const availability = provider.availability ?? {};
    if (availability.isOnline !== true) {
        return { kind: 'reject', code: 'not-online', message: 'Provider is not online' };
    }

    // (3) Service-type gate.
    const serviceTypes = Array.isArray(provider.serviceTypes)
        ? (provider.serviceTypes as unknown[])
        : [];
    if (!serviceTypes.includes(request.serviceType)) {
        return {
            kind: 'reject',
            code: 'service-type-mismatch',
            message: 'Provider does not offer this service type',
        };
    }

    // (4) Idle gate — reject if already on another job.
    const current = availability.currentRequestId;
    if (typeof current === 'string' && current.length > 0 && current !== requestId) {
        return {
            kind: 'reject',
            code: 'already-busy',
            message: 'Provider already has an active request',
        };
    }

    return {
        kind: 'accept',
        requestUpdate: {
            providerId,
            status: 'accepted',
            acceptedAtSentinel: 'server-timestamp',
            updatedAtSentinel: 'server-timestamp',
        },
        providerUpdate: {
            'availability.currentRequestId': requestId,
        },
    };
}
