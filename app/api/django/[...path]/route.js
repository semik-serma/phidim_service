import { proxyBackend } from "../../../../lib/backendProxy.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function handle(request, context) {
  const base = process.env.DJANGO_API_URL || process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000";
  return proxyBackend(request, context, base, "/api/django");
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE, handle as HEAD, handle as OPTIONS };
