import { proxyBackend } from "../../../lib/backendProxy.js";

export const dynamic = "force-dynamic";
export function GET(request) {
  return proxyBackend(request, { params: Promise.resolve({ path: ["v1", "forecast"] }) }, "https://api.open-meteo.com", "/api/weather");
}
