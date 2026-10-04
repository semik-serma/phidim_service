"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import socket from "../realtime/client.js";
import { fetchWithFailover } from "@/lib/apiClient";
import { triggerBackendWarning, BACKEND_READY } from "@/lib/backendWarning";
import { dashboardPathFor, normalizeRole, ROLES } from "@/lib/auth/roles";

const AuthContext = createContext({
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => { },
  loginWithGoogle: async () => { },
  logout: async () => { },
  register: async () => { },
  refreshSession: async () => { },
  hasRole: () => false,
  updateUser: async () => { },
});

export const DEMO_ACCOUNTS = {
  USER: {
    id: "USR-8821",
    name: "Ram Shrestha",
    email: "user@phidim.np",
    phone: "+977 9862772457",
    role: "USER",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    address: "Phidim-1, Panchthar",
    dashboardPath: "/user/dashboard",
  },
  TECHNICIAN: {
    id: "TECH-8842",
    name: "Rajesh Tamang",
    email: "tech@phidim.np",
    phone: "+977 9842109842",
    role: "TECHNICIAN",
    specialty: "Senior AC & Fiber Specialist",
    rating: "4.95 ★",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    address: "Phidim Sector 4, Panchthar",
    dashboardPath: "/technician/dashboard",
  },
  ADMIN: {
    id: "ADMIN-001",
    name: "Dhanraj Serma",
    email: "dhanrajserma34@gmail.com",
    phone: "+977 9862772457",
    role: "ADMIN",
    avatar: "/dhanraj.png",
    dashboardPath: "/admin/dashboard",
  },
};

const SESSION_KEY = "phidim_auth_user";
const DJANGO_API_URL =
  process.env.NEXT_PUBLIC_DJANGO_API_URL ||
  "http://localhost:8000";

function parseJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    return JSON.parse(atob(b64));
  } catch (e) {
    return null;
  }
}

function getDjangoLoginUrl() {
  const baseUrl = DJANGO_API_URL.replace(/\/+$/, "");
  return `${baseUrl}/login/`;
}

function getAuthErrorMessage(status, data) {
  if (data?.detail) return data.detail;
  if (data?.error) return data.error;
  if (data?.message) return data.message;
  if (data?.non_field_errors?.length) return data.non_field_errors.join(" ");
  if (status === 400 || status === 401 || status === 403) {
    return "Invalid email or password. Please check your credentials.";
  }
  return `Login failed (${status}). Please try again.`;
}

function clearStoredSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  document.cookie = "phidim_auth_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
  document.cookie = "phidim_jwt_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
  document.cookie = "phidim_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
  document.cookie = "phidim_refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
}

function normalizeUser(u) {
  if (!u) return null;
  const emailPrefix = u.email ? u.email.split("@")[0] : "";
  const derivedUsername = (u.username || emailPrefix).toLowerCase().replace(/[^a-z0-9_]/g, "");
  const role = normalizeRole(u.role) || ROLES.USER;

  return {
    ...u,
    role,
    dashboardPath: dashboardPathFor(role),
    displayName: u.displayName || u.name || emailPrefix || "User",
    username: derivedUsername,
    avatar: u.avatar || u.picture || "",
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expiresAt, setExpiresAt] = useState(null);
  const sessionVersion = useRef(0);

  const safeSetUser = useCallback((acc) => {
    const normalized = normalizeUser(acc);
    setUser(normalized);
    try {
      if (typeof window !== "undefined" && normalized) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
        const cookieVal = encodeURIComponent(JSON.stringify(normalized));
        document.cookie = `phidim_auth_user=${cookieVal}; path=/; max-age=2592000; SameSite=Lax`;
      } else if (typeof window !== "undefined") {
        clearStoredSession();
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // This checks the current access token; it does not refresh its lifetime.
  const refreshSession = useCallback(async (profile = {}) => {
    const version = ++sessionVersion.current;
    try {
      const res = await fetch("/api/auth/session", {
        credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(7000),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !normalizeRole(data.user?.role)) throw new Error("Invalid session");
      if (version !== sessionVersion.current) return null;
      let cached = {};
      try {
        const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
        if (saved?.id === data.user.id) cached = saved;
      } catch {}
      // Cached data supplies display fields only; identity and role always
      // come from the server-verified access token.
      const normalized = normalizeUser({
        ...data.user,
        name: data.user.name || profile.name || cached.name || "",
        displayName: data.user.displayName || profile.displayName || profile.name || cached.displayName || "",
        email: data.user.email || profile.email || cached.email || "",
        phone: data.user.phone || profile.phone || cached.phone || "",
        avatar: data.user.avatar || profile.avatar || cached.avatar || "",
      });
      safeSetUser(normalized);
      setExpiresAt(data.expiresAt);
      return normalized;
    } catch {
      if (version === sessionVersion.current) {
        safeSetUser(null);
        setExpiresAt(null);
      }
      return null;
    }
  }, [safeSetUser]);

  useEffect(() => {
    let active = true;
    refreshSession().finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [refreshSession]);

  useEffect(() => {
    if (!expiresAt) return;
    const timer = setTimeout(() => {
      ++sessionVersion.current;
      safeSetUser(null);
      setExpiresAt(null);
    }, Math.max(0, expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [expiresAt, safeSetUser]);

  useEffect(() => {
    if (!user?.id) return;
    socket.emit("register-user", user.id);
    console.log("👤 Registered realtime user:", user.id);
  }, [user]);

  const loginWithGoogle = useCallback(async (targetRole = "USER") => {
    if (!BACKEND_READY) {
      triggerBackendWarning();
      return;
    }
    try {
      if (typeof window !== "undefined") {
        const origin = window.location.origin;
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
        const redirectUri =
          process.env.NEXT_PUBLIC_GOOGLE_CALLBACK_URL ||
          (origin.includes("localhost") || origin.includes("127.0.0.1")
            ? "http://localhost:3000/api/auth/google/callback"
            : `${origin}/api/auth/google/callback`);

        const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const statePayload = { role: targetRole, redirectUri, nonce, origin };
        const state = btoa(JSON.stringify(statePayload));

        const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        googleAuthUrl.searchParams.append("client_id", clientId);
        googleAuthUrl.searchParams.append("redirect_uri", redirectUri);
        googleAuthUrl.searchParams.append("response_type", "code");
        googleAuthUrl.searchParams.append("scope", "openid email profile");
        googleAuthUrl.searchParams.append("prompt", "select_account");
        googleAuthUrl.searchParams.append("state", state);

        window.location.href = googleAuthUrl.toString();
      }
    } catch (err) {
      console.error("Google login redirect error:", err);
      throw err;
    }
  }, []);

  const login = useCallback(
    async ({ emailOrPhone, password, rememberMe = false, role = "USER" }) => {
      try {
        const res = await fetch(getDjangoLoginUrl(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "omit",
          body: JSON.stringify({
            email: String(emailOrPhone || "").trim(),
            password,
          }),
        });

        let data = {};
        try {
          data = await res.json();
        } catch (e) {
          data = {};
        }
        if (!res.ok) {
          const err = new Error(getAuthErrorMessage(res.status, data));
          err.status = res.status;
          err.locked = data.locked;
          err.retryAfterSeconds = data.retryAfterSeconds;
          throw err;
        }

        const token = data.access || data.accessToken || data.token || "";
        const refreshToken = data.refresh || data.refreshToken || "";
        if (!token || !refreshToken) {
          throw new Error("Login response did not include access and refresh tokens.");
        }

        const decoded = parseJwtPayload(token) || {};
        const tokenRole = normalizeRole(decoded.role);
        const userRole = normalizeRole(data.user?.role);
        const topLevelRole = normalizeRole(data.role);
        const allReturnedRoles = [tokenRole, userRole, topLevelRole].filter(Boolean);
        const uniqueReturnedRoles = new Set(allReturnedRoles);

        if (uniqueReturnedRoles.size > 1) {
          clearStoredSession();
          throw new Error("Login response role mismatch. Please contact support.");
        }

        const activeRole = tokenRole || userRole || topLevelRole;
        if (!activeRole) {
          clearStoredSession();
          throw new Error("Login response did not include a valid account role.");
        }

        const requestedRole = normalizeRole(role) || ROLES.USER;
        if (activeRole !== requestedRole) {
          clearStoredSession();
          throw new Error("This account is not allowed in this portal.");
        }

        if (typeof window !== "undefined") {
          const maxAge = rememberMe ? 2592000 : 86400;
          document.cookie = `phidim_access_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
          document.cookie = `phidim_jwt_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
          document.cookie = `phidim_refresh_token=${refreshToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
        }
        const verified = await refreshSession(data.user || { email: String(emailOrPhone || "").trim() });
        if (!verified) throw new Error("Could not verify your login session. Please sign in again.");
        setIsLoading(false);
        return verified;
      } catch (error) {
        if (error instanceof TypeError) {
          throw new Error("Could not reach the login API at http://localhost:8000/login/. Please make sure it is running and allows requests from this frontend.");
        }
        throw error;
      }
    },
    [refreshSession]
  );

  const register = useCallback(
    async (data) => {
      if (!BACKEND_READY) {
        triggerBackendWarning();
        return;
      }
      try {
        const res = await fetchWithFailover("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          timeout: 8000,
        });

        const resData = await res.json();
        if (!res.ok) {
          const err = new Error(resData.error || resData.message || `Registration failed (${res.status})`);
          err.status = res.status;
          throw err;
        }

        const token = resData.access || resData.accessToken || resData.token || "";
        if (!token) throw new Error("Registration did not provide an access token. Please sign in.");
        if (typeof window !== "undefined" && token) {
          document.cookie = `phidim_access_token=${token}; path=/; max-age=2592000; SameSite=Lax`;
          document.cookie = `phidim_jwt_token=${token}; path=/; max-age=2592000; SameSite=Lax`;
        }

        const newAccount = await refreshSession();
        if (!newAccount) throw new Error("Registration did not provide a verified Django session. Please sign in.");
        if (typeof window !== "undefined" && newAccount?.dashboardPath) {
          window.location.href = newAccount.dashboardPath;
        }
        return newAccount;
      } catch (error) {
        throw error;
      }
    },
    [refreshSession]
  );

  const logout = useCallback(async () => {
    ++sessionVersion.current;
    setExpiresAt(null);
    safeSetUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, [safeSetUser]);

  const hasRole = useCallback((...roles) => {
    const role = user?.role;
    return roles.length === 0 || roles.includes(role);
  }, [user]);

  const updateUser = useCallback(async (updatedFields) => {
    if (!BACKEND_READY) {
      triggerBackendWarning();
      return;
    }
    setUser((prev) => {
      const next = prev ? { ...prev, ...updatedFields, id: prev.id, role: prev.role, dashboardPath: prev.dashboardPath } : null;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(next));
          const cookieVal = encodeURIComponent(JSON.stringify(next));
          document.cookie = `phidim_auth_user=${cookieVal}; path=/; max-age=2592000; SameSite=Lax`;
        } catch (e) { }
      }
      return next;
    });

    try {
      const res = await fetchWithFailover("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          const normalized = normalizeUser(data.user);
          setUser((prev) => prev ? { ...normalized, id: prev.id, role: prev.role, dashboardPath: prev.dashboardPath } : null);
          return normalized;
        }
      }
    } catch (e) {
      console.error("Failed to persist profile update:", e);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role || null,
      isAuthenticated: !!user,
      isLoading,
      login,
      loginWithGoogle,
      logout,
      register,
      refreshSession,
      hasRole,
      updateUser,
    }),
    [user, isLoading, login, loginWithGoogle, logout, register, refreshSession, hasRole, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => { },
      loginWithGoogle: async () => { },
      logout: () => { },
      register: async () => { },
      refreshSession: async () => { },
      hasRole: () => false,
      updateUser: () => { },
    };
  }
  return context;
}
