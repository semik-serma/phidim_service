import test from "node:test";
import assert from "node:assert/strict";
import { proxyBackend } from "../lib/backendProxy.js";
import { djangoBrowserUrl, djangoFetch } from "../lib/djangoClient.js";
import { fetchTechnicians, postBooking } from "../services/bookingService.js";
import { fetchNewestDjangoArticle } from "../services/articleService.js";
import { fetchWithFailover } from "../lib/apiClient.js";
import { GET as djangoRoute } from "../app/api/django/[...path]/route.js";
import { GET as legacyRoute } from "../app/api/backend/[...path]/route.js";
import nextConfig from "../next.config.mjs";

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
test.afterEach(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.window;
  delete globalThis.document;
  for (const key of ["BACKEND_API_URL", "DJANGO_API_URL"]) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});
const context = path => ({ params: Promise.resolve({ path }) });
const proxy = (request, path) => proxyBackend(request, context(path), "http://127.0.0.1:8000", "/api/django");

test("proxy preserves methods, query, credentials, JSON and multipart bytes without forwarding host or cookies", async () => {
  for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]) {
    const body = ["GET", "HEAD"].includes(method) ? undefined : "raw multipart or JSON bytes";
    const request = new Request("https://frontend.example/api/django/bookings/?page=2", { method, body, headers: { Authorization: "Bearer test", "Content-Type": "multipart/form-data; boundary=test", Cookie: "private=secret", Host: "frontend.example" } });
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "http://127.0.0.1:8000/bookings/?page=2");
      assert.equal(options.method, method);
      assert.equal(options.headers.get("authorization"), "Bearer test");
      assert.equal(options.headers.get("cookie"), null);
      assert.equal(options.headers.get("host"), null);
      if (body) assert.equal(new TextDecoder().decode(options.body), body);
      return new Response(method === "HEAD" ? null : "backend response", { status: 200, headers: { "Content-Type": "application/json", "Retry-After": "60" } });
    };
    const response = await proxy(request, ["bookings"]);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("retry-after"), "60");
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
});

test("proxy streams media, preserves errors and no-content responses, and rewrites backend redirects", async () => {
  const request = new Request("https://frontend.example/api/django/media/a.png");
  globalThis.fetch = async () => new Response(new Uint8Array([0, 255, 3]), { status: 206, headers: { "Content-Type": "image/png", "Content-Range": "bytes 0-2/3" } });
  assert.deepEqual(new Uint8Array(await (await proxy(request, ["media", "a.png"])).arrayBuffer()), new Uint8Array([0, 255, 3]));
  for (const status of [204, 400, 401, 403, 429, 500]) {
    globalThis.fetch = async () => new Response(status === 204 ? null : "original error", { status });
    assert.equal((await proxy(request, ["media", "a.png"])).status, status);
  }
  globalThis.fetch = async () => new Response(null, { status: 301, headers: { location: "/media/a.png/?page=2" } });
  assert.equal((await proxy(request, ["media", "a.png"])).headers.get("location"), "/api/django/media/a.png/?page=2");
  globalThis.fetch = async () => new Response(null, { status: 302, headers: { location: "https://other.example/" } });
  assert.equal((await proxy(request, ["media", "a.png"])).status, 502);
});

test("proxy rejects unsafe paths and reports backend outages", async () => {
  globalThis.fetch = () => assert.fail("Unsafe paths must not fetch");
  for (const path of [[".."], ["//other.example"], ["a\\b"]]) assert.equal((await proxy(new Request("https://frontend.example/api/django/a"), path)).status, 400);
  globalThis.fetch = async () => { throw new TypeError("offline"); };
  assert.equal((await proxy(new Request("https://frontend.example/api/django/a"), ["a"])).status, 502);
});

test("browser Django transport routes loopback URLs through the frontend and leaves external images alone", async () => {
  globalThis.window = { location: { origin: "https://frontend.example" } };
  assert.equal(djangoBrowserUrl("http://127.0.0.1:8000/media/a.jpg"), "/api/django/media/a.jpg");
  assert.equal(djangoBrowserUrl("https://images.example/a.jpg"), "https://images.example/a.jpg");
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/django/bookings/?page=2");
    assert.equal(options.headers.Authorization, "Bearer token");
    return Response.json([]);
  };
  await djangoFetch("http://localhost:8000/bookings/?page=2", { headers: { Authorization: "Bearer token" } });
});

test("real services proxy pagination, backend images and authenticated booking submissions in the browser", async () => {
  globalThis.window = {};
  const urls = [];
  globalThis.fetch = async url => {
    urls.push(url);
    return Response.json(urls.length === 1 ? { results: [{ id: 1, profile: {} }], next: "?page=2" } : { results: [{ id: 2, profile: {} }], next: null });
  };
  assert.equal((await fetchTechnicians()).length, 2);
  assert.deepEqual(urls, ["/api/django/technicians/", "/api/django/technicians/?page=2"]);
  globalThis.fetch = async url => {
    assert.equal(url, "/api/django/articles/");
    return Response.json([{ id: 1, image: "http://127.0.0.1:8000/media/a.png" }]);
  };
  assert.equal((await fetchNewestDjangoArticle()).image, "/api/django/media/a.png");
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/django/bookings/");
    assert.equal(options.headers.Authorization, "Bearer token");
    assert.equal(options.method, "POST");
    return Response.json({ id: 1, status: "p" }, { status: 201 });
  };
  await postBooking({ technicianId: 1, latitude: "27", longitude: "87", date: "2026-10-14", time: "12:00", notes: "Repair" }, { token: "token" });
});

test("legacy browser client uses one same-origin request with the access token, and server calls use an absolute backend URL", async () => {
  globalThis.window = {};
  globalThis.document = { cookie: "other=value; phidim_access_token=access-token" };
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/backend/api/users/search?q=test");
    assert.equal(options.headers.get("authorization"), "Bearer access-token");
    assert.equal(options.credentials, "same-origin");
    return Response.json([]);
  };
  await fetchWithFailover("/api/users/search?q=test");
  delete globalThis.window;
  process.env.BACKEND_API_URL = "http://localhost:5000/";
  globalThis.fetch = async url => {
    assert.equal(url, "http://localhost:5000/api/users/search");
    return Response.json([]);
  };
  await fetchWithFailover("/api/users/search");
});

test("both catch-all routes use their configured backend and preserve trailing slashes", async () => {
  process.env.DJANGO_API_URL = "http://127.0.0.1:8000";
  process.env.BACKEND_API_URL = "http://localhost:5000";
  const targets = [];
  globalThis.fetch = async url => { targets.push(url); return Response.json([]); };
  assert.equal((await djangoRoute(new Request("https://frontend.example/api/django/services/?service-area=1"), context(["services"]))).status, 200);
  assert.equal((await legacyRoute(new Request("https://frontend.example/api/backend/api/chat/messages"), context(["api", "chat", "messages"]))).status, 200);
  assert.deepEqual(targets, ["http://127.0.0.1:8000/services/?service-area=1", "http://localhost:5000/api/chat/messages"]);
});

test("legacy rewrite is a fallback so it cannot intercept the Django and backend API routes", async () => {
  const rewrites = await nextConfig.rewrites();
  assert.equal(nextConfig.skipTrailingSlashRedirect, true);
  assert.deepEqual(rewrites.afterFiles.map(rule => rule.source), ["/api/realtime/:path*"]);
  assert.deepEqual(rewrites.fallback.map(rule => rule.source), ["/api/:path*"]);
});
