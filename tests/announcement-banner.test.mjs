import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const React = require("react");
const { transform } = require("next/dist/build/swc");
const source = await readFile(new URL("../components/AnnouncementBanner.js", import.meta.url), "utf8");
const compiled = await transform(source, {
  filename: "AnnouncementBanner.jsx",
  jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "classic" } } },
  module: { type: "commonjs" },
});

// Exercise the component's effects and event handlers with controlled requests
// and timers, without adding browser or React renderer dependencies.
function mount(fetch, baseUrl) {
  const states = [], effects = [], pending = [], timers = new Map();
  let cursor = 0, timerId = 0;
  const module = { exports: {} };
  vm.runInNewContext(compiled.code, {
    module, exports: module.exports, React, fetch, AbortController,
    process: { env: { NEXT_PUBLIC_DJANGO_API_URL: baseUrl } },
    setInterval(fn, delay) { assert.equal(delay, 5000); timers.set(++timerId, fn); return timerId; },
    clearInterval(id) { timers.delete(id); },
    require(name) {
      if (name === "react") return {
        ...React,
        useState(initial) {
          const i = cursor++;
          if (!(i in states)) states[i] = typeof initial === "function" ? initial() : initial;
          return [states[i], value => { states[i] = typeof value === "function" ? value(states[i]) : value; }];
        },
        useEffect(fn, deps) {
          const i = cursor++;
          if (!effects[i] || deps.some((d, j) => !Object.is(d, effects[i].deps[j]))) {
            pending.push(() => { effects[i]?.cleanup?.(); effects[i] = { deps, cleanup: fn() }; });
          }
        },
      };
      if (name === "lucide-react") return {};
      if (name === "motion/react") return { motion: { div: "div" }, AnimatePresence: "section" };
      if (name === "./WeatherWidget") return { WeatherWidget: "weather-widget" };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return {
    api: module.exports, timers,
    render() { cursor = 0; const tree = module.exports.AnnouncementBanner(); pending.splice(0).forEach(fn => fn()); return tree; },
    unmount() { effects.forEach(effect => effect.cleanup?.()); },
  };
}

function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...React.Children.toArray(tree.props?.children).flatMap(nodes)];
}
const textOf = tree => nodes(tree).flatMap(n => React.Children.toArray(n.props?.children).filter(c => typeof c === "string")).join(" ");
const settle = () => new Promise(resolve => setImmediate(resolve));
const response = data => ({ ok: true, json: async () => data });

test("API text loads in order, rotates, navigates and remains dismissed", async () => {
  let resolve, options;
  const banner = mount((url, init) => {
    assert.equal(url, "/api/django/announcements/");
    options = init;
    return new Promise(done => { resolve = done; });
  }, "https://api.example.test///");
  assert.equal(banner.render(), null);
  resolve(response([null, {}, { text: 42 }, { text: "  " }, { id: 1, text: " First " }, { id: 2, text: "Second" }]));
  await settle();
  let tree = banner.render();
  assert.match(textOf(tree), /First/);
  assert.match(nodes(tree).find(n => n.type === "div").props.className, /from-emerald-600/);
  assert.ok(nodes(tree).some(n => n.type === "weather-widget"));
  assert.equal(banner.timers.size, 1);
  [...banner.timers.values()][0]();
  tree = banner.render();
  assert.match(textOf(tree), /Second/);
  nodes(tree).find(n => n.props.title === "Previous announcement").props.onClick();
  tree = banner.render();
  assert.match(textOf(tree), /First/);
  nodes(tree).find(n => n.props.title === "Next announcement").props.onClick();
  assert.match(textOf(banner.render()), /Second/);
  nodes(banner.render()).filter(n => n.type === "button" && !n.props.title)[0].props.onClick();
  assert.match(textOf(banner.render()), /First/);
  nodes(banner.render()).find(n => n.props.title === "Dismiss announcement banner").props.onClick();
  assert.equal(banner.render(), null);
  assert.equal(banner.timers.size, 0);
  banner.api.setAnnouncements([{ id: 3, text: "Updated", active: true }]);
  assert.equal(banner.render(), null);
  banner.unmount();
  assert.equal(options.signal.aborted, true);
});

test("empty, malformed and failed responses keep the banner hidden", async () => {
  for (const fetch of [
    async () => response([]),
    async () => response({ results: [{ text: "Wrong shape" }] }),
    async () => response([null, {}, { text: false }, { text: "\t" }]),
    async () => ({ ok: false }),
    async () => { throw new Error("Offline"); },
    async () => ({ ok: true, json: async () => { throw new SyntaxError("Invalid JSON"); } }),
  ]) {
    const banner = mount(fetch);
    assert.equal(banner.render(), null);
    await settle();
    assert.equal(banner.render(), null);
    assert.equal(banner.timers.size, 0);
    banner.unmount();
  }
});

test("unmount aborts pending requests and removes subscribers and timers", async () => {
  let resolve, signal;
  const banner = mount((url, options) => {
    assert.equal(url, "/api/django/announcements/");
    signal = options.signal;
    return new Promise(done => { resolve = done; });
  });
  banner.render();
  banner.unmount();
  assert.equal(signal.aborted, true);
  resolve(response([{ id: 1, text: "Late response" }]));
  await settle();
  assert.equal(banner.api.getAnnouncements().length, 0);
  assert.equal(banner.render(), null);

  const loaded = mount(async () => response([{ id: 1, text: "One" }, { id: 2, text: "Two" }]));
  loaded.render();
  await settle();
  loaded.render();
  loaded.unmount();
  assert.equal(loaded.timers.size, 0);
  loaded.api.setAnnouncements([]);
  assert.match(textOf(loaded.render()), /One/);
});
