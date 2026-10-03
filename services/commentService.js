/**
 * Django API Comment Service for Phidim Service
 * Connects Next.js comment section with Django REST Framework backend
 */

import { triggerBackendWarning, BACKEND_READY } from "@/lib/backendWarning";

export const DJANGO_API_BASE_URL =
  process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://127.0.0.1:8000";

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

export function normalizeDjangoComment(c) {
  if (!c) return null;
  return {
    id: `django-cmt-${c.id}`,
    djangoId: c.id,
    author: {
      id: c.author?.id,
      username: c.author?.username || "member",
      name: c.author?.name || "Community Member",
      avatarUrl: c.author?.avatarUrl || "/dhanraj.png",
      role: c.author?.role || "Verified Customer",
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
    replies: (c.replies || []).map((r) => ({
      id: `django-rep-${r.id}`,
      djangoId: r.id,
      author: {
        id: r.author?.id,
        username: r.author?.username || "member",
        name: r.author?.name || "Community Member",
        avatarUrl: r.author?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        role: r.author?.role || "Verified Customer",
      },
      translations: {
        Nepali: r.reply || r.text,
        English: r.reply || r.text,
      },
      text: r.reply || r.text,
      likes: 0,
      createdAt: formatRelativeTime(r.created_at),
    })),
  };
}

/**
 * Fetch all comments from Django backend
 */
export async function fetchDjangoComments(articleId = null) {
  try {
    const url = articleId
      ? `${DJANGO_API_BASE_URL}/comments/?article=${articleId}`
      : `${DJANGO_API_BASE_URL}/comments/`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Django API error: ${res.status}`);
    }

    const data = await res.json();
    const commentList = Array.isArray(data) ? data : data.results || [];
    return commentList.map(normalizeDjangoComment);
  } catch (error) {
    console.warn("Failed to fetch comments from Django backend:", error?.message);
    return null;
  }
}

/**
 * Post a new comment to Django backend
 */
export async function postDjangoComment({ text, articleId = 1, userId = null }) {
  if (!BACKEND_READY) {
    triggerBackendWarning();
    return null;
  }
  try {
    const payload = {
      text,
      article: articleId || 1,
    };
    if (userId) payload.user = userId;

    const res = await fetch(`${DJANGO_API_BASE_URL}/comments/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(`Failed to post comment: ${JSON.stringify(errData)}`);
    }

    const created = await res.json();
    return normalizeDjangoComment(created);
  } catch (error) {
    console.error("Error posting comment to Django:", error);
    throw error;
  }
}

/**
 * Post a reply to a comment on Django backend
 */
export async function postDjangoReply({ commentDjangoId, replyText, articleId = 1, userId = null }) {
  if (!BACKEND_READY) {
    triggerBackendWarning();
    return null;
  }
  try {
    const payload = {
      comment: commentDjangoId,
      reply: replyText,
      article: articleId || 1,
    };
    if (userId) payload.user = userId;

    const res = await fetch(`${DJANGO_API_BASE_URL}/replies/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(`Failed to post reply: ${JSON.stringify(errData)}`);
    }

    const created = await res.json();
    return {
      id: `django-rep-${created.id}`,
      djangoId: created.id,
      author: {
        id: created.author?.id,
        username: created.author?.username || "member",
        name: created.author?.name || "Community Member",
        avatarUrl: created.author?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        role: created.author?.role || "Verified Customer",
      },
      translations: {
        Nepali: created.reply || created.text,
        English: created.reply || created.text,
      },
      text: created.reply || created.text,
      likes: 0,
      createdAt: "Just now",
    };
  } catch (error) {
    console.error("Error posting reply to Django:", error);
    throw error;
  }
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
