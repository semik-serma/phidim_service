"use client";

import { ExternalLink, Sparkles } from "lucide-react";

export const RopePullingDevBadge = ({ className = "" }) => (
  <div className={`dev-credit relative inline-flex items-center select-none ${className}`}>
    <div
      aria-hidden="true"
      className="dev-credit__tooltip absolute bottom-full left-1/2 z-50 mb-2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-md border border-green-800 bg-slate-900 px-2 py-1 text-[10px] font-bold text-green-100 shadow-lg"
    >
      <Sparkles className="h-2.5 w-2.5 text-green-300" />
      <span>Crafted by Semik Serma • View Portfolio</span>
    </div>

    {/* Move the entire scene together so the rope stays attached to the badge. */}
    <div className="dev-credit__scene inline-flex items-center">
      <svg
        viewBox="0 0 88 44"
        width="88"
        height="44"
        aria-hidden="true"
        focusable="false"
        className="block h-7 w-14 shrink-0 overflow-visible sm:h-10 sm:w-20"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse cx="24" cy="40" rx="18" ry="2" fill="#64748b" opacity="0.18" />

        {/* Knee movement pivots around the feet instead of rocking the whole man. */}
        <g className="dev-credit__back-leg" stroke="#334155" strokeWidth="3.5">
          <path d="M23 28 L16 33 L11 38" />
          <path d="M7 39 H13" stroke="#0f172a" strokeWidth="4" />
        </g>
        <g className="dev-credit__front-leg" stroke="#475569" strokeWidth="3.5">
          <path d="M25 28 L30 33 L34 38" />
          <path d="M33 39 H39" stroke="#0f172a" strokeWidth="4" />
        </g>

        {/* The hands are the pivot: the grip never separates from the rope. */}
        <g className="dev-credit__upper-body">
          <path d="M23 18 L22 28" stroke="#15803d" strokeWidth="7" />
          <path d="M24 19 L30 23 L40 22" stroke="#166534" strokeWidth="3" />
          <path d="M22 16 L22 13" stroke="#d6d3d1" strokeWidth="3" />
          <circle cx="22" cy="10" r="5" fill="#f1f5f9" stroke="#334155" strokeWidth="1.4" />
          <path d="M17 9 Q17 3 22 3 Q27 3 27 8 Z" fill="#16a34a" />
          <path d="M17 8 H13" stroke="#15803d" strokeWidth="2" />
          <circle cx="24.5" cy="10" r="0.8" fill="#0f172a" />
          <path d="M24 13 L26 12.5" stroke="#475569" strokeWidth="0.8" />
          <path d="M21 19 L29 25 L40 22" stroke="#22c55e" strokeWidth="3.5" />
          <ellipse cx="40" cy="22" rx="3" ry="2.3" fill="#dcfce7" stroke="#166534" strokeWidth="1.2" />
        </g>

        {/* Both endpoints stay fixed; the shared scene supplies the pulling travel. */}
        <path d="M40 22 H88" stroke="#166534" strokeWidth="2.4" />
        <path d="M43 22 H85" stroke="#86efac" strokeWidth="0.8" strokeDasharray="2 3" />
        <path d="M85 20 L88 22 L85 24" stroke="#15803d" strokeWidth="1.8" />
      </svg>

      <a
        href="https://portfolio.phidimservice.com.np"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Developed by Semik Serma — View portfolio"
        className="dev-credit__badge relative inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-green-300 bg-gradient-to-r from-green-100 to-emerald-200 px-2.5 py-1 text-[11px] font-black text-green-950 shadow-xs sm:px-3 sm:text-xs"
      >
        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-700" />
        <span className="whitespace-nowrap font-extrabold tracking-tight">
          <span className="hidden 2xl:inline">
            Developed by <span className="font-black underline decoration-green-800/40 underline-offset-2">Semik Serma</span>
          </span>
          <span className="hidden sm:inline 2xl:hidden">
            By <span className="font-black">Semik Serma</span>
          </span>
          <span className="font-black sm:hidden">Semik</span>
        </span>
        <ExternalLink aria-hidden="true" className="h-3 w-3 shrink-0" />
      </a>
    </div>
  </div>
);
