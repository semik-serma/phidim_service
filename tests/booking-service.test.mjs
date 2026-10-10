import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchServiceAreas, fetchServicesByArea, fetchTechnicians, buildBookingPayload, nepalDateTimeToUTC, postBooking, normalizeCreatedBooking } from '../services/bookingService.js';

const input = { technicianId: 6, latitude: '27.16', longitude: '87.92', date: '2026-09-10', time: '16:15', notes: ' Camera has no video. ' };
test('loads service area choices from the configured API and handles failures', async () => {
  const areas = [{id: 1, name: 'Phidim'}, {id: 2, name: 'dharan'}, {id: 3, name: 'birathnagar'}];
  assert.deepEqual(await fetchServiceAreas({token: 'access-token', baseUrl: 'http://localhost:8000/', fetchImpl: async (url, options) => {
    assert.equal(url, 'http://localhost:8000/service-areas/');
    assert.equal(options.headers.Authorization, 'Bearer access-token');
    return Response.json(areas);
  }}), areas);
  await assert.rejects(fetchServiceAreas({fetchImpl: async () => new Response('Offline', {status: 503})}), /Unable to load service areas/);
  await assert.rejects(fetchServiceAreas({fetchImpl: async () => Response.json([{name: 'Missing ID'}])}), /Invalid service area/);
  assert.equal(buildBookingPayload({...input, serviceAreaId: 2}).service_area, 2);
  assert.throws(() => buildBookingPayload({...input, serviceAreaId: '2'}), /valid service area/);
});
const saved = { id: 18, status: 'p', latitude: '27.1600000', longitude: '87.9200000', date: '2026-09-10T10:30:00Z', created_at: '2026-10-09T07:25:42.189935Z', updated_at: '2026-10-09T07:25:42.189945Z', problem_details: 'Camera has no video.', technician: 6, customer: 11 };

test('technicians use profile IDs, real details, and anonymous GET', async () => {
  const rows = await fetchTechnicians({ baseUrl: 'http://localhost:8000///', fetchImpl: async (url, options) => {
    assert.equal(url, 'http://localhost:8000/technicians/');
    assert.equal(options.headers, undefined);
    return Response.json([{first_name: 'Ram', last_name: 'Sita', email: 'ram@example.test', phone_number: '', profile: {id: 6, user: 7, phone_number: '9867124534', rating: 0}}, {profile: null}]);
  }});
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, 6);
  assert.equal(rows[0].userId, 7);
  assert.equal(rows[0].name, 'Ram Sita');
  assert.equal(rows[0].phone, '9867124534');
  assert.equal(rows[0].rating, 0);
});

test('supports paginated lists and rejects pagination loops and malformed data', async () => {
  let calls = 0;
  const rows = await fetchTechnicians({baseUrl: 'http://localhost:8000', fetchImpl: async () => Response.json(++calls === 1 ? {results: [{profile: {id: 6}}], next: '?page=2'} : {results: [{profile: {id: 9}}], next: null})});
  assert.deepEqual(rows.map(row => row.id), [6, 9]);
  await assert.rejects(fetchTechnicians({fetchImpl: async () => Response.json({results: [], next: '/technicians/'})}), /pagination/);
  await assert.rejects(fetchTechnicians({fetchImpl: async () => Response.json({unexpected: []})}), /Invalid technician/);
  await assert.rejects(fetchTechnicians({fetchImpl: async () => new Response('Offline', {status: 503})}), /Unable to load/);
});

test('converts Nepal time including UTC date rollover and rejects invalid dates', () => {
  assert.equal(nepalDateTimeToUTC('2026-09-10', '16:15'), '2026-09-10T10:30:00.000Z');
  assert.equal(nepalDateTimeToUTC('2026-09-10', '01:00'), '2026-09-09T19:15:00.000Z');
  for (const [date, time] of [['2026-02-30', '10:30'], ['2026-09-10', '24:00'], ['2026-09-10', '10:65'], ['', '10:30']]) assert.throws(() => nepalDateTimeToUTC(date, time), /valid booking/);
});

test('payload contains only the five backend fields and normalizes coordinates', () => {
  assert.deepEqual(buildBookingPayload({...input, customer: 999, serviceName: 'CCTV', isEmergency: true}), {technician: 6, latitude: '27.1600000', longitude: '87.9200000', date: '2026-09-10T10:30:00.000Z', problem_details: 'Camera has no video.'});
  for (const change of [{technicianId: 0}, {technicianId: '6'}, {latitude: ''}, {latitude: '91'}, {longitude: '-181'}, {longitude: 'NaN'}, {notes: '  '}]) assert.throws(() => buildBookingPayload({...input, ...change}));
  assert.equal(buildBookingPayload({...input, latitude: '0', longitude: '-180'}).latitude, '0.0000000');
});

test('POST uses exact endpoint and bearer authentication, then preserves server values', async () => {
  const response = await postBooking(input, {baseUrl: 'http://localhost:8000/', token: 'access-token', fetchImpl: async (url, options) => {
    assert.equal(url, 'http://localhost:8000/bookings/');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer access-token');
    assert.deepEqual(JSON.parse(options.body), buildBookingPayload(input));
    return Response.json(saved, {status: 201});
  }});
  const booking = normalizeCreatedBooking(response, {...input, technician: {id: 6, name: 'Ram Sita'}, customerEmail: 'SAM@example.test'});
  assert.equal(booking.id, '18');
  assert.equal(booking.backendId, 18);
  assert.equal(booking.status, 'Pending');
  assert.equal(booking.backendStatus, 'p');
  assert.equal(booking.customer, 11);
  assert.equal(booking.date, saved.date);
  assert.equal(booking.createdAt, saved.created_at);
  assert.equal(booking.technician.name, 'Ram Sita');
  assert.equal(booking.technicianId, 6);
  assert.equal(booking.customerEmail, 'sam@example.test');
});

test('missing token, validation errors, expired sessions, and invalid success never return bookings', async () => {
  await assert.rejects(postBooking(input, {token: '', fetchImpl: () => assert.fail('Must not send')}), /sign in/);
  await assert.rejects(postBooking(input, {token: 't', fetchImpl: async () => Response.json({technician: ['Invalid pk.']}, {status: 400})}), /technician: Invalid pk/);
  await assert.rejects(postBooking(input, {token: 't', fetchImpl: async () => Response.json({detail: 'Expired'}, {status: 401})}), /session expired/);
  await assert.rejects(postBooking(input, {token: 't', fetchImpl: async () => Response.json({})}), /invalid booking/);
  await assert.rejects(postBooking(input, {token: 't', fetchImpl: async () => {throw new Error('Offline');}}), /Offline/);
});

test('loads services for the selected area with cancellation and validates responses', async () => {
  const rows = [{id: 25, name: 'House Wiring', description: 'Residential wiring', image: null, category: 15}];
  const controller = new AbortController();
  assert.deepEqual(await fetchServicesByArea('1', {token: 'access-token', baseUrl: 'http://localhost:8000/', signal: controller.signal, fetchImpl: async (url, options) => {
    assert.equal(url, 'http://localhost:8000/services/?service-area=1');
    assert.equal(options.signal, controller.signal);
    assert.equal(options.headers.Authorization, 'Bearer access-token');
    return Response.json(rows);
  }}), rows);
  assert.deepEqual(await fetchServicesByArea(2, {fetchImpl: async () => Response.json({results: []})}), []);
  await assert.rejects(fetchServicesByArea('', {fetchImpl: () => assert.fail('Invalid area must not fetch')}), /valid service area/);
  await assert.rejects(fetchServicesByArea(1, {fetchImpl: async () => new Response('Offline', {status: 503})}), /Unable to load services/);
  await assert.rejects(fetchServicesByArea(1, {fetchImpl: async () => Response.json([{name: 'Missing ID'}])}), /Invalid services response/);
});
