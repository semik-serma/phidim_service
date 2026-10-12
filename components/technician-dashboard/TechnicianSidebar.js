"use client";

import { motion } from "motion/react";
import { Briefcase, LogOut, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";

export const TECHNICIAN_NAV_ITEMS = [
  { id: "my-jobs", name: "My Bookings", icon: Briefcase },
  { id: "logout", name: "Logout", icon: LogOut, isDanger: true },
];

export function TechnicianSidebar({ activeTab, collapsed, setCollapsed, mobileOpen, setMobileOpen, onLogout }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen bg-[#061510] dark:bg-[#040d0a] text-slate-300 border-r border-emerald-900/30 transition-all duration-300 flex flex-col ${
          collapsed ? "w-[68px]" : "w-[245px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Header / Logo */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-emerald-900/30">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-700 flex items-center justify-center shadow-[0_0_15px_rgba(22,163,74,0.35)] text-white font-black">
                <ShieldCheck size={18} className="text-white drop-shadow" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#061510] animate-pulse" />
            </div>

            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                className="leading-tight min-w-0"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-white tracking-tight truncate">
                    Phidim<span className="text-emerald-400">Service</span>
                  </span>
                  <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider border border-emerald-500/30">
                    TECH
                  </span>
                </div>
                <p className="text-[10px] text-emerald-400/70 font-medium truncate">
                  Technician Command Hub
                </p>
              </motion.div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-950/60 hover:bg-emerald-800/60 border border-emerald-700/40 text-emerald-400 hover:text-white transition-all shadow-sm"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
          {TECHNICIAN_NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "logout" && onLogout) {
                    onLogout();
                  }
                  if (mobileOpen) setMobileOpen(false);
                }}
                className={`group relative w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  item.isDanger
                    ? "text-rose-400 hover:bg-rose-950/30 hover:text-rose-300"
                    : isActive
                    ? "bg-gradient-to-r from-emerald-500/25 via-emerald-500/15 to-transparent text-emerald-400 font-bold border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.12)]"
                    : "hover:bg-white/5 hover:text-white text-slate-300"
                }`}
                title={collapsed ? item.name : undefined}
              >
                {isActive && (
                  <motion.span
                    layoutId="techNavIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-emerald-400 rounded-r-full shadow-[0_0_12px_#22c55e]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                <item.icon
                  size={20}
                  className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive
                      ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                      : item.isDanger
                      ? "text-rose-400"
                      : "text-slate-400 group-hover:text-emerald-300"
                  }`}
                />

                {!collapsed && (
                  <span className="flex-1 text-left truncate tracking-wide">
                    {item.name}
                  </span>
                )}

              </button>
            );
          })}
        </nav>

      </aside>
    </>
  );
}
