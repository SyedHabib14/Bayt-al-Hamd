// Tiny client-side auth store backed by localStorage + cookie (for SSR). Server enforces every action.
import { useSyncExternalStore } from "react";

const TOKEN_KEY = "dalil.token";
const USER_KEY = "dalil.user";

export interface StoredUser {
  id: string;
  name: string;
  role: "admin" | "scholar" | "editor";
  cnic: string;
  exp?: number;
}

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as StoredUser; } catch { return null; }
}

/**
 * Set auth state:
 * 1. Store token + user in localStorage for client-side reads.
 * 2. Set a cookie for SSR — the cookie is read by the requireAdminAuth middleware.
 *    Important attributes: Path=/ so it's available on all routes,
 *    SameSite=Lax (default) for CSRF protection, Secure only on HTTPS.
 */
export function setAuth(token: string, user: StoredUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  // Cookie for SSR — Must be set with Path=/ so server reads it on any route change.
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=7200; SameSite=Lax${isSecure ? "; Secure" : ""}`;
  document.cookie = cookie;

  console.debug("[auth] setAuth: token and cookie set", { hasToken: !!token, cookiePresent: document.cookie.includes(TOKEN_KEY) });
  emit();
}

/**
 * Clear auth state completely — localStorage + cookie expiry.
 */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  // Expire the cookie immediately — use all possible path/domain combos to ensure cleanup.
  document.cookie = `${TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${TOKEN_KEY}=; Path=/admin; Max-Age=0; SameSite=Lax`;

  console.debug("[auth] clearAuth: token and cookie cleared");
  emit();
}

let cachedUserRaw: string | null = null;
let cachedUser: StoredUser | null = null;

function getCachedUser(raw: string | null): StoredUser | null {
  if (raw === cachedUserRaw) return cachedUser;
  cachedUserRaw = raw;
  cachedUser = raw ? (() => { try { return JSON.parse(raw) as StoredUser; } catch { return null; } })() : null;
  return cachedUser;
}

export function useAuth() {
  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    const onStorage = () => cb();
    window.addEventListener("storage", onStorage);
    return () => { listeners.delete(cb); window.removeEventListener("storage", onStorage); };
  };
  const getSnapshot = () => localStorage.getItem(TOKEN_KEY) ?? null;
  const token = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const getUserSnapshot = () => (typeof window === "undefined" ? null : localStorage.getItem(USER_KEY));
  const userRaw = useSyncExternalStore(subscribe, getUserSnapshot, () => null);
  const user = getCachedUser(userRaw);
  return { token, user };
}

/**
 * Build Authorization headers for TanStack Start server function calls.
 * TanStack Start serializes these headers and sends them along with the request.
 * The server checks both the Authorization header AND the cookie fallback.
 */
export function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/**
 * Check if a token is expired (client-side heuristic).
 */
export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    // JWT payloads use base64url, which `atob` does not reliably accept.
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    const payload = JSON.parse(atob(base64));
    return payload.exp ? payload.exp * 1000 < Date.now() : true;
  } catch {
    return true;
  }
}
