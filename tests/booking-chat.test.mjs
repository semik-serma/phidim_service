import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { transform } = require("next/dist/build/swc");
const { code } = await transform(await readFile(new URL("../components/chat/BookingChatModal.js", import.meta.url), "utf8"), {
  filename: "BookingChatModal.jsx",
  jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "classic" } } },
  module: { type: "commonjs" },
});

function harness() {
  const hooks = [], pending = [], sockets = [], sent = [];
  let cursor = 0, tree;
  class WebSocket {
    static OPEN = 1;
    constructor() { sockets.push(this); this.readyState = 1; }
    send(value) { sent.push(JSON.parse(value)); }
    close() {}
  }
  const module = { exports: {} };
  vm.runInNewContext(code, {
    React, module, exports: module.exports, WebSocket, URL, URLSearchParams, console,
    process: { env: {} }, document: { cookie: "" },
    require(name) {
      if (name === "react") return {
        useState(initial) {
          const i = cursor++;
          if (!(i in hooks)) hooks[i] = initial;
          return [hooks[i], value => { hooks[i] = typeof value === "function" ? value(hooks[i]) : value; }];
        },
        useRef(initial) { const i = cursor++; return hooks[i] ||= { current: initial }; },
        useCallback(fn, deps) {
          const i = cursor++;
          if (!hooks[i] || deps.some((d, j) => d !== hooks[i].deps[j])) hooks[i] = { fn, deps };
          return hooks[i].fn;
        },
        useEffect(fn, deps) {
          const i = cursor++;
          if (!hooks[i] || deps.some((d, j) => d !== hooks[i].deps[j])) {
            hooks[i] = { deps }; pending.push(fn);
          }
        },
      };
      if (name === "@/context/AuthContext") return { useAuth: () => ({ user: { id: 8, role: "USER", name: "Customer" } }) };
      if (name === "@/lib/chatStore") return { playMessageChime() {} };
      if (name === "lucide-react") return new Proxy({}, { get: () => () => null });
      throw new Error(name);
    },
  });
  function find(node, type) {
    if (!React.isValidElement(node)) return null;
    if (node.type === type) return node;
    for (const child of React.Children.toArray(node.props.children)) {
      const result = find(child, type);
      if (result) return result;
    }
    return null;
  }
  const app = {
    sent, sockets,
    render() {
      cursor = 0;
      tree = module.exports.BookingChatModal({ booking: { id: 21 }, onClose() {} });
      pending.splice(0).forEach(fn => fn());
      return renderToStaticMarkup(tree);
    },
    receive(data) { sockets[0].onmessage({ data: JSON.stringify(data) }); },
    send(text) {
      find(tree, "input").props.onChange({ target: { value: text } });
      app.render();
      find(tree, "input").props.onKeyDown({ key: "Enter", preventDefault() {} });
    },
  };
  app.render(); sockets[0].onopen(); app.render();
  return app;
}

test("booking chat sends the consumer contract and renders persisted broadcasts once", () => {
  const app = harness();
  app.send("  Hello  ");
  assert.deepEqual(app.sent, [{ type: "chat.message", message: "Hello" }]);
  const frame = { type: "chat.message", data: { id: 1, user_id: 8, message: "Hello", created_at: "2026-11-04T10:00:00Z" } };
  app.receive(frame); app.receive(frame);
  const html = app.render();
  assert.equal((html.match(/>Hello</g) || []).length, 1);
  assert.match(html, />You</);
});

test("history is loaded and control/error events are not chat bubbles", () => {
  const app = harness();
  app.receive({ type: "connection", message: "Connected to chat group" });
  assert.doesNotMatch(app.render(), /Connected to chat group/);
  app.receive({ type: "chat.history", messages: [{ id: 4, user_id: 9, message: "Earlier message", created_at: "2026-11-04T10:00:00Z" }] });
  assert.match(app.render(), />Earlier message</);
  app.receive({ type: "error", message: "Booking is no longer available for chat" });
  assert.match(app.render(), /Booking is no longer available for chat/);
  app.receive({ type: "chat.history", messages: [] });
  assert.doesNotMatch(app.render(), />Earlier message</);
});

test("disconnected and oversized messages are not sent", () => {
  const app = harness();
  app.send("x".repeat(5001));
  assert.equal(app.sent.length, 0);
  assert.match(app.render(), /Message exceeds 5000 characters/);
  app.sockets[0].readyState = 3;
  app.send("Offline message");
  assert.equal(app.sent.length, 0);
  assert.match(app.render(), /Reconnect before sending/);
});
