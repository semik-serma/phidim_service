import { proxyBackend } from "../../../../lib/backendProxy.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handle(request, context) {
  let base = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://service.phidimservice.com.np";
  // Preserve local-backend discovery on the server, where localhost is reachable.
  const local = process.env.LOCAL_BACKEND_URL || process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL || "http://localhost:5000";
  if (!process.env.BACKEND_API_URL) {
    try {
      const health = await fetch(`${local.replace(/\/+$/, "")}/api/health`, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(1200) });
      if (health.ok || health.status === 404) base = local;
    } catch {}
  }
  // Never retry a mutation against a different backend after sending it.
  return proxyBackend(request, context, base, "/api/backend");
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE, handle as HEAD, handle as OPTIONS };
