const API_BASE = (process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000").replace(/\/+$/, "");

function readToken() {
  if (typeof document === "undefined") return "";
  const cookie = document.cookie.split(";").map(part => part.trim()).find(part => part.startsWith("phidim_access_token="));
  return cookie ? decodeURIComponent(cookie.slice("phidim_access_token=".length)) : "";
}

async function errorMessage(response, fallback) {
  const data = await response.json().catch(() => null);
  if (response.status === 401) return "Your session expired. Please sign in again.";
  return data ? Object.entries(data).map(([key, value]) => key + ": " + (Array.isArray(value) ? value.join(" ") : String(value))).join("; ") : fallback;
}

export async function fetchTechnicians({ baseUrl = API_BASE, fetchImpl = fetch, signal } = {}) {
  let url = new URL(baseUrl.replace(/\/+$/, "") + "/technicians/");
  const origin = url.origin;
  const seen = new Set();
  const rows = [];
  while (url) {
    if (url.origin !== origin || seen.has(url.href)) throw new Error("Invalid technician pagination.");
    seen.add(url.href);
    const response = await fetchImpl(url.href, { signal });
    if (!response.ok) throw new Error(await errorMessage(response, "Unable to load technicians. Please retry."));
    const data = await response.json();
    const page = Array.isArray(data) ? data : data?.results;
    if (!Array.isArray(page)) throw new Error("Invalid technician response.");
    rows.push(...page);
    url = !Array.isArray(data) && data.next ? new URL(data.next, url) : null;
  }
  return rows.filter(row => Number.isInteger(row?.profile?.id) && row.profile.id > 0).map(row => ({
    id: row.profile.id,
    userId: row.profile.user,
    name: [row.first_name, row.last_name].filter(Boolean).join(" ") || row.email || "Technician #" + row.profile.id,
    email: row.email || "",
    phone: row.profile.phone_number || row.phone_number || "",
    address: row.profile.address || row.address || "",
    rating: row.profile.rating ?? null,
  }));
}

export function nepalDateTimeToUTC(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") || !/^\d{2}:\d{2}$/.test(time || "")) throw new Error("Choose a valid booking date and time.");
  const value = new Date(date + "T" + time + ":00+05:45");
  if (!Number.isFinite(value.getTime()) || time > "23:59" || Number(time.slice(3)) > 59) throw new Error("Choose a valid booking date and time.");
  const local = new Date(value.getTime() + 345 * 60000).toISOString().slice(0, 16);
  if (local !== date + "T" + time) throw new Error("Choose a valid booking date and time.");
  return value.toISOString();
}

export function buildBookingPayload(data) {
  if (!Number.isInteger(data.technicianId) || data.technicianId <= 0) throw new Error("Select a technician.");
  const coordinates = {};
  for (const [key, limit] of [["latitude", 90], ["longitude", 180]]) {
    const raw = String(data[key] ?? "").trim();
    const value = Number(raw);
    if (!raw || !Number.isFinite(value) || Math.abs(value) > limit) throw new Error("Enter a valid " + key + ".");
    coordinates[key] = value.toFixed(7);
  }
  const details = typeof data.notes === "string" ? data.notes.trim() : "";
  if (!details) throw new Error("Describe the problem for your technician.");
  return { technician: data.technicianId, ...coordinates, date: nepalDateTimeToUTC(data.date, data.time), problem_details: details };
}

export async function postBooking(data, { token = readToken(), baseUrl = API_BASE, fetchImpl = fetch, signal } = {}) {
  const payload = buildBookingPayload(data);
  if (!token) throw new Error("Please sign in again to book a service.");
  const response = await fetchImpl(baseUrl.replace(/\/+$/, "") + "/bookings/", {
    method: "POST", signal,
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await errorMessage(response, "Unable to create booking. Please try again."));
  const saved = await response.json();
  if (!saved || !Number.isInteger(saved.id) || saved.id <= 0 || typeof saved.status !== "string") throw new Error("The server returned an invalid booking. Check your bookings before retrying.");
  return saved;
}

export function normalizeCreatedBooking(saved, data) {
  return {
    ...saved,
    id: String(saved.id),
    backendId: saved.id,
    backendStatus: saved.status,
    status: saved.status === "p" ? "Pending" : saved.status,
    technicianId: saved.technician,
    technician: data.technician,
    serviceName: data.serviceName || data.category || "Service booking",
    category: data.category || "",
    customerName: data.customerName || "",
    customerEmail: (data.customerEmail || "").toLowerCase().trim(),
    customerPhone: data.customerPhone || "",
    address: data.address || "",
    bookingDate: data.date,
    timeSlot: data.time + " (Nepal time)",
    notes: saved.problem_details,
    amount: data.amount || (data.basePrice != null ? "Rs. " + Number(data.basePrice).toLocaleString("en-IN") : ""),
    numericAmount: Number(data.basePrice ?? data.numericAmount) || 0,
    isEmergency: !!data.isEmergency,
    createdAt: saved.created_at,
    updatedAt: saved.updated_at,
  };
}
