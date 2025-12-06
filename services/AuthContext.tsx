// ResQ Kenya - Auth Context Provider
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, getUserProfile, signOut as authSignOut, checkIsProvider } from '../services/auth.service';
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
        // Subscribe to auth state changes
        const unsubscribe = onAuthChange(async (firebaseUser: User | null) => {
            if (firebaseUser) {
                // User is signed in
                const [userProfile, isProvider] = await Promise.all([
                    getUserProfile(firebaseUser.uid),
                    checkIsProvider(firebaseUser.uid),
                ]);

                setAuthState({
                    user: userProfile,
                    provider: null, // Load provider profile if needed
                    isAuthenticated: true,
                    isLoading: false,
                    userRole: isProvider ? 'provider' : 'customer',
                });
            } else {
                // User is signed out
                setAuthState({
                    user: null,
                    provider: null,
                    isAuthenticated: false,
                    isLoading: false,
                    userRole: null,
                });
            }
        });

        return () => unsubscribe();
    }, []);

    const handleSignOut = async () => {
        await authSignOut();
    };

    const refreshUserProfile = async () => {
        const currentUser = authState.user;
        if (currentUser?.id) {
            const profile = await getUserProfile(currentUser.id);
            if (profile) {
                setAuthState(prev => ({ ...prev, user: profile }));
            }
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
