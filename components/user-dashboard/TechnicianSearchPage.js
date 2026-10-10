"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Star, MapPin, Wrench, X, CheckCircle2, LoaderCircle, UserRound } from "lucide-react";
import { fetchServiceAreas, fetchServicesByArea, nepalDateTimeToUTC } from "@/services/bookingService";
import { searchTechnicians } from "@/services/technicianSearchService";

const inputClass = "w-full rounded-xl border border-white/15 bg-[#1c1c28] px-3 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 [color-scheme:dark]";
const primaryClass = "inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed";
const secondaryClass = "inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-emerald-400";

function Avatar({ technician, large = false }) {
  const [failed, setFailed] = useState(false);
  const size = large ? "h-24 w-24" : "h-20 w-20";
  return failed || !technician.avatar ? (
    <span role="img" aria-label={technician.name} className={size + " flex items-center justify-center rounded-full bg-white/10 text-emerald-300"}><UserRound size={36} /></span>
  ) : <img src={technician.avatar} alt={technician.name} loading="lazy" onError={() => setFailed(true)} className={size + " rounded-full border border-white/10 object-cover"} />;
}

function Rating({ technician }) {
  const rated = typeof technician.rating === "number" && Number.isFinite(technician.rating);
  return <p className="flex items-center justify-center gap-1.5 text-sm">
    <Star size={15} className={rated ? "fill-amber-400 text-amber-400" : "text-neutral-500"} aria-hidden="true" />
    <span className="font-semibold">{rated ? technician.rating.toFixed(1) : "Not rated yet"}{rated && <span className="sr-only"> out of 5 stars</span>}</span>
  </p>;
}

function Dialog({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    return () => { dialog.close(); if (previousFocus?.isConnected) previousFocus.focus(); };
  }, []);
  return <dialog ref={ref} aria-labelledby="technician-dialog-title" onCancel={event => { event.preventDefault(); onClose(); }} className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-3xl border border-white/15 bg-[#14141e] p-6 text-white shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm">
    <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/10 pb-4"><h2 id="technician-dialog-title" className="text-lg font-semibold">{title}</h2><button type="button" autoFocus onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"><X size={20} /></button></div>
    {children}
  </dialog>;
}

export function DemoBookingForm({ technician, area, service, initialNotes = "" }) {
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [locating, setLocating] = useState(false);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  function locate() {
    setLocationError("");
    if (!navigator.geolocation) { setLocationError("Location is unavailable. Enter coordinates manually."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(position => {
      if (!active.current) return;
      setLatitude(position.coords.latitude.toFixed(7)); setLongitude(position.coords.longitude.toFixed(7)); setLocating(false);
    }, () => {
      if (!active.current) return;
      setLocationError("Unable to get your location. Allow location access or enter coordinates manually."); setLocating(false);
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  }
  function confirm(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setError("");
    try {
      if (!String(values.get("address") || "").trim() || !String(values.get("notes") || "").trim()) throw new Error("Enter your service address and problem details.");
      const date = nepalDateTimeToUTC(values.get("date"), values.get("time"));
      if (new Date(date).getTime() < Date.now()) throw new Error("Choose a future booking date and time.");
      for (const [value, limit] of [[latitude, 90], [longitude, 180]]) {
        if (!value.trim() || !Number.isFinite(Number(value)) || Math.abs(Number(value)) > limit) throw new Error("Enter valid latitude and longitude, or use your location.");
      }
      // Confirmation remains a demo until real booking submission is connected.
      setConfirmed(true);
    } catch (err) { setError(err.message); }
  }
  return <>
    <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="font-semibold">{technician.name}</p><p className="mt-1 text-sm text-neutral-300">{service.name} · {area.name}</p></div>
    {confirmed ? <div role="status" className="space-y-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5"><CheckCircle2 className="text-emerald-300" /><h3 className="font-semibold">Demo booking confirmed</h3><p className="text-sm text-neutral-300">Your sample request for {technician.name} is complete. No real booking has been created.</p></div> : <form onSubmit={confirm} className="space-y-4">
      <p className="text-xs text-amber-300">Demo booking — this form will not create a real booking.</p>
      <label className="block space-y-1.5 text-sm"><span>Service address *</span><input name="address" required className={inputClass} placeholder="Street, ward, and nearby landmark" /></label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5 text-sm"><span>Preferred date *</span><input name="date" type="date" required min={today} defaultValue={today} className={inputClass} /></label>
        <label className="block space-y-1.5 text-sm"><span>Time (Nepal, UTC+05:45) *</span><input name="time" type="time" required defaultValue="10:30" className={inputClass} /></label>
        <label className="block space-y-1.5 text-sm"><span>Latitude *</span><input name="latitude" type="number" required step="any" min="-90" max="90" value={latitude} onChange={e => setLatitude(e.target.value)} className={inputClass} placeholder="27.1600000" /></label>
        <label className="block space-y-1.5 text-sm"><span>Longitude *</span><input name="longitude" type="number" required step="any" min="-180" max="180" value={longitude} onChange={e => setLongitude(e.target.value)} className={inputClass} placeholder="87.9200000" /></label>
      </div>
      <button type="button" onClick={locate} disabled={locating} className={secondaryClass}>{locating ? "Getting location…" : "Use my location"}</button>
      {locationError && <p role="alert" className="text-sm text-red-300">{locationError}</p>}
      <label className="block space-y-1.5 text-sm"><span>Problem details *</span><textarea name="notes" required rows={3} defaultValue={initialNotes} className={inputClass} placeholder="Describe what needs repair…" /></label>
      <label className="flex items-center gap-2 text-sm"><input name="urgent" type="checkbox" className="h-4 w-4 accent-emerald-400" />Urgent service request</label>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <button type="submit" className={primaryClass + " w-full"}>Confirm Demo Booking</button>
    </form>}
  </>;
}

export default function TechnicianSearchPage({ initialNotes = "" }) {
  const [areas, setAreas] = useState({ rows: [], loading: true, error: "" });
  const [areaId, setAreaId] = useState("");
  const [areaRetry, setAreaRetry] = useState(0);
  const [services, setServices] = useState({ areaId: "", rows: [], loading: false, error: "" });
  const [serviceId, setServiceId] = useState("");
  const [serviceRetry, setServiceRetry] = useState(0);
  const [results, setResults] = useState({ status: "idle", rows: [], error: "" });
  const [dialog, setDialog] = useState(null);
  const searchRequest = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    setAreas({ rows: [], loading: true, error: "" });
    fetchServiceAreas({ signal: controller.signal }).then(rows => {
      if (!controller.signal.aborted) setAreas({ rows, loading: false, error: "" });
    }).catch(err => { if (!controller.signal.aborted) setAreas({ rows: [], loading: false, error: err.message || "Unable to load service areas." }); });
    return () => controller.abort();
  }, [areaRetry]);

  useEffect(() => {
    if (!areaId) return;
    const controller = new AbortController();
    setServices({ areaId, rows: [], loading: true, error: "" });
    fetchServicesByArea(areaId, { signal: controller.signal }).then(rows => {
      if (!controller.signal.aborted) setServices({ areaId, rows, loading: false, error: "" });
    }).catch(err => { if (!controller.signal.aborted) setServices({ areaId, rows: [], loading: false, error: err.message || "Unable to load services." }); });
    return () => controller.abort();
  }, [areaId, serviceRetry]);
  useEffect(() => () => searchRequest.current?.abort(), []);

  function clearResults() { searchRequest.current?.abort(); setResults({ status: "idle", rows: [], error: "" }); }
  const area = areas.rows.find(row => String(row.id) === areaId);
  const matchingServices = services.areaId === areaId;
  const service = matchingServices ? services.rows.find(row => String(row.id) === serviceId) : null;
  const servicesLoading = !!areaId && (!matchingServices || services.loading);
  const canSearch = !!area && !!service && !areas.loading && !areas.error && !servicesLoading && !services.error;
  async function search(event) {
    event?.preventDefault();
    if (!canSearch) return;
    searchRequest.current?.abort();
    const controller = new AbortController();
    searchRequest.current = controller;
    setResults({ status: "loading", rows: [], error: "" });
    try {
      const rows = await searchTechnicians({ serviceAreaId: area.id, serviceId: service.id }, { signal: controller.signal });
      if (!controller.signal.aborted) setResults({ status: "success", rows, error: "" });
    } catch (err) {
      if (!controller.signal.aborted) setResults({ status: "error", rows: [], error: err.message || "Unable to search technicians." });
    }
  }
  function openDialog(mode, technician) { setDialog({ mode, technician, area, service }); }

  return <main className="min-h-screen bg-[#0b0b0f] px-4 py-6 text-[#ededed] sm:px-8 lg:py-10">
    <div className="mx-auto max-w-6xl">
      <Link href="/user/dashboard" className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white"><ArrowLeft size={16} />Back to dashboard</Link>
      <header className="mb-7"><span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">At your doorstep</span><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Find your technician</h1><p className="mt-3 text-sm text-neutral-400">Choose your area and service to find the right person for the job.</p></header>
      <form onSubmit={search} className="rounded-2xl border border-white/10 bg-[#14141e] p-5 sm:p-6">
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-2"><label htmlFor="technician-area" className="flex items-center gap-2 text-sm font-medium"><MapPin size={15} className="text-neutral-400" />Select service area</label>
            <select id="technician-area" required value={areaId} disabled={areas.loading || !!areas.error} onChange={e => { clearResults(); setAreaId(e.target.value); setServiceId(""); setServices({ areaId: "", rows: [], loading: false, error: "" }); }} className={inputClass}>
              <option value="">{areas.loading ? "Loading service areas…" : "Select a service area"}</option>{areas.rows.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
            {areas.error && <p role="alert" className="text-xs text-red-300">{areas.error}</p>}
            {!areas.loading && !areas.error && !areas.rows.length && <p role="status" className="text-xs text-neutral-400">No service areas are available.</p>}
            {(areas.error || (!areas.loading && !areas.rows.length)) && <button type="button" onClick={() => setAreaRetry(value => value + 1)} className="text-xs underline">Retry service areas</button>}
          </div>
          <div className="space-y-2"><label htmlFor="technician-service" className="flex items-center gap-2 text-sm font-medium"><Wrench size={15} className="text-neutral-400" />Select service</label>
            <select id="technician-service" required value={serviceId} disabled={!area || servicesLoading || !matchingServices || !!services.error || !services.rows.length} onChange={e => { clearResults(); setServiceId(e.target.value); }} className={inputClass}>
              <option value="">{!areaId ? "Select a service area first" : servicesLoading ? "Loading services…" : "Select a service"}</option>{matchingServices && services.rows.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
            {matchingServices && services.error && <p role="alert" className="text-xs text-red-300">{services.error}</p>}
            {areaId && matchingServices && !services.loading && !services.error && !services.rows.length && <p role="status" className="text-xs text-neutral-400">No services are available in this area.</p>}
            {matchingServices && (services.error || (areaId && !services.loading && !services.rows.length)) && <button type="button" onClick={() => { clearResults(); setServiceRetry(value => value + 1); }} className="text-xs underline">Retry services</button>}
          </div>
          <button type="submit" disabled={!canSearch || results.status === "loading"} className={primaryClass + " md:mt-7"}>{results.status === "loading" ? <LoaderCircle size={17} className="animate-spin" /> : <Search size={17} />}Search</button>
        </div>
      </form>
      <p className="mt-4 text-xs text-amber-300/90">Booking confirmations are demo only. No real booking will be created.</p>
      <section aria-label="Technician search results" aria-busy={results.status === "loading"} className="mt-9">
        {results.status === "idle" && <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center"><Search size={28} className="mx-auto mb-4 text-neutral-500" /><h2 className="font-medium">Your next repair starts here</h2><p className="mt-2 text-sm text-neutral-400">Select an area and service, then search for technicians.</p></div>}
        {results.status === "loading" && <p role="status" className="flex items-center justify-center gap-3 py-20 text-sm text-neutral-400"><LoaderCircle className="animate-spin" size={20} />Finding technicians…</p>}
        {results.status === "error" && <div role="alert" className="rounded-2xl border border-red-400/20 p-6"><p className="mb-4 text-sm text-red-300">{results.error}</p><button type="button" onClick={() => search()} className={secondaryClass}>Retry search</button></div>}
        {results.status === "success" && <><div className="mb-5 flex flex-wrap items-center justify-between gap-2"><h2 role="status" className="text-lg font-semibold">{results.rows.length} technicians found</h2><p className="text-sm text-neutral-400">{service?.name} · {area?.name}</p></div>
          {!results.rows.length ? <p className="rounded-2xl border border-white/10 p-8 text-center text-neutral-400">No technicians found. Try another service or area.</p> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{results.rows.map(technician => <article key={technician.id} className="rounded-2xl border border-white/10 bg-[#14141e] p-6 transition hover:border-white/25"><div className="flex flex-col items-center gap-3"><Avatar technician={technician} /><h3 className="mt-1 text-lg font-semibold">{technician.name}</h3><p className="text-center text-sm text-neutral-400">{service.name}</p><Rating technician={technician} /><p className="text-center text-xs text-neutral-400">{technician.address || "Address not provided"}</p>{technician.isKycVerified && <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-300">KYC verified</span>}</div><div className="mt-6 grid grid-cols-2 gap-2"><button type="button" onClick={() => openDialog("book", technician)} aria-label={"Book now with " + technician.name} className={primaryClass + " px-3"}>Book Now</button><button type="button" onClick={() => openDialog("details", technician)} aria-label={"View details for " + technician.name} className={secondaryClass + " px-3"}>View Details</button></div></article>)}</div>}
        </>}
      </section>
    </div>
    {dialog && <Dialog title={dialog.mode === "book" ? "Book a technician" : "Technician details"} onClose={() => setDialog(null)}>
      {dialog.mode === "book" ? <DemoBookingForm key={dialog.technician.id} technician={dialog.technician} area={dialog.area} service={dialog.service} initialNotes={initialNotes} /> : <div className="space-y-5"><div className="flex flex-col items-center gap-3"><Avatar technician={dialog.technician} large /><h3 className="text-xl font-semibold">{dialog.technician.name}</h3><Rating technician={dialog.technician} /></div><dl className="grid grid-cols-2 gap-4 rounded-2xl bg-white/[0.04] p-4 text-sm"><div><dt className="text-neutral-400">Specialty</dt><dd className="mt-1">{dialog.service.name}</dd></div><div><dt className="text-neutral-400">Service area</dt><dd className="mt-1">{dialog.area.name}</dd></div><div><dt className="text-neutral-400">Address</dt><dd className="mt-1">{dialog.technician.address || "Not provided"}</dd></div>
          <div><dt className="text-neutral-400">Phone</dt><dd className="mt-1">{dialog.technician.phone || "Not provided"}</dd></div>
          <div className="col-span-2 min-w-0"><dt className="text-neutral-400">Email</dt><dd className="mt-1 break-words">{dialog.technician.email || "Not provided"}</dd></div>
          <div><dt className="text-neutral-400">Account verified</dt><dd className="mt-1">{dialog.technician.isVerified ? "Yes" : "No"}</dd></div>
          <div><dt className="text-neutral-400">KYC verified</dt><dd className="mt-1">{dialog.technician.isKycVerified ? "Yes" : "No"}</dd></div>
        </dl>
        {!!dialog.technician.services?.length && <section aria-label="Technician services" className="space-y-3"><h4 className="font-semibold">Services offered</h4>{dialog.technician.services.map(item => <div key={item.id} className="rounded-xl border border-white/10 p-3"><h5 className="text-sm font-medium">{item.name}</h5>{item.description && <p className="mt-1 text-sm leading-relaxed text-neutral-400">{item.description}</p>}</div>)}</section>}</div>}
    </Dialog>}
  </main>;
}
