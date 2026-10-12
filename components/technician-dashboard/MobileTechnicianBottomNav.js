"use client";

import { Briefcase, LogOut } from "lucide-react";

export function MobileTechnicianBottomNav({ activeTab, onLogout }) {
  const items = [
    { id: "my-jobs", name: "My Bookings", icon: Briefcase },
    { id: "logout", name: "Logout", icon: LogOut },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#061510]/90 backdrop-blur-xl border-t border-slate-200 dark:border-emerald-900/40 px-3 py-2 lg:hidden shadow-2xl">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => { if (item.id === "logout") onLogout(); }}
              className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
                item.id === "logout"
                  ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  : isActive
                  ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon size={20} className={isActive ? "scale-110 drop-shadow-[0_0_6px_rgba(34,197,94,0.5)]" : ""} />
              <span className="text-[10px] tracking-tight">{item.name}</span>

            </button>
          );
        })}
      </div>
    </nav>
  );
}
