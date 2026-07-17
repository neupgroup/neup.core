"use client";

/*
::neup.documentation::core-session-provider
::title Core Session Provider

Client session provider and hook for the account app shell.

::public

This module exposes `SessionProvider` and `useSession()` so client components can read the current signed-in profile, permissions, and active-account state.

::public end

::private

The provider hydrates from the server-side account session check, caches the lightweight profile snapshot in browser storage, and refetches whenever auth state or the `workingProfile` query changes.

::private end

::end
*/

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { AUTH_STATE_CHANGED_EVENT } from '@/inapp/auth/events';
import {
  deleteSessionData,
  getSessionData,
  JWT_KEY,
  PROFILE_INFO_KEY,
  setSessionData,
} from '@/inapp/auth/storage';
import { checkSession } from '@/services/account/check';
import { type UserProfile, getUserProfile as fetchUserProfile } from '@/services/user';

type SessionState = {
  loading: boolean;
  profile: UserProfile | null;
  permissions: string[] | null;
  accountId: string | null;
  personalAccountId: string | null;
  isManaging: boolean;
  refetch: () => void;
};

const SessionContext = createContext<SessionState | undefined>(undefined);

export function useSession(): SessionState {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }

  return context;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const workingProfileId = searchParams.get('workingProfile');
  const workingProfileRef = useRef<string | null>(workingProfileId);
  const fetchDataRef = useRef<(forceRefresh?: boolean) => Promise<void>>(async () => {});
  const [sessionState, setSessionState] = useState<SessionState>({
    loading: true,
    profile: null,
    permissions: null,
    accountId: null,
    personalAccountId: null,
    isManaging: false,
    refetch: () => {},
  });

  fetchDataRef.current = async (forceRefresh = false) => {
    setSessionState((currentState) => ({ ...currentState, loading: true }));

    const result = await checkSession(workingProfileId);

    if (!result.valid) {
      deleteSessionData();
      setSessionState((currentState) => ({
        ...currentState,
        loading: false,
        profile: null,
        permissions: [],
      }));
      return;
    }

    const cachedProfile = getSessionData(PROFILE_INFO_KEY);
    const profileChanged =
      !cachedProfile ||
      cachedProfile.firstName !== result.profileInfo.firstName ||
      cachedProfile.lastName !== result.profileInfo.lastName ||
      cachedProfile.neupId !== result.profileInfo.neupId ||
      cachedProfile.accountType !== result.profileInfo.accountType ||
      cachedProfile.accountPhoto !== result.profileInfo.accountPhoto;

    if (profileChanged) {
      setSessionData(PROFILE_INFO_KEY, result.profileInfo);
    }

    const cachedPermissions = getSessionData(JWT_KEY);
    const freshPermissionsJson = JSON.stringify(result.permissions);
    if (cachedPermissions !== freshPermissionsJson) {
      setSessionData(JWT_KEY, freshPermissionsJson);
    }

    let fullProfile: UserProfile | null = sessionState.profile;
    if (forceRefresh || profileChanged || !fullProfile) {
      fullProfile = await fetchUserProfile(result.accountId);
    }

    setSessionState({
      loading: false,
      profile: fullProfile,
      permissions: result.permissions,
      accountId: result.accountId,
      personalAccountId: result.personalAccountId,
      isManaging: result.accountId !== result.personalAccountId,
      refetch: () => fetchDataRef.current(true),
    });
  };

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
  }, []);

  useEffect(() => {
    if (workingProfileRef.current === workingProfileId) {
      return;
    }

    workingProfileRef.current = workingProfileId;
    clearCacheAndRefetch();
  }, [workingProfileId]);

  return (
    <SessionContext.Provider value={{ ...sessionState, refetch: clearCacheAndRefetch }}>
      {children}
    </SessionContext.Provider>
  );
}
