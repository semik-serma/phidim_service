/**
 * Smart Dual-Mode API Client with Auto-Discovery:
 * 
 * 1. If BOTH Frontend & Backend are running locally:
 *    -> Automatically routes all requests to our localhost backend (http://localhost:5000).
 * 
 * 2. If ONLY Frontend is running (Localhost backend is NOT running / stopped):
 *    -> Automatically routes all requests to hosted cPanel backend (https://service.phidimservice.com.np).
 */

export const CPANEL_LIVE_BACKEND_URL = "https://service.phidimservice.com.np";
export const LOCAL_DEV_BACKEND_URL =
  process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL || "http://localhost:5000";

let localBackendStatus = null; // null: unknown, true: running, false: offline
let lastHealthCheckTime = 0;
const HEALTH_CHECK_INTERVAL = 30000; // re-check every 30s

/**
 * Probes if local backend is running (with a 1.2s timeout).
 */
export async function checkIsLocalBackendRunning() {
  if (typeof window === "undefined") return false;
  
  const now = Date.now();
  if (localBackendStatus !== null && now - lastHealthCheckTime < HEALTH_CHECK_INTERVAL) {
    return localBackendStatus;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${LOCAL_DEV_BACKEND_URL}/api/health`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    localBackendStatus = res.ok || res.status === 404; // backend reached
    lastHealthCheckTime = now;
    return localBackendStatus;
  } catch (err) {
    localBackendStatus = false;
    lastHealthCheckTime = now;
    return false;
  }
}

/**
 * Intelligent fetch wrapper with automatic failover.
 * - When localhost backend is running, uses localhost backend.
 * - When localhost backend is NOT running, automatically uses cPanel hosted backend.
 */
export async function fetchWithFailover(endpoint, options = {}) {
  // Normalize relative path
  let relativePath = endpoint;
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    try {
      const urlObj = new URL(relativePath);
      relativePath = urlObj.pathname + urlObj.search;
    } catch {}
  }
  if (!relativePath.startsWith("/api")) {
    relativePath = `/api${relativePath.startsWith("/") ? "" : "/"}${relativePath}`;
  }

  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const fetchOptions = {
    ...options,
    headers: defaultHeaders,
    credentials: options.credentials || "include",
  };

  // Check if localhost backend is running
  const isLocalRunning = await checkIsLocalBackendRunning();

  // If local backend IS running, try localhost first
  if (isLocalRunning) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 3500);

      const localUrl = `${LOCAL_DEV_BACKEND_URL}${relativePath}`;
      const res = await fetch(localUrl, {
        ...fetchOptions,
        signal: options.signal || controller.signal,
      });
      clearTimeout(timeoutId);

      // If local returned a severe server error (500, 502, 503, 504), failover to cPanel
      if (res.status >= 500) {
        throw new Error(`Local Backend Server Error (${res.status})`);
      }

      return res;
    } catch (localErr) {
      console.warn(`[Local Backend Failed] Routing request to cPanel live (${CPANEL_LIVE_BACKEND_URL}${relativePath}):`, localErr?.message);
      localBackendStatus = false; // Mark local as offline
    }
  }

  // Frontend ONLY running or Localhost down -> Route directly to cPanel Live Backend
  const cpanelUrl = `${CPANEL_LIVE_BACKEND_URL}${relativePath}`;
  try {
    const res = await fetch(cpanelUrl, fetchOptions);
    return res;
  } catch (liveErr) {
    // If direct CORS fails, fallback to Next.js relative rewrite proxy
    console.warn(`[Direct cPanel Fetch Error] Trying relative proxy "${relativePath}":`, liveErr?.message);
    return fetch(relativePath, fetchOptions);
  }
}

export default fetchWithFailover;
