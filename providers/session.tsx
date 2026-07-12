"use client";

// Provides the active session state to the entire component tree.
// On mount, calls checkSession() to verify the session and load the profile and permissions.
// Caches a lightweight profile snapshot and permissions JSON in sessionStorage to avoid
// redundant server calls on subsequent renders. Cache is invalidated on refetch().

import { createContext, useState, useEffect, type ReactNode, useContext, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { AUTH_STATE_CHANGED_EVENT } from '@/core/auth/events';
import {
    getSessionData,
    deleteSessionData,
    PROFILE_INFO_KEY,
    JWT_KEY,
} from '@/core/auth/storage';

type UserProfile = {
    firstName?: string;
    lastName?: string;
    neupId?: string;
    accountType?: string;
    [key: string]: unknown;
};

type SessionState = {
    loading: boolean;
    profile: UserProfile | null;
    permissions: string[] | null;
    accountId: string | null;
    personalAccountId: string | null;
    isManaging: boolean; // true when the active account differs from the personal account
    refetch: () => void;
};

const SessionContext = createContext<SessionState | undefined>(undefined);

// Hook to consume the session context. Must be used inside a SessionProvider.
export function useSession() {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}

export const SessionProvider = ({ children }: { children: ReactNode }) => {
    const searchParams = useSearchParams();
    const workingProfileId = searchParams.get('workingProfile');
    const workingProfileRef = useRef<string | null>(workingProfileId);
    const [sessionState, setSessionState] = useState<SessionState>({
        loading: true,
        profile: null,
        permissions: null,
        accountId: null,
        personalAccountId: null,
        isManaging: false,
        refetch: () => {},
    });
    const fetchDataRef = useRef<(forceRefresh?: boolean) => Promise<void>>(async () => {});

    fetchDataRef.current = async (forceRefresh = false) => {
        setSessionState(s => ({ ...s, loading: true }));

        const cachedProfile = getSessionData(PROFILE_INFO_KEY);
        const cachedPermissions = getSessionData(JWT_KEY);
        let permissions: unknown = [];
        if (typeof cachedPermissions === 'string') {
            try {
                permissions = JSON.parse(cachedPermissions || '[]');
            } catch {
                permissions = [];
            }
        }

        setSessionState({
            loading: false,
            profile: forceRefresh ? cachedProfile : (cachedProfile ?? sessionState.profile),
            permissions: Array.isArray(permissions) ? permissions : [],
            accountId: workingProfileId,
            personalAccountId: null,
            isManaging: Boolean(workingProfileId),
            refetch: () => fetchDataRef.current(true),
        });
    };

    // Clears the sessionStorage cache and forces a full re-fetch from the server.
    const clearCacheAndRefetch = () => {
        deleteSessionData();
        void fetchDataRef.current(true);
    };

    useEffect(() => {
        void fetchDataRef.current();

        const handleAuthStateChanged = () => {
            clearCacheAndRefetch();
        };

        window.addEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthStateChanged);

        return () => {
            window.removeEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthStateChanged);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (workingProfileRef.current === workingProfileId) {
            return;
        }

        workingProfileRef.current = workingProfileId;
        clearCacheAndRefetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workingProfileId]);

    return (
        <SessionContext.Provider value={{ ...sessionState, refetch: clearCacheAndRefetch }}>
            {children}
        </SessionContext.Provider>
    );
};
