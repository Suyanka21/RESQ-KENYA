// ResQ Kenya - Auth Context Provider
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, getUserProfile, signOut as authSignOut, checkIsProvider } from '../services/auth.service';
import { getProvider } from '../services/firestore.service';
import { clearFcmToken } from '../services/fcmToken.service';
import { registerForPushNotifications } from '../services/notification.service';
import type { User as ResQUser, Provider, AuthState } from '../types';

interface AuthContextType extends AuthState {
    signOut: () => Promise<void>;
    refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        provider: null,
        isAuthenticated: false,
        isLoading: true,
        userRole: null,
    });

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        
        try {
            unsubscribe = onAuthChange(async (firebaseUser: User | null) => {
                try {
                    if (firebaseUser) {
                        // Phase 4 (audit-v3 §AUTH-WIRE) — actually load
                        // the Provider doc when the user has one. The
                        // previous code hard-coded `provider: null`,
                        // which made every provider screen render
                        // empty/zero state (provider?.earnings,
                        // provider?.serviceTypes, provider?.vehicle,
                        // provider?.displayName) regardless of the
                        // real backing data in Firestore. Both reads
                        // are issued in parallel with the user
                        // profile, then the role is derived from
                        // whichever returned a doc.
                        const [userProfile, providerProfile] = await Promise.all([
                            getUserProfile(firebaseUser.uid),
                            getProvider(firebaseUser.uid),
                        ]);

                        // Defensive fallback — if getProvider() somehow
                        // failed but the legacy boolean check still
                        // returns true, route to provider chrome so
                        // the user isn't trapped in customer surfaces.
                        const isProviderRole = providerProfile !== null
                            ? true
                            : await checkIsProvider(firebaseUser.uid);

                        setAuthState({
                            user: userProfile,
                            provider: providerProfile,
                            isAuthenticated: true,
                            isLoading: false,
                            userRole: isProviderRole ? 'provider' : 'customer',
                        });

                        // Phase 4 (audit-v3 §AUTH-WIRE) — register the
                        // device's push token via the owned callable so
                        // live users receive request_accepted /
                        // provider_enroute / new_request pushes from
                        // Cloud Functions. Fire-and-forget: the auth
                        // flow must not block on push registration
                        // (which fails on simulator / web / no perms).
                        void registerForPushNotifications();
                    } else {
                        setAuthState({
                            user: null,
                            provider: null,
                            isAuthenticated: false,
                            isLoading: false,
                            userRole: null,
                        });
                    }
                } catch (error) {
                    console.error('Error loading user profile:', error);
                    setAuthState({
                        user: null,
                        provider: null,
                        isAuthenticated: false,
                        isLoading: false,
                        userRole: null,
                    });
                }
            });
        } catch (error) {
            console.error('Error initializing auth listener:', error);
            setAuthState({
                user: null,
                provider: null,
                isAuthenticated: false,
                isLoading: false,
                userRole: null,
            });
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    const handleSignOut = async () => {
        // Phase 4 (audit-v2 §N-MED-8) — clear the server-stored FCM
        // token BEFORE we drop the auth session. After signOut the
        // callable would reject as unauthenticated, leaving this
        // device's token attached to the next user that signs in
        // here (a confidentiality leak).
        await clearFcmToken();
        await authSignOut();
    };

    const refreshUserProfile = async () => {
        const currentUser = authState.user;
        if (currentUser?.id) {
            // Refresh BOTH the user and provider docs together so a
            // newly-onboarded provider (or one who just updated their
            // service types / vehicle) sees the fresh data without
            // having to sign out and back in.
            const [profile, providerProfile] = await Promise.all([
                getUserProfile(currentUser.id),
                getProvider(currentUser.id),
            ]);
            setAuthState(prev => ({
                ...prev,
                user: profile ?? prev.user,
                provider: providerProfile ?? prev.provider,
            }));
        }
    };

    return (
        <AuthContext.Provider value={{ ...authState, signOut: handleSignOut, refreshUserProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
