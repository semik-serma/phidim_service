import test from 'node:test';
import assert from 'node:assert/strict';
import { requestAccurateLocation, LOCATION_TIMEOUT_MS } from '../lib/accurateLocation.js';

function harness() {
  let success, failure, expire, options;
  const accepted = [], errors = [], cleared = [], timers = [];
  const cancel = requestAccurateLocation(coords => accepted.push(coords), message => errors.push(message), {
    geolocation: {
      watchPosition(ok, fail, opts) { success = ok; failure = fail; options = opts; return 7; },
      clearWatch(id) { cleared.push(id); },
    },
    now: () => 100000,
    schedule(callback, delay) { assert.equal(delay, LOCATION_TIMEOUT_MS); expire = callback; return 8; },
    unschedule(id) { timers.push(id); },
  });
  return { accepted, errors, cleared, timers, options, cancel,
    fix(accuracy, timestamp = 100000, latitude = 27.16, longitude = 87.92) { success({timestamp, coords: {latitude, longitude, accuracy}}); },
    fail(code) { failure({code}); }, expire: () => expire(),
  };
}

test('waits for a precise fix instead of accepting a coarse initial result', () => {
  const h = harness();
  assert.deepEqual(h.options, {enableHighAccuracy: true, timeout: 30000, maximumAge: 0});
  h.fix(5000); h.fix(120);
  assert.equal(h.accepted.length, 0);
  h.fix(15);
  assert.deepEqual(h.accepted, [{latitude: 27.16, longitude: 87.92, accuracy: 15}]);
  assert.deepEqual(h.cleared, [7]); assert.deepEqual(h.timers, [8]);
  h.fix(8); h.expire();
  assert.equal(h.accepted.length, 1); assert.equal(h.errors.length, 0);
});

test('rejects stale fixes, missing accuracy, and invalid coordinates', () => {
  const h = harness();
  h.fix(10, 90000); h.fix(10, 110000); h.fix(undefined); h.fix(NaN); h.fix(-1);
  h.fix(5, 100000, 91); h.fix(5, 100000, 27, 181);
  assert.equal(h.accepted.length, 0);
  h.fix(50); assert.equal(h.accepted.length, 1);
});

test('deadline rejects approximate location and reports best uncertainty', () => {
  const h = harness(); h.fix(3000); h.fix(600); h.fix(900); h.expire();
  assert.equal(h.accepted.length, 0); assert.match(h.errors[0], /600 metres/);
  assert.deepEqual(h.cleared, [7]);
});

test('temporary failures can recover; denied permission stops immediately', () => {
  const h = harness(); h.fail(2); h.fail(3); h.fix(20);
  assert.equal(h.accepted.length, 1);
  const denied = harness(); denied.fail(1); denied.fix(10);
  assert.match(denied.errors[0], /permission denied/); assert.equal(denied.accepted.length, 0);
  assert.deepEqual(denied.cleared, [7]);
});

test('cancellation releases resources and ignores late callbacks', () => {
  const h = harness(); h.cancel(); h.fix(10); h.fail(1); h.expire();
  assert.equal(h.accepted.length, 0); assert.equal(h.errors.length, 0);
  assert.deepEqual(h.cleared, [7]); assert.deepEqual(h.timers, [8]);
});

test('unavailable geolocation and provider exceptions produce actionable errors', () => {
  let message;
  requestAccurateLocation(assert.fail, value => {message = value;}, {geolocation: null});
  assert.match(message, /Location is unavailable/);
  requestAccurateLocation(assert.fail, value => {message = value;}, {
    geolocation: {watchPosition() {throw new Error('Unavailable');}, clearWatch() {}},
  });
  assert.match(message, /Unable to access location/);
});
