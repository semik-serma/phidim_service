import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";
import * as roles from "../lib/auth/roles.js";
import { verifyAccessToken } from "../lib/auth/token.js";
import { DASHBOARD_PATHS } from "../lib/auth/roles.js";

// Next resolves extensionless imports at build time. Resolve them for Node tests
// while executing the actual middleware and session implementations unchanged.
async function importNextModule(path) {
  const url = new URL(path, import.meta.url);
  const source = (await readFile(url, "utf8"))
    .replaceAll('"next/server"', '"next/server.js"')
    .replaceAll('"next/headers"', '"next/headers.js"')
    .replace(/from "(\.\.?\/[^"\n]+)"/g, (_, spec) => `from "${new URL(spec.endsWith(".js") ? spec : `${spec}.js`, url).href}"`);
  // Bare Next imports must be resolved before using a data URL.
  const resolved = source.replace(/"(next\/[^"\n]+)"/g, (_, spec) => `"${import.meta.resolve(spec)}"`);
  return import(`data:text/javascript;base64,${Buffer.from(resolved).toString("base64")}`);
}

const configSource = (await readFile(new URL("../lib/auth/config.js", import.meta.url), "utf8"))
  .replace('"./roles"', `"${new URL("../lib/auth/roles.js", import.meta.url).href}"`);
const configUrl = `data:text/javascript;base64,${Buffer.from(configSource).toString("base64")}`;
const middlewareSource = (await readFile(new URL("../middleware.js", import.meta.url), "utf8"))
  .replace('"./lib/auth/config"', `"${configUrl}"`)
  .replace('"next/server"', `"${import.meta.resolve("next/server.js")}"`)
  .replace(/"\.\/lib\/auth\/(roles|token)"/g, (_, name) => `"${new URL(`../lib/auth/${name}.js`, import.meta.url).href}"`);
const { middleware } = await import(`data:text/javascript;base64,${Buffer.from(middlewareSource).toString("base64")}`);
const { getSessionUser } = await importNextModule("../lib/auth/session.js");

function token(role = "c", extra = {}) {
  const payload = { token_type: "access", user_id: "8", role, exp: Math.floor(Date.now() / 1000) + 300, ...extra };
  return `e30.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.signature`;
}
function request(path, accessToken, extraCookies = {}) {
  const url = new URL(path, "http://localhost:3000");
  const cookies = { ...extraCookies, phidim_access_token: accessToken };
  return { nextUrl: url, url: url.href, cookies: { get: (key) => cookies[key] ? { value: cookies[key] } : undefined } };
}
const originalFetch = globalThis.fetch;
test.after(() => { globalThis.fetch = originalFetch; });

test("all dashboard roles and nested routes enforce the access matrix", async () => {
  globalThis.fetch = async () => new Response("{}", { status: 200 });
  for (const [role, own] of [["c", "USER"], ["t", "TECHNICIAN"], ["a", "ADMIN"]]) {
    for (const target of ["USER", "TECHNICIAN", "ADMIN"]) {
      for (const path of [DASHBOARD_PATHS[target], `/${target.toLowerCase()}/settings`, `/${target.toLowerCase()}/private.js`]) {
        const response = await middleware(request(path, token(role)));
        const allowed = own === "ADMIN" || own === target;
        assert.equal(response.status, allowed ? 200 : 307, `${role} -> ${path}`);
        if (!allowed) assert.equal(new URL(response.headers.get("location")).pathname, DASHBOARD_PATHS[own]);
      }
    }
  }
});

test("legacy aliases check roles before redirecting", async () => {
  globalThis.fetch = async () => new Response("{}", { status: 200 });
  for (const role of ["c", "t", "a"]) {
    const own = role === "c" ? "USER" : role === "t" ? "TECHNICIAN" : "ADMIN";
    for (const [path, target] of [["/user-dashboard", "USER"], ["/technician-dashboard", "TECHNICIAN"], ["/dashboard/user", "USER"], ["/dashboard/technician", "TECHNICIAN"], ["/dashboard/admin", "ADMIN"]]) {
      const response = await middleware(request(path, token(role)));
      assert.equal(new URL(response.headers.get("location")).pathname, DASHBOARD_PATHS[own === "ADMIN" || own === target ? target : own]);
    }
  }
});

test("forged browser cookies and query parameters cannot authenticate", async () => {
  const forged = JSON.stringify({ id: "8", role: "ADMIN" });
  const response = await middleware(request(`/admin/dashboard?user=${encodeURIComponent(forged)}&auth_token=${token("a")}`, null, { phidim_auth_user: forged }));
  assert.equal(new URL(response.headers.get("location")).pathname, "/login");
  const session = await getSessionUser({ request: new Request("http://localhost:3000", { headers: { cookie: `phidim_auth_user=${encodeURIComponent(forged)}` } }) });
  assert.equal(session, null);
});

test("session uses the verified Django user_id and role despite conflicting user cookies", async () => {
  globalThis.fetch = async (url, options) => {
    assert.ok(url.endsWith("/token/verify/"));
    assert.equal(options.cache, "no-store");
    assert.equal(JSON.parse(options.body).token, token("t"));
    return new Response("{}", { status: 200 });
  };
  const session = await getSessionUser({ request: new Request("http://localhost:3000", { headers: { cookie: `phidim_access_token=${token("t")}; phidim_auth_user=%7B%22role%22%3A%22ADMIN%22%7D` } }) });
  assert.equal(session.user.id, "8");
  assert.equal(session.user.role, "TECHNICIAN");
  assert.equal(session.user.dashboardPath, "/technician/dashboard");
});

test("refresh, expired, malformed and incomplete tokens fail before verification", async () => {
  globalThis.fetch = async () => { assert.fail("Invalid access claims must not reach Django"); };
  for (const value of [null, "broken", token("t", { token_type: "refresh" }), token("a", { exp: 1 }), token("unknown"), token("t", { role: null }), token("t", { user_id: null }), token("t", { exp: null })]) {
    assert.equal(await verifyAccessToken(value), null);
  }
});

test("Django rejects invalid signatures and outages never permit dashboard access", async () => {
  for (const status of [401, 403, 500]) {
    globalThis.fetch = async () => new Response("{}", { status });
    assert.equal(await verifyAccessToken(token("a")), null);
    const response = await middleware(request("/admin/dashboard", token("a")));
    assert.equal(new URL(response.headers.get("location")).pathname, "/login");
  }
  globalThis.fetch = async () => { throw new Error("Backend unavailable"); };
  assert.equal(await verifyAccessToken(token("a")), null);
});

test("client guard renders no dashboard during loading, missing sessions, or wrong roles", async () => {
  const require = createRequire(import.meta.url);
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const { transform } = require("next/dist/build/swc");
  const source = await readFile(new URL("../components/RoleGuard.js", import.meta.url), "utf8");
  const compiled = await transform(source, {
    filename: "RoleGuard.jsx",
    jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "classic" } } },
    module: { type: "commonjs" },
  });
  let state;
  const module = { exports: {} };
  vm.runInNewContext(compiled.code, {
    module, exports: module.exports, React,
    require: (name) => {
      if (name === "react") return { ...React, useEffect: () => {} };
      if (name === "next/navigation") return { useRouter: () => ({ replace() {} }), usePathname: () => "/admin/dashboard" };
      if (name === "@/context/AuthContext") return { useAuth: () => state };
      if (name === "@/lib/auth/roles") return roles;
      if (name === "lucide-react") return { Loader2: () => null };
      throw new Error(`Unexpected import ${name}`);
    },
    // Even a forged cached session must not cause children to render.
    window: { localStorage: { getItem: () => '{"role":"ADMIN"}' } },
  });
  const guard = module.exports.default;
  for (const [userRole, allowedRole, loading, authenticated, expected] of [
    ["ADMIN", "ADMIN", true, true, false],
    [null, "ADMIN", false, false, false],
    ["USER", "ADMIN", false, true, false],
    ["TECHNICIAN", "USER", false, true, false],
    ["USER", "TECHNICIAN", false, true, false],
    ["USER", "USER", false, true, true],
    ["TECHNICIAN", "TECHNICIAN", false, true, true],
    ["ADMIN", "ADMIN", false, true, true],
    ["ADMIN", "USER", false, true, true],
    ["ADMIN", "TECHNICIAN", false, true, true],
  ]) {
    state = { user: userRole ? { role: userRole } : null, isAuthenticated: authenticated, isLoading: loading };
    const allowedRoles = allowedRole === "ADMIN" ? ["ADMIN"] : [allowedRole, "ADMIN"];
    const html = renderToStaticMarkup(guard({ roles: allowedRoles, children: React.createElement("p", null, "PRIVATE_DASHBOARD") }));
    assert.equal(html.includes("PRIVATE_DASHBOARD"), expected, `${userRole} -> ${allowedRole}, loading=${loading}`);
  }
});

test("roleless Google sessions remain valid on later dashboard and session requests", async () => {
  const accessToken = token("c", {role: undefined});
  globalThis.fetch = async (url, options) => {
    if (url.endsWith("/token/verify/")) return new Response("{}");
    assert.ok(url.endsWith("/api/auth/user/"));
    assert.equal(options.headers.Authorization, "Bearer " + accessToken);
    return new Response(JSON.stringify({pk: 8, role: "c", email: "new@example.com"}));
  };
  assert.equal((await middleware(request("/user/dashboard", accessToken))).status, 200);
  const denied = await middleware(request("/admin/dashboard", accessToken));
  assert.equal(new URL(denied.headers.get("location")).pathname, "/user/dashboard");
  const session = await getSessionUser({request: new Request("http://localhost:3000", {headers: {cookie: "phidim_access_token=" + accessToken}})});
  assert.equal(session.user.id, "8");
  assert.equal(session.user.role, "USER");
  assert.equal(session.user.email, "new@example.com");
});
