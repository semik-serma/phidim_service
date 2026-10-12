/**
 * Django API Comment Service for Phidim Service
 * Connects Next.js comment section with Django REST Framework backend
 */

import { triggerBackendWarning, BACKEND_READY } from "../lib/backendWarning.js";

export const DJANGO_API_BASE_URL =
  (process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000").replace(/\/+$/, "");

function formatRelativeTime(dateString) {
  if (!dateString) return "Just now";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? "s" : ""} ago`;
    if (diffHour < 24) return `${diffHour} hr${diffHour > 1 ? "s" : ""} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  } catch (e) {
    return "Recently";
  }
}

export function normalizeDjangoReply(reply) {
  const author = reply.author || (typeof reply.user === "object" ? reply.user : null) || {};
  const name = [author.first_name, author.last_name].filter(Boolean).join(" ");
  return {
    id: `django-rep-${reply.id}`,
    djangoId: reply.id,
    author: {
      id: author.id ?? reply.user,
      username: author.username || "member",
      name: author.displayName || author.name || name || author.username || "Community Member",
      avatarUrl: author.avatarUrl || author.avatar || (typeof author.profile === "string" ? author.profile : null) || "/logo.png",
      role: author.role || "Member",
    },
    translations: { Nepali: reply.reply ?? reply.text, English: reply.reply ?? reply.text },
    text: reply.reply ?? reply.text,
    likes: reply.likes || 0,
    createdAt: formatRelativeTime(reply.created_at),
    rawCreatedAt: reply.created_at,
  };
}

export function normalizeDjangoComment(c) {
  if (!c) return null;
  const author = c.author || (typeof c.user === "object" ? c.user : null) || {};
  return {
    id: `django-cmt-${c.id}`,
    djangoId: c.id,
    author: {
      id: author.id ?? c.user,
      username: author.username || "member",
      name: author.displayName || author.name || author.username || "Community Member",
      avatarUrl: author.avatarUrl || author.avatar || "/logo.png",
      role: author.role || "Member",
    },
    translations: {
      Nepali: c.text,
      English: c.text,
    },
    text: c.text,
    likes: c.likes || 0,
    dislikes: 0,
    createdAt: formatRelativeTime(c.created_at),
    rawCreatedAt: c.created_at,
    isCardStyle: true,
    replies: (c.replies || []).map(normalizeDjangoReply),
  };
}

/**
 * Fetch all comments from Django backend
 */
export async function fetchDjangoComments(articleId, { signal, fetchImpl = fetch, baseUrl = DJANGO_API_BASE_URL } = {}) {
  if (!articleId) throw new Error("An article is required to load comments.");
  const base = new URL(baseUrl.replace(/\/+$/, "") + "/");
  let url = new URL("comments/", base);
  url.searchParams.set("article", String(articleId));
  const visited = new Set();
  const comments = [];
  while (url) {
    if (visited.has(url.href)) throw new Error("Repeated comments pagination URL");
    visited.add(url.href);
    const response = await fetchImpl(url.href, { signal, cache: "no-store", headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Unable to load comments (" + response.status + ")");
    const data = await response.json();
    const page = Array.isArray(data) ? data : data?.results;
    if (!Array.isArray(page)) throw new Error("Invalid comments response");
    comments.push(...page.filter(c => c && (c.article == null || String(c.article?.id ?? c.article) === String(articleId))));
    const next = !Array.isArray(data) && data.next ? new URL(data.next, url) : null;
    if (next && next.origin !== base.origin) throw new Error("Unexpected comments pagination origin");
    if (next) next.searchParams.set("article", String(articleId));
    url = next;
  }
  return comments.map(normalizeDjangoComment);
}

function readAccessToken() {
  if (typeof document === "undefined") return "";
  const cookie = document.cookie.split(";").map(part => part.trim()).find(part => part.startsWith("phidim_access_token="));
  return cookie ? cookie.slice("phidim_access_token=".length) : "";
}

export async function postDjangoComment({ text, articleId, userId, token = readAccessToken(), signal, fetchImpl = fetch, baseUrl = DJANGO_API_BASE_URL }) {
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed) throw new Error("Please enter a comment.");
  if (!articleId) throw new Error("An article is required to comment.");
  if (!/^[1-9]\d*$/.test(String(userId ?? ""))) throw new Error("Please sign in with a valid user account to comment.");
  if (!token) throw new Error("Please sign in again to comment.");
  const response = await fetchImpl(baseUrl.replace(/\/+$/, "") + "/comments/", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ user: Number(userId), article: articleId, text: trimmed }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const detail = data && Object.entries(data).map(([key, value]) => key + ": " + (Array.isArray(value) ? value.join(" ") : String(value))).join("; ");
    throw new Error(response.status === 401 ? "Your session expired. Please sign in again." : detail || "Unable to post comment (" + response.status + "). Please try again.");
  }
  const created = await response.json();
  if (!created?.id || typeof created.text !== "string") throw new Error("The server returned an invalid comment. Refresh comments before retrying.");
  return normalizeDjangoComment(created);
}

/**
 * Post a reply to a comment on Django backend
 */
export async function postDjangoReply({ commentDjangoId, replyText, articleId, token = readAccessToken(), signal, fetchImpl = fetch, baseUrl = DJANGO_API_BASE_URL }) {
  const trimmed = typeof replyText === "string" ? replyText.trim() : "";
  if (!trimmed) throw new Error("Please enter a reply.");
  if (!/^[1-9]\d*$/.test(String(articleId ?? ""))) throw new Error("An article is required to reply.");
  if (!/^[1-9]\d*$/.test(String(commentDjangoId ?? ""))) throw new Error("A saved comment is required to reply.");
  if (!token) throw new Error("Please sign in again to reply.");
  const response = await fetchImpl(baseUrl.replace(/\/+$/, "") + "/replies/", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ article: Number(articleId), comment: Number(commentDjangoId), reply: trimmed }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const detail = data && Object.entries(data).map(([key, value]) => key + ": " + (Array.isArray(value) ? value.join(" ") : String(value))).join("; ");
    throw new Error(response.status === 401 ? "Your session expired. Please sign in again." : detail || "Unable to post reply (" + response.status + "). Please try again.");
  }
  const created = await response.json();
  if (!created?.id || typeof created.reply !== "string") throw new Error("The server returned an invalid reply. Refresh comments before retrying.");
  return normalizeDjangoReply(created);
}

/**
 * Like / unlike a comment on Django backend
 */
export async function likeDjangoComment(commentDjangoId, action = "like") {
  if (!BACKEND_READY) {
    triggerBackendWarning();
    return null;
  }
  try {
    const res = await fetch(`${DJANGO_API_BASE_URL}/comments/${commentDjangoId}/like/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action }),
    });

    if (!res.ok) {
      throw new Error(`Failed to like comment: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.warn("Failed to update like on Django:", error?.message);
    return null;
  }
}
