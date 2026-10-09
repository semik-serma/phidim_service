import test from "node:test";
import assert from "node:assert/strict";
import { startGoogleLogin, finishGoogleLogin } from "../lib/auth/google.js";

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
test.afterEach(() => { globalThis.fetch = originalFetch; for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key]; Object.assign(process.env, originalEnv); });
const request = (path, cookie) => ({ url: "http://localhost:3000" + path, cookies: { get: () => cookie ? { value: cookie } : undefined } });
async function begin(query = "") {
  process.env.GOOGLE_CLIENT_ID = "test-client";
  process.env.GOOGLE_CALLBACK_URL = "http://localhost:3000/auth/google/callback";
  const response = await startGoogleLogin(request("/api/auth/google/start" + query));
  const cookie = response.cookies.get("phidim_google_oauth");
  return { response, cookie: cookie.value, state: JSON.parse(cookie.value).state };
}
const callback = (state) => "/auth/google/callback?code=test-code&state=" + encodeURIComponent(state);
const errorOf = (response) => new URL(response.headers.get("location")).searchParams.get("error");

test("authorization includes requested scopes and protects state with an expiring HttpOnly cookie", async () => {
  const { response } = await begin();
  const url = new URL(response.headers.get("location"));
  assert.equal(url.origin, "https://accounts.google.com");
  for (const [key, value] of Object.entries({client_id: "test-client", redirect_uri: "http://localhost:3000/auth/google/callback", response_type: "code", scope: "openid email profile", access_type: "offline", prompt: "consent"})) assert.equal(url.searchParams.get(key), value);
  assert.equal(response.cookies.get("phidim_google_oauth").httpOnly, true);
  assert.equal(response.cookies.get("phidim_google_oauth").maxAge, 600);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("missing credentials and callback origin mismatch return useful configuration errors", async () => {
  delete process.env.GOOGLE_CLIENT_ID;
  assert.equal(errorOf(await startGoogleLogin(request("/api/auth/google/start"))), "GoogleNotConfigured");
  process.env.GOOGLE_CLIENT_ID = "test";
  process.env.GOOGLE_CALLBACK_URL = "https://other.example/auth/google/callback";
  assert.equal(errorOf(await startGoogleLogin(request("/api/auth/google/start"))), "GoogleCallbackMismatch");
});

test("missing, mismatched, malformed, Unicode and expired state never reach the backend", async () => {
  const { cookie, state } = await begin();
  globalThis.fetch = () => { throw new Error("Must not fetch"); };
  for (const [received, saved] of [[state, undefined], ["bad", cookie], [state, "invalid"], ["é".repeat(state.length), cookie], [state, JSON.stringify({...JSON.parse(cookie), createdAt: Date.now() - 601000})]]) {
    const response = await finishGoogleLogin(request(callback(received), saved));
    assert.equal(errorOf(response), "InvalidOAuthState");
    assert.equal(response.cookies.get("phidim_google_oauth").maxAge, 0);
  }
});

test("cancellation and missing code return to /system", async () => {
  const { cookie, state } = await begin();
  for (const [query, error] of [["error=access_denied", "OAuthAccessDenied"], ["", "NoCodeProvided"]]) {
    const response = await finishGoogleLogin(request("/auth/google/callback?state=" + state + "&" + query, cookie));
    assert.equal(errorOf(response), error);
    assert.equal(new URL(response.headers.get("location")).pathname, "/system");
  }
});

test("posts only the code and creates a session only after Django token verification", async () => {
  const { cookie, state } = await begin();
  process.env.GOOGLE_AUTH_BACKEND_URL = "http://localhost:8000/api/auth/google/";
  process.env.DJANGO_API_URL = "http://localhost:8000";
  const token = "e30." + Buffer.from(JSON.stringify({token_type: "access", user_id: 8, role: "t", exp: Math.floor(Date.now()/1000)+300})).toString("base64url") + ".signature";
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push({url, options}); return new Response(JSON.stringify(calls.length === 1 ? {access: token, refresh: "refresh-token"} : {}), {status: 200}); };
  const response = await finishGoogleLogin(request(callback(state), cookie));
  assert.equal(calls[0].url, process.env.GOOGLE_AUTH_BACKEND_URL);
  assert.deepEqual(JSON.parse(calls[0].options.body), {code: "test-code"});
  assert.equal(calls[1].url, "http://localhost:8000/token/verify/");
  assert.equal(new URL(response.headers.get("location")).pathname, "/technician/dashboard");
  assert.equal(response.cookies.get("phidim_access_token").value, token);
  assert.equal(response.cookies.get("phidim_refresh_token").value, "refresh-token");
  assert.equal(response.cookies.get("phidim_google_oauth").maxAge, 0);
});

test("rejects backend errors, malformed tokens and unreachable backend without creating sessions", async () => {
  const { cookie, state } = await begin();
  for (const [fetcher, error] of [[async () => new Response("{}", {status: 400}), "TokenExchangeFailed"], [async () => new Response('{"access":"invalid"}'), "BackendSessionRequired"], [async () => {throw new Error("offline");}, "CallbackException"]]) {
    globalThis.fetch = fetcher;
    const response = await finishGoogleLogin(request(callback(state), cookie));
    assert.equal(errorOf(response), error);
    assert.equal(response.cookies.get("phidim_access_token"), undefined);
  }
});

test("preserves the home return destination", async () => {
  const { cookie } = await begin("?redirect=/");
  assert.equal(JSON.parse(cookie).returnHome, true);
  const other = await begin("?redirect=https://other.example");
  assert.equal(JSON.parse(other.cookie).returnHome, false);
});

test("new Google accounts accept roleless Simple JWT and cookie-only refresh tokens", async () => {
  const { cookie, state } = await begin();
  process.env.DJANGO_API_URL = "http://localhost:8000";
  delete process.env.DJANGO_AUTH_USER_URL;
  const token = "e30." + Buffer.from(JSON.stringify({token_type: "access", user_id: "17", exp: Math.floor(Date.now()/1000)+300})).toString("base64url") + ".signature";
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({url, options});
    if (url.endsWith("/api/auth/google/")) return new Response(JSON.stringify({access: token, refresh: "", user: {pk: 17, role: "a"}}), {headers: {"Set-Cookie": "access=" + token + "; expires=Fri, 09 Oct 2026 10:12:41 GMT; HttpOnly; Path=/, refresh=cookie-refresh; expires=Sat, 10 Oct 2026 10:07:41 GMT; HttpOnly; Path=/"}});
    if (url.endsWith("/token/verify/")) return new Response("{}");
    assert.equal(url, "http://localhost:8000/api/auth/user/");
    assert.equal(options.headers.Authorization, "Bearer " + token);
    return new Response(JSON.stringify({pk: 17, role: "c", email: "new@example.com"}));
  };
  const response = await finishGoogleLogin(request(callback(state), cookie));
  assert.equal(new URL(response.headers.get("location")).pathname, "/user/dashboard");
  assert.equal(response.cookies.get("phidim_access_token").value, token);
  assert.equal(response.cookies.get("phidim_refresh_token").value, "cookie-refresh");
  assert.equal(response.cookies.get("phidim_refresh_token").httpOnly, true);
  assert.equal(calls.length, 3);
});

test("roleless Google tokens fail closed for unavailable, mismatched or invalid user details", async () => {
  const { cookie, state } = await begin();
  delete process.env.DJANGO_AUTH_USER_URL;
  const token = "e30." + Buffer.from(JSON.stringify({token_type: "access", user_id: 17, exp: Math.floor(Date.now()/1000)+300})).toString("base64url") + ".signature";
  for (const [status, profile] of [[401, {}], [500, {}], [200, {pk: 18, role: "a"}], [200, {pk: 17, role: "unknown"}], [200, {pk: 17}]]) {
    globalThis.fetch = async (url) => {
      if (url.endsWith("/api/auth/google/")) return new Response(JSON.stringify({access: token, user: {pk: 17, role: "a"}}));
      if (url.endsWith("/token/verify/")) return new Response("{}");
      return new Response(JSON.stringify(profile), {status});
    };
    const response = await finishGoogleLogin(request(callback(state), cookie));
    assert.equal(errorOf(response), "BackendSessionRequired");
    assert.equal(response.cookies.get("phidim_access_token"), undefined);
  }
});
