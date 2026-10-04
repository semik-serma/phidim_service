/**
 * ============================================================
 * RBAC — CENTRAL ROLE DEFINITIONS (single source of truth)
 * ============================================================
 *
 * This module is intentionally PURE JavaScript with NO Next.js or
 * Node-only imports so it can be required from:
 *   - middleware (Edge runtime)
 *   - server components
 *   - route handlers / server actions
 *   - the (legacy) Express-style auth layer under src/server
 *
 * If a new role is ever added, it must be defined here FIRST,
 * then wired into: ROUTE_ACCESS_RULES (config.js), the User model
 * enum, and the dashboard redirects.
 */

export const ROLES = Object.freeze({
  USER: "USER",
  TECHNICIAN: "TECHNICIAN",
  ADMIN: "ADMIN",
});

export const ALL_ROLES = Object.freeze(Object.values(ROLES));

export function normalizeRole(role) {
  if (role == null) return null;
  const value = String(role).trim().toLowerCase();

  if (value === "c" || value === "customer" || value === "user") {
    return ROLES.USER;
  }
  if (value === "t" || value === "technician") {
    return ROLES.TECHNICIAN;
  }
  if (value === "a" || value === "admin") {
    return ROLES.ADMIN;
  }

  return null;
}

/**
 * Canonical dashboard path per role. Login redirection, the middleware
 * and every role guard redirect based on these exact paths, so the
 * role -> URL mapping lives in ONE place.
 */
export const DASHBOARD_PATHS = Object.freeze({
  USER: "/user/dashboard",
  TECHNICIAN: "/technician/dashboard",
  ADMIN: "/admin/dashboard",
});

export function dashboardPathFor(role) {
  return DASHBOARD_PATHS[normalizeRole(role)] || DASHBOARD_PATHS.USER;
}

/**
 * Which roles may open each dashboard. Admins are allowed on every
 * dashboard; a USER must never see the technician/admin dashboards and
 * a TECHNICIAN must never see the user/admin dashboards.
 */
export const DASHBOARD_ROLES = Object.freeze({
  "/user/dashboard": [ROLES.USER, ROLES.ADMIN],
  "/technician/dashboard": [ROLES.TECHNICIAN, ROLES.ADMIN],
  "/admin/dashboard": [ROLES.ADMIN],
  [DASHBOARD_PATHS.USER]: [ROLES.USER, ROLES.ADMIN],
  [DASHBOARD_PATHS.TECHNICIAN]: [ROLES.TECHNICIAN, ROLES.ADMIN],
  [DASHBOARD_PATHS.ADMIN]: [ROLES.ADMIN],
});

export function hasRole(user, allowedRoles) {
  if (!user || !user.role) return false;
  const userRole = normalizeRole(user.role);
  if (!userRole) return false;
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) return true;
  const normalized = allowedRoles.map((r) => normalizeRole(r)).filter(Boolean);
  return normalized.includes(userRole);
}
