import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const React = require("react");
const { transform } = require("next/dist/build/swc");
const compiled = await transform(await readFile(new URL("../components/user-dashboard/BookingLiveLocationButton.js", import.meta.url), "utf8"), {
  filename: "BookingLiveLocationButton.jsx",
  jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "classic" } } },
  module: { type: "commonjs" },
});

function harness({ cookie = "phidim_access_token=access%2Btoken", baseUrl = "https://api.example.test" } = {}) {
  const hooks = [], pending = [], sockets = [], logs = [], errors = [];
  let cursor = 0;
  const module = { exports: {} };
  class MockWebSocket {
    constructor(url) { this.url = url; this.sent = []; this.closed = false; sockets.push(this); }
    send(value) { this.sent.push(value); }
    close() { this.closed = true; }
  }
  vm.runInNewContext(compiled.code, {
    React, module, exports: module.exports, URL, URLSearchParams,
    document: { cookie }, process: { env: { NEXT_PUBLIC_DJANGO_API_URL: baseUrl } },
    WebSocket: MockWebSocket, console: { log: (...args) => logs.push(args), error: (...args) => errors.push(args) },
    require: name => {
      if (name === "react") return {
        ...React,
        useState(initial) {
          const i = cursor++;
          if (!(i in hooks)) hooks[i] = initial;
          return [hooks[i], value => { hooks[i] = typeof value === "function" ? value(hooks[i]) : value; }];
        },
        useEffect(callback, deps) {
          const i = cursor++;
          const old = hooks[i];
          if (!old || deps.some((value, index) => value !== old.deps[index])) {
            pending.push(() => { old?.cleanup?.(); hooks[i] = { deps, cleanup: callback() }; });
          }
        },
      };
      if (name.endsWith(".module.css")) return {};
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return {
    sockets, logs, errors,
    render(bookingId = 21) {
      cursor = 0;
      const tree = module.exports.default({ bookingId });
      pending.splice(0).forEach(callback => callback());
      return tree;
    },
    unmount() { hooks.forEach(hook => hook?.cleanup?.()); },
  };
}
const button = tree => React.Children.toArray(tree.props.children).find(child => child.type === "button");

test("click authenticates through the socket URL and logs location_update coordinates", () => {
  const app = harness();
  const tree = app.render();
  assert.equal(app.sockets.length, 0);
  assert.equal(button(tree).props.children, "Show live location");
  button(tree).props.onClick();
  app.render();
  const socket = app.sockets[0];
  assert.equal(socket.url, "wss://api.example.test/ws/share-location/21/?token=access%2Btoken");
  assert.equal(button(app.render()).props.disabled, true);
  socket.onopen();
  assert.deepEqual(socket.sent, []);
  socket.onmessage({ data: '{"type":"location_update","booking_id":21,"technician_id":7,"latitude":27.1,"longitude":87.7}' });
  assert.deepEqual(JSON.parse(JSON.stringify(app.logs)), [["Live location for booking #21:", { latitude: 27.1, longitude: 87.7 }]]);
  assert.equal(button(app.render()).props.children, "Live location connected");
  const lateMessage = socket.onmessage;
  app.unmount();
  assert.equal(socket.closed, true);
  assert.equal(socket.onmessage, null);
  lateMessage({ data: "late" });
  assert.equal(app.logs.length, 1);
});

test("connection and error messages are handled separately from coordinates", () => {
  const app = harness();
  button(app.render()).props.onClick(); app.render();
  const socket = app.sockets[0];
  socket.onopen();
  socket.onmessage({ data: JSON.stringify({ type: "connection", message: "Connected to booking location channel", booking_id: 21 }) });
  assert.deepEqual(app.logs, [["Live location for booking #21:", "Connected to booking location channel"]]);
  socket.onmessage({ data: JSON.stringify({ type: "error", message: "Only the technician can share location" }) });
  assert.deepEqual(app.errors, [["Live location for booking #21:", "Only the technician can share location"]]);
  const alert = React.Children.toArray(app.render().props.children)[1];
  assert.equal(alert.props.children, "Only the technician can share location");
  app.unmount();
});

test("malformed, unknown, mismatched and invalid coordinate messages are ignored", () => {
  const app = harness();
  button(app.render()).props.onClick(); app.render();
  const socket = app.sockets[0];
  for (const data of ["invalid JSON", "null", JSON.stringify({ type: "unknown" }),
    ...[
      { booking_id: 22, latitude: 27, longitude: 87 },
      { booking_id: 21, latitude: "27", longitude: 87 },
      { booking_id: 21, latitude: 91, longitude: 87 },
      { booking_id: 21, latitude: 27, longitude: null },
      { booking_id: 21, latitude: 27, longitude: 181 },
    ].map(message => JSON.stringify({ type: "location_update", ...message })),
  ]) socket.onmessage({ data });
  assert.equal(app.logs.length, 0);
  socket.onmessage({ data: '{"type":"location_update","booking_id":21,"latitude":0,"longitude":0}' });
  assert.equal(app.logs.length, 1);
  app.unmount();
});

test("errors allow retry and replace the previous socket", () => {
  const app = harness({ baseUrl: "http://localhost:8000" });
  button(app.render()).props.onClick(); app.render();
  const socket = app.sockets[0];
  assert.equal(socket.url, "ws://localhost:8000/ws/share-location/21/?token=access%2Btoken");
  socket.onerror(); socket.onclose();
  const tree = app.render();
  assert.equal(button(tree).props.disabled, false);
  assert.equal(React.Children.toArray(tree.props.children)[1].props.role, "alert");
  button(tree).props.onClick(); app.render();
  assert.equal(app.sockets.length, 2);
  assert.equal(socket.closed, true);
  app.unmount();
});

test("missing access token reports an error without connecting", () => {
  const app = harness({ cookie: "" });
  button(app.render()).props.onClick(); app.render();
  assert.equal(app.sockets.length, 0);
  const alert = React.Children.toArray(app.render().props.children)[1];
  assert.match(alert.props.children, /Please sign in again/);
});

test("changing booking closes the existing connection and uses the new booking URL", () => {
  const app = harness();
  button(app.render()).props.onClick(); app.render();
  app.render(42);
  assert.equal(app.sockets[0].closed, true);
  assert.match(app.sockets[1].url, /\/ws\/share-location\/42\//);
  app.unmount();
});
