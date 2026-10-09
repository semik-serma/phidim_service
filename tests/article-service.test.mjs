import test from 'node:test';
import assert from 'node:assert/strict';
import { selectNewestArticle, resolveArticleImage, fetchNewestDjangoArticle } from '../services/articleService.js';

test('select newest by creation date then ID, without mutating input', () => {
  const articles = [{id: 9, created_at: '2026-01-01'}, {id: 2, created_at: '2026-10-01'}, {id: 3, created_at: '2026-10-01'}];
  assert.equal(selectNewestArticle(articles).id, 3);
  assert.equal(articles[0].id, 9);
  assert.equal(selectNewestArticle([]), null);
});
test('resolve relative, absolute, absent and invalid images', () => {
  assert.equal(resolveArticleImage('/media/a.jpg', 'http://localhost:8000'), 'http://localhost:8000/media/a.jpg');
  assert.equal(resolveArticleImage('https://example.com/a.jpg'), 'https://example.com/a.jpg');
  assert.equal(resolveArticleImage(null), null);
  assert.equal(resolveArticleImage('javascript:alert(1)'), null);
});
test('fetch all pages to find newest article and resolve its image', async () => {
  const urls = [];
  const article = await fetchNewestDjangoArticle({baseUrl: 'http://localhost:8000', fetchImpl: async (url) => {
    urls.push(url);
    return Response.json(urls.length === 1 ? {results: [{id: 1, created_at: '2026-01-01'}], next: '?page=2'} : {results: [{id: 2, created_at: '2026-10-01', image: '/media/new.jpg', comments: []}], next: null});
  }});
  assert.equal(urls.length, 2);
  assert.equal(article.id, 2);
  assert.equal(article.image, 'http://localhost:8000/media/new.jpg');
});
test('empty articles return null and failures remain errors', async () => {
  assert.equal(await fetchNewestDjangoArticle({fetchImpl: async () => Response.json([])}), null);
  await assert.rejects(fetchNewestDjangoArticle({fetchImpl: async () => new Response('', {status: 500})}), /500/);
  await assert.rejects(fetchNewestDjangoArticle({fetchImpl: async () => Response.json({detail: 'invalid'})}), /Invalid/);
});
test('pagination cannot loop or leave the Django origin', async () => {
  await assert.rejects(fetchNewestDjangoArticle({baseUrl: 'http://localhost:8000', fetchImpl: async () => Response.json({results: [], next: 'http://localhost:8000/articles/'})}), /Repeated/);
  await assert.rejects(fetchNewestDjangoArticle({fetchImpl: async () => Response.json({results: [], next: 'https://example.com/articles/'})}), /origin/);
});
test('abort signal reaches the request', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(fetchNewestDjangoArticle({signal: controller.signal, fetchImpl: async (_, options) => {options.signal.throwIfAborted();}}), {name: 'AbortError'});
});
