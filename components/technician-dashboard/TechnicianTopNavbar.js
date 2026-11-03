"use client";

import Link from "next/link";
import { Home, Menu, LogOut } from "lucide-react";

export function TechnicianTopNavbar({ setMobileOpen, onLogout }) {
  return (
    <header className="sticky top-0 z-30 h-[58px] bg-white/85 dark:bg-[#050e0b]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-emerald-900/30 px-4 sm:px-6 transition-colors duration-300">
      <div className="flex items-center justify-between h-full gap-3 max-w-7xl mx-auto">
        {/* Left Section: Menu Toggle & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-950/60 lg:hidden transition-all border border-slate-200 dark:border-emerald-800/40"
            aria-label="Open sidebar navigation"
          >
            <Menu size={18} />
          </button>

          <div className="leading-tight min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight capitalize truncate">
                My Bookings
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <Home size={16} aria-hidden="true" />
            <span>Back to Home</span>
          </Link>
          <button
            onClick={onLogout}
            aria-label="Logout"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all font-bold text-xs border border-slate-200 dark:border-emerald-800/40"
          >
            <LogOut size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
