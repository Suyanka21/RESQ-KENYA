/**
 * Shared API contracts (functions side mirror of `types/api.ts`).
 *
 * The Cloud Functions package has its own `tsconfig.json` and is built
 * separately from the React Native app. To avoid a circular dependency
 * across `node_modules`, we duplicate the contract here. Whenever
 * `types/api.ts` changes the same change must land here.
 *
 * Skills: API-and-Interface-Design (one-version rule, additive fields).
 */

export type ServiceType =
    | 'towing'
    | 'tire'
    | 'battery'
    | 'fuel'
    | 'diagnostics'
    | 'ambulance';

export type CallResult<T, E extends string = string> =
    | { ok: true; data: T }
    | { ok: false; errorCode: E; message: string };

export type CommonErrorCode =
    | 'unauthenticated'
    | 'invalid_argument'
    | 'permission_denied'
    | 'not_found'
    | 'already_exists'
    | 'failed_precondition'
    | 'rate_limited'
    | 'internal';

export interface ApiGeoLocation {
    latitude: number;
    longitude: number;
}

export interface CustomerLocationInput {
    coordinates: ApiGeoLocation;
    address: string;
    landmark?: string;
    instructions?: string;
}

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
    quoteId?: string;
    idempotencyKey: string;
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

export function ok<T>(data: T): { ok: true; data: T } {
    return { ok: true, data };
}

export function err<E extends string>(
    errorCode: E,
    message: string
): { ok: false; errorCode: E; message: string } {
    return { ok: false, errorCode, message };
}

export function isValidIdempotencyKey(key: unknown): key is string {
    if (typeof key !== 'string') return false;
    if (key.length < 16 || key.length > 64) return false;
    return /^[A-Za-z0-9_-]+$/.test(key);
}

export function isValidCoordinates(loc: unknown): loc is ApiGeoLocation {
    if (!loc || typeof loc !== 'object') return false;
    const candidate = loc as Partial<ApiGeoLocation>;
    if (typeof candidate.latitude !== 'number' || !Number.isFinite(candidate.latitude)) return false;
    if (typeof candidate.longitude !== 'number' || !Number.isFinite(candidate.longitude)) return false;
    if (candidate.latitude < -90 || candidate.latitude > 90) return false;
    if (candidate.longitude < -180 || candidate.longitude > 180) return false;
    return true;
}

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
