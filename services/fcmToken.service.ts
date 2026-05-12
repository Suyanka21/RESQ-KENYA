/**
 * Phase 4 (audit-v2 §N-MED-8) — Client wrapper for the owned
 * `fcmToken` write path.
 *
 * The client never writes `users/{uid}.fcmToken` directly anymore;
 * it goes through the `setFcmToken` callable so the server enforces
 * ownership and validation. Failures are logged but do not throw —
 * push notifications are nice-to-have, not load-bearing.
 *
 * Skills: API-and-Interface-Design (typed wrapper mirroring
 * functions/src/users/fcmToken.ts), Security-and-Hardening (clears
 * the token on sign-out so a previous device cannot continue
 * receiving the next signed-in user's pushes).
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../config/firebase';

const functions = getFunctions(app, 'us-central1');

interface SetFcmTokenInput {
    token: string | null;
}

interface SetFcmTokenResult {
    success: true;
    cleared: boolean;
}

const callable = httpsCallable<SetFcmTokenInput, SetFcmTokenResult>(
    functions,
    'setFcmToken'
);

/**
 * Push a new FCM token to the server.
 * Returns true on success, false on any failure.
 */
export async function pushFcmToken(token: string): Promise<boolean> {
    try {
        const result = await callable({ token });
        return result.data.success === true;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown';
        console.warn('[fcm] pushFcmToken failed:', message);
        return false;
    }
}

/**
 * Clear the FCM token server-side. Call from `signOut()` so the
 * previous device stops receiving the next user's pushes.
 */
export async function clearFcmToken(): Promise<void> {
    try {
        await callable({ token: null });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown';
        console.warn('[fcm] clearFcmToken failed:', message);
    }
}
