import { normalizeRole } from "./roles.js";

export const ACCESS_COOKIE = "phidim_access_token";

// Safe for both middleware (Edge) and server components. Decoding alone
// never authenticates a session: Django must accept the exact token first.
export async function verifyAccessToken(token) {
  if (typeof token !== "string" || !token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    const role = normalizeRole(payload.role);
    if (
      payload.token_type !== "access" || !role ||
      typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now() ||
      !["string", "number"].includes(typeof payload.user_id) ||
      String(payload.user_id).trim() === ""
    ) return null;

    const base = (process.env.DJANGO_API_URL || process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000").replace(/\/+$/, "");
    const response = await fetch(`${base}/token/verify/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (response.status !== 200 || payload.exp * 1000 <= Date.now()) return null;
    return { ...payload, role };
  } catch {
    return null;
  }
}
