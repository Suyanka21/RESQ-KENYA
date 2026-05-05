/**
 * Pure cryptographic helpers used by the M-Pesa callback HMAC flow.
 * Lives in `shared/` (no firebase-* imports) so the helpers can be unit
 * tested directly.
 *
 * Skills: Security-and-Hardening (constant-time comparison, dedicated
 * HMAC secret), Source-Driven-Development (Node.js crypto.createHmac
 * documentation: https://nodejs.org/api/crypto.html#cryptocreatehmacalgorithm-key-options).
 */

import * as crypto from 'crypto';

export function signCallbackToken(
    requestId: string,
    amount: number,
    secret: string
): string {
    const mac = crypto.createHmac('sha256', secret);
    mac.update(`${requestId}:${Math.round(amount)}`);
    return mac.digest('hex').slice(0, 32);
}

export function verifyCallbackToken(
    requestId: string,
    amount: number,
    received: string,
    secret: string
): boolean {
    const expected = signCallbackToken(requestId, amount, secret);
    if (expected.length !== received.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

/** Generate a deterministic SHA256 ID from `${userId}:${idempotencyKey}`. */
export function idempotencyDocId(userId: string, idempotencyKey: string): string {
    return crypto
        .createHash('sha256')
        .update(`${userId}:${idempotencyKey}`)
        .digest('hex')
        .slice(0, 32);
}
