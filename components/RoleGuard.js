"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * CLIENT-SIDE UX & ROUTE PROTECTION LAYER
 *
 * Enforces authentication and role-based access on client-rendered pages:
 *   - Not authenticated -> immediate redirect to /login with callbackUrl
 *   - Authenticated with unauthorized role -> redirect to /403
 *   - Admin users -> permitted across all views for supervision
 */
export default function RoleGuard({ roles = [], children, redirectPath = "/login" }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Check if user is present in state or localStorage
    let hasStoredSession = false;
    if (typeof window !== "undefined") {
      try {
        hasStoredSession = !!localStorage.getItem("phidim_auth_user");
      } catch (e) {}
    }

    if (!isAuthenticated && !hasStoredSession) {
      const callback = pathname ? `?callbackUrl=${encodeURIComponent(pathname)}` : "";
      router.replace(`${redirectPath}${callback}`);
      return;
    }

    if (user?.role && roles.length > 0) {
      const roleUpper = String(user.role).toUpperCase();
      const allowedRoles = roles.map((r) => String(r).toUpperCase());
      // Admins have supervisory access
      if (roleUpper !== "ADMIN" && !allowedRoles.includes(roleUpper)) {
        router.replace("/403");
      }
    }
  }, [isLoading, isAuthenticated, user?.role, roles, router, redirectPath, pathname]);

  if (isLoading || (!isAuthenticated && typeof window !== "undefined" && !localStorage.getItem("phidim_auth_user"))) {
    return (
      <div className="min-h-screen bg-slate-900/95 backdrop-blur-md text-white flex items-center justify-center font-sans">
        <div className="text-center text-slate-300">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Verifying Authentication...
          </p>
        </div>
      </div>
    );
  }

  if (roles.length > 0 && user?.role) {
    const roleUpper = String(user.role).toUpperCase();
    const allowedRoles = roles.map((r) => String(r).toUpperCase());
    if (roleUpper !== "ADMIN" && !allowedRoles.includes(roleUpper)) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-sans">
          <div className="text-center text-slate-300">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest text-rose-400">
              Access Restricted (403)...
            </p>
          </div>
        </div>
      );
    }
  }

  return children;
}