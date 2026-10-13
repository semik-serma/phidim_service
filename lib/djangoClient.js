// Services retain backend URLs for pagination validation. Only the transport
// translates them to the current frontend origin in the browser.
export function djangoBrowserUrl(value) {
  if (!value || typeof window === "undefined") return value;
  const base = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000";
  const target = new URL(value, base.replace(/\/+$/, "") + "/");
  const backend = new URL(base);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname);
  if (target.origin === backend.origin || (loopback && target.port === "8000")) {
    return `/api/django${target.pathname}${target.search}`;
  }
  return value;
}

export function djangoFetch(url, options) {
  return fetch(djangoBrowserUrl(url), options);
}
