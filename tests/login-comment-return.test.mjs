import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';

test('comment login returns home while normal login retains its role dashboard', async () => {
  const require = createRequire(import.meta.url);
  const {transform} = require('next/dist/build/swc');
  const source = await readFile(new URL('../components/login/LoginPage.jsx', import.meta.url), 'utf8');
  const compiled = await transform(source, {filename: 'LoginPage.jsx', jsc: {parser: {syntax: 'ecmascript', jsx: true}, transform: {react: {runtime: 'classic'}}}, module: {type: 'commonjs'}});
  const module = {exports: {}};
  const window = {location: {search: '?redirect=/'}};
  vm.runInNewContext(compiled.code + '\nmodule.exports.destination = loginDestination;', {module, exports: module.exports, URLSearchParams, window, require: () => ({})});
  assert.equal(module.exports.destination('/user/dashboard'), '/');
  window.location.search = '';
  assert.equal(module.exports.destination('/technician/dashboard'), '/technician/dashboard');
  window.location.search = '?redirect=https://example.com';
  assert.equal(module.exports.destination('/admin/dashboard'), '/admin/dashboard');
});
