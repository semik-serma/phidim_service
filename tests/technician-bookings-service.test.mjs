import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchBookings, updateTechnicianBooking } from '../services/bookingService.js';

const booking = { id: 16, status: 'p', status_display: 'pending', customer: null, technician: { first_name: 'ram', last_name: 'sita' }, problem_images: [], problem_details: 'Circuit failed', date: '2026-10-14T04:48:00Z', latitude: '26.6500000', longitude: '87.6500000' };

test('accept and reject PATCH exact payloads with access authentication', async () => {
  for (const status of ['c', 'r']) {
    const signal = new AbortController().signal;
    const saved = { message: 'Booking status updated successfully.', booking: 21, status };
    assert.deepEqual(await updateTechnicianBooking(21, status, { token: 'access-token', baseUrl: 'http://localhost:8000///', signal, fetchImpl: async (url, options) => {
      assert.equal(url, 'http://localhost:8000/technician/booking/');
      assert.equal(options.method, 'PATCH');
      assert.equal(options.headers.Authorization, 'Bearer access-token');
      assert.equal(options.headers['Content-Type'], 'application/json');
      assert.deepEqual(JSON.parse(options.body), { booking: 21, status });
      assert.equal(options.signal, signal);
      return Response.json(saved);
    }}), saved);
  }
});

test('booking decisions validate inputs and handle authorization, backend, and invalid success responses', async () => {
  const noFetch = { token: 'token', fetchImpl: () => assert.fail('Unexpected request') };
  await assert.rejects(updateTechnicianBooking(0, 'c', noFetch), /valid booking/);
  await assert.rejects(updateTechnicianBooking(21, 'p', noFetch), /accept or reject/);
  await assert.rejects(updateTechnicianBooking(21, 'r', { ...noFetch, token: '' }), /sign in again/);
  await assert.rejects(updateTechnicianBooking(21, 'c', { token: 'token', fetchImpl: async () => Response.json({ detail: 'Unauthorized' }, { status: 401 }) }), /session expired/);
  await assert.rejects(updateTechnicianBooking(21, 'c', { token: 'token', fetchImpl: async () => Response.json({ detail: 'Booking cannot be updated' }, { status: 400 }) }), /Booking cannot be updated/);
  for (const value of [['Booking is already in the same status.'], 'Booking is already in the same status.']) {
    await assert.rejects(updateTechnicianBooking(21, 'c', { token: 'token', fetchImpl: async () => Response.json({ non_field_errors: value }, { status: 400 }) }), { message: 'Booking is already in the same status.' });
  }
  for (const result of [null, { booking: 15, status: 'c' }, { booking: 21, status: 'r' }]) {
    await assert.rejects(updateTechnicianBooking(21, 'c', { token: 'token', fetchImpl: async () => Response.json(result) }), /Unexpected booking update response/);
  }
});

test('bookings use the exact Django endpoint, bearer token, and supplied signal', async () => {
  const signal = new AbortController().signal;
  const rows = await fetchBookings({ token: 'access-token', baseUrl: 'http://localhost:8000///', signal, fetchImpl: async (url, options) => {
    assert.equal(url, 'http://localhost:8000/bookings/');
    assert.equal(options.headers.Authorization, 'Bearer access-token');
    assert.equal(options.method, 'GET');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.redirect, 'error');
    assert.equal(options.signal, signal);
    return Response.json([booking, { ...booking, id: 20 }]);
  }});
  assert.deepEqual(rows, [booking, { ...booking, id: 20 }]);
});

test('missing access token never makes a request', async () => {
  await assert.rejects(fetchBookings({ token: '', fetchImpl: () => assert.fail('Unexpected request') }), /sign in again/);
});

test('reads the existing access cookie by default', async () => {
  const original = globalThis.document;
  globalThis.document = { cookie: 'other=value; phidim_access_token=encoded%2Btoken' };
  try {
    await fetchBookings({ fetchImpl: async (_, options) => {
      assert.equal(options.headers.Authorization, 'Bearer encoded+token');
      return Response.json([]);
    }});
  } finally {
    if (original === undefined) delete globalThis.document;
    else globalThis.document = original;
  }
});

test('supports empty responses and same-origin pagination in server order', async () => {
  assert.deepEqual(await fetchBookings({ token: 'token', fetchImpl: async () => Response.json([]) }), []);
  let calls = 0;
  const rows = await fetchBookings({ token: 'token', baseUrl: 'https://example.test/django', fetchImpl: async (url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer token');
    assert.equal(url, calls ? 'https://example.test/django/bookings/?page=2' : 'https://example.test/django/bookings/');
    return Response.json(++calls === 1 ? { results: [booking], next: '?page=2' } : { results: [{ ...booking, id: 20 }], next: null });
  }});
  assert.deepEqual(rows.map(row => row.id), [16, 20]);
});

test('rejects pagination loops, foreign origins, and malformed data', async () => {
  for (const next of ['/bookings/', 'https://foreign.test/bookings/', 123]) {
    let calls = 0;
    await assert.rejects(fetchBookings({ token: 'secret', fetchImpl: async () => {
      assert.equal(++calls, 1, 'must reject before forwarding token');
      return Response.json({ results: [booking], next });
    }}), /pagination/);
  }
  for (const data of [null, {}, [{ status: 'p' }], [{ id: 1 }]]) {
    await assert.rejects(fetchBookings({ token: 'token', fetchImpl: async () => Response.json(data) }), /Invalid booking response/);
  }
});

test('reports authentication, server, and network errors and preserves aborts', async () => {
  await assert.rejects(fetchBookings({ token: 'token', fetchImpl: async () => Response.json({ detail: 'Unauthorized' }, { status: 401 }) }), /session expired/);
  await assert.rejects(fetchBookings({ token: 'token', fetchImpl: async () => new Response('Offline', { status: 503 }) }), /Unable to load bookings/);
  const offline = new Error('Network unavailable');
  await assert.rejects(fetchBookings({ token: 'token', fetchImpl: async () => { throw offline; } }), error => error === offline);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(fetchBookings({ token: 'token', signal: controller.signal, fetchImpl: async (_, { signal }) => { signal.throwIfAborted(); } }), { name: 'AbortError' });
});
