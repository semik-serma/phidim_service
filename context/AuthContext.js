"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import socket from "../realtime/client.js";
import { fetchWithFailover, CPANEL_LIVE_BACKEND_URL } from "@/lib/apiClient";
import { triggerBackendWarning, BACKEND_READY } from "@/lib/backendWarning";

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

function normalizeUser(u) {
  if (!u) return null;
  const emailPrefix = u.email ? u.email.split("@")[0] : "";
  const derivedUsername = (u.username || emailPrefix).toLowerCase().replace(/[^a-z0-9_]/g, "");
  const role = String(u.role || "USER").toUpperCase();
  const dashboardPath =
    role === "ADMIN"
      ? "/admin/dashboard"
      : role === "TECHNICIAN"
      ? "/technician/dashboard"
      : "/user/dashboard";

  return {
    ...u,
    role,
    dashboardPath,
    displayName: u.displayName || u.name || emailPrefix || "User",
    username: derivedUsername,
    avatar: u.avatar || u.picture || "",
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(SESSION_KEY);
        if (saved) return normalizeUser(JSON.parse(saved));
        const cookieMatch = document.cookie.match(/phidim_auth_user=([^;]+)/);
        if (cookieMatch) {
          let rawVal = decodeURIComponent(cookieMatch[1]);
          if (rawVal.startsWith("j:")) rawVal = rawVal.slice(2);
          return normalizeUser(JSON.parse(rawVal));
        }
      } catch (e) { }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        if (localStorage.getItem(SESSION_KEY) || document.cookie.includes("phidim_auth_user=")) {
          return false;
        }
      } catch (e) { }
    }
    return true;
  });

  const refreshTimer = useRef(null);

  const safeSetUser = useCallback((acc) => {
    const normalized = normalizeUser(acc);
    setUser(normalized);
    try {
      if (typeof window !== "undefined" && normalized) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
        const cookieVal = encodeURIComponent(JSON.stringify(normalized));
        document.cookie = `phidim_auth_user=${cookieVal}; path=/; max-age=2592000; SameSite=Lax`;
      } else if (typeof window !== "undefined") {
        localStorage.removeItem(SESSION_KEY);
        document.cookie = "phidim_auth_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
        document.cookie = "phidim_jwt_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
        document.cookie = "phidim_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
        document.cookie = "phidim_refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetchWithFailover("/api/auth/refresh", {
        method: "POST",
        timeout: 3000,
      });
      if (!res.ok) throw new Error("Refresh failed");
      const data = await res.json();
      if (data.success && data.user) {
        const norm = normalizeUser(data.user);
        setUser(norm);
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(norm));
        } catch (e) { }
        return norm;
      }
    } catch (e) { }
    return null;
  }, []);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const refreshed = await refreshSession();
        if (!active) return;
        if (refreshed) {
          setIsLoading(false);
          return;
        }

        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const authToken = params.get("auth_token");
          const userParam = params.get("user");
          if (authToken && userParam) {
            try {
              let parsedUser = JSON.parse(decodeURIComponent(userParam));
              if (parsedUser) {
                const norm = normalizeUser(parsedUser);
                safeSetUser(norm);
                document.cookie = `phidim_access_token=${authToken}; path=/; max-age=86400; SameSite=Lax`;
                document.cookie = `phidim_auth_user=${encodeURIComponent(JSON.stringify(norm))}; path=/; max-age=2592000; SameSite=Lax`;
                localStorage.setItem(SESSION_KEY, JSON.stringify(norm));
                params.delete("auth_token");
                params.delete("user");
                const newQuery = params.toString() ? `?${params.toString()}` : "";
                window.history.replaceState({}, "", `${window.location.pathname}${newQuery}`);
                setIsLoading(false);
                return;
              }
            } catch (e) { }
          }

          const cookieMatch = document.cookie.match(/phidim_auth_user=([^;]+)/);
          if (cookieMatch) {
            try {
              let rawVal = cookieMatch[1];
              try {
                rawVal = decodeURIComponent(rawVal);
              } catch (e) { }
              if (typeof rawVal === "string" && rawVal.startsWith("j:")) {
                rawVal = rawVal.slice(2);
              }
              const googleUser = JSON.parse(rawVal);
              if (googleUser && googleUser.role) {
                const norm = normalizeUser(googleUser);
                setUser(norm);
                localStorage.setItem(SESSION_KEY, JSON.stringify(norm));
                setIsLoading(false);
                return;
              }
            } catch (e) { }
          }

          const savedUser = localStorage.getItem(SESSION_KEY);
          if (savedUser) {
            const parsed = JSON.parse(savedUser);
            if (parsed) {
              try {
                const meRes = await fetchWithFailover("/api/auth/me", { timeout: 2500 });
                if (meRes.ok) {
                  const meData = await meRes.json();
                  if (meData.success && meData.user) {
                    const norm = normalizeUser(meData.user);
                    setUser(norm);
                    setIsLoading(false);
                    return;
                  }
                }
              } catch (e) { }
              setUser(normalizeUser(parsed));
            }
          }
        }
      } catch (e) {
        console.error("Failed to restore auth session:", e);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, [refreshSession, safeSetUser]);

  useEffect(() => {
    if (!user) return;
    refreshTimer.current = setInterval(() => {
      refreshSession().catch(() => { });
    }, 12 * 60 * 1000);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [user, refreshSession]);

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
      if (!BACKEND_READY) {
        triggerBackendWarning();
        return;
      }
      try {
        const res = await fetchWithFailover("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailOrPhone, password, rememberMe, role }),
          timeout: 8000,
        });

        let data = {};
        try {
          data = await res.json();
        } catch (e) {
          data = { error: "Authentication response parsing error. Please try again." };
        }
        if (!res.ok) {
          const err = new Error(data.error || data.message || `Login failed (${res.status})`);
          err.status = res.status;
          err.locked = data.locked;
          err.retryAfterSeconds = data.retryAfterSeconds;
          throw err;
        }

        const token = data.accessToken || data.token || "";
        if (typeof window !== "undefined" && token) {
          const maxAge = rememberMe ? 2592000 : 86400;
          document.cookie = `phidim_access_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
          document.cookie = `phidim_jwt_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
        }

        const activeRole = role || data.user?.role || "USER";
        const account = data.user
          ? {
            ...data.user,
            role: activeRole,
          }
          : DEMO_ACCOUNTS[activeRole] || DEMO_ACCOUNTS.USER;
        safeSetUser(account);
        return account;
      } catch (error) {
        throw error;
      }
    },
    [safeSetUser]
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

        const token = resData.accessToken || resData.token || "";
        if (typeof window !== "undefined" && token) {
          document.cookie = `phidim_access_token=${token}; path=/; max-age=2592000; SameSite=Lax`;
          document.cookie = `phidim_jwt_token=${token}; path=/; max-age=2592000; SameSite=Lax`;
        }

        const newAccount = resData.user;
        safeSetUser(newAccount);
        if (typeof window !== "undefined" && newAccount.dashboardPath) {
          window.location.href = newAccount.dashboardPath;
        }
        return newAccount;
      } catch (error) {
        throw error;
      }
    },
    [safeSetUser]
  );

  const logout = useCallback(async () => {
    try {
      await fetchWithFailover("/api/auth/logout", { method: "POST", timeout: 3000 });
    } catch (e) { }
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
      const next = { ...(prev || {}), ...updatedFields };
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
          setUser(normalized);
          return data.user;
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
