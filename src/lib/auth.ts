import type { UserRole } from "@/types/sale";

export type AuthUser = {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  email_verified?: boolean;
};

const TOKEN_KEY = "auth_token";
const ROLE_KEY = "user_role";
const USER_KEY = "auth_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuth(token: string, user: AuthUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(ROLE_KEY, user.role);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("auth_updated"));
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function getStoredRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  const r = window.localStorage.getItem(ROLE_KEY);
  return (r as UserRole) || null;
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(ROLE_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("auth_updated"));
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000;
    return Date.now() > exp - 5 * 60 * 1000;
  } catch {
    return true;
  }
}
