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

function dashboardHarness(initialBookings = []) {
  const states = [];
  let hookIndex = 0;
  let effect;
  let subscription;
  let unsubscribed = false;
  let logoutCalls = 0;
  const auth = { user: { email: "customer@example.com" }, logout: () => { logoutCalls++; } };
  const module = { exports: {} };
  vm.runInNewContext(compiled.code, {
    React, module, exports: module.exports,
    require: name => {
      if (name === "react") return {
        ...React,
        useState: initial => {
          const index = hookIndex++;
          if (states[index] === undefined) states[index] = initial;
          return [states[index], value => { states[index] = value; }];
        },
        useEffect: callback => { effect = callback; },
      };
      if (name === "@/context/AuthContext") return { useAuth: () => auth };
      if (name === "@/lib/bookingStore") return {
        getBookingsList: () => initialBookings,
        subscribeBookings: callback => {
          subscription = callback;
          return () => { unsubscribed = true; };
        },
      };
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
    update: bookings => subscription(bookings),
    get unsubscribed() { return unsubscribed; },
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

test("dashboard keeps sidebar navigation, a working Logout button and a plain bookings list", () => {
  const dashboard = dashboardHarness();
  dashboard.mount();
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

test("initial and live bookings strictly belong to the current user and show every row", () => {
  const owned = Array.from({ length: 6 }, (_, index) => ({
    id: `OWN-${index}`, serviceName: `Service ${index}`, customerEmail: " Customer@Example.COM ",
    amount: index === 0 ? 0 : "Rs. 500", status: "Pending",
  }));
  const foreign = [
    { id: "FOREIGN", customerEmail: "other@example.com" },
    { id: "PARTIAL", customerEmail: "prefix-customer@example.com" },
    { id: "OWNERLESS" }, null,
  ];
  const dashboard = dashboardHarness([...owned, ...foreign]);
  const cleanup = dashboard.mount();
  let html = dashboard.html();
  for (const booking of owned) assert.ok(html.includes(booking.id));
  assert.doesNotMatch(html, /FOREIGN|PARTIAL|OWNERLESS/);
  assert.match(html, /<td>0<\/td>/);
  assert.match(html, /Not assigned/);
  dashboard.update([{ ...owned[0], id: "LIVE" }, ...foreign]);
  html = dashboard.html();
  assert.match(html, /LIVE/);
  assert.doesNotMatch(html, /OWN-|FOREIGN|PARTIAL|OWNERLESS/);
  dashboard.update([]);
  assert.match(dashboard.html(), /No bookings yet/);
  cleanup();
  assert.equal(dashboard.unsubscribed, true);
});

test("changing or missing user identity never displays the previous customer's bookings", () => {
  const dashboard = dashboardHarness([{ id: "PRIVATE", customerEmail: "customer@example.com" }]);
  dashboard.mount();
  assert.match(dashboard.html(), /PRIVATE/);
  dashboard.auth.user = { email: "another@example.com" };
  assert.doesNotMatch(dashboard.html(), /PRIVATE/);
  dashboard.auth.user = null;
  assert.doesNotMatch(dashboard.html(), /PRIVATE/);
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
