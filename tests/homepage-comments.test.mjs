import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const React = require('react');
const {transform} = require('next/dist/build/swc');
const source = await readFile(new URL('../components/HomepageCommentSection.jsx', import.meta.url), 'utf8');
const compiled = await transform(source, {filename: 'HomepageCommentSection.jsx', jsc: {parser: {syntax: 'ecmascript', jsx: true}, transform: {react: {runtime: 'classic'}}}, module: {type: 'commonjs'}});
const tick = () => new Promise(resolve => setImmediate(resolve));
function find(tree, predicate) {
  if (!tree || typeof tree !== 'object') return null;
  if (predicate(tree)) return tree;
  for (const child of React.Children.toArray(tree.props?.children)) {const found = find(child, predicate); if (found) return found;}
  return null;
}
function harness({authenticated = true, load = async () => [], post} = {}) {
  const hooks = [], effects = [], storage = new Map(); let cursor = 0;
  const module = {exports: {}};
  vm.runInNewContext(compiled.code, {module, exports: module.exports, React, AbortController, setTimeout: () => 0,
    sessionStorage: {getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k)},
    localStorage: {getItem: () => null}, require: name => {
      if (name === 'react') return {...React,
        useState(initial) {const i = cursor++; if (!(i in hooks)) hooks[i] = initial; return [hooks[i], value => {hooks[i] = typeof value === 'function' ? value(hooks[i]) : value;}];},
        useRef(initial) {const i = cursor++; return hooks[i] ||= {current: initial};},
        useEffect(callback, deps) {const i = cursor++; const old = hooks[i]; if (!old || deps.some((v,n) => v !== old.deps[n])) {effects.push(() => {old?.cleanup?.(); hooks[i] = {deps, cleanup: callback()};});}}
      };
      if (name === 'next/navigation') return {useRouter: () => ({push: () => {}})};
      if (name === '@/context/AuthContext') return {useAuth: () => ({user: authenticated ? {id: '23', displayName: 'Sam'} : null, isAuthenticated: authenticated})};
      if (name === 'lucide-react') return new Proxy({}, {get: () => () => null});
      if (name === '@/services/articleService') return {fetchNewestDjangoArticle: async () => ({id: 17, title: 'Article', content: 'Body'})};
      if (name === '@/services/commentService') return {fetchDjangoComments: load, postDjangoComment: post};
      if (name === '@/lib/backendWarning') return {BACKEND_READY: false};
      throw new Error('Unexpected import ' + name);
    }});
  function render() {cursor = 0; const tree = module.exports.HomepageCommentSection(); while(effects.length) effects.shift()(); return tree;}
  async function ready() {render(); await tick(); render(); await tick(); return render();}
  function open() {let tree = render(); find(tree, n => n.type === 'button' && find(n, x => x.type === 'span' && x.props.children === 'Add Comment')).props.onClick(); tree = render(); find(tree, n => n.type === 'input' && n.props['aria-label'] === 'Comment text').props.onChange({target: {value: ' hello '}}); return render();}
  return {render, ready, open, storage};
}

test('posting waits for persistence, prevents duplicates and displays saved comment', async () => {
  let resolvePost, calls = 0;
  const h = harness({post: args => {calls++; assert.equal(args.userId, '23'); assert.equal(args.articleId, 17); return new Promise(resolve => {resolvePost = resolve;});}});
  await h.ready(); const tree = h.open(); const submit = find(tree, n => n.type === 'form').props.onSubmit;
  const pending = submit({preventDefault() {}}); await submit({preventDefault() {}});
  assert.equal(calls, 1);
  assert.equal(find(h.render(), n => n.type === 'input').props.value, ' hello ');
  assert.ok(find(h.render(), n => n.type === 'button' && n.props.children === 'Posting…').props.disabled);
  resolvePost({id: 'django-cmt-8', djangoId: 8, author: {name: 'Community Member', avatarUrl: '/logo.png'}, text: 'hello', replies: []});
  await pending;
  assert.equal(find(h.render(), n => n.type === 'form'), null);
  assert.ok(find(h.render(), n => n.type === 'p' && n.props.children === 'hello'));
});
test('failed posts preserve the editable draft and show error without a saved comment', async () => {
  const h = harness({post: async () => {throw new Error('Server unavailable');}});
  await h.ready(); const tree = h.open(); await find(tree, n => n.type === 'form').props.onSubmit({preventDefault() {}});
  assert.equal(find(h.render(), n => n.type === 'input').props.value, ' hello ');
  assert.ok(find(h.render(), n => n.props.role === 'alert' && n.props.children === 'Server unavailable'));
  assert.equal(find(h.render(), n => n.type === 'p' && n.props.children === 'hello'), null);
});
test('visitors must sign in and their draft is retained', async () => {
  const h = harness({authenticated: false, post: () => assert.fail('Visitor must not post')});
  await h.ready(); await find(h.open(), n => n.type === 'form').props.onSubmit({preventDefault() {}});
  assert.equal(h.storage.get('phidim_pending_comment_draft'), 'hello');
  assert.ok(find(h.render(), n => n.type === 'button' && n.props.children === 'Sign in'));
});
test('saved article comments load, and failed loads offer retry independently of the article', async () => {
  let calls = 0;
  const h = harness({load: async id => {assert.equal(id, 17); if (++calls === 1) throw new Error('Offline'); return [{id: 'django-cmt-1', text: 'Persisted', author: {name: 'Sam'}, replies: []}];}});
  let tree = await h.ready(); const retry = find(tree, n => n.type === 'button' && n.props.children === 'Retry comments'); assert.ok(retry);
  retry.props.onClick(); h.render(); await tick(); tree = h.render();
  assert.ok(find(tree, n => n.type === 'p' && n.props.children === 'Persisted'));
  assert.equal(calls, 2);
});
