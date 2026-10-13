import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { requestAccurateLocation } from '../lib/accurateLocation.js';
import { searchTechnicians } from '../services/technicianSearchService.js';
import { nepalDateTimeToUTC, buildBookingPayload } from '../services/bookingService.js';
const require = createRequire(import.meta.url);
const React = require('react');
const { transform } = require('next/dist/build/swc');
const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...React.Children.toArray(tree.props?.children).flatMap(nodes)];
}
const text = tree => nodes(tree).flatMap(n => React.Children.toArray(n.props?.children).filter(c => typeof c === 'string' || typeof c === 'number')).join(' ');
const byId = (tree, id) => nodes(tree).find(n => n.props.id === id);
const button = (tree, label) => nodes(tree).find(n => n.type === 'button' && text(n) === label);
async function compile(path) {
  return (await transform(await readFile(new URL('../' + path, import.meta.url), 'utf8'), { filename: path.replace('.js', '.jsx'), jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'classic' } } }, module: { type: 'commonjs' } })).code;
}
const compiled = await compile('components/user-dashboard/TechnicianSearchPage.js');
const dashboardCompiled = await compile('components/user-dashboard/UserDashboardNewUI.js');
const tech = { id: 10, userId: 10, name: 'ram sam', rating: 3, email: 'tech@example.test', phone: '9817926978', address: 'koshi, Nepal', avatar: '', isVerified: true, isKycVerified: true, services: [{ id: 25, name: 'House Wiring', description: 'Residential wiring services.' }] };
const apiTechnician = { id: 10, first_name: 'ram', last_name: 'sam', email: 'tech@example.test', role: 't', is_verified: true, profile: { id: 9, user: 10, rating: 3, address: 'koshi, Nepal', phone_number: '9817926978', is_kyc_verified: true, services: tech.services, nagarita_front: '/media/private-document.jpg', certificate: '/media/certificate.jpg' } };
const apiOptions = fetchImpl => ({ baseUrl: 'https://api.example.test', fetchImpl });
function harness({ create = () => assert.fail('Unexpected booking request'), areas = async () => [{ id: 1, name: 'Phidim' }, { id: 2, name: 'Dharan' }], services = async () => [{ id: 25, name: 'House Wiring' }], search = async () => [tech], code = compiled, exported = 'default', props = {}, navigation = [], gps } = {}) {
  const hooks = [], effects = []; let cursor = 0;
  const module = { exports: {} };
  const actualReact = { ...React,
    useState(initial) { const i = cursor++; if (!(i in hooks)) hooks[i] = typeof initial === 'function' ? initial() : initial; return [hooks[i], value => { hooks[i] = typeof value === 'function' ? value(hooks[i]) : value; }]; },
    useRef(initial) { const i = cursor++; return hooks[i] ||= { current: initial }; },
    useMemo: fn => fn(),
    useEffect(callback, deps) { if (code === dashboardCompiled) return; const i = cursor++; const old = hooks[i]; if (!old || deps.some((v, n) => v !== old.deps[n])) effects.push(() => { old?.cleanup?.(); hooks[i] = { deps, cleanup: callback() }; }); },
  };
  class MockFormData { constructor(form) { this.values = form.values; } get(key) { return this.values[key]; } }
  vm.runInNewContext(code, { module, exports: module.exports, React, AbortController, FormData: MockFormData, setTimeout: () => 0, require(name) {
    if (name === 'react') return actualReact;
    if (name === 'next/link') return { __esModule: true, default: 'a' };
    if (name === 'next/navigation') return { useRouter: () => ({ push: url => navigation.push(url) }) };
    if (name === '@/services/bookingService') return { fetchServiceAreas: areas, fetchServicesByArea: services, nepalDateTimeToUTC };
    if (name === '@/services/technicianSearchService') return { searchTechnicians: search };
    if (name === 'lucide-react') return new Proxy({}, { get: () => 'icon' });
    if (name === 'motion/react') return { motion: new Proxy({}, { get: (_, key) => key }), AnimatePresence: 'section' };
    if (name === '@/context/AuthContext') return { useAuth: () => ({ user: { name: 'Customer', email: 'customer@example.test' } }) };
    if (name === '@/components/calls/CallProvider') return { useCall: () => ({}) };
    if (name === '@/lib/bookingStore') return { createBooking: create, getBookingsList: () => [], subscribeBookings: () => () => {} };
    if (name === '@/lib/accurateLocation') return {requestAccurateLocation: (ok, fail) => requestAccurateLocation(ok, fail, {geolocation: gps})};
    return new Proxy({}, { get: () => () => null });
  } });
  return { render() { cursor = 0; const tree = module.exports[exported](props); effects.splice(0).forEach(effect => effect()); return tree; }, unmount() { hooks.forEach(h => h?.cleanup?.()); } };
}
test('technician booking waits for precise coordinates and releases location watch on close', () => {
  let fix, stopped = 0;
  const h = harness({exported: 'TechnicianBookingForm', props: {technician: tech, area: {id: 1, name: 'Phidim'}, service: tech.services[0]},
    gps: {watchPosition(ok) {fix = ok; return 2;}, clearWatch() {stopped++;}}});
  let tree = h.render(); button(tree, 'Use my location').props.onClick();
  fix({timestamp: Date.now(), coords: {latitude: 27, longitude: 87, accuracy: 4000}});
  tree = h.render();
  assert.equal(nodes(tree).find(n => n.props.name === 'latitude').props.value, '');
  assert.equal(nodes(tree).find(n => n.props.type === 'submit').props.disabled, true);
  fix({timestamp: Date.now(), coords: {latitude: 27.16, longitude: 87.92, accuracy: 9}});
  tree = h.render();
  assert.equal(nodes(tree).find(n => n.props.name === 'latitude').props.value, '27.1600000');
  assert.equal(nodes(tree).find(n => n.props.type === 'submit').props.disabled, false);
  assert.match(text(tree), /9\s+metres/);
  button(tree, 'Use my location').props.onClick(); h.unmount();
  assert.ok(stopped >= 2);
});

async function ready(h) {
  h.render(); await tick(); let tree = h.render();
  byId(tree, 'technician-area').props.onChange({ target: { value: '1' } }); h.render(); await tick(); tree = h.render();
  byId(tree, 'technician-service').props.onChange({ target: { value: '25' } });
  return h.render();
}
const submitSearch = tree => nodes(tree).find(n => n.type === 'form').props.onSubmit({ preventDefault() {} });

test('search sends exact filters and maps backend profile fields without inventing data', async () => {
  const controller = new AbortController(); let request;
  const rows = await searchTechnicians({ serviceAreaId: 1, serviceId: 25 }, { ...apiOptions(async (url, options) => { request = { url, options }; return Response.json([apiTechnician]); }), signal: controller.signal });
  assert.equal(request.url, 'https://api.example.test/technicians/?service-area=1&service=25');
  assert.equal(request.options.signal, controller.signal);
  assert.deepEqual(rows, [tech]);
  assert.equal(buildBookingPayload({ technicianId: rows[0].id, latitude: '27.16', longitude: '87.92', date: '2099-10-10', time: '10:30', notes: 'Repair needed' }).technician, 10);
  assert.equal(rows[0].avatar, ''); assert.equal(rows[0].reviewCount, undefined); assert.equal(rows[0].experienceYears, undefined);
  assert.equal(rows[0].nagarita_front, undefined); assert.equal(rows[0].certificate, undefined);
});

test('search handles pagination, preserves filters, and rejects loops or foreign origins', async () => {
  const urls = [];
  const rows = await searchTechnicians({ serviceAreaId: '1', serviceId: '25' }, apiOptions(async url => {
    urls.push(url);
    return Response.json(urls.length === 1 ? { results: [apiTechnician], next: '/technicians/?page=2' } : { results: [{ ...apiTechnician, id: 11, profile: { ...apiTechnician.profile, id: 9 } }], next: null });
  }));
  assert.equal(rows.length, 2);
  assert.equal(urls[1], 'https://api.example.test/technicians/?page=2&service-area=1&service=25');
  for (const next of ['/technicians/', 'https://foreign.example/technicians/']) {
    await assert.rejects(searchTechnicians({ serviceAreaId: 1, serviceId: 25 }, apiOptions(async () => Response.json({ results: [apiTechnician], next }))), /Invalid technician pagination/);
  }
});

test('missing or string ratings and optional photos are normalized safely', async () => {
  const rows = await searchTechnicians({ serviceAreaId: 1, serviceId: 25 }, apiOptions(async () => Response.json([
    { ...apiTechnician, profile: { ...apiTechnician.profile, rating: '3.5', avatar: '/media/avatar.jpg' } },
    { ...apiTechnician, id: 11, profile: { id: 9, rating: null } },
    { ...apiTechnician, id: 12, profile: { id: 10, rating: 'invalid' } },
    { ...apiTechnician, id: 13, profile: { id: 11, rating: 0 } },
    { ...apiTechnician, profile: null },
  ])));
  assert.equal(rows[0].rating, 3.5); assert.equal(rows[0].avatar, 'https://api.example.test/media/avatar.jpg');
  assert.equal(rows[1].rating, null); assert.equal(rows[2].rating, null); assert.equal(rows[3].rating, 0); assert.deepEqual(rows[1].services, []);
});

test('API errors, invalid payloads, empty results, and cancellation are handled', async () => {
  const criteria = { serviceAreaId: 1, serviceId: 25 };
  await assert.rejects(searchTechnicians({ ...criteria, serviceAreaId: '' }, apiOptions(() => assert.fail('Must not request'))), /valid service area/);
  await assert.rejects(searchTechnicians(criteria, apiOptions(async () => Response.json({ detail: 'Unavailable' }, { status: 503 }))), /Unavailable/);
  await assert.rejects(searchTechnicians(criteria, apiOptions(async () => Response.json({}, { status: 401 }))), /session expired/);
  await assert.rejects(searchTechnicians(criteria, apiOptions(async () => Response.json({ unexpected: [] }))), /Invalid technician response/);
  assert.deepEqual(await searchTechnicians(criteria, apiOptions(async () => Response.json([]))), []);
  const controller = new AbortController();
  const pending = searchTechnicians(criteria, { ...apiOptions((url, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')), { once: true }))), signal: controller.signal });
  controller.abort(); await assert.rejects(pending, { name: 'AbortError' });
});

test('search only runs on submit and cards open details and booking with fixed selections', async () => {
  const calls = []; const h = harness({ search: async (...args) => { calls.push(args); return [tech]; }, props: { initialNotes: 'Camera has no video' } });
  let tree = await ready(h); assert.equal(calls.length, 0); assert.equal(button(tree, 'Search').props.disabled, false);
  await submitSearch(tree); tree = h.render(); assert.equal(calls.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0][0])), { serviceAreaId: 1, serviceId: 25 });
  assert.match(text(tree), /ram sam/);
  button(tree, 'View Details').props.onClick(); tree = h.render(); assert.match(text(tree), /koshi, Nepal/); assert.match(text(tree), /9817926978/); assert.match(text(tree), /Residential wiring services/); assert.doesNotMatch(text(tree), /Sample profile|years of experience/);
  nodes(tree).find(n => n.props.title === 'Technician details').props.onClose(); tree = h.render();
  button(tree, 'Book Now').props.onClick(); tree = h.render();
  const booking = nodes(tree).find(n => n.type?.name === 'TechnicianBookingForm');
  assert.equal(booking.props.technician.id, tech.id); assert.equal(booking.props.area.id, 1); assert.equal(booking.props.service.id, 25); assert.equal(booking.props.initialNotes, 'Camera has no video');
  h.unmount();
});

test('cards handle missing ratings and photos without displaying fabricated review data', async () => {
  const h = harness({ search: async () => [{ ...tech, rating: null }] });
  let tree = await ready(h); await submitSearch(tree); tree = h.render();
  const rating = nodes(tree).find(n => n.type?.name === 'Rating');
  assert.match(text(rating.type(rating.props)), /Not rated yet/);
  assert.doesNotMatch(text(rating.type(rating.props)), /reviews/);
  assert.match(text(rating.type({ technician: { ...tech, rating: 0 } })), /0.0/);
  assert.doesNotMatch(text(tree), /years of experience|Sample profile/);
  h.unmount();
});

test('changing filters cancels pending searches and services; late results cannot appear', async () => {
  const searches = [], serviceRequests = [];
  const h = harness({ services: (id, { signal }) => { const p = deferred(); serviceRequests.push({ id, signal, ...p }); return p.promise; }, search: (criteria, { signal }) => { const p = deferred(); searches.push({ signal, ...p }); return p.promise; } });
  h.render(); await tick(); let tree = h.render();
  byId(tree, 'technician-area').props.onChange({ target: { value: '1' } }); h.render();
  tree = h.render(); byId(tree, 'technician-area').props.onChange({ target: { value: '2' } }); h.render();
  assert.equal(serviceRequests[0].signal.aborted, true);
  serviceRequests[0].resolve([{ id: 99, name: 'Wrong area' }]); serviceRequests[1].resolve([{ id: 25, name: 'House Wiring' }]); await tick(); tree = h.render();
  assert.doesNotMatch(text(tree), /Wrong area/); assert.equal(byId(tree, 'technician-service').props.value, '');
  byId(tree, 'technician-service').props.onChange({ target: { value: '25' } }); tree = h.render(); const pending = submitSearch(tree); tree = h.render();
  assert.equal(button(tree, 'Search').props.disabled, true);
  byId(tree, 'technician-area').props.onChange({ target: { value: '1' } }); tree = h.render();
  assert.equal(searches[0].signal.aborted, true); searches[0].resolve([tech]); await pending; tree = h.render();
  assert.doesNotMatch(text(tree), /ram sam/); assert.equal(byId(tree, 'technician-service').props.value, ''); h.unmount();
});

test('API failures and empty results show recovery states', async () => {
  let areaCalls = 0, serviceCalls = 0, searchCalls = 0;
  const h = harness({ areas: async () => { if (++areaCalls === 1) throw Error('Area offline'); return [{ id: 1, name: 'Phidim' }]; }, services: async () => { if (++serviceCalls === 1) throw Error('Services offline'); return [{ id: 25, name: 'House Wiring' }]; }, search: async () => { if (++searchCalls === 1) throw Error('Search offline'); return []; } });
  h.render(); await tick(); let tree = h.render(); assert.match(text(tree), /Area offline/);
  button(tree, 'Retry service areas').props.onClick(); h.render(); await tick(); tree = h.render();
  byId(tree, 'technician-area').props.onChange({ target: { value: '1' } }); h.render(); await tick(); tree = h.render(); assert.match(text(tree), /Services offline/);
  button(tree, 'Retry services').props.onClick(); h.render(); await tick(); tree = h.render();
  byId(tree, 'technician-service').props.onChange({ target: { value: '25' } }); tree = h.render(); await submitSearch(tree); tree = h.render(); assert.match(text(tree), /Search offline/);
  await button(tree, 'Retry search').props.onClick(); tree = h.render(); assert.match(text(tree), /No technicians found/); h.unmount();
});

test('booking validates inputs, awaits server creation, prevents duplicates, and retries failures', async () => {
  const requests = [];
  const h = harness({ create: data => { const pending = deferred(); requests.push({ data, ...pending }); return pending.promise; }, exported: 'TechnicianBookingForm', props: { technician: tech, area: { id: 1, name: 'Phidim' }, service: { id: 25, name: 'House Wiring' }, initialNotes: 'No video' } });
  let tree = h.render();
  assert.equal(nodes(tree).find(n => n.type === 'textarea').props.defaultValue, 'No video');
  const submit = values => nodes(tree).find(n => n.type === 'form').props.onSubmit({ preventDefault() {}, currentTarget: { values } });
  const values = { address: 'Main bazar', notes: 'No video', date: '2099-10-10', time: '10:30' };
  await submit(values); tree = h.render(); assert.match(text(tree), /Enter valid latitude/);
  nodes(tree).find(n => n.props.name === 'latitude').props.onChange({ target: { value: '27.16' } });
  nodes(tree).find(n => n.props.name === 'longitude').props.onChange({ target: { value: '87.92' } }); tree = h.render();
  await submit({ ...values, notes: '   ' }); tree = h.render(); assert.match(text(tree), /Enter your service address and problem details/);
  await submit({ ...values, date: '2020-01-01' }); tree = h.render(); assert.match(text(tree), /Choose a future/);
  const first = submit(values); tree = h.render();
  assert.equal(nodes(tree).find(n => n.type === 'fieldset').props.disabled, true);
  await submit(values); assert.equal(requests.length, 1);
  assert.equal(requests[0].data.technicianId, 10);
  assert.equal(buildBookingPayload(requests[0].data).technician, 10);
  assert.equal(requests[0].data.latitude, '27.16');
  assert.equal(requests[0].data.longitude, '87.92');
  assert.equal(requests[0].data.notes, 'No video');
  assert.equal(requests[0].data.customerEmail, 'customer@example.test');
  assert.equal(requests[0].data.serviceAreaId, undefined);
  assert.doesNotMatch(text(tree), /Booking created/);
  requests[0].reject(Error('technician: unavailable')); await first; tree = h.render();
  assert.match(text(tree), /technician: unavailable/);
  assert.equal(nodes(tree).find(n => n.props.name === 'latitude').props.value, '27.16');
  const second = submit(values);
  requests[1].resolve({ id: '19', status: 'Pending' }); await second; tree = h.render();
  assert.match(text(tree), /Booking created/); assert.match(text(tree), /19/); assert.match(text(tree), /Pending/);
  assert.doesNotMatch(text(tree), /Demo booking|No real booking/);
  assert.equal(nodes(tree).some(n => n.type === 'form'), false); h.unmount();
});

test('dashboard booking buttons navigate to search and assistant notes survive navigation', () => {
  const navigation = []; const h = harness({ code: dashboardCompiled, navigation }); let tree = h.render();
  for (const label of ['Book New Service', 'Book Service', 'Book a Technician', 'Instant Book']) button(tree, label).props.onClick();
  assert.deepEqual(navigation, Array(4).fill('/user/book-service'));
  nodes(tree).find(n => n.type === 'button' && text(n).includes('Support Center')).props.onClick(); tree = h.render();
  nodes(tree).find(n => n.type === 'button' && text(n).includes('My Split AC is leaking')).props.onClick();
  assert.match(navigation.at(-1), /^\/user\/book-service\?notes=/); assert.match(decodeURIComponent(navigation.at(-1)), /My Split AC is leaking/); h.unmount();
});
