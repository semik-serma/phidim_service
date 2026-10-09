import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const React = require('react');
const {transform} = require('next/dist/build/swc');
const source = await readFile(new URL('../components/BookingFields.js', import.meta.url), 'utf8');
const compiled = await transform(source, {filename: 'BookingFields.jsx', jsc: {parser: {syntax: 'ecmascript', jsx: true}, transform: {react: {runtime: 'classic'}}}, module: {type: 'commonjs'}});
const tick = () => new Promise(resolve => setImmediate(resolve));
function harness({load = async () => [{id: 6, userId: 7, name: 'Ram Sita'}], create, gps} = {}) {
  const hooks = [], effects = []; let cursor = 0;
  const module = {exports: {}};
  vm.runInNewContext(compiled.code, {module, exports: module.exports, React, AbortController, navigator: gps ? {geolocation: gps} : {}, require(name) {
    if (name === 'react') return {...React,
      useState(initial) {const i = cursor++; if (!(i in hooks)) hooks[i] = initial; return [hooks[i], value => {hooks[i] = typeof value === 'function' ? value(hooks[i]) : value;}];},
      useRef(initial) {const i = cursor++; return hooks[i] ||= {current: initial};},
      useEffect(callback, deps) {const i = cursor++; const old = hooks[i]; if (!old || deps.some((v,n) => v !== old.deps[n])) effects.push(() => {old?.cleanup?.(); hooks[i] = {deps, cleanup: callback()};});},
    };
    if (name === '@/services/bookingService') return {fetchTechnicians: load};
    if (name === '@/lib/bookingStore') return {createBooking: create};
    throw new Error('Unexpected import ' + name);
  }});
  return {render(active = true) {cursor = 0; const form = module.exports.useBookingForm(active); while(effects.length) effects.shift()(); return form;}, unmount() {hooks.forEach(h => h?.cleanup?.());}};
}
const metadata = {date: '2026-09-10', notes: 'No video'};
async function fill(h) {
  h.render(); await tick(); let f = h.render();
  f.setTechnicianId('6'); f.setLatitude('27.16'); f.setLongitude('87.92'); f.setTime('16:15');
  return h.render();
}

test('submission sends selected profile, waits for persistence, and prevents duplicates', async () => {
  let resolve, calls = 0;
  const h = harness({create: data => {calls++; assert.equal(data.technicianId, 6); assert.equal(data.technician.userId, 7); assert.equal(data.latitude, '27.16'); assert.equal(data.time, '16:15'); return new Promise(done => {resolve = done;});}});
  const f = await fill(h);
  const pending = f.submit(metadata);
  assert.equal(h.render().submitting, true);
  assert.equal(await f.submit(metadata), null);
  assert.equal(calls, 1);
  resolve({id: '18', status: 'Pending'});
  assert.equal((await pending).id, '18');
  assert.equal(h.render().submitting, false);
  h.unmount();
});

test('failed submission retains editable inputs, shows error, and permits retry', async () => {
  let calls = 0;
  const h = harness({create: async () => {if (++calls === 1) throw new Error('technician: unavailable'); return {id: '18'};}});
  let f = await fill(h);
  assert.equal(await f.submit(metadata), null);
  f = h.render();
  assert.match(f.error, /technician: unavailable/);
  assert.equal(f.technicianId, '6'); assert.equal(f.latitude, '27.16'); assert.equal(f.time, '16:15');
  assert.equal((await f.submit(metadata)).id, '18');
  assert.equal(h.render().error, '');
  h.unmount();
});

test('technician load failure and empty list block booking, retry loads real choices', async () => {
  let calls = 0;
  const h = harness({load: async () => {if (++calls === 1) throw new Error('Offline'); return [];}, create: () => assert.fail('Must not create')});
  h.render(); await tick(); let f = h.render();
  assert.match(f.loadError, /Offline/); assert.equal(f.disabled, true);
  assert.equal(await f.submit(metadata), null);
  f.retry(); h.render(); await tick(); f = h.render();
  assert.equal(f.loadError, ''); assert.equal(f.technicians.length, 0); assert.equal(f.disabled, true);
  h.unmount();
});

test('GPS success fills coordinates and GPS denial preserves manually entered location', async () => {
  let fail = false;
  const h = harness({gps: {getCurrentPosition(ok, error) {if (fail) error({code: 1}); else ok({coords: {latitude: 27.16, longitude: 87.92}});}}});
  let f = await fill(h); f.locate(); f = h.render();
  assert.equal(f.latitude, '27.1600000'); assert.equal(f.longitude, '87.9200000');
  f.setLatitude('28'); f.setLongitude('88'); fail = true;
  f = h.render(); f.locate(); f = h.render();
  assert.equal(f.latitude, '28'); assert.equal(f.longitude, '88'); assert.match(f.locationError, /enter coordinates manually/);
  h.unmount();
});

test('inactive forms do not fetch, and closing aborts the pending technician request', async () => {
  let signal, calls = 0;
  const h = harness({load: options => {calls++; signal = options.signal; return new Promise(() => {});}});
  h.render(false); assert.equal(calls, 0);
  h.render(true); assert.equal(calls, 1);
  h.render(false); assert.equal(signal.aborted, true);
});
