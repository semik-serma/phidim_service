const forwardedHeaders = ["accept", "content-type", "authorization", "range", "if-none-match", "if-modified-since", "x-csrftoken"];

// Targets come exclusively from server configuration, never from request input.
export async function proxyBackend(request, { params }, base, prefix) {
  const { path = [] } = await params;
  if (path.some(part => part === "." || part === ".." || /[\\/]/.test(part))) {
    return Response.json({ detail: "Invalid API path." }, { status: 400 });
  }
  const incoming = new URL(request.url);
  const suffix = incoming.pathname.endsWith("/") ? "/" : "";
  const target = `${base.replace(/\/+$/, "")}/${path.map(encodeURIComponent).join("/")}${suffix}${incoming.search}`;
  const headers = new Headers();
  for (const key of forwardedHeaders) {
    if (request.headers.has(key)) headers.set(key, request.headers.get(key));
  }
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(30000)]),
    });
    const responseHeaders = new Headers({ "Cache-Control": "no-store" });
    for (const key of ["content-type", "content-disposition", "content-range", "accept-ranges", "etag", "last-modified", "retry-after", "www-authenticate"]) {
      if (upstream.headers.has(key)) responseHeaders.set(key, upstream.headers.get(key));
    }
    const location = upstream.headers.get("location");
    if (location) {
      const destination = new URL(location, target);
      if (destination.origin !== new URL(base).origin) {
        return Response.json({ detail: "Unexpected backend redirect." }, { status: 502 });
      }
      responseHeaders.set("location", `${prefix}${destination.pathname}${destination.search}`);
    }
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json({ detail: "Could not reach the backend. Check the backend server and its URL configuration." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
