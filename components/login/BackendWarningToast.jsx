'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  AlertTriangle,
  Server,
  X,
  CheckCircle2,
  ShieldCheck,
  CalendarCheck,
  MessageSquare,
  Video,
  Layers,
  Sparkles,
} from 'lucide-react';

/**
 * BackendWarningToast
 * 
 * Clean, professional notification modal communicating:
 * 1. What Phidim Service is: A secure, professional service-management platform in Phidim, Panchthar.
 * 2. Services coming: Fast bookings, verified technician profiles & previous work, ratings/reviews.
 * 3. Real-time communication: Chat, voice calling, video calling, and media/file sharing.
 * 4. Architecture: Powered by Django REST Framework with role-based dashboards (Customers, Technicians, Admins).
 * 5. Current status: Active backend development; frontend demo available while backend is being finalized.
 * 
 * Functional constraints preserved:
 * - Subtle background audio (0.22 volume, loop, zero UI controls)
 * - Music immediately stops on close / dismiss
 * - No auto-redirecting or dashboard jumps
 */
export default function BackendWarningToast({
  isOpen = false,
  onClose,
  triggerCount = 0,
}) {
  const audioRef = useRef(null);

  /**
   * Stop music completely and clean up any persistent state
   */
  const stopMusic = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stop-backend-music'));
      window.dispatchEvent(new CustomEvent('stop-google-login-music'));
      try {
        sessionStorage.removeItem('phidim_google_login_music_active');
        localStorage.removeItem('phidim_google_login_music_active');
        document.cookie =
          'phidim_google_login_music_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
      } catch (e) {}
    }
  }, []);

  /**
   * Start soft, subtle background music when modal opens
   * Kept at a low, gentle volume (0.22) so it is not intrusive or noticeable
   */
  const playMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = true;
    audio.volume = 0.22; // Soft, gentle background volume
    audio.currentTime = 0;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('[Backend Notice Audio] Autoplay awaiting interaction:', err?.message);
      });
    }
  }, []);

  /**
   * Handle Close:
   * - Dismisses pop-up
   * - Immediately STOPS background music
   */
  const handleClose = useCallback(() => {
    stopMusic();
    if (onClose) {
      onClose();
    }
  }, [stopMusic, onClose]);

  // Audio lifecycle watcher
  useEffect(() => {
    if (!isOpen) {
      stopMusic();
      return;
    }

    // Modal opened: play subtle background music
    playMusic();

    // Escape key listener to close modal
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      stopMusic();
    };
  }, [isOpen, triggerCount, playMusic, stopMusic, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="backend-warning-title"
    >
      {/* Background audio element - Soft, subtle ambient sound with zero UI controls */}
      <audio
        ref={audioRef}
        src="/music/login.mpeg"
        loop
        preload="auto"
        playsInline
        style={{ display: 'none' }}
        aria-hidden="true"
      >
        <source src="/music/login.mpeg" type="audio/mpeg" />
        <source src="/login.mpeg" type="audio/mpeg" />
      </audio>

      {/* Decorative ambient radial glow */}
      <div className="absolute w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900/98 to-slate-950 border border-emerald-500/30 rounded-3xl shadow-2xl shadow-emerald-950/80 p-5 sm:p-7 text-white overflow-hidden animate-in zoom-in-95 duration-200 my-auto max-h-[92vh] flex flex-col justify-between">
        
        {/* Glowing Top Beam */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 shadow-xs shadow-emerald-400" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
              <Server className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>
            <div>
              <h3 id="backend-warning-title" className="text-base sm:text-lg font-black tracking-tight text-white mt-1">
                Phidim Service Notice
              </h3>
            </div>
          </div>

          {/* Close [X] Button - Closes notification and stops music */}
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close notification"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto pr-1 space-y-4 text-xs text-slate-300">

          {/* Primary Alert Banner */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  Active Backend Development
                </h4>
                <p className="text-sm sm:text-base font-extrabold text-white leading-snug">
                  &ldquo;Backend is in progress. So please come on later. We can give you best services.&rdquo;
                </p>
                <p className="text-[11px] text-amber-200/90 leading-relaxed font-medium">
                  Phidim Service is currently under active development.
                </p>
              </div>
            </div>
          </div>

          {/* What Phidim Service Is & What We're Building */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <h5 className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              What We Are Building
            </h5>
            <p className="text-xs leading-relaxed text-slate-300">
              We are building a secure service platform where customers can find and book technicians, view technician services and previous work, communicate through chat, voice and video calls, share photos, videos and files, and manage service bookings.
            </p>
          </div>

          {/* Core Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white text-[11px] block">Role-Based System</span>
                <span className="text-[10px] text-slate-400 leading-tight block">
                  Dedicated secure portals for Customers, Technicians, and Admins.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white text-[11px] block">Bookings & Tasks</span>
                <span className="text-[10px] text-slate-400 leading-tight block">
                  Direct service dispatch, task lifecycle, and verified technician histories.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white text-[11px] block">Direct Chat & Files</span>
                <span className="text-[10px] text-slate-400 leading-tight block">
                  Real-time messaging, photos, videos, and document sharing.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white text-[11px] block">Voice & Video Calls</span>
                <span className="text-[10px] text-slate-400 leading-tight block">
                  Real-time direct audio and HD video calling between customers and technicians.
                </span>
              </div>
            </div>
          </div>

          {/* Architecture & Temporary Unavailability Reassurance */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-slate-300 space-y-1.5">
            <p className="text-[11px] leading-relaxed text-slate-300">
              Secure login, role-based dashboards, technician management, booking, ratings, and communication features are being powered by our <strong className="text-emerald-400">Django REST Framework</strong> backend.
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Some features may currently be unavailable while the backend is being completed.
            </p>
          </div>

          <p className="text-center text-[11px] font-semibold text-emerald-300/90 pt-1">
            Thank you for your patience. We&apos;re working to bring the complete Phidim Service experience soon.
          </p>

        </div>

        {/* Action Button - Closes notification and stops music */}
        <div className="pt-4 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="w-full h-11 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>I Understand / Close</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export { BackendWarningToast };
