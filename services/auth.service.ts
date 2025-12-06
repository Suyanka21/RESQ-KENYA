// ResQ Kenya - Authentication Service
// Firebase Phone Authentication for Kenya (+254)

import {
    signInWithPhoneNumber,
    PhoneAuthProvider,
    signInWithCredential,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User,
    ConfirmationResult,
    RecaptchaVerifier
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { User as ResQUser } from '../types';

// Store verification result globally for OTP verification
let confirmationResult: ConfirmationResult | null = null;

/**
 * Format phone number to international format
 */
export function formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Handle different input formats
    if (cleaned.startsWith('254')) {
        return '+' + cleaned;
    }
    if (cleaned.startsWith('0')) {
        return '+254' + cleaned.slice(1);
    }
    // Assume it's just the 9 digits without prefix
    return '+254' + cleaned;
}

/**
 * Send OTP to phone number
 * @param phoneNumber - Phone number in any Kenya format
 * @param recaptchaContainerId - ID of the recaptcha container element (for web)
 */
export async function sendOTP(
    phoneNumber: string,
    recaptchaContainerId?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const formattedPhone = formatPhoneNumber(phoneNumber);

        console.log('Sending OTP to:', formattedPhone);

        // For web, we need RecaptchaVerifier
        // Note: For React Native, we'll need to use a different approach
        if (typeof window !== 'undefined' && recaptchaContainerId) {
            const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
                size: 'invisible',
                callback: () => {
                    console.log('Recaptcha verified');
                },
                'expired-callback': () => {
                    console.log('Recaptcha expired');
                }
            });

            confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
        } else {
            // For testing without recaptcha (will fail in production)
            // In a real app, you'd need to handle this differently for mobile
            console.warn('No recaptcha verifier provided - this will fail on web');

            // For development/testing, we can use test phone numbers in Firebase Console
            // Or implement Firebase App Check
            throw new Error('Recaptcha verification required for web. Use test phone numbers in Firebase Console for development.');
        }

        return { success: true };
    } catch (error: any) {
        console.error('Send OTP error:', error);
        return {
            success: false,
            error: error.message || 'Failed to send OTP'
        };
    }
}

/**
 * Verify OTP code
 * @param code - 6-digit OTP code
 */
export async function verifyOTP(
    code: string
): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
        if (!confirmationResult) {
            throw new Error('No OTP request pending. Please request OTP first.');
        }

        const result = await confirmationResult.confirm(code);
        const user = result.user;

        // Create or update user profile in Firestore
        await createUserProfile(user);

        // Clear confirmation result
        confirmationResult = null;

        return { success: true, user };
    } catch (error: any) {
        console.error('Verify OTP error:', error);
        return {
            success: false,
            error: error.code === 'auth/invalid-verification-code'
                ? 'Invalid code. Please try again.'
                : error.message
        };
    }
}

/**
 * Create user profile in Firestore on first login
 */
async function createUserProfile(user: User): Promise<void> {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        // First time user - create profile
        const userData: Partial<ResQUser> = {
            id: user.uid,
            phoneNumber: user.phoneNumber || '',
            displayName: '',
            membership: 'basic',
            loyaltyPoints: 0,
            vehicles: [],
            emergencyContacts: [],
            savedLocations: [],
        };

        await setDoc(userRef, {
            ...userData,
            createdAt: serverTimestamp(),
        });

        console.log('Created new user profile:', user.uid);
    } else {
        console.log('User profile already exists:', user.uid);
    }
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(userId: string): Promise<ResQUser | null> {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return { id: userSnap.id, ...userSnap.data() } as ResQUser;
        }
        return null;
    } catch (error) {
        console.error('Get user profile error:', error);
        return null;
    }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
    await firebaseSignOut(auth);
    confirmationResult = null;
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): User | null {
    return auth.currentUser;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
}

/**
 * Check if user is provider (has provider profile)
 */
export async function checkIsProvider(userId: string): Promise<boolean> {
    try {
        const providerRef = doc(db, 'providers', userId);
        const providerSnap = await getDoc(providerRef);
        return providerSnap.exists();
    } catch (error) {
        console.error('Check provider error:', error);
        return false;
    }
}
