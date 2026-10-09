import { randomBytes, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server.js";
import { verifyAccessToken } from "./token.js";
import { dashboardPathFor } from "./roles.js";

const STATE_COOKIE = "phidim_google_oauth";
const STATE_TTL = 600;
const noStore = { "Cache-Control": "no-store" };

function cookieOptions(request) {
  return { path: "/", httpOnly: true, sameSite: "lax", secure: new URL(request.url).protocol === "https:" };
}

function fail(request, error) {
  const url = new URL("/system", request.url);
  url.searchParams.set("error", error);
  const response = NextResponse.redirect(url, { status: 303, headers: noStore });
  response.cookies.set(STATE_COOKIE, "", { ...cookieOptions(request), maxAge: 0 });
  return response;
}

// Preserve separate Set-Cookie headers and commas inside Expires attributes.
function backendCookie(headers, name) {
  const values = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [headers.get("set-cookie") || ""];
  for (const value of values) {
    const match = value.match(new RegExp("(?:^|,\\s*)" + name + "=([^;,]*)"));
    if (match?.[1]) return match[1];
  }
  return "";
}

export async function startGoogleLogin(request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || clientId === "your-client-id") return fail(request, "GoogleNotConfigured");
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || new URL("/auth/google/callback", request.url).href;
  // Keep the authorization code and session cookies on this application's origin.
  try {
    if (new URL(redirectUri).origin !== new URL(request.url).origin) return fail(request, "GoogleCallbackMismatch");
  } catch { return fail(request, "GoogleCallbackMismatch"); }
  const state = randomBytes(32).toString("base64url");
  const returnHome = new URL(request.url).searchParams.get("redirect") === "/";
  const response = NextResponse.redirect(buildGoogleAuthorizationUrl(clientId, redirectUri, state), { headers: noStore });
  response.cookies.set(STATE_COOKIE, JSON.stringify({ state, redirectUri, returnHome, createdAt: Date.now() }), { ...cookieOptions(request), maxAge: STATE_TTL });
  return response;
}

export function buildGoogleAuthorizationUrl(clientId, redirectUri, state) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: "code", scope: "openid email profile", access_type: "offline", prompt: "consent", state }).toString();
  return url;
}

export async function finishGoogleLogin(request) {
  const params = new URL(request.url).searchParams;
  let pending;
  try { pending = JSON.parse(request.cookies.get(STATE_COOKIE)?.value || "null"); } catch { /* Invalid cookie fails state validation. */ }
  const state = params.get("state") || "";
  const expected = pending?.state;
  if (typeof expected !== "string" || !state || Buffer.byteLength(state) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(state), Buffer.from(expected)) ||
      !Number.isFinite(pending.createdAt) || Date.now() - pending.createdAt > STATE_TTL * 1000 || pending.createdAt > Date.now()) {
    return fail(request, "InvalidOAuthState");
  }
  if (params.has("error")) return fail(request, "OAuthAccessDenied");
  const code = params.get("code");
  if (!code) return fail(request, "NoCodeProvided");

  try {
    const base = (process.env.DJANGO_API_URL || process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000").replace(/\/+$/, "");
    const endpoint = process.env.GOOGLE_AUTH_BACKEND_URL || base + "/api/auth/google/";
    // The backend exchanges the code using its server-side Google client secret.
    const backend = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000),
    });
    if (!backend.ok) return fail(request, "TokenExchangeFailed");
    const data = await backend.json();
    const accessToken = data.access || data.accessToken || data.token;
    const decoded = await verifyAccessToken(accessToken);
    if (!decoded) return fail(request, "BackendSessionRequired");
    const response = NextResponse.redirect(new URL(pending.returnHome ? "/" : dashboardPathFor(decoded.role), request.url), { status: 303, headers: noStore });
    const options = { ...cookieOptions(request), httpOnly: false, maxAge: Math.max(0, Math.floor(decoded.exp - Date.now() / 1000)) };
    response.cookies.set("phidim_access_token", accessToken, options);
    response.cookies.set("phidim_jwt_token", accessToken, options);
    const refreshToken = data.refresh || data.refreshToken || backendCookie(backend.headers, "refresh");
    if (typeof refreshToken === "string" && refreshToken) response.cookies.set("phidim_refresh_token", refreshToken, { ...cookieOptions(request), maxAge: 86400 });
    response.cookies.set(STATE_COOKIE, "", { ...cookieOptions(request), maxAge: 0 });
    return response;
  } catch {
    return fail(request, "CallbackException");
  }
}
