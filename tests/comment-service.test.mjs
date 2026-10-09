import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchDjangoComments, postDjangoComment, normalizeDjangoComment } from '../services/commentService.js';

const baseUrl = 'http://localhost:8000/';
test('post sends required identity, actual article, trimmed text and access token', async () => {
  let request;
  const saved = await postDjangoComment({userId: '23', articleId: 17, text: ' hello ', token: 'access-token', baseUrl,
    fetchImpl: async (url, options) => {request = {url, ...options}; return Response.json({id: 8, user: 23, article: 17, text: 'hello'});}});
  assert.equal(request.url, 'http://localhost:8000/comments/');
  assert.equal(request.method, 'POST');
  assert.equal(request.headers.Authorization, 'Bearer access-token');
  assert.deepEqual(JSON.parse(request.body), {user: 23, article: 17, text: 'hello'});
  assert.equal(saved.djangoId, 8);
  assert.equal(saved.author.id, 23);
});
test('invalid input or missing authentication never sends a request', async () => {
  const valid = {userId: '23', articleId: 17, text: 'hello', token: 'token', fetchImpl: () => assert.fail('Unexpected request')};
  for (const invalid of [{userId: null}, {userId: 'USR-1'}, {articleId: null}, {text: '  '}, {token: ''}]) {
    await assert.rejects(postDjangoComment({...valid, ...invalid}));
  }
});
test('posting preserves validation, authentication and network errors', async () => {
  const options = {userId: 23, articleId: 17, text: 'hello', token: 'token'};
  await assert.rejects(postDjangoComment({...options, fetchImpl: async () => Response.json({text: ['Too long.']}, {status: 400})}), /Too long/);
  await assert.rejects(postDjangoComment({...options, fetchImpl: async () => new Response('', {status: 401})}), /session expired/);
  await assert.rejects(postDjangoComment({...options, fetchImpl: async () => {throw new Error('Offline');}}), /Offline/);
  await assert.rejects(postDjangoComment({...options, fetchImpl: async () => Response.json({})}), /invalid comment/);
});
test('load comments filters by article and follows pagination', async () => {
  const urls = [];
  const comments = await fetchDjangoComments(17, {baseUrl, fetchImpl: async url => {
    urls.push(url);
    return Response.json(urls.length === 1 ? {results: [{id: 1, article: 17, text: 'one'}, {id: 99, article: 2, text: 'unrelated'}], next: '?page=2'} : {results: [{id: 2, article: 17, text: 'two', user: {id: 3, username: 'sam'}}], next: null});
  }});
  assert.ok(urls.every(url => new URL(url).searchParams.get('article') === '17'));
  assert.deepEqual(comments.map(c => c.text), ['one', 'two']);
  assert.equal(comments[1].author.name, 'sam');
  assert.deepEqual(await fetchDjangoComments(17, {fetchImpl: async () => Response.json([])}), []);
  assert.equal(normalizeDjangoComment({id: 1, text: 'hi', author: {name: 'Jane'}}).author.name, 'Jane');
});
test('loading errors, malformed responses, unsafe pagination and cancellation remain errors', async () => {
  await assert.rejects(fetchDjangoComments(17, {fetchImpl: async () => new Response('', {status: 500})}), /500/);
  await assert.rejects(fetchDjangoComments(17, {fetchImpl: async () => Response.json({})}), /Invalid/);
  await assert.rejects(fetchDjangoComments(17, {baseUrl, fetchImpl: async () => Response.json({results: [], next: 'http://localhost:8000/comments/?article=17'})}), /Repeated/);
  await assert.rejects(fetchDjangoComments(17, {fetchImpl: async () => Response.json({results: [], next: 'https://example.com/comments/'})}), /origin/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(fetchDjangoComments(17, {signal: controller.signal, fetchImpl: async (_, options) => options.signal.throwIfAborted()}), {name: 'AbortError'});
});
