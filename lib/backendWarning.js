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
export function triggerBackendWarning() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('phidim:show-backend-warning'));
  }
}

export default triggerBackendWarning;
