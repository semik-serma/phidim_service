'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * ====================================================================
 * FEATURE VIDEO CONFIGURATION
 * Drop your video file into /public/videos/feature-video.mp4
 * or change the src path below anytime.
 * ====================================================================
 */
const VIDEO_SRC = '/videos/feature-video.mp4';
const FALLBACK_SRC = 'https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4';

export default function MinimalVideoPage() {
  const videoRef = useRef(null);

  // Ensure music is stopped immediately when navigating or redirecting back
  useEffect(() => {
    const handleStop = () => {
      window.dispatchEvent(new CustomEvent('stop-google-login-music'));
      window.dispatchEvent(new CustomEvent('stop-backend-music'));
      try {
        sessionStorage.removeItem('phidim_google_login_music_active');
        localStorage.removeItem('phidim_google_login_music_active');
        document.cookie =
          'phidim_google_login_music_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
      } catch (e) {}
    };

    // If browser back/forward buttons are used, stop the song immediately
    window.addEventListener('popstate', handleStop);

    return () => {
      handleStop();
      window.removeEventListener('popstate', handleStop);
    };
  }, []);

  const handleRedirectBack = () => {
    window.dispatchEvent(new CustomEvent('stop-google-login-music'));
    try {
      sessionStorage.removeItem('phidim_google_login_music_active');
      localStorage.removeItem('phidim_google_login_music_active');
      document.cookie =
        'phidim_google_login_music_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
    } catch (e) {}
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  return (
    <main className="fixed inset-0 w-screen h-screen bg-black overflow-hidden flex items-center justify-center select-none">
      {/* Minimalist Floating Back Button (Black & White Monochromatic UI) */}
      <Link
        href="/login"
        onClick={handleRedirectBack}
        aria-label="Back to Login"
        className="fixed top-6 left-6 z-50 w-11 h-11 rounded-full bg-black/60 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white flex items-center justify-center transition-all duration-300 backdrop-blur-md shadow-2xl group cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
      </Link>

      {/* Pure Video Display - No Texts, Pure Professional Minimalist Screen */}
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        autoPlay
        loop
        muted
        playsInline
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
        onError={(e) => {
          if (FALLBACK_SRC && e.target.src !== FALLBACK_SRC) {
            e.target.src = FALLBACK_SRC;
            e.target.play().catch(() => {});
          }
        }}
      />
    </main>
  );
}
