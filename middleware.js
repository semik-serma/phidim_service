import { NextResponse } from "next/server";
import { dashboardPathFor, hasRole } from "./lib/auth/roles";
import { ACCESS_COOKIE, verifyAccessToken } from "./lib/auth/token";
import { DASHBOARD_ALIASES, PAGE_ROUTE_RULES, findRoleRule } from "./lib/auth/config";

const PUBLIC_EXACT = new Set([
  "/",
  "/sitemap.xml",
  "/sw.js",
  "/favicon.ico",
  "/logo.png",
  "/apple-touch-icon.png",
  "/site.webmanifest",
  "/robots.txt",
]);

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/401",
  "/403",
  "/services",
  "/phidim",
  "/panchthar",
  "/_next",
];

function isPublic(pathname) {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  // APIs enforce their own authorization; public pages need no session lookup.
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }
  const isAuthPage = ["/system", "/login", "/register", "/forgot-password", "/reset-password"].includes(pathname);
  const canonical = DASHBOARD_ALIASES[pathname] || pathname;
  const rule = findRoleRule(PAGE_ROUTE_RULES, canonical);
  if (!isAuthPage && (isPublic(pathname) || (!rule && canonical !== "/dashboard"))) {
    return NextResponse.next();
  }
  const user = await verifyAccessToken(request.cookies.get(ACCESS_COOKIE)?.value);
  if (isAuthPage) {
    return user
      ? NextResponse.redirect(new URL(dashboardPathFor(user.role), request.url))
      : NextResponse.next();
  }
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", canonical);
    return NextResponse.redirect(loginUrl);
  }
  if (canonical === "/dashboard" || (rule && !hasRole(user, rule.roles))) {
    return NextResponse.redirect(new URL(dashboardPathFor(user.role), request.url));
  }
  if (canonical !== pathname) {
    return NextResponse.redirect(new URL(canonical, request.url));
  }
  return NextResponse.next();
}

// Do not exclude protected paths merely because they contain a file extension.
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
