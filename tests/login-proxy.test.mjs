import test from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/auth/login/route.js";

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
test.afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const key of ["DJANGO_API_URL", "NEXT_PUBLIC_DJANGO_API_URL"]) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});
const request = (body = { email: "user@example.com", password: "password" }, origin = "https://cp186v31-3000.inc1.devtunnels.ms") => new Request(`${origin}/api/auth/login`, {
  method: "POST", headers: { "Content-Type": "application/json", Cookie: "unrelated=secret" }, body: JSON.stringify(body),
});

test("local and tunneled login reach the server backend without forwarding browser headers", async () => {
  process.env.DJANGO_API_URL = "http://127.0.0.1:8000/";
  process.env.NEXT_PUBLIC_DJANGO_API_URL = "https://other.example";
  const tokens = { access: "access-token", refresh: "refresh-token", user: { role: "c" } };
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://127.0.0.1:8000/login/");
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), { email: "user@example.com", password: "password" });
    assert.deepEqual(options.headers, { "Content-Type": "application/json" });
    assert.equal(options.cache, "no-store");
    assert.equal(options.redirect, "error");
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json(tokens);
  };
  for (const origin of ["http://localhost:3000", "https://cp186v31-3000.inc1.devtunnels.ms"]) {
    const response = await POST(request({ email: "user@example.com", password: "password", role: "ADMIN" }, origin));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), tokens);
  }
});

test("backend credential and lockout errors retain their status and details", async () => {
  delete process.env.DJANGO_API_URL;
  process.env.NEXT_PUBLIC_DJANGO_API_URL = "http://localhost:8000/";
  for (const status of [400, 401, 403, 429]) {
    const data = { detail: "Login rejected", locked: true, retryAfterSeconds: 60 };
    globalThis.fetch = async (url) => {
      assert.equal(url, "http://localhost:8000/login/");
      return Response.json(data, { status });
    };
    const response = await POST(request());
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), data);
  }
});

test("invalid input never reaches Django", async () => {
  globalThis.fetch = () => assert.fail("Unexpected backend request");
  for (const req of [request(null), request({ email: "user" }), new Request("http://localhost/api/auth/login", { method: "POST", body: "{" })]) {
    assert.equal((await POST(req)).status, 400);
  }
});

test("backend outages and non-JSON responses return a useful 502", async () => {
  for (const fetcher of [async () => { throw new TypeError("offline"); }, async () => new Response("<html>Bad Gateway</html>", { status: 502 })]) {
    globalThis.fetch = fetcher;
    const response = await POST(request());
    assert.equal(response.status, 502);
    assert.match((await response.json()).detail, /Django is running/);
  }
});
