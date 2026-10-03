'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const STORAGE_KEY = 'phidim_google_login_music_active';

/**
 * PersistentGoogleMusic
 * 
 * Safety Guardian component mounted in root layout:
 * - Ensures no music leaks across page transitions
 * - Immediately silences audio whenever navigating or redirected to dashboards
 * - Listens for global stop signals to enforce silence
 */
export default function PersistentGoogleMusic() {
  const audioRef = useRef(null);
  const pathname = usePathname();

  const stopMusic = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
      document.cookie = `${STORAGE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax`;
    } catch (e) {}

    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) {}
    }
  };

  // Immediate silence guardian on ANY route navigation (dashboards, services, home, etc.)
  useEffect(() => {
    stopMusic();
  }, [pathname]);

  // Global stop signals & window unload
  useEffect(() => {
    const handleStop = () => {
      stopMusic();
    };

    window.addEventListener('stop-backend-music', handleStop);
    window.addEventListener('stop-google-login-music', handleStop);
    window.addEventListener('beforeunload', handleStop);
    window.addEventListener('pagehide', handleStop);

    return () => {
      stopMusic();
      window.removeEventListener('stop-backend-music', handleStop);
      window.removeEventListener('stop-google-login-music', handleStop);
      window.removeEventListener('beforeunload', handleStop);
      window.removeEventListener('pagehide', handleStop);
    };
  }, []);

  return (
    <audio
      ref={audioRef}
      src="/music/login.mpeg"
      loop
      autoPlay={false}
      preload="none"
      playsInline
      style={{ display: 'none' }}
      aria-hidden="true"
    >
      <source src="/music/login.mpeg" type="audio/mpeg" />
      <source src="/login.mpeg" type="audio/mpeg" />
    </audio>
  );
}
