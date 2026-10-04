'use client';

/**
 * ARCHITECTURAL CONFIGURATION
 * Set BACKEND_READY to true once backend authentication, PostgreSQL/MongoDB,
 * and live API endpoints are fully deployed and connected.
 * When false, all backend-dependent actions trigger the Backend Development Warning Notification.
 */
export const BACKEND_READY = false;

/**
 * Triggers the Backend Development Warning Notification globally.
 * Opens the high-status notification modal and starts the soft, subtle background music.
 */
export function triggerBackendWarning(role) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('phidim:show-backend-warning', {
        detail: { role: role || 'USER' },
      })
    );
  }
}

/**
 * Handles like attempts when user is unauthenticated:
 * Shows friendly warning toast and redirects to /login with prompt.
 * When the user attempts to sign in on /login, the backend warning is then displayed.
 */
export function handleUnauthenticatedLike(router = null) {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('phidim_like_redirect_prompt', 'true');
    } catch (e) {}

    // Dispatch custom event so any active toast or UI immediately notifies user

    setTimeout(() => {
      if (router && typeof router.push === 'function') {
        router.push('/login?prompt=register');
      } else {
        window.location.href = '/login?prompt=register';
      }
    }, 700);
  }
}

/**
 * Handles booking attempts when user is unauthenticated:
 * Shows friendly warning toast and redirects to /login with prompt=booking.
 * When the user attempts to sign in on /login, the backend warning is then displayed.
 */
export function handleUnauthenticatedBooking(router = null) {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('phidim_booking_redirect_prompt', 'true');
    } catch (e) {}


    setTimeout(() => {
      if (router && typeof router.push === 'function') {
        router.push('/login?prompt=booking');
      } else {
        window.location.href = '/login?prompt=booking';
      }
    }, 700);
  }
}

export default triggerBackendWarning;

