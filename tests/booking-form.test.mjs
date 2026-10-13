import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import { requestAccurateLocation } from '../lib/accurateLocation.js';
const require = createRequire(import.meta.url);
const React = require('react');
const {transform} = require('next/dist/build/swc');
const source = await readFile(new URL('../components/BookingFields.js', import.meta.url), 'utf8');
const compiled = await transform(source, {filename: 'BookingFields.jsx', jsc: {parser: {syntax: 'ecmascript', jsx: true}, transform: {react: {runtime: 'classic'}}}, module: {type: 'commonjs'}});
const tick = () => new Promise(resolve => setImmediate(resolve));
function harness({load = async () => [{id: 6, userId: 7, name: 'Ram Sita'}], loadAreas = async () => [{id: 1, name: 'Phidim'}, {id: 2, name: 'dharan'}], requireServiceArea = false, create, gps} = {}) {
  const hooks = [], effects = []; let cursor = 0;
  const module = {exports: {}};
  vm.runInNewContext(compiled.code, {module, exports: module.exports, React, AbortController, navigator: gps ? {geolocation: gps} : {}, require(name) {
    if (name === 'react') return {...React,
      useState(initial) {const i = cursor++; if (!(i in hooks)) hooks[i] = initial; return [hooks[i], value => {hooks[i] = typeof value === 'function' ? value(hooks[i]) : value;}];},
      useRef(initial) {const i = cursor++; return hooks[i] ||= {current: initial};},
      useEffect(callback, deps) {const i = cursor++; const old = hooks[i]; if (!old || deps.some((v,n) => v !== old.deps[n])) effects.push(() => {old?.cleanup?.(); hooks[i] = {deps, cleanup: callback()};});},
    };
    if (name === '@/services/bookingService') return {fetchTechnicians: load, fetchServiceAreas: loadAreas};
    if (name === '@/lib/bookingStore') return {createBooking: create};
    if (name === '@/lib/accurateLocation') return {requestAccurateLocation: (ok, fail) => requestAccurateLocation(ok, fail, {geolocation: gps})};
    throw new Error('Unexpected import ' + name);
  }});
  return {render(active = true) {cursor = 0; const form = module.exports.useBookingForm(active, {requireServiceArea}); while(effects.length) effects.shift()(); return form;}, unmount() {hooks.forEach(h => h?.cleanup?.());}};
}
const metadata = {date: '2026-09-10', notes: 'No video'};
test('dashboard requires a loaded service area and submits its numeric ID', async () => {
  let submitted;
  const h = harness({requireServiceArea: true, create: async data => {submitted = data; return {id: '18'};}});
  let f = await fill(h);
  assert.equal(f.disabled, true);
  assert.equal(await f.submit(metadata), null);
  f.setServiceAreaId('2');
  f = h.render();
  assert.equal(f.disabled, false);
  assert.equal((await f.submit(metadata)).id, '18');
  assert.equal(submitted.serviceAreaId, 2);
  assert.equal(submitted.serviceArea.name, 'dharan');
  h.unmount();
});

test('service area failure blocks booking and retry recovers the list', async () => {
  let calls = 0;
  const h = harness({requireServiceArea: true, loadAreas: async () => {if (++calls === 1) throw new Error('Offline'); return [{id: 1, name: 'Phidim'}];}});
  let f = await fill(h);
  assert.match(f.areasError, /Offline/);
  assert.equal(f.disabled, true);
  f.retry(); h.render(); await tick(); f = h.render();
  assert.equal(f.areasError, '');
  assert.equal(f.serviceAreas[0].name, 'Phidim');
  h.unmount();
});
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

test('GPS success fills accurate coordinates and GPS denial clears stale coordinates', async () => {
  let fail = false;
  const h = harness({gps: {watchPosition(ok, error) {if (fail) error({code: 1}); else ok({timestamp: Date.now(), coords: {latitude: 27.16, longitude: 87.92, accuracy: 12}}); return 1;}, clearWatch() {}}});
  let f = await fill(h); f.locate(); f = h.render();
  assert.equal(f.latitude, '27.1600000'); assert.equal(f.longitude, '87.9200000');
  assert.equal(f.locationAccuracy, 12);
  f.setLatitude('28'); f.setLongitude('88'); fail = true;
  f = h.render(); f.locate(); f = h.render();
  assert.equal(f.latitude, ''); assert.equal(f.longitude, ''); assert.match(f.locationError, /enter coordinates manually/);
  h.unmount();
});

test('coarse location blocks submission until a precise fix; closing cancels detection', async () => {
  let fix, cleared = 0;
  const h = harness({gps: {watchPosition(ok) {fix = ok; return 4;}, clearWatch() {cleared++;}}, create: () => assert.fail('Must wait for precise coordinates')});
  let f = await fill(h); f.locate(); f = h.render();
  fix({timestamp: Date.now(), coords: {latitude: 27, longitude: 87, accuracy: 2000}});
  f = h.render(); assert.equal(f.latitude, ''); assert.equal(f.locating, true); assert.equal(f.disabled, true);
  assert.equal(await f.submit(metadata), null);
  fix({timestamp: Date.now(), coords: {latitude: 27.16, longitude: 87.92, accuracy: 10}});
  f = h.render(); assert.equal(f.locating, false); assert.equal(f.disabled, false); assert.equal(f.locationAccuracy, 10);
  f.setLatitude('28'); assert.equal(h.render().locationAccuracy, null);
  f = h.render(); f.locate(); h.render(false);
  const stoppedAt = cleared;
  fix({timestamp: Date.now(), coords: {latitude: 25, longitude: 85, accuracy: 5}});
  assert.equal(h.render(false).latitude, ''); assert.ok(stoppedAt >= 2);
  h.unmount();
});

test('inactive forms do not fetch, and closing aborts the pending technician request', async () => {
  let signal, calls = 0;
  const h = harness({load: options => {calls++; signal = options.signal; return new Promise(() => {});}});
  h.render(false); assert.equal(calls, 0);
  h.render(true); assert.equal(calls, 1);
  h.render(false); assert.equal(signal.aborted, true);
});
