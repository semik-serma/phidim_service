import { djangoFetch, djangoBrowserUrl } from "../lib/djangoClient.js";
const DJANGO_API_BASE_URL = (process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export function selectNewestArticle(articles) {
  return articles.reduce((latest, article) => {
    if (!latest) return article;
    const timestamp = (item) => Date.parse(item.created_at) || 0;
    return timestamp(article) > timestamp(latest) ||
      (timestamp(article) === timestamp(latest) && Number(article.id) > Number(latest.id))
      ? article : latest;
  }, null);
}

export function resolveArticleImage(image, baseUrl = DJANGO_API_BASE_URL) {
  if (!image) return null;
  try {
    const url = new URL(image, baseUrl + "/");
    return ["http:", "https:"].includes(url.protocol) ? djangoBrowserUrl(url.href) : null;
  } catch { return null; }
}

export async function fetchNewestDjangoArticle({ signal, fetchImpl = djangoFetch, baseUrl = DJANGO_API_BASE_URL } = {}) {
  const articles = [];
  let url = new URL("articles/", baseUrl.replace(/\/$/, "") + "/").href;
  const visited = new Set();
  while (url) {
    if (visited.has(url)) throw new Error("Repeated articles pagination URL");
    visited.add(url);
    const response = await fetchImpl(url, { signal, headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Unable to load articles (" + response.status + ")");
    const data = await response.json();
    const page = Array.isArray(data) ? data : data?.results;
    if (!Array.isArray(page)) throw new Error("Invalid articles response");
    articles.push(...page);
    const next = !Array.isArray(data) && data.next ? new URL(data.next, url) : null;
    if (next && next.origin !== new URL(baseUrl).origin) throw new Error("Unexpected articles pagination origin");
    url = next?.href || null;
  }
  const article = selectNewestArticle(articles);
  return article ? { ...article, image: resolveArticleImage(article.image, baseUrl) } : null;
}
