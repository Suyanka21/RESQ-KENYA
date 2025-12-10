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
        let unsubscribe: (() => void) | undefined;
        
        try {
            unsubscribe = onAuthChange(async (firebaseUser: User | null) => {
                try {
                    if (firebaseUser) {
                        const [userProfile, isProvider] = await Promise.all([
                            getUserProfile(firebaseUser.uid),
                            checkIsProvider(firebaseUser.uid),
                        ]);

                        setAuthState({
                            user: userProfile,
                            provider: null,
                            isAuthenticated: true,
                            isLoading: false,
                            userRole: isProvider ? 'provider' : 'customer',
                        });
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
