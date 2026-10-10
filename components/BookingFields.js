"use client";

import { useEffect, useRef, useState } from "react";
import { fetchTechnicians, fetchServiceAreas } from "@/services/bookingService";
import { createBooking } from "@/lib/bookingStore";

export function useBookingForm(active = true, { requireServiceArea = false } = {}) {
  const [serviceAreas, setServiceAreas] = useState([]);
  const [serviceAreaId, setServiceAreaId] = useState("");
  const [areasLoading, setAreasLoading] = useState(false);
  const [areasError, setAreasError] = useState("");
  const [technicians, setTechnicians] = useState([]);
  const [technicianId, setTechnicianId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [time, setTime] = useState("10:30");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [retry, setRetry] = useState(0);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!active || !requireServiceArea) return;
    const controller = new AbortController();
    setAreasLoading(true);
    setAreasError("");
    fetchServiceAreas({ signal: controller.signal }).then(rows => {
      if (controller.signal.aborted) return;
      setServiceAreas(rows);
      setServiceAreaId(current => rows.some(row => String(row.id) === current) ? current : "");
    }).catch(err => {
      if (!controller.signal.aborted) { setServiceAreas([]); setAreasError(err.message || "Unable to load service areas."); }
    }).finally(() => { if (!controller.signal.aborted) setAreasLoading(false); });
    return () => controller.abort();
  }, [active, requireServiceArea, retry]);

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    fetchTechnicians({ signal: controller.signal }).then(rows => {
      if (controller.signal.aborted) return;
      setTechnicians(rows);
      setTechnicianId(current => rows.some(row => String(row.id) === current) ? current : "");
    }).catch(err => {
      if (!controller.signal.aborted) { setTechnicians([]); setLoadError(err.message || "Unable to load technicians."); }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [active, retry]);

  function locate() {
    setLocationError("");
    if (!navigator.geolocation) { setLocationError("Location is unavailable. Enter coordinates manually."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(position => {
      setLatitude(position.coords.latitude.toFixed(7));
      setLongitude(position.coords.longitude.toFixed(7));
      setLocating(false);
    }, () => {
      setLocationError("Unable to get your location. Allow location access or enter coordinates manually.");
      setLocating(false);
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  }

  async function submit(metadata) {
    if (inFlight.current) return null;
    inFlight.current = true;
    setSubmitting(true);
    setError("");
    try {
      const technician = technicians.find(row => String(row.id) === technicianId);
      if (loading || loadError || !technician) throw new Error("Select an available technician before booking.");
      const serviceArea = serviceAreas.find(row => String(row.id) === serviceAreaId);
      if (requireServiceArea && (areasLoading || areasError || !serviceArea)) throw new Error("Select an available service area before booking.");
      return await createBooking({ ...metadata, ...(requireServiceArea ? { serviceAreaId: serviceArea.id, serviceArea } : {}), technician, technicianId: technician.id, latitude, longitude, time });
    } catch (err) {
      setError(err.message || "Unable to create booking. Please try again.");
      return null;
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return { technicians, technicianId, setTechnicianId, latitude, setLatitude, longitude, setLongitude,
    requireServiceArea, serviceAreas, serviceAreaId, setServiceAreaId, areasLoading, areasError,
    time, setTime, loading, loadError, error, submitting, locating, locationError, locate,
    retry: () => setRetry(value => value + 1), submit,
    disabled: submitting || loading || !!loadError || !technicians.length || !technicianId ||
      (requireServiceArea && (areasLoading || !!areasError || !serviceAreas.length || !serviceAreaId)) };
}

const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

export function BookingFields({ form }) {
  return (
    <fieldset disabled={form.submitting} className="col-span-full space-y-3 text-xs">
      <legend className="sr-only">Technician, booking time, and coordinates</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block space-y-1 font-semibold">Technician *
          <select required value={form.technicianId} onChange={e => form.setTechnicianId(e.target.value)} disabled={form.loading || !!form.loadError} className={inputClass}>
            <option value="">{form.loading ? "Loading technicians…" : "Select a technician"}</option>
            {form.technicians.map(tech => <option key={tech.id} value={tech.id}>{tech.name} ({tech.email || "#" + tech.id})</option>)}
          </select>
        </label>
        <label className="block space-y-1 font-semibold">Preferred time (Nepal, UTC+05:45) *
          <input required type="time" value={form.time} onChange={e => form.setTime(e.target.value)} className={inputClass} />
        </label>
        <label className="block space-y-1 font-semibold">Latitude *
          <input required type="number" step="any" min="-90" max="90" value={form.latitude} onChange={e => form.setLatitude(e.target.value)} placeholder="27.1600000" className={inputClass} />
        </label>
        <label className="block space-y-1 font-semibold">Longitude *
          <input required type="number" step="any" min="-180" max="180" value={form.longitude} onChange={e => form.setLongitude(e.target.value)} placeholder="87.9200000" className={inputClass} />
        </label>
      </div>
      {form.loadError && <p role="alert" className="text-red-500">{form.loadError}</p>}
      {!form.loading && !form.loadError && !form.technicians.length && <p role="status">No technicians are available. Please retry later.</p>}
      {(form.loadError || (!form.loading && !form.technicians.length)) && <button type="button" onClick={form.retry} className="font-bold underline">Retry technicians</button>}
      <button type="button" disabled={form.locating} onClick={form.locate} className="rounded-lg bg-emerald-600 px-3 py-2 font-bold text-white disabled:opacity-50">{form.locating ? "Getting location…" : "Use my location"}</button>
      {form.locationError && <p role="alert" className="text-red-500">{form.locationError}</p>}
      {form.error && <p role="alert" className="text-red-500">{form.error}</p>}
      {form.submitting && <p role="status">Creating booking…</p>}
    </fieldset>
  );
}
