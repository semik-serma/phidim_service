// Sessions are authorized by Django Simple JWT verification, not browser profile cookies.
import { cookies as nextCookies } from "next/headers";
import { dashboardPathFor, normalizeRole, ROLES } from "./roles";
import { ACCESS_COOKIE, verifyAccessToken } from "./token";
export { ACCESS_COOKIE, verifyAccessToken } from "./token";
export const SESSION_COOKIE = ACCESS_COOKIE;
export const VALID_ROLES = Object.freeze(Object.values(ROLES));

/** Shape of the user object safe to hand to the client. */
export function toClientUser(user) {
  const role = normalizeRole(user?.role) || ROLES.USER;
  return {
    id: user._id?.toString ? user._id.toString() : (user._id || user.id || user.email),
    name: user.name || "",
    displayName: user.displayName || user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    role,
    status: user.status || "active",
    avatar: user.avatar || "",
    dashboardPath: dashboardPathFor(role),
  };
}

/**
 * Reads the access token from a Request (route handler / server action)
 * or, when no Request is given, from the implicit cookies() store
 * (server components).
 */
async function getAccessToken({ request } = {}) {
  if (request) {
    // Authorization: Bearer <token> takes precedence (API clients).
    const auth = request.headers?.get?.("authorization") || "";
    if (auth.toLowerCase().startsWith("bearer ")) {
      return auth.slice(7).trim() || null;
    }
    // Cookie header (route handlers receive a standard Request).
    const cookieHeader = request.headers?.get?.("cookie") || "";
    for (const part of cookieHeader.split(";")) {
      const [k, ...rest] = part.trim().split("=");
      if (k === ACCESS_COOKIE) return rest.join("=") || null;
    }
    return null;
  }

  try {
    const store = await nextCookies();
    return store.get(ACCESS_COOKIE)?.value || null;
  } catch (e) {
    return null;
  }
}

export async function getSessionUser({ request } = {}) {
  const token = await getAccessToken({ request });
  const decoded = await verifyAccessToken(token);
  if (!decoded) return null;
  return {
    token,
    decoded,
    user: toClientUser({ ...decoded, id: String(decoded.user_id) }),
  };
}

/** Best-effort client IP for audit logs (route handlers only). */
export function clientIpFromRequest(request) {
  if (!request) return "";
  const forwarded = request.headers?.get?.("x-forwarded-for") || "";
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  return request.headers?.get?.("x-real-ip") || request.headers?.get?.("cf-connecting-ip") || "";
}
