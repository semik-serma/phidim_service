import { triggerBackendWarning, BACKEND_READY } from "./backendWarning.js";

// All legacy backend calls use the same frontend origin. Backend selection is
// performed on the server, where local services can actually be reached.
export async function fetchWithFailover(endpoint, options = {}) {
  let relativePath = endpoint;
  if (/^https?:\/\//.test(relativePath)) {
    const url = new URL(relativePath);
    relativePath = url.pathname + url.search;
  }
  if (!relativePath.startsWith("/api/")) relativePath = "/api/" + relativePath.replace(/^\/+/, "");
  // Intercept state-mutating requests when backend is in development progress
  const method = (options.method || "GET").toUpperCase();
  if (!BACKEND_READY && method !== "GET") {
    if (typeof window !== "undefined") {
      triggerBackendWarning();
    }
    return new Response(
      JSON.stringify({
        error: "Backend is in progress. So please come on later. We can give you best services.",
        status: "backend_in_progress",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }


  const { timeout = 30000, ...fetchOptions } = options;
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (!headers.has("Authorization") && typeof document !== "undefined") {
    const token = document.cookie.split(";").map(part => part.trim()).find(part => part.startsWith("phidim_access_token="));
    if (token) headers.set("Authorization", "Bearer " + decodeURIComponent(token.slice("phidim_access_token=".length)));
  }
  const target = typeof window === "undefined"
    ? (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://service.phidimservice.com.np").replace(/\/+$/, "") + relativePath
    : "/api/backend" + relativePath;
  return fetch(target, {
    ...fetchOptions,
    headers,
    credentials: options.credentials || "same-origin",
    signal: options.signal || AbortSignal.timeout(timeout),
  });
}

export default fetchWithFailover;
