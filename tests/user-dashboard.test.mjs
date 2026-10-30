import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { transform } = require("next/dist/build/swc");
const source = await readFile(new URL("../components/user-dashboard/UserDashboardNewUI.js", import.meta.url), "utf8");
const compiled = await transform(source, {
  filename: "UserDashboardNewUI.jsx",
  jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "classic" } } },
  module: { type: "commonjs" },
});

const tick = () => new Promise(resolve => setImmediate(resolve));

function dashboardHarness(fetchBookings = async () => []) {
  const states = [];
  let hookIndex = 0;
  let effect;
  let logoutCalls = 0;
  const auth = { user: { id: 1, email: "customer@example.com", role: "USER" }, isAuthenticated: true, isLoading: false, logout: () => { logoutCalls++; } };
  const module = { exports: {} };
  vm.runInNewContext(compiled.code, {
    React, AbortController, module, exports: module.exports,
    require: name => {
      if (name === "react") return {
        ...React,
        useState: initial => {
          const index = hookIndex++;
          if (states[index] === undefined) states[index] = initial;
          return [states[index], value => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
        },
        useEffect: callback => { effect = callback; },
      };
      if (name === "@/context/AuthContext") return { useAuth: () => auth };
      if (name === "@/services/bookingService") return { fetchBookings };
      if (name === "./BookingLiveLocationButton") return { __esModule: true, default: ({ bookingId }) => React.createElement("button", { "data-booking-id": bookingId }, "Show live location") };
      if (name === "lucide-react") return Object.fromEntries(["LogOut", "BriefcaseBusiness", "ChevronLeft", "ChevronRight", "Menu", "ShieldCheck", "X"].map(name => [name, () => null]));
      if (name.endsWith(".module.css")) return {};
      throw new Error(`Unexpected dashboard dependency: ${name}`);
    },
  });
  const tree = () => { hookIndex = 0; return module.exports.default(); };
  return {
    auth,
    tree,
    html: () => renderToStaticMarkup(tree()),
    mount: () => { tree(); return effect(); },
    get logoutCalls() { return logoutCalls; },
  };
}

function findElement(element, predicate) {
  if (!React.isValidElement(element)) return null;
  if (predicate(element)) return element;
  for (const child of React.Children.toArray(element.props.children)) {
    const found = findElement(child, predicate);
    if (found) return found;
  }
  return null;
}

test("dashboard keeps sidebar navigation, a working Logout button and a plain bookings list", async () => {
  const dashboard = dashboardHarness();
  dashboard.mount();
  assert.match(dashboard.html(), /Loading bookings/);
  await tick();
  const html = dashboard.html();
  assert.match(html, /My Bookings/);
  assert.match(html, /No bookings yet/);
  assert.match(html, /<aside/);
  assert.match(html, /User dashboard navigation/);
  assert.match(html, /aria-current="page"/);
  assert.doesNotMatch(html, /<input|role="dialog"|Book Service|Track|Chat|Settings|Notifications|Switch to|Show map|maps\.google|Latitude|Longitude/);
  findElement(dashboard.tree(), element => element.props["aria-label"] === "Logout").props.onClick();
  assert.equal(dashboard.logoutCalls, 1);
});

test("dashboard fetches and renders every API booking with backend fields and Nepal time", async () => {
  const bookings = Array.from({ length: 6 }, (_, index) => ({
    id: 100 + index, problem_details: `Service ${index}`, status: "p", status_display: "pending",
    technician: index ? null : { first_name: "Ram", last_name: "Shrestha" },
    date: index ? null : "2026-10-14T04:48:00Z", amount: index === 0 ? 0 : undefined,
  }));
  let signal;
  const dashboard = dashboardHarness(async options => { signal = options.signal; return bookings; });
  const cleanup = dashboard.mount();
  await tick();
  const html = dashboard.html();
  for (const booking of bookings) assert.ok(html.includes(booking.problem_details));
  assert.match(html, /6 bookings/);
  assert.match(html, /Ram Shrestha/);
  assert.equal((html.match(/Show live location/g) || []).length, 6);
  assert.match(html, /data-booking-id="100"/);
  assert.match(html, /pending/);
  assert.match(html, /14 Oct 2026, 10:33 am \(Nepal time\)/);
  assert.match(html, /<td>0<\/td>/);
  assert.match(html, /Not assigned/);
  assert.match(html, /Not scheduled/);
  cleanup();
  assert.equal(signal.aborted, true);
});

test("changing or missing user identity never displays the previous customer's bookings", async () => {
  let calls = 0;
  const dashboard = dashboardHarness(async () => { calls++; return [{ id: 1, problem_details: "PRIVATE" }]; });
  const cleanup = dashboard.mount();
  await tick();
  assert.match(dashboard.html(), /PRIVATE/);
  cleanup();
  dashboard.auth.user = { id: 2, email: "another@example.com", role: "USER" };
  assert.doesNotMatch(dashboard.html(), /PRIVATE/);
  dashboard.mount();
  assert.equal(calls, 2);
  dashboard.auth.user = null;
  assert.doesNotMatch(dashboard.html(), /PRIVATE/);
});

test("failed requests show an error and retry fetches again", async () => {
  let calls = 0;
  const dashboard = dashboardHarness(async () => {
    if (++calls === 1) throw new Error("Your session expired. Please sign in again.");
    return [];
  });
  dashboard.mount();
  await tick();
  assert.match(dashboard.html(), /role="alert"/);
  assert.match(dashboard.html(), /Your session expired/);
  assert.doesNotMatch(dashboard.html(), /No bookings yet/);
  findElement(dashboard.tree(), element => element.type === "button" && element.props.children === "Retry").props.onClick();
  assert.match(dashboard.html(), /Loading bookings/);
  dashboard.mount();
  await tick();
  assert.equal(calls, 2);
  assert.match(dashboard.html(), /No bookings yet/);
});

test("unmounted and superseded requests cannot restore stale bookings", async () => {
  let resolve;
  const dashboard = dashboardHarness(() => new Promise(done => { resolve = done; }));
  const cleanup = dashboard.mount();
  cleanup();
  resolve([{ id: 1, problem_details: "STALE" }]);
  await tick();
  assert.doesNotMatch(dashboard.html(), /STALE/);
});

test("dashboard waits for authentication and does not fetch for unauthorized roles", () => {
  const dashboard = dashboardHarness(() => assert.fail("Unexpected booking request"));
  dashboard.auth.isLoading = true;
  dashboard.mount();
  assert.equal(dashboard.html(), "");
  dashboard.auth.isLoading = false;
  dashboard.auth.user.role = "TECHNICIAN";
  dashboard.mount();
  assert.equal(dashboard.html(), "");
  dashboard.auth.user.role = "USER";
  dashboard.auth.isAuthenticated = false;
  dashboard.mount();
  assert.equal(dashboard.html(), "");
});

test("sidebar can collapse and mobile navigation can open and close", () => {
  const dashboard = dashboardHarness();
  dashboard.mount();
  const button = label => findElement(dashboard.tree(), element => element.props["aria-label"] === label);
  button("Collapse sidebar").props.onClick();
  assert.ok(button("Expand sidebar"));
  button("Open sidebar navigation").props.onClick();
  assert.equal(button("Open sidebar navigation").props["aria-expanded"], true);
  button("Close navigation").props.onClick();
  assert.equal(button("Open sidebar navigation").props["aria-expanded"], false);
  button("Open sidebar navigation").props.onClick();
  dashboard.tree().props.onKeyDown({ key: "Escape" });
  assert.equal(button("Open sidebar navigation").props["aria-expanded"], false);
});
