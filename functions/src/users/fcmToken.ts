/**
 * Phase 4 (audit-v2 §N-MED-8) — Owned `fcmToken` write path.
 *
 * Pre-fix: `requests.ts:577-578` (now line ~600) pulls
 * `users/{uid}.fcmToken` to send status-update notifications, but
 * there was no canonical server-side write path. Clients wrote
 * directly via the (formerly permissive) `users` rule. Consequences:
 *   - A logout-from-device-A left device-A's token on the user doc
 *     until device-B logs in, so the next push lit device-A by
 *     mistake (a confidentiality leak).
 *   - The field had no validation; a corrupted string broke FCM
 *     silently.
 *
 * This callable owns the field. The client calls `setFcmToken({ token })`
 * on login / token refresh and `setFcmToken({ token: null })` on
 * sign-out. Combined with the tightened `users` allow_update rule
 * (Phase 3 N-HIGH-2), the field is now server-authoritative.
 *
 * Skills: API-and-Interface-Design (single canonical write path,
 * typed in/out, fail-closed on missing auth), Security-and-Hardening
 * (input validation; field allow-list), Code-Simplification (callers
 * don't need to know the underlying field path).
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();

export interface SetFcmTokenInput {
    /** New token, or null to clear (used by signOut). */
    token: string | null;
}

export interface SetFcmTokenResult {
    success: true;
    cleared: boolean;
}

/**
 * FCM tokens have no documented format guarantee. Google explicitly
 * advises against pattern-validation of the registration token
 * (https://firebase.google.com/docs/cloud-messaging/manage-tokens):
 *
 *   "The format may change in the future; please do not validate
 *    this input against any pattern, as this may cause your app to
 *    break if this happens."
 *
 * CodeRabbit feedback (PR #9): the previous regex
 * (`/^[A-Za-z0-9_\-:]+$/`) would reject any future token containing
 * `.`, `/`, `+`, or `=` (all plausible for base64/JWT-like
 * encodings), silently dropping push notifications for affected
 * clients. We keep the length + type check (defensive) and drop the
 * character-set assertion.
 *
 * Skills: Source-Driven Development (cite Google's guidance),
 * TRUSTLESS-AUDITOR (silent FCM drops are exactly the "real user,
 * no recovery path" scenario).
 */
function isValidFcmToken(value: string): boolean {
    return value.length >= 32 && value.length <= 4096;
}

export const setFcmToken = functions.https.onCall(
    async (data: unknown, context): Promise<SetFcmTokenResult> => {
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User must be authenticated to set the FCM token'
            );
        }

        const input = (data ?? {}) as Partial<SetFcmTokenInput>;
        const userId = context.auth.uid;
        const userRef = db.collection('users').doc(userId);

        // Clear path: token === null OR token === '' both clear.
        if (input.token === null || input.token === '') {
            await userRef.update({
                fcmToken: admin.firestore.FieldValue.delete(),
                fcmTokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return { success: true, cleared: true };
        }

        if (typeof input.token !== 'string' || !isValidFcmToken(input.token)) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'token must be a valid FCM token string or null to clear'
            );
        }

        await userRef.update({
            fcmToken: input.token,
            fcmTokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { success: true, cleared: false };
    }
);
