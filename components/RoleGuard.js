"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { dashboardPathFor, hasRole } from "@/lib/auth/roles";
import { Loader2 } from "lucide-react";

export default function RoleGuard({ roles = [], children, redirectPath = "/login" }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = isAuthenticated && hasRole(user, roles);
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`${redirectPath}?callbackUrl=${encodeURIComponent(pathname || "/dashboard")}`);
    } else if (!allowed) {
      router.replace(dashboardPathFor(user.role));
    }
  }, [isLoading, isAuthenticated, allowed, user?.role, router, redirectPath, pathname]);
  if (isLoading || !allowed) {
    return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
        <p>Verifying Authentication...</p></div>
    </div>;
  }
  return children;
}
