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

function harness({ cookie = "phidim_access_token=test-token", env = {}, location } = {}) {
  const hooks = [], pending = [], sockets = [], sent = [], timers = [];
  let cursor = 0, tree;
  class WebSocket {
    static OPEN = 1;
    constructor(url) { this.url = url; sockets.push(this); this.readyState = 1; }
    send(value) { sent.push(JSON.parse(value)); }
    close() {}
  }
  const module = { exports: {} };
  vm.runInNewContext(code, {
    React, module, exports: module.exports, WebSocket, URL, URLSearchParams, console,
    setTimeout(fn) { timers.push(fn); return timers.length; }, clearTimeout(id) { timers[id - 1] = null; },
    process: { env }, document: { cookie },
    ...(location ? { window: { location, localStorage: { getItem() { return null; } } }, localStorage: { getItem() { return null; } } } : {}),
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
    type(text) { find(tree, "input").props.onChange({ target: { value: text } }); app.render(); },
    blur() { find(tree, "input").props.onBlur(); },
    expire() { timers.splice(0).forEach(fn => fn?.()); },
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
  app.render(); sockets[0]?.onopen(); app.render();
  return app;
}

test("booking chat sends the consumer contract and renders persisted broadcasts once", () => {
  const app = harness();
  app.send("  Hello  ");
  assert.deepEqual(app.sent, [{ type: "typing.start" }, { type: "typing.stop" }, { type: "chat.message", message: "Hello" }]);
  const frame = { type: "chat.message", data: { id: 1, user_id: 8, message: "Hello", created_at: "2026-11-04T10:00:00Z" } };
  app.receive(frame); app.receive(frame);
  const html = app.render();
  assert.equal((html.match(/>Hello</g) || []).length, 1);
  assert.match(html, />You</);
});

test("missing credentials show a sign-in error without opening an anonymous socket", () => {
  const app = harness({ cookie: "" });
  assert.equal(app.sockets.length, 0);
  assert.match(app.render(), /Please sign in again/);
});

test("secure WebSocket hosts remain secure and stale query parameters are removed", () => {
  const app = harness({ env: { NEXT_PUBLIC_DJANGO_WS_URL: "wss://chat.example.test/old?stale=yes" } });
  const url = new URL(app.sockets[0].url);
  assert.equal(url.protocol, "wss:");
  assert.equal(url.pathname, "/ws/chat/21/");
  assert.equal(url.searchParams.get("token"), "test-token");
  assert.equal(url.searchParams.has("stale"), false);
});

test("mixed-content connections are explained before opening a socket", () => {
  const app = harness({ location: { protocol: "https:" } });
  assert.equal(app.sockets.length, 0);
  assert.match(app.render(), /Chat requires a secure connection/);
});

test("close codes preserve authentication, authorization and server failure explanations", () => {
  for (const [code, pattern] of [[4401, /authentication was rejected/], [4403, /access was denied/], [1011, /server encountered an error/], [1006, /connection was interrupted/]]) {
    const app = harness();
    app.sockets[0].onerror({});
    app.sockets[0].onclose({ code });
    assert.match(app.render(), pattern);
  }
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
  assert.equal(app.sent.filter(frame => frame.type === "chat.message").length, 0);
  assert.match(app.render(), /Message exceeds 5000 characters/);
  app.sockets[0].readyState = 3;
  app.send("Offline message");
  assert.equal(app.sent.filter(frame => frame.type === "chat.message").length, 0);
  assert.match(app.render(), /Reconnect before sending/);
});

test("typing is throttled, stops on blur and inactivity, and ignores self events", () => {
  const app = harness();
  app.type("H"); app.type("Hello");
  assert.deepEqual(app.sent, [{ type: "typing.start" }]);
  app.blur();
  assert.equal(app.sent.at(-1).type, "typing.stop");
  app.type("More"); app.expire();
  assert.equal(app.sent.at(-1).type, "typing.stop");
  app.receive({ type: "chat.typing", user_id: 8, is_typing: true });
  assert.doesNotMatch(app.render(), /is typing/);
  app.receive({ type: "chat.typing", user_id: 9, is_typing: true });
  assert.match(app.render(), /is typing/);
  app.expire();
  assert.doesNotMatch(app.render(), /is typing/);
  app.receive({ type: "chat_typing", user_id: 9, is_typing: true });
  assert.match(app.render(), /is typing/);
  app.receive({ type: "chat.typing", user_id: 9, is_typing: false });
  assert.doesNotMatch(app.render(), /is typing/);
});

test("consumer typing.start and typing.stop frames show and clear the indicator", () => {
  const app = harness();
  app.receive({ type: "typing.start", user_id: 9 });
  assert.match(app.render(), /is typing/);
  app.receive({ type: "typing.stop", user_id: 9 });
  assert.doesNotMatch(app.render(), /is typing/);
  app.receive({ type: "typing.start", user_id: 8 });
  assert.doesNotMatch(app.render(), /is typing/);
  app.receive({ type: "typing.start", user_id: 9 });
  app.expire();
  assert.doesNotMatch(app.render(), /is typing/);
});
