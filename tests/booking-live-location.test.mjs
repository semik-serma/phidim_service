import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { transform } = require("next/dist/build/swc");
async function compile(name) {
  return (await transform(await readFile(new URL(`../components/user-dashboard/${name}.js`, import.meta.url), "utf8"), {
    filename: `${name}.jsx`,
    jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "classic" } } },
    module: { type: "commonjs" },
  })).code;
}
const pageCode = await compile("BookingLiveLocationPage");
const buttonCode = await compile("BookingLiveLocationButton");

function harness({ cookie = "phidim_access_token=access%2Btoken" } = {}) {
  const hooks = [], pending = [], sockets = [], timers = new Map();
  let cursor = 0, timerId = 0, now = Date.parse("2026-10-31T10:00:00Z");
  class MockDate extends Date { static now() { return now; } }
  class MockWebSocket {
    constructor(url) { this.url = url; sockets.push(this); }
    close() { this.closed = true; }
  }
  const module = { exports: {} };
  vm.runInNewContext(pageCode, {
    React, module, exports: module.exports, URL, URLSearchParams, Date: MockDate,
    document: { cookie }, process: { env: { NEXT_PUBLIC_DJANGO_API_URL: "https://api.example.test" } },
    WebSocket: MockWebSocket,
    setInterval(fn) { timers.set(++timerId, fn); return timerId; },
    setTimeout(fn) { timers.set(++timerId, fn); return timerId; },
    clearInterval(id) { timers.delete(id); }, clearTimeout(id) { timers.delete(id); },
    require: name => {
      if (name === "next/link") return { __esModule: true, default: props => React.createElement("a", props) };
      if (name === "react") return {
        ...React,
        useState(initial) {
          const i = cursor++;
          if (!(i in hooks)) hooks[i] = initial;
          return [hooks[i], value => { hooks[i] = typeof value === "function" ? value(hooks[i]) : value; }];
        },
        useEffect(callback, deps) {
          const i = cursor++, old = hooks[i];
          if (!old || deps.some((value, index) => value !== old.deps[index])) {
            pending.push(() => { old?.cleanup?.(); hooks[i] = { deps, cleanup: callback() }; });
          }
        },
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  const app = {
    sockets, timers,
    render(id = 21) {
      cursor = 0;
      const tree = module.exports.default({ bookingId: id });
      pending.splice(0).forEach(callback => callback());
      return tree;
    },
    html() { return renderToStaticMarkup(app.render()); },
    tick(ms) { now += ms; [...timers.values()].forEach(fn => fn()); },
    unmount() { hooks.forEach(hook => hook?.cleanup?.()); },
  };
  return app;
}
function find(tree, type) {
  if (!React.isValidElement(tree)) return null;
  if (tree.type === type) return tree;
  for (const child of React.Children.toArray(tree.props.children)) {
    const match = find(child, type);
    if (match) return match;
  }
  return null;
}
function send(socket, extra = {}) {
  socket.onmessage({ data: JSON.stringify({ type: "location_update", booking_id: 21, latitude: 27.1, longitude: 87.7, ...extra }) });
}

test("dashboard button navigates to the selected booking tracking page", () => {
  const paths = [], module = { exports: {} };
  vm.runInNewContext(buttonCode, { React, module, exports: module.exports, require(name) {
    if (name === "next/navigation") return { useRouter: () => ({ push: path => paths.push(path) }) };
    if (name.endsWith(".module.css")) return {};
    throw new Error(name);
  } });
  find(module.exports.default({ bookingId: 42 }), "button").props.onClick();
  assert.deepEqual(paths, ["/user/bookings/42/live-location"]);
});

test("page connects automatically and updates the map, coordinates and received time", () => {
  const app = harness(); app.render();
  const socket = app.sockets[0];
  assert.equal(socket.url, "wss://api.example.test/ws/share-location/21/?token=access%2Btoken");
  socket.onopen();
  assert.match(app.html(), /Waiting for the technician/);
  assert.equal(find(app.render(), "iframe"), null);
  send(socket);
  assert.match(app.html(), /27.1000000.*87.7000000/);
  assert.match(app.html(), /Last received:/);
  assert.match(find(app.render(), "iframe").props.src, /27.1%2C87.7/);
  send(socket, { latitude: 28.2, longitude: 88.8 });
  assert.match(find(app.render(), "iframe").props.src, /28.2%2C88.8/);
  assert.doesNotMatch(app.html(), /27.1000000/);
  app.tick(60000);
  assert.match(app.html(), /Waiting for a fresh location/);
  app.unmount();
  assert.equal(socket.closed, true);
  assert.equal(app.timers.size, 0);
});

test("ignores malformed, mismatched and invalid location messages, accepts zero coordinates", () => {
  const app = harness(); app.render(); const socket = app.sockets[0];
  for (const data of ["bad JSON", "null", '{"type":"unknown"}']) socket.onmessage({ data });
  for (const extra of [{ booking_id: 22 }, { latitude: "27" }, { latitude: 91 }, { longitude: null }, { longitude: 181 }]) send(socket, extra);
  assert.equal(find(app.render(), "iframe"), null);
  send(socket, { latitude: 0, longitude: 0, booking_id: "21" });
  assert.match(app.html(), /0.0000000/);
  app.unmount();
});

test("disconnect retains last location and reconnects automatically", () => {
  const app = harness(); app.render(); const socket = app.sockets[0];
  send(socket); socket.onclose();
  assert.match(app.html(), /Showing the last received location/);
  assert.match(app.html(), /Reconnecting/);
  app.tick(5000);
  assert.equal(app.sockets.length, 2);
  send(app.sockets[1], { latitude: 28 });
  assert.match(app.html(), /28.0000000/);
  const late = app.sockets[1].onmessage;
  app.unmount(); late({ data: "null" });
  assert.equal(app.sockets[1].onmessage, null);
  assert.equal(app.timers.size, 0);
});

test("missing token and server errors are shown on screen", () => {
  const missing = harness({ cookie: "" }); missing.render();
  assert.equal(missing.sockets.length, 0);
  assert.match(missing.html(), /Please sign in again/);
  missing.unmount();
  const app = harness(); app.render();
  app.sockets[0].onmessage({ data: '{"type":"error","message":"Booking access denied"}' });
  assert.match(app.html(), /Booking access denied/);
  app.unmount();
});

test("manual retry cleans up the previous connection", () => {
  const app = harness(); app.render(); const socket = app.sockets[0];
  socket.onerror(); socket.onclose();
  find(app.render(), "button").props.onClick(); app.render();
  assert.equal(socket.closed, true);
  assert.equal(socket.onmessage, null);
  assert.equal(app.sockets.length, 2);
  app.unmount();
});
