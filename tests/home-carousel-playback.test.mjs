import test from 'node:test';
import assert from 'node:assert/strict';
import { startCarouselPlayback } from '../lib/homeCarouselPlayback.js';

function harness(paused = false) {
  const listeners = new Map();
  const timers = new Map();
  let nextId = 0;
  let advances = 0;
  const page = {
    hidden: false,
    addEventListener: (event, listener) => listeners.set(event, listener),
    removeEventListener: (event) => listeners.delete(event),
  };
  const clock = {
    setTimeout: (callback, delay) => { timers.set(++nextId, { callback, delay }); return nextId; },
    clearTimeout: (id) => timers.delete(id),
  };
  const start = (isPaused = paused) => startCarouselPlayback({
    paused: isPaused, page, clock, onAdvance: () => { advances++; },
  });
  return { page, timers, listeners, start, advances: () => advances };
}

test('autoplay advances after eight seconds and cleans up on unmount', () => {
  const h = harness();
  const cleanup = h.start();
  assert.equal(h.timers.size, 1);
  const timer = [...h.timers.values()][0];
  assert.equal(timer.delay, 8000);
  timer.callback();
  assert.equal(h.advances(), 1);
  cleanup();
  assert.equal(h.timers.size, 0);
  assert.equal(h.listeners.size, 0);
});

test('paused playback stays stopped across visibility changes', () => {
  const h = harness(true);
  const cleanup = h.start();
  assert.equal(h.timers.size, 0);
  h.page.hidden = true;
  h.listeners.get('visibilitychange')();
  h.page.hidden = false;
  h.listeners.get('visibilitychange')();
  assert.equal(h.timers.size, 0);
  cleanup();
});

test('hidden tabs cancel rotation; returning starts a fresh countdown', () => {
  const h = harness();
  const cleanup = h.start();
  h.page.hidden = true;
  h.listeners.get('visibilitychange')();
  assert.equal(h.timers.size, 0);
  h.page.hidden = false;
  h.listeners.get('visibilitychange')();
  assert.equal(h.timers.size, 1);
  assert.equal([...h.timers.values()][0].delay, 8000);
  cleanup();
});

test('manual selection resets countdown and pause/resume leaves one timer', () => {
  const h = harness();
  const firstCleanup = h.start();
  const firstId = [...h.timers.keys()][0];
  firstCleanup();
  const nextCleanup = h.start();
  assert.equal(h.timers.size, 1);
  assert.notEqual([...h.timers.keys()][0], firstId);
  nextCleanup();
  const pausedCleanup = h.start(true);
  assert.equal(h.timers.size, 0);
  pausedCleanup();
  const resumedCleanup = h.start(false);
  assert.equal(h.timers.size, 1);
  resumedCleanup();
});
