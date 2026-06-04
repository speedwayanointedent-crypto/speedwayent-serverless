"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AuthUser, clearAuth as clear, getStoredRole, getStoredUser, getToken, setAuth as set } from "./auth";
import type { UserRole } from "@/types/sale";

type AuthCtx = {
  user: AuthUser | null;
  role: UserRole | null;
  token: string | null;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
  isAdmin: boolean;
  isStaff: boolean;
  isAuthenticated: boolean;
  hydrated: boolean;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    setToken(getToken());
    setHydrated(true);

    const handler = () => {
      setUser(getStoredUser());
      setToken(getToken());
    };
    window.addEventListener("auth_updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("auth_updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const setAuthHandler = useCallback((t: string, u: AuthUser) => {
    set(t, u);
    setUser(u);
    setToken(t);
  }, []);

  const clearAuthHandler = useCallback(() => {
    clear();
    setUser(null);
    setToken(null);
  }, []);

  const role = (user?.role || getStoredRole()) as UserRole | null;

  const value: AuthCtx = {
    user,
    role,
    token,
    setAuth: setAuthHandler,
    clearAuth: clearAuthHandler,
    isAdmin: role === "admin",
    isStaff: role === "admin" || role === "manager" || role === "staff",
    isAuthenticated: !!token && !!user,
    hydrated,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
