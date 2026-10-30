import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { transform } = require('next/dist/build/swc');
const source = await readFile(new URL('../components/technician-dashboard/TechnicianBookings.js', import.meta.url), 'utf8');
const compiled = await transform(source, {
  filename: 'TechnicianBookings.jsx',
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'classic' } } },
  module: { type: 'commonjs' },
});

// Drive effect lifetimes explicitly so delayed requests can be resolved after
// a session change, without adding a browser/test-renderer dependency.
function harness(fetchImpl, updateImpl = async () => { throw new Error('Unexpected update'); }, browser = {}) {
  let auth = { user: { id: '8', role: 'TECHNICIAN' }, isAuthenticated: true, isLoading: false };
  const states = [], effects = [], refs = [];
  let stateIndex = 0, effectIndex = 0, refIndex = 0, pending = [], tree;
  const module = { exports: {} };
  vm.runInNewContext(compiled.code, {
    module, exports: module.exports, React, AbortController, Intl, Date, URLSearchParams,
    window: { isSecureContext: false }, navigator: {}, ...browser,
    require: name => {
      if (name === 'react') return {
        useRef(initial) {
          const index = refIndex++;
          if (!(index in refs)) refs[index] = { current: initial };
          return refs[index];
        },
        useState(initial) {
          const index = stateIndex++;
          if (!(index in states)) states[index] = initial;
          return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
        },
        useEffect(effect, deps) {
          const index = effectIndex++;
          if (!effects[index] || deps.some((dep, i) => dep !== effects[index].deps[i])) {
            pending.push(() => {
              effects[index]?.cleanup?.();
              effects[index] = { deps, cleanup: effect() };
            });
          }
        },
      };
      if (name === '@/context/AuthContext') return { useAuth: () => auth };
      if (name === '@/services/bookingService') return { fetchBookings: fetchImpl, updateTechnicianBooking: updateImpl };
      if (name === 'lucide-react') return new Proxy({}, { get: () => () => null });
      throw new Error(`Unexpected import ${name}`);
    },
  });
  function visit(node, predicate) {
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    for (const child of React.Children.toArray(node.props?.children)) {
      const found = visit(child, predicate);
      if (found) return found;
    }
    return null;
  }
  return {
    render() {
      stateIndex = 0; effectIndex = 0; refIndex = 0;
      tree = module.exports.TechnicianBookings();
      const html = renderToStaticMarkup(tree);
      const queued = pending; pending = [];
      queued.forEach(effect => effect());
      return html;
    },
    setAuth(value) { auth = value; },
    refresh() { visit(tree, node => node.type === 'button').props.onClick(); },
    search(value) { visit(tree, node => node.type === 'input').props.onChange({ target: { value } }); },
    open(id) { visit(tree, node => node.props?.['aria-label'] === `Review booking #${id}`).props.onClick({ stopPropagation() {} }); },
    share() { visit(tree, node => node.props?.['aria-label'] === 'Share live location for booking #20').props.onClick({ stopPropagation() {} }); },
    confirmShare() { visit(tree, node => node.type === 'button' && node.props.children === 'Confirm location share').props.onClick(); },
    closeShare() { visit(tree, node => node.props?.['aria-label'] === 'Close location sharing').props.onClick(); },
    mapLink(id = 20) { return visit(tree, node => node.type === 'a' && node.props['aria-label'].includes(`for booking #${id} `))?.props; },
    clickMap() {
      const row = visit(tree, node => node.type === 'tr' && typeof node.props.onClick === 'function');
      const control = visit(row, node => node.type === 'div' && typeof node.props.onClick === 'function');
      let stopped = false;
      control.props.onClick({ stopPropagation() { stopped = true; } });
      if (!stopped) row.props.onClick();
      return stopped;
    },
    decide(status) { return visit(tree, node => node.type === 'button' && React.Children.toArray(node.props.children).includes(status === 'c' ? 'Accept booking' : 'Reject booking')).props.onClick(); },
    close() { visit(tree, node => node.props?.['aria-label'] === 'Close booking review').props.onClick(); },
    unmount() { effects.forEach(effect => effect.cleanup?.()); },
  };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
const booking = { id: 20, status: 'p', status_display: 'pending', customer: { first_name: 'ram', last_name: 'sita' }, technician: { first_name: 'semik', last_name: 'anaconda' }, date: '2026-10-14T04:48:00Z', problem_details: 'Home Appliance service I need', latitude: '26.6500000', longitude: '87.6500000' };

test('location sharing connects only after confirmation, retries errors and closes on dismissal', async () => {
  const sockets = [];
  const intervals = new Map();
  const document = { cookie: 'other=value; phidim_access_token=dummy%2Baccess%2Ftoken%3D' };
  let intervalId = 0;
  class WebSocket {
    static OPEN = 1;
    constructor(url) { this.url = url; this.readyState = 0; this.messages = []; sockets.push(this); }
    send(message) { this.messages.push(JSON.parse(message)); }
    close() { this.closed = true; }
  }
  const app = harness(async () => [booking], undefined, {
    WebSocket, document,
    setInterval(callback, delay) { assert.equal(delay, 1000); intervals.set(++intervalId, callback); return intervalId; },
    clearInterval(id) { intervals.delete(id); },
  });
  app.render(); await settle(); app.render();
  app.share();
  assert.match(app.render(), /Confirm location share/);
  assert.equal(sockets.length, 0);
  app.confirmShare(); app.render();
  const socketUrl = new URL(sockets[0].url);
  assert.equal(socketUrl.origin + socketUrl.pathname, 'ws://127.0.0.1:8000/ws/share-location/20/');
  assert.equal(socketUrl.searchParams.get('token'), 'dummy+access/token=');
  assert.equal(intervals.size, 0);
  sockets[0].onerror();
  assert.match(app.render(), /Unable to connect/);
  app.confirmShare(); app.render();
  assert.equal(sockets.length, 2);
  assert.equal(sockets[0].closed, true);
  sockets[1].readyState = WebSocket.OPEN;
  sockets[1].onopen();
  assert.match(app.render(), /WebSocket connected/);
  assert.equal(sockets[1].messages.length, 0);
  const tick = [...intervals.values()][0];
  tick(); tick();
  assert.deepEqual(sockets[1].messages, [
    { type: 'location_update', latitude: 27.1479, longitude: 87.7657 },
    { type: 'location_update', latitude: 27.1479, longitude: 87.7657 },
  ]);
  sockets[1].readyState = 3;
  tick();
  assert.equal(sockets[1].messages.length, 2);
  sockets[1].onclose();
  assert.equal(intervals.size, 0);
  app.render(); app.confirmShare(); app.render();
  sockets[2].readyState = WebSocket.OPEN;
  sockets[2].onopen();
  assert.equal(intervals.size, 1);
  app.closeShare(); app.render();
  assert.equal(sockets[2].closed, true);
  assert.equal(intervals.size, 0);
  document.cookie = 'other=value';
  app.share(); app.render(); app.confirmShare(); app.render();
  assert.match(app.render(), /access token is missing/);
  assert.equal(sockets.length, 3);
  app.unmount();
});

function mapBrowser({ secure = true, supported = true, throws = false } = {}) {
  const requests = [], timers = new Map();
  let timerId = 0;
  return {
    requests, timers,
    expire() { for (const callback of [...timers.values()]) callback(); },
    globals: {
      window: {
        isSecureContext: secure,
        open() { assert.fail('Location requests must not open a tab'); },
        location: { assign() { assert.fail('Location requests must not navigate'); } },
      },
      navigator: { geolocation: supported ? {
        getCurrentPosition(success, failure, options) {
          if (throws) throw new Error('Location unavailable');
          requests.push({ success, failure, options });
        },
      } : undefined },
      setTimeout(callback, delay) { assert.equal(delay, 15000); timers.set(++timerId, callback); return timerId; },
      clearTimeout(id) { timers.delete(id); },
    },
  };
}

test('page entry requests location once and changes booking links to Map direction when precise', async () => {
  const browser = mapBrowser();
  const app = harness(async () => [booking, { ...booking, id: 21, latitude: 0, longitude: -180 }], undefined, browser.globals);
  app.render();
  assert.equal(browser.requests.length, 1);
  await settle(); app.render();
  assert.equal(app.mapLink().children, 'Show map');
  assert.equal(new URL(app.mapLink().href).pathname, '/maps/search/');
  assert.equal(app.mapLink().onClick, undefined);
  assert.equal(app.clickMap(), true);
  assert.doesNotMatch(app.render(), /<dialog/);
  const request = browser.requests[0];
  assert.deepEqual({ ...request.options }, { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 });
  request.success({ coords: { latitude: 0, longitude: 87.5, accuracy: 100 } });
  app.render();
  const link = app.mapLink(21);
  assert.equal(link.children, 'Map direction');
  assert.equal(link['aria-label'], 'Map direction for booking #21 (opens in a new tab)');
  assert.equal(link.target, '_blank');
  assert.equal(link.rel, 'noopener noreferrer');
  assert.equal(link.onClick, undefined);
  const url = new URL(link.href);
  assert.equal(url.pathname, '/maps/dir/');
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.get('origin'), '0,87.5');
  assert.equal(url.searchParams.get('destination'), '0,-180');
  assert.equal(url.searchParams.get('travelmode'), 'driving');
  assert.equal(browser.timers.size, 0);
  request.failure({ code: 3 });
  app.render();
  assert.equal(new URL(app.mapLink().href).searchParams.get('destination'), '26.6500000,87.6500000');
  assert.equal(app.clickMap(), true);
  app.search('ram'); app.render();
  app.refresh(); app.render(); await settle(); app.render();
  assert.equal(browser.requests.length, 1);
  assert.equal(app.mapLink().children, 'Map direction');
  app.unmount();
});

test('Show map falls back to the existing booking pin for every location failure', async () => {
  const cases = [
    { secure: false }, { supported: false }, { throws: true },
    ...[1, 2, 3].map(code => ({ error: { code } })),
    { expire: true },
    ...[100.01, -1, NaN, Infinity, undefined, '10'].map(accuracy => ({ coords: { latitude: 27, longitude: 87, accuracy } })),
    ...[{ latitude: 91, longitude: 87 }, { latitude: 27, longitude: -181 }, { latitude: NaN, longitude: 87 }, { latitude: null, longitude: 87 }].map(coords => ({ coords: { ...coords, accuracy: 5 } })),
    { coords: null },
  ];
  for (const scenario of cases) {
    const browser = mapBrowser(scenario);
    const app = harness(async () => [booking], undefined, browser.globals);
    app.render(); await settle(); app.render();
    const request = browser.requests[0];
    if (scenario.expire) browser.expire();
    else if (request) {
      if (scenario.error) request.failure(scenario.error);
      else request.success({ coords: scenario.coords });
    }
    app.render();
    assert.equal(app.mapLink().href, 'https://www.google.com/maps/search/?api=1&query=26.6500000%2C87.6500000');
    assert.equal(app.mapLink().children, 'Show map');
    assert.equal(browser.timers.size, 0);
    request?.success({ coords: { latitude: 27, longitude: 87, accuracy: 5 } });
    app.render();
    assert.equal(app.mapLink().children, 'Show map');
    assert.equal(app.clickMap(), true);
    app.unmount();
  }
});

test('location requests wait for authorization and discard results from an old session', async () => {
  const browser = mapBrowser();
  const app = harness(async () => [booking], undefined, browser.globals);
  app.setAuth({ user: null, isAuthenticated: false, isLoading: true });
  app.render();
  app.setAuth({ user: { id: '1', role: 'USER' }, isAuthenticated: true, isLoading: false });
  app.render();
  assert.equal(browser.requests.length, 0);
  app.setAuth({ user: { id: '8', role: 'TECHNICIAN' }, isAuthenticated: true, isLoading: false });
  app.render(); await settle(); app.render();
  assert.equal(browser.requests.length, 1);
  app.setAuth({ user: { id: '9', role: 'TECHNICIAN' }, isAuthenticated: true, isLoading: false });
  app.render(); await settle(); app.render();
  assert.equal(browser.requests.length, 2);
  browser.requests[0].success({ coords: { latitude: 27, longitude: 87, accuracy: 5 } });
  app.render();
  assert.equal(app.mapLink().children, 'Show map');
  browser.requests[1].success({ coords: { latitude: 28, longitude: 88, accuracy: 5 } });
  app.render();
  assert.equal(new URL(app.mapLink().href).searchParams.get('origin'), '28,88');
  app.setAuth({ user: { id: '10', role: 'TECHNICIAN' }, isAuthenticated: true, isLoading: false });
  app.render(); await settle(); app.render();
  assert.equal(app.mapLink().children, 'Show map');
  assert.equal(browser.requests.length, 3);
  app.unmount();
  assert.equal(browser.timers.size, 0);
});

test('leaving cancels the location request and revisiting starts a fresh request', async () => {
  const browser = mapBrowser();
  const app = harness(async () => [booking], undefined, browser.globals);
  app.render(); await settle(); app.render();
  app.unmount();
  assert.equal(browser.timers.size, 0);
  browser.requests[0].success({ coords: { latitude: 27, longitude: 87, accuracy: 5 } });
  app.render();
  assert.equal(app.mapLink().children, 'Show map');
  const revisit = harness(async () => [booking], undefined, browser.globals);
  revisit.render(); await settle(); revisit.render();
  assert.equal(browser.requests.length, 2);
  assert.equal(revisit.mapLink().children, 'Show map');
  browser.requests[1].success({ coords: { latitude: 28, longitude: 88, accuracy: 5 } });
  revisit.render();
  assert.equal(revisit.mapLink().children, 'Map direction');
  revisit.unmount();
});

test('map links use each booking location and open separately without opening review', async () => {
  const app = harness(async () => [booking, { ...booking, id: 21, latitude: 0, longitude: -180 }]);
  app.render(); await settle();
  const html = app.render();
  assert.match(html, /href="https:\/\/www.google.com\/maps\/search\/\?api=1&amp;query=26.6500000%2C87.6500000"/);
  assert.match(html, /query=0%2C-180/);
  assert.equal((html.match(/target="_blank" rel="noopener noreferrer"/g) || []).length, 2);
  assert.match(html, /Show map for booking #20 \(opens in a new tab\)/);
  assert.equal(app.clickMap(), true);
  assert.doesNotMatch(app.render(), /<dialog/);
  app.open(20);
  assert.match(app.render(), /<dialog/);
  app.unmount();
});

test('missing or invalid coordinates disable map controls with an explanation', async () => {
  const invalid = [null, undefined, '', '  ', 'invalid', Infinity, NaN, 91, -91, true, {}];
  const rows = invalid.map((latitude, index) => ({ ...booking, id: index + 1, latitude }));
  rows.push(...[null, '', 'invalid', 181, -181].map((longitude, index) => ({ ...booking, id: index + 30, longitude })));
  const app = harness(async () => rows);
  app.render(); await settle();
  const html = app.render();
  assert.doesNotMatch(html, /https:\/\/www.google.com\/maps/);
  assert.equal((html.match(/disabled="" aria-describedby="booking-location-unavailable-/g) || []).length, rows.length);
  assert.equal((html.match(/>Location unavailable</g) || []).length, rows.length);
  assert.equal(app.clickMap(), true);
  assert.doesNotMatch(app.render(), /<dialog/);
  app.unmount();
});

test('renders real details, multiple bookings, nullable customers, and Nepal time', async () => {
  const app = harness(async () => [booking, { ...booking, id: 16, customer: null, date: null, problem_details: '', status_display: null, latitude: null }]);
  assert.match(app.render(), /Loading bookings/);
  await settle();
  const html = app.render();
  assert.match(html, /<table/);
  assert.match(html, /scope="col"/);
  for (const text of ['2 bookings', 'Booking #20', 'Booking #16', 'ram sita', 'semik anaconda', 'pending', 'Home Appliance service I need', '14 Oct 2026', '10:33 am (Nepal time)', '26.6500000', '87.6500000', 'Customer unavailable', 'Schedule unavailable', 'Problem details unavailable', 'Latitude: Unavailable']) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /Verify OTP|Complete Service|Cancel Active Job|Split AC|Elapsed Service Time|unsplash/);
  app.unmount();
});

test('clicking a booking opens a dismissible review without updating it', async () => {
  const app = harness(async () => [booking]);
  app.render(); await settle();
  assert.doesNotMatch(app.render(), /<dialog/);
  app.open(20);
  const html = app.render();
  assert.match(html, /<dialog/);
  assert.match(html, /Would you like to accept this booking or reject it/);
  assert.match(html, /Review booking #20/);
  assert.match(html, /Accept booking/);
  assert.match(html, /Reject booking/);
  app.close(); assert.doesNotMatch(app.render(), /<dialog/);
  app.unmount();
});

test('accept and reject send the selected ID and refresh server statuses on success', async () => {
  for (const status of ['c', 'r']) {
    let savedStatus = 'p', calls = 0;
    const app = harness(async () => {
      calls++;
      return [{ ...booking, status: savedStatus, status_display: savedStatus === 'p' ? 'pending' : savedStatus === 'c' ? 'confirmed' : 'rejected' }];
    }, async (id, choice, { signal }) => {
      assert.equal(id, 20); assert.equal(choice, status); assert.equal(signal.aborted, false);
      savedStatus = choice;
      return { message: 'Booking status updated successfully.', booking: id, status: choice };
    });
    app.render(); await settle(); app.render(); app.open(20); app.render();
    await app.decide(status);
    assert.doesNotMatch(app.render(), /<dialog/);
    await settle();
    const html = app.render();
    assert.match(html, status === 'c' ? /accepted successfully/ : /rejected successfully/);
    assert.match(html, status === 'c' ? />confirmed</ : />rejected</);
    assert.equal(calls, 2);
    app.unmount();
  }
});

test('pending decisions block repeat submissions and dismissal; failures keep the modal open', async () => {
  let rejectUpdate, calls = 0;
  const app = harness(async () => [booking], () => {
    calls++;
    return new Promise((_, reject) => { rejectUpdate = reject; });
  });
  app.render(); await settle(); app.render(); app.open(20); app.render();
  const pending = app.decide('c');
  await app.decide('r'); assert.equal(calls, 1);
  assert.match(app.render(), /Accepting/);
  app.close(); assert.match(app.render(), /<dialog/);
  rejectUpdate(new Error('Your session expired. Please sign in again.'));
  await pending;
  const html = app.render();
  assert.match(html, /<dialog/);
  assert.match(html, /role="alert".*Your session expired/);
  assert.match(html, /Accept booking/);
  app.close(); assert.doesNotMatch(app.render(), /<dialog/);
  app.unmount();
});

test('session changes abort decisions and hide late success notifications', async () => {
  let finishUpdate, signal;
  const app = harness(async () => [booking], (id, status, options) => {
    signal = options.signal;
    return new Promise(resolve => { finishUpdate = () => resolve({ booking: id, status }); });
  });
  app.render(); await settle(); app.render(); app.open(20); app.render();
  const pending = app.decide('r');
  app.setAuth({ user: { id: '9', role: 'TECHNICIAN' }, isAuthenticated: true, isLoading: false });
  assert.doesNotMatch(app.render(), /<dialog/);
  assert.equal(signal.aborted, true);
  finishUpdate(); await pending; await settle();
  assert.doesNotMatch(app.render(), /rejected successfully/);
  app.unmount();
});

test('search filters displayed bookings without additional requests and clears to all rows', async () => {
  let calls = 0;
  const app = harness(async () => {
    calls++;
    return [booking, { ...booking, id: 16, customer: { first_name: 'khirish', last_name: 'shrestha' }, technician: { first_name: 'other' }, status_display: 'completed', problem_details: 'CCTV camera failed' }];
  });
  app.render(); await settle(); app.render();
  for (const query of ['  KHirish  ', '#16', 'completed', 'CCTV', 'other']) {
    app.search(query);
    const html = app.render();
    assert.match(html, /Showing 1 of 2 bookings/);
    assert.match(html, /Booking #16/);
    assert.doesNotMatch(html, /Booking #20/);
  }
  app.search('no such booking');
  assert.match(app.render(), /No bookings match your search/);
  app.search('  ');
  assert.match(app.render(), /Showing 2 of 2 bookings/);
  assert.equal(calls, 1);
  app.unmount();
});

test('shows empty, error, retry, and successful refresh states', async () => {
  let calls = 0;
  const app = harness(async () => {
    if (++calls === 1) throw new Error('Your session expired. Please sign in again.');
    return calls === 2 ? [] : [booking];
  });
  app.render(); await settle();
  assert.match(app.render(), /role="alert".*Your session expired/);
  assert.match(app.render(), /Retry/);
  app.refresh(); assert.match(app.render(), /Loading bookings/); await settle();
  assert.match(app.render(), /No bookings yet/);
  app.refresh(); app.render(); await settle();
  assert.match(app.render(), /1 booking/);
  assert.equal(calls, 3);
  app.unmount();
});

test('waits for authorization and prevents stale bookings across sessions and unmount', async () => {
  const requests = [];
  const app = harness(({ signal }) => new Promise(resolve => requests.push({ signal, resolve })));
  app.setAuth({ user: null, isAuthenticated: false, isLoading: true });
  assert.equal(app.render(), ''); assert.equal(requests.length, 0);
  app.setAuth({ user: { id: '8', role: 'USER' }, isAuthenticated: true, isLoading: false });
  assert.equal(app.render(), ''); assert.equal(requests.length, 0);
  app.setAuth({ user: { id: '8', role: 'TECHNICIAN' }, isAuthenticated: true, isLoading: false });
  app.render(); assert.equal(requests.length, 1);
  requests[0].resolve([booking]); await settle();
  assert.match(app.render(), /Booking #20/);
  app.setAuth({ user: { id: '9', role: 'ADMIN' }, isAuthenticated: true, isLoading: false });
  assert.doesNotMatch(app.render(), /Booking #20/);
  assert.equal(requests[0].signal.aborted, true);
  assert.equal(requests.length, 2);
  app.setAuth({ user: null, isAuthenticated: false, isLoading: false });
  assert.equal(app.render(), ''); assert.equal(requests[1].signal.aborted, true);
  requests[1].resolve([booking]); await settle();
  app.setAuth({ user: { id: '10', role: 'TECHNICIAN' }, isAuthenticated: true, isLoading: false });
  assert.doesNotMatch(app.render(), /Booking #20/);
  app.unmount(); assert.equal(requests[2].signal.aborted, true);
  requests[2].resolve([booking]); await settle();
});
