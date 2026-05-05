/**
 * Shared API Contracts (Phase 2 — Contract Stabilization)
 *
 * Single source of truth for the request/response shapes shared between the
 * React Native client (`services/`) and the Cloud Functions backend
 * (`functions/src/`).
 *
 * Skills applied:
 *   - API-and-Interface-Design: discriminated `CallResult` envelope, additive
 *     fields only, validation at boundary.
 *   - Source-Driven-Development: matches Firebase Callable Functions
 *     contract documented at https://firebase.google.com/docs/functions/callable.
 *
 * Rules:
 *   1. Every callable returns `CallResult<T,E>`. Old callables that still
 *      return `{ success: boolean }` are wrapped or migrated, never both.
 *   2. Adding a new field is allowed; renaming or removing a field is a
 *      breaking change and requires a `v2` namespace.
 *   3. `idempotencyKey` is required on any callable that mutates state with a
 *      cost (creating a request, charging a wallet, debiting M-Pesa).
 */

import type { ServiceType } from '../theme/voltage-premium';

/* ──────────────────────────── Envelope ──────────────────────────── */

/**
 * Discriminated-union response envelope. Use the `ok` field to narrow.
 *
 * @example
 *   const result: CallResult<{ requestId: string }, 'duplicate' | 'invalid_quote'> = await fn();
 *   if (result.ok) {
 *       console.log(result.data.requestId);
 *   } else if (result.errorCode === 'duplicate') {
 *       // …
 *   }
 */
export type CallResult<T, E extends string = string> =
    | { ok: true; data: T }
    | { ok: false; errorCode: E; message: string };

/** Standard error codes that any callable may return. */
export type CommonErrorCode =
    | 'unauthenticated'
    | 'invalid_argument'
    | 'permission_denied'
    | 'not_found'
    | 'already_exists'
    | 'failed_precondition'
    | 'rate_limited'
    | 'internal';

/* ───────────────── createServiceRequest contract ───────────────── */

/**
 * Geographic coordinates expressed in WGS-84 decimal degrees.
 * Latitude in [-90, 90]; longitude in [-180, 180].
 */
export interface ApiGeoLocation {
    latitude: number;
    longitude: number;
}

export interface CustomerLocationInput {
    coordinates: ApiGeoLocation;
    /** Human-readable street address (max 256 chars). */
    address: string;
    /** Optional landmark to help the provider find the customer. */
    landmark?: string;
    /** Optional special instructions for the provider. */
    instructions?: string;
}

/**
 * Pricing snapshot supplied by the legacy client. Prefer `quoteId` for new
 * call sites — when both are present, `quoteId` wins after server validation.
 *
 * @deprecated New clients should send `quoteId` only and let the server
 *   resolve pricing from `price_quotes/{quoteId}`.
 */
export interface PricingInput {
    baseServiceFee: number;
    distanceFee?: number;
    additionalCharges?: number;
    platformFee?: number;
    total: number;
}

export interface CreateServiceRequestInput {
    serviceType: ServiceType;
    customerLocation: CustomerLocationInput;
    serviceDetails?: Record<string, unknown>;
    /**
     * Server-validated quote id from `getPriceQuote`. Required for new
     * clients; if absent, the request is allowed but a one-shot warning is
     * logged so we can track legacy clients.
     */
    quoteId?: string;
    /**
     * Client-generated UUID for de-duplication. The server stores it on the
     * request document so retries with the same key return the same id.
     * Recommended formats: RFC 4122 UUID v4 or any 32-char ULID.
     */
    idempotencyKey: string;
    /** Legacy client-side pricing snapshot. See `PricingInput` deprecation. */
    pricing?: PricingInput;
}

export type CreateServiceRequestErrorCode =
    | CommonErrorCode
    | 'invalid_quote'
    | 'quote_expired'
    | 'duplicate';

export type CreateServiceRequestOutput = CallResult<
    { requestId: string },
    CreateServiceRequestErrorCode
>;

/* ─────────────────── Helpers (pure, no I/O) ─────────────────── */

/** Build a success envelope. */
export function ok<T>(data: T): { ok: true; data: T } {
    return { ok: true, data };
}

/** Build an error envelope. Message is end-user-safe. */
export function err<E extends string>(
    errorCode: E,
    message: string
): { ok: false; errorCode: E; message: string } {
    return { ok: false, errorCode, message };
}

/** Type guard for narrowing a `CallResult` to its success branch. */
export function isOk<T, E extends string>(
    result: CallResult<T, E>
): result is { ok: true; data: T } {
    return result.ok === true;
}

/**
 * Validate that an idempotency key is well-formed. Accepts:
 *   - any RFC 4122 v4 UUID, or
 *   - any 16–64 char alphanumeric/dash/underscore string (covers ULIDs and
 *     custom client formats).
 *
 * Rejects empty strings, control characters, whitespace.
 */
export function isValidIdempotencyKey(key: unknown): key is string {
    if (typeof key !== 'string') return false;
    if (key.length < 16 || key.length > 64) return false;
    return /^[A-Za-z0-9_-]+$/.test(key);
}

/**
 * Validate that a coordinate pair is within the valid WGS-84 range.
 * Returns `true` for finite numbers in [-90,90] / [-180,180].
 */
export function isValidCoordinates(loc: unknown): loc is ApiGeoLocation {
    if (!loc || typeof loc !== 'object') return false;
    const candidate = loc as Partial<ApiGeoLocation>;
    if (typeof candidate.latitude !== 'number' || !Number.isFinite(candidate.latitude)) return false;
    if (typeof candidate.longitude !== 'number' || !Number.isFinite(candidate.longitude)) return false;
    if (candidate.latitude < -90 || candidate.latitude > 90) return false;
    if (candidate.longitude < -180 || candidate.longitude > 180) return false;
    return true;
}

/** Allow-listed service types. Used by both client and server validation. */
export const VALID_SERVICE_TYPES: readonly ServiceType[] = [
    'towing',
    'tire',
    'battery',
    'fuel',
    'diagnostics',
    'ambulance',
] as const;

export function isValidServiceType(value: unknown): value is ServiceType {
    return typeof value === 'string' && (VALID_SERVICE_TYPES as readonly string[]).includes(value);
}
