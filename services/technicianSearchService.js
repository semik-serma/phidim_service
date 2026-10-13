import { djangoFetch, djangoBrowserUrl } from "../lib/djangoClient.js";
const API_BASE = (process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000").replace(/\/+$/, "");

function normalizeTechnician(row, baseUrl) {
  const profile = row.profile;
  const rawRating = profile.rating;
  const rating = rawRating == null || rawRating === "" ? null : Number(rawRating);
  const image = profile.avatar || profile.profile_picture || row.avatar || row.profile_picture;
  let avatar = "";
  if (typeof image === "string" && image.trim()) {
    const url = new URL(image, baseUrl + "/");
    if (["http:", "https:"].includes(url.protocol)) avatar = djangoBrowserUrl(url.href);
  }
  return {
    id: row.id,
    userId: profile.user,
    name: [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || row.email || "Technician #" + row.id,
    email: row.email || "",
    phone: profile.phone_number || row.phone_number || "",
    address: profile.address || row.address || "",
    rating: Number.isFinite(rating) && rating >= 0 && rating <= 5 ? rating : null,
    avatar,
    isVerified: row.is_verified === true,
    isKycVerified: profile.is_kyc_verified === true,
    services: Array.isArray(profile.services) ? profile.services.map(service => ({
      id: service.id, name: service.name, description: service.description || "",
    })) : [],
  };
}

export async function searchTechnicians(
  { serviceAreaId, serviceId },
  { baseUrl = API_BASE, fetchImpl = djangoFetch, signal } = {},
) {
  const area = Number(serviceAreaId);
  const service = Number(serviceId);
  if (!Number.isSafeInteger(area) || area <= 0 || !Number.isSafeInteger(service) || service <= 0) {
    throw new Error("Select a valid service area and service.");
  }
  const base = baseUrl.replace(/\/+$/, "");
  let url = new URL(base + "/technicians/");
  const origin = url.origin;
  const seen = new Set();
  const technicians = new Map();
  while (url) {
    if (url.origin !== origin) throw new Error("Invalid technician pagination.");
    url.searchParams.set("service-area", String(area));
    url.searchParams.set("service", String(service));
    if (seen.has(url.href)) throw new Error("Invalid technician pagination.");
    seen.add(url.href);
    const response = await fetchImpl(url.href, { signal });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      if (response.status === 401) throw new Error("Your session expired. Please sign in again.");
      throw new Error(typeof error?.detail === "string" ? error.detail : "Unable to load technicians. Please retry.");
    }
    const data = await response.json();
    const rows = Array.isArray(data) ? data : data?.results;
    if (!Array.isArray(rows)) throw new Error("Invalid technician response.");
    for (const row of rows) {
      if (!Number.isSafeInteger(row?.id) || row.id <= 0 || !row.profile) continue;
      const technician = normalizeTechnician(row, base);
      technicians.set(technician.id, technician);
    }
    url = !Array.isArray(data) && data.next ? new URL(data.next, url) : null;
  }
  return [...technicians.values()];
}
