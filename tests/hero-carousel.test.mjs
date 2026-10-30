import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { startCarouselPlayback } from '../lib/homeCarouselPlayback.js';

const require = createRequire(import.meta.url);
const React = require('react');
const { transform } = require('next/dist/build/swc');
const source = await readFile(new URL('../components/HeroCarousel.js', import.meta.url), 'utf8');
const compiled = await transform(source, {
  filename: 'HeroCarousel.js',
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'classic' } } },
  module: { type: 'commonjs' },
});

function harness({ reduced = false, campaigns = [] } = {}) {
  let cursor = 0;
  let tree;
  let timerId = 0;
  let reducedMotion = reduced;
  let storeListener;
  const states = [];
  const effects = [];
  const pending = [];
  const timers = new Map();
  const listeners = new Map();
  const bookings = [];
  const page = {
    hidden: false,
    addEventListener: (event, fn) => listeners.set(event, fn),
    removeEventListener: (event) => listeners.delete(event),
  };
  const clock = {
    setTimeout: (fn, delay) => { timers.set(++timerId, { fn, delay }); return timerId; },
    clearTimeout: (id) => timers.delete(id),
  };
  const module = { exports: {} };
  vm.runInNewContext(compiled.code, {
    module, exports: module.exports, React,
    require: name => {
      if (name === 'react') return {
        useState: initial => {
          const slot = cursor++;
          if (!(slot in states)) states[slot] = typeof initial === 'function' ? initial() : initial;
          return [states[slot], value => { states[slot] = typeof value === 'function' ? value(states[slot]) : value; }];
        },
        useEffect: (fn, deps) => {
          const slot = cursor++;
          if (!effects[slot] || deps.some((dep, index) => !Object.is(dep, effects[slot].deps[index]))) {
            pending.push(() => {
              effects[slot]?.cleanup?.();
              effects[slot] = { deps, cleanup: fn() };
            });
          }
        },
      };
      if (name === 'motion/react') return { motion: { div: 'div' }, useReducedMotion: () => reducedMotion };
      if (name === './home/HomeMotion') return { HOME_EASE: [0.22, 1, 0.36, 1] };
      if (name === '@/lib/homeCarouselPlayback') return {
        startCarouselPlayback: options => startCarouselPlayback({ ...options, page, clock }),
      };
      if (name === '@/lib/heroCarouselStore') return {
        getHeroCarouselSlides: () => campaigns,
        refreshHeroCarouselSlides: () => {},
        subscribeHeroCarouselSlides: listener => { storeListener = listener; return () => { storeListener = null; }; },
      };
      if (name === 'lucide-react') return new Proxy({}, { get: () => () => null });
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  function render() {
    cursor = 0;
    tree = module.exports.HeroCarousel({ onBookService: service => bookings.push(service) });
    pending.splice(0).forEach(fn => fn());
    return tree;
  }
  function nodes(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(child => nodes(child));
    return [node, ...nodes(node.props?.children)];
  }
  render();
  return {
    render, nodes: () => nodes(tree), timers, page, listeners, bookings,
    section: () => tree.props,
    button: label => nodes(tree).find(node => node.type === 'button' && node.props['aria-label'] === label).props,
    selected: () => nodes(tree).find(node => node.props?.['aria-roledescription'] === 'slide' && !node.props.inert),
    setReduced: value => { reducedMotion = value; render(); },
    publish: slides => { storeListener(slides); render(); },
    cleanup: () => effects.forEach(effect => effect?.cleanup?.()),
  };
}

test('carousel pauses on hover and keyboard focus, resuming only after both end', () => {
  const h = harness();
  assert.equal(h.timers.size, 1);
  h.section().onMouseEnter(); h.render();
  assert.equal(h.timers.size, 0);
  h.section().onFocusCapture(); h.render();
  h.section().onMouseLeave(); h.render();
  assert.equal(h.timers.size, 0);
  h.section().onBlurCapture({ currentTarget: { contains: () => true }, relatedTarget: {} }); h.render();
  assert.equal(h.timers.size, 0);
  h.section().onBlurCapture({ currentTarget: { contains: () => false }, relatedTarget: null }); h.render();
  assert.equal(h.timers.size, 1);
  h.cleanup();
});

test('reduced motion starts paused and uses immediate slide changes', () => {
  const h = harness({ reduced: true });
  assert.equal(h.timers.size, 0);
  h.button('Next slide').onClick(); h.render();
  assert.match(h.selected().props['aria-label'], /^2 of 7:/);
  assert.equal(h.selected().props.transition.duration, 0);
  assert.equal(h.timers.size, 0);
  h.cleanup();
});

test('navigation wraps, resets the countdown, and makes only one slide interactive', () => {
  const h = harness();
  const firstTimer = [...h.timers.keys()][0];
  h.button('Go to slide 1').onClick(); h.render();
  assert.notEqual([...h.timers.keys()][0], firstTimer);
  h.button('Previous slide').onClick(); h.render();
  assert.match(h.selected().props['aria-label'], /^7 of 7:/);
  h.button('Next slide').onClick(); h.render();
  assert.match(h.selected().props['aria-label'], /^1 of 7:/);
  const slides = h.nodes().filter(node => node.props?.['aria-roledescription'] === 'slide');
  assert.equal(slides.filter(node => !node.props.inert).length, 1);
  assert.equal(slides.filter(node => node.props['aria-hidden']).length, 6);
  const activeContent = h.selected().props.children;
  activeContent.props.active.action();
  assert.equal(h.bookings[0].id, 'srv-cctv-install');
  h.cleanup();
  assert.equal(h.timers.size, 0);
  assert.equal(h.listeners.size, 0);
});

test('autoplay continues through navigation and live campaign updates without playback controls', () => {
  const h = harness();
  assert.equal(h.nodes().some(node => /^(Pause|Play) slide rotation$/.test(node.props?.['aria-label'])), false);
  h.button('Next slide').onClick(); h.render();
  h.publish([{ id: 'campaign', title: 'Campaign', image: '/campaign.jpg' }]);
  assert.equal(h.timers.size, 1);
  assert.match(h.selected().props['aria-label'], /^1 of 8: Campaign/);
  h.cleanup();
});

test('changing reduced motion stops autoplay', () => {
  const h = harness();
  h.setReduced(true);
  assert.equal(h.timers.size, 0);
  h.setReduced(false);
  assert.equal(h.timers.size, 1);
  h.cleanup();
});
