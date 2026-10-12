"use client";

import { useState } from "react";
import { TechnicianSidebar } from "../../components/technician-dashboard/TechnicianSidebar";
import { TechnicianTopNavbar } from "../../components/technician-dashboard/TechnicianTopNavbar";
import { TechnicianBookings } from "../../components/technician-dashboard/TechnicianBookings";
import { MobileTechnicianBottomNav } from "../../components/technician-dashboard/MobileTechnicianBottomNav";
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "../../components/RoleGuard";
import { LogoutConfirmModal } from "../../components/LogoutConfirmModal";

export default function TechnicianDashboardPage() {
  const { logout } = useAuth();
  const activeTab = "my-jobs";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <RoleGuard roles={["TECHNICIAN", "ADMIN"]}>
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#070f0d] text-slate-900 dark:text-slate-100 font-dm-sans selection:bg-emerald-500 selection:text-white transition-colors duration-300 pb-20 lg:pb-8" data-dashboard="true">
      {/* Dark Left Sidebar */}
      <TechnicianSidebar
        activeTab={activeTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={() => setIsLogoutOpen(true)}
      />

      {/* Main Layout Container */}
      <div
        className={`transition-all duration-300 flex flex-col min-h-screen ${
          collapsed ? "lg:pl-[68px]" : "lg:pl-[245px]"
        }`}
      >
        {/* Top Navbar */}
        <TechnicianTopNavbar
          setMobileOpen={setMobileOpen}
          onLogout={() => setIsLogoutOpen(true)}
        />

        {/* Main Body */}
        <main className="flex-1 p-3.5 sm:p-5 lg:p-6 space-y-5 max-w-[1360px] mx-auto w-full">
          <TechnicianBookings />
        </main>

        {/* Footer */}
        <footer className="px-8 py-5 border-t border-slate-200/60 dark:border-slate-800/60 text-center text-xs text-slate-400">
          <p>© 2026 Phidim Service. Enterprise Technician Command Interface built for Panchthar Home Service Marketplace.</p>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileTechnicianBottomNav activeTab={activeTab} onLogout={() => setIsLogoutOpen(true)} />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        open={isLogoutOpen}
        onCancel={() => setIsLogoutOpen(false)}
        onConfirm={handleLogoutConfirm}
        isLoggingOut={isLoggingOut}
      />

    </div>
    </RoleGuard>
  );
}
