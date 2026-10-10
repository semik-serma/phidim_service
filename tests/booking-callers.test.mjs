import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import * as services from '../data/services.js';
const require = createRequire(import.meta.url);
const React = require('react');
const {transform} = require('next/dist/build/swc');
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...React.Children.toArray(tree.props?.children).flatMap(nodes)];
}
const text = tree => nodes(tree).flatMap(n => React.Children.toArray(n.props?.children).filter(c => typeof c === 'string')).join(' ');
const cases = [
  ['components/ServiceBookingModal.js', 'ServiceBookingModal', null],
  ['components/user-dashboard/QuickBookingCard.js', 'QuickBookingCard', null],
  ['components/user-dashboard/MyBookingsList.js', 'MyBookingsList', '+ Create New Booking'],
];
for (const [file, exported, openLabel] of cases) {
  const source = await readFile(new URL('../' + file, import.meta.url), 'utf8');
  const compiled = await transform(source, {filename: file.replace('.js','.jsx'), jsc: {parser: {syntax: 'ecmascript', jsx: true}, transform: {react: {runtime: 'classic'}}}, module: {type: 'commonjs'}});
  test(file + ' awaits creation and leaves failed forms open with inputs intact', async () => {
    const hooks = []; let cursor = 0, resolve, submitted, success = 0;
    const form = {disabled: false, time: '16:15', serviceAreas: [{id: 1, name: 'Phidim'}, {id: 2, name: 'dharan'}, {id: 3, name: 'birathnagar'}], serviceAreaId: '', setServiceAreaId: value => {form.serviceAreaId = value;}, submit: data => {submitted = data; return new Promise(done => {resolve = done;});}};
    const serviceRequests = [];
    const pendingEffects = [];
    const module = {exports: {}};
    vm.runInNewContext(compiled.code, {module, exports: module.exports, React, AbortController, setTimeout: () => 0, require(name) {
      if (name === 'react') return {...React,
        useState(initial) {const i=cursor++; if (!(i in hooks)) hooks[i] = typeof initial === 'function' ? initial() : initial; return [hooks[i], v => {hooks[i] = typeof v === 'function' ? v(hooks[i]) : v;}];},
        useEffect(effect, deps) {
          if (!String(effect).includes('fetchServicesByArea')) return;
          const i = cursor++;
          if (!hooks[i] || deps.some((dep, index) => dep !== hooks[i].deps[index])) {
            hooks[i]?.cleanup?.();
            hooks[i] = {deps};
            pendingEffects.push(() => {hooks[i].cleanup = effect();});
          }
        }, useMemo: fn => fn(), useRef: value => ({current: value}),
      };
      if (name === '@/services/bookingService') return {fetchServicesByArea: (areaId, options) => new Promise(resolve => {serviceRequests.push({areaId, signal: options.signal, resolve});})};
      if (name === '@/components/BookingFields') return {BookingFields: 'booking-fields', useBookingForm: () => form};
      if (name === '@/context/AuthContext') return {useAuth: () => ({isAuthenticated: true, user: {name: 'Customer', email: 'customer@example.test', phone: '9800000000'}})};
      if (name === '@/data/services') return services;
      if (name === 'lucide-react') return new Proxy({}, {get: () => 'icon'});
      if (name === 'motion/react') return {motion: new Proxy({}, {get: (_, key) => key}), AnimatePresence: 'section'};
      if (name === 'next/link') return {__esModule: true, default: 'a'};
      if (name === '@/lib/backendWarning') return {BACKEND_READY: false, triggerBackendWarning: () => assert.fail('Booking must bypass legacy flag')};
      if (name === '@/lib/bookingStore') return {getBookingsList: () => [], subscribeBookings: () => () => {}};
      if (name === '@/components/calls/CallProvider') return {useCall: () => ({})};
      return new Proxy({}, {get: () => () => null});
    }});
    const props = {isOpen: true, service: services.SERVICES[0], onClose: () => {}, onBookingSuccess: () => success++, onConfirmBooking: () => success++};
    function render() {cursor = 0; const tree = module.exports[exported](props); pendingEffects.splice(0).forEach(effect => effect()); return tree;}
    let tree = render();
    if (openLabel) {nodes(tree).find(n => n.type === 'button' && text(n).includes(openLabel)).props.onClick(); tree = render();}
    assert.ok(nodes(tree).some(n => n.type === 'booking-fields'));
    const details = nodes(tree).find(n => n.type === 'textarea' || (n.type === 'input' && n.props['aria-label'] === 'Problem details'));
    details.props.onChange({target: {value: 'Camera has no video'}});
    tree = render();
    const submit = nodes(tree).find(n => n.type === 'form').props.onSubmit;
    const pending = submit({preventDefault() {}});
    assert.equal(submitted.notes, 'Camera has no video');
    assert.equal(success, 0);
    assert.ok(nodes(render()).some(n => n.type === 'form'));
    resolve(null); await pending;
    tree = render();
    assert.ok(nodes(tree).some(n => n.type === 'form'));
    assert.equal(nodes(tree).find(n => n.type === 'textarea' || (n.type === 'input' && n.props['aria-label'] === 'Problem details')).props.value, 'Camera has no video');
    assert.equal(success, 0);
    const saved = {id: '18', status: 'Pending', technician: {name: 'Ram Sita'}, serviceName: 'CCTV', bookingDate: '2026-09-10'};
    const successful = nodes(tree).find(n => n.type === 'form').props.onSubmit({preventDefault() {}});
    resolve(saved); await successful;
    tree = render();
    if (exported === 'QuickBookingCard' || exported === 'ServiceBookingModal') assert.equal(success, 1);
    else assert.equal(nodes(tree).some(n => n.type === 'form'), false);
    if (exported === 'ServiceBookingModal' || exported === 'MyBookingsList') {assert.match(text(tree), /18/); assert.match(text(tree), /Pending/);}
  });
}
