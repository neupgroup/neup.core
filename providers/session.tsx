"use client";

/*
::neup.documentation::core-session-provider
::title Core Session Provider

Client session provider and hook for the app shell.

::public

This module exposes `SessionProvider` and `useSession()` so client components can read and update the current account display state.

::public end

::private

The provider accepts the server-rendered account snapshot from the root layout, caches it in session storage for client navigation, and can refresh from `/bridge/api.v1/auth/me` without importing service-layer modules into `core`.

::private end

::end
*/

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { APP_BASE_PATH } from "@/core/appconfig";

export type SessionUser = {
  accountId?: string | null;
  neupId?: string | null;
  displayName?: string | null;
  displayImage?: string | null;
  accountType?: string | null;
  verified?: boolean | null;
  workingProfile?: string | null;
  workingProfileDisplayName?: string | null;
};

type SessionState = {
  loading: boolean;
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
  updateUser: (updates: Partial<SessionUser>) => void;
  refetch: () => Promise<void>;
};

const SESSION_KEY = "neup_user";
const SESSION_ENDPOINT = `${APP_BASE_PATH}/bridge/api.v1/auth/me`;

const SessionContext = createContext<SessionState | undefined>(undefined);

export function save<T>(variableName: string, value: T | null | undefined) {
  if (typeof window === "undefined") return;

  try {
    if (value === null || value === undefined) {
      window.sessionStorage.removeItem(variableName);
      return;
    }

    window.sessionStorage.setItem(variableName, JSON.stringify(value));
  } catch {
    // Session storage is an optimization only.
  }
}

export function get<T>(variableName: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(variableName);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function readCachedUser(): SessionUser | null {
  return get<SessionUser>(SESSION_KEY);
}

function writeCachedUser(user: SessionUser | null) {
  save(SESSION_KEY, user?.accountId ? user : null);
}

function mapMeResponseToSessionUser(data: unknown): SessionUser | null {
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  const accountId = typeof record.accountId === "string" ? record.accountId : null;
  if (!accountId) return null;

  return {
    accountId,
    neupId: typeof record.neupId === "string" ? record.neupId : null,
    displayName: typeof record.displayName === "string" ? record.displayName : null,
    displayImage: typeof record.displayImage === "string" ? record.displayImage : null,
    accountType: typeof record.accountType === "string" ? record.accountType : null,
    verified: typeof record.registered === "boolean" ? record.registered : null,
    workingProfile: typeof record.workingProfile === "string" ? record.workingProfile : null,
    workingProfileDisplayName:
      typeof record.workingProfileDisplayName === "string" ? record.workingProfileDisplayName : null,
  };
}

export function useSession(): SessionState {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }

  return context;
}

export function SessionProvider({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  initialUser?: SessionUser | null;
}) {
  const [loading, setLoading] = useState(false);
  const [user, setUserState] = useState<SessionUser | null>(initialUser);

  const setUser = (nextUser: SessionUser | null) => {
    setUserState(nextUser);
    writeCachedUser(nextUser);
  };

  const updateUser = (updates: Partial<SessionUser>) => {
    setUserState((currentUser) => {
      const nextUser = currentUser ? { ...currentUser, ...updates } : null;
      writeCachedUser(nextUser);
      return nextUser;
    });
  };

  const refetch = async () => {
    setLoading(true);

    try {
      const response = await fetch(SESSION_ENDPOINT, {
        cache: "no-store",
        credentials: "include",
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      setUser(mapMeResponseToSessionUser(await response.json().catch(() => null)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialUser?.accountId) {
      setUser(initialUser);
      return;
    }

    const cachedUser = readCachedUser();
    if (cachedUser?.accountId) {
      setUserState(cachedUser);
    }
  }, [initialUser]);

  const value = useMemo(
    () => ({ loading, user, setUser, updateUser, refetch }),
    [loading, user]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
