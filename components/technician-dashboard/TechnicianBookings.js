"use client";

import { useEffect, useRef, useState } from "react";
import { Search, RefreshCw, BriefcaseBusiness, X, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchBookings, updateTechnicianBooking } from "@/services/bookingService";

function personName(person, fallback) {
  return [person?.first_name, person?.last_name]
    .filter(value => typeof value === "string" && value.trim())
    .join(" ").trim() || fallback;
}

function scheduledDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || !Number.isFinite(date.getTime())) return "Schedule unavailable";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kathmandu", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).format(date) + " (Nepal time)";
}

function coordinate(value, limit) {
  if (value == null || String(value).trim() === "" || !Number.isFinite(Number(value)) || Math.abs(Number(value)) > limit) return "Unavailable";
  return String(value);
}

export function TechnicianBookings() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const allowed = !authLoading && isAuthenticated && ["TECHNICIAN", "ADMIN"].includes(user?.role);
  const owner = allowed ? `${user.id}:${user.role}` : null;
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState("");
  const [state, setState] = useState({ owner: null, revision: -1, bookings: [], loading: true, error: "" });
  const [decision, setDecision] = useState(null);
  const [notice, setNotice] = useState(null);
  const dialogRef = useRef(null);
  const updateRequest = useRef(null);
  const selected = decision?.owner === owner ? decision : null;

  useEffect(() => setSearch(""), [owner]);

  useEffect(() => {
    setDecision(null);
    setNotice(null);
    return () => {
      updateRequest.current?.abort();
      updateRequest.current = null;
    };
  }, [owner]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!selected || !dialog) return;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [selected?.booking.id, owner]);

  const openBooking = booking => {
    if (updateRequest.current) return;
    setNotice(null);
    setDecision({ owner, booking, pending: "", error: "" });
  };

  const closeBooking = () => {
    if (!updateRequest.current) setDecision(null);
  };

  const submitDecision = async status => {
    if (!selected || updateRequest.current) return;
    const controller = new AbortController();
    updateRequest.current = controller;
    setDecision({ ...selected, pending: status, error: "" });
    try {
      const saved = await updateTechnicianBooking(selected.booking.id, status, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setDecision(null);
      setNotice({ owner, message: `Booking #${saved.booking} ${saved.status === "c" ? "accepted" : "rejected"} successfully.` });
      setRevision(value => value + 1);
    } catch (error) {
      if (!controller.signal.aborted) setDecision({ ...selected, pending: "", error: error.message || "Unable to update booking. Please retry." });
    } finally {
      if (updateRequest.current === controller) updateRequest.current = null;
    }
  };

  useEffect(() => {
    if (!owner) {
      setState({ owner: null, revision: -1, bookings: [], loading: true, error: "" });
      return;
    }
    const controller = new AbortController();
    setState({ owner, revision, bookings: [], loading: true, error: "" });
    fetchBookings({ signal: controller.signal }).then(bookings => {
      if (!controller.signal.aborted) setState({ owner, revision, bookings, loading: false, error: "" });
    }).catch(error => {
      if (!controller.signal.aborted) setState({ owner, revision, bookings: [], loading: false, error: error.message || "Unable to load bookings. Please retry." });
    });
    return () => controller.abort();
  }, [owner, revision]);

  if (!allowed) return null;
  const current = state.owner === owner && state.revision === revision;
  const loading = !current || state.loading;
  const bookings = current ? state.bookings : [];
  const error = current ? state.error : "";
  const query = search.trim().toLowerCase();
  const filteredBookings = bookings.filter(booking => [
    `Booking #${booking.id}`,
    personName(booking.customer, "Customer unavailable"),
    personName(booking.technician, "Technician unavailable"),
    booking.status_display, booking.status, booking.problem_details,
    scheduledDate(booking.date), booking.latitude, booking.longitude,
  ].join(" ").toLowerCase().includes(query));

  return (
    <>
    <section aria-labelledby="technician-bookings-title" aria-busy={loading} className="rounded-3xl bg-white dark:bg-[#061812] border border-slate-200/80 dark:border-emerald-900/30 p-5 sm:p-7 shadow-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-emerald-900/20 pb-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"><BriefcaseBusiness size={24} /></div>
          <div>
            <h1 id="technician-bookings-title" className="text-xl font-black">My Bookings</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{loading ? "Loading your bookings…" : error ? "Bookings could not be loaded" : `${bookings.length} booking${bookings.length === 1 ? "" : "s"}`}</p>
          </div>
        </div>
        <button type="button" disabled={loading || !!selected?.pending} onClick={() => setRevision(value => value + 1)} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 disabled:opacity-50">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />{error ? "Retry" : "Refresh"}
        </button>
      </div>

      {notice?.owner === owner && <p role="status" className="rounded-xl bg-emerald-50 dark:bg-emerald-950 p-4 text-sm text-emerald-800 dark:text-emerald-300">{notice.message}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:max-w-md">
          <label htmlFor="technician-booking-search" className="block mb-2 text-sm font-semibold">Search bookings</label>
          <div className="relative">
            <Search size={17} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input id="technician-booking-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search ID, customer, status, or problem…" className="w-full rounded-xl border border-slate-200 dark:border-emerald-900/40 bg-slate-50 dark:bg-[#040e0b] pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>
        {!loading && !error && <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Showing {filteredBookings.length} of {bookings.length} bookings</p>}
      </div>

      {loading ? <p role="status" className="py-10 text-center text-slate-500">Loading bookings…</p> : error ? (
        <p role="alert" className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 p-5 text-sm text-rose-700 dark:text-rose-300">{error}</p>
      ) : bookings.length === 0 ? (
        <div className="py-10 text-center space-y-2"><h2 className="font-bold">No bookings yet</h2><p className="text-sm text-slate-500">You have no bookings at the moment.</p></div>
      ) : (
        <div role="region" aria-label="Bookings table" tabIndex={0} className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-emerald-900/40 focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <caption className="sr-only">Technician bookings. Scheduled dates are shown in Nepal time.</caption>
            <thead className="bg-slate-50 dark:bg-[#040e0b] text-slate-500 dark:text-slate-400">
              <tr>{["Booking ID", "Customer", "Technician", "Status", "Scheduled (Nepal time)", "Problem details", "Location"].map(label => <th key={label} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-emerald-900/30">
              {filteredBookings.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">No bookings match your search.</td></tr>
              ) : filteredBookings.map(booking => (
                <tr key={booking.id} onClick={() => openBooking(booking)} className="cursor-pointer align-top hover:bg-emerald-50/70 dark:hover:bg-emerald-950/20">
                  <th scope="row" className="px-4 py-4 font-bold whitespace-nowrap"><button type="button" aria-label={`Review booking #${booking.id}`} aria-haspopup="dialog" onClick={event => { event.stopPropagation(); openBooking(booking); }} className="rounded text-emerald-700 dark:text-emerald-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">Booking #{booking.id}</button></th>
                  <td className="px-4 py-4 break-words min-w-36">{personName(booking.customer, "Customer unavailable")}</td>
                  <td className="px-4 py-4 break-words min-w-36">{personName(booking.technician, "Technician unavailable")}</td>
                  <td className="px-4 py-4"><span className="inline-block rounded-full bg-emerald-100 dark:bg-emerald-950 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">{booking.status_display || booking.status || "Status unavailable"}</span></td>
                  <td className="px-4 py-4 min-w-48">{scheduledDate(booking.date)}</td>
                  <td className="px-4 py-4 min-w-64 max-w-sm whitespace-pre-wrap break-words">{booking.problem_details?.trim() || "Problem details unavailable"}</td>
                  <td className="px-4 py-4 whitespace-nowrap"><div>Latitude: {coordinate(booking.latitude, 90)}</div><div>Longitude: {coordinate(booking.longitude, 180)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </section>
      {selected && (
        <dialog ref={dialogRef} aria-labelledby="booking-decision-title" aria-describedby="booking-decision-description" aria-busy={!!selected.pending} onCancel={event => { event.preventDefault(); closeBooking(); }} onClick={event => { if (event.target === event.currentTarget) closeBooking(); }} className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-lg max-h-[90dvh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-emerald-900/40 bg-white dark:bg-[#061812] p-0 text-slate-900 dark:text-slate-100 shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm">
          <div className="p-6 sm:p-8 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="rounded-2xl bg-emerald-100 dark:bg-emerald-950 p-3 text-emerald-600 dark:text-emerald-400"><BriefcaseBusiness size={24} /></div>
              <button type="button" autoFocus aria-label="Close booking review" disabled={!!selected.pending} onClick={closeBooking} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-emerald-950 disabled:opacity-50"><X size={20} /></button>
            </div>
            <div>
              <h2 id="booking-decision-title" className="text-xl font-bold">Review booking #{selected.booking.id}</h2>
              <p id="booking-decision-description" className="mt-2 text-sm text-slate-500 dark:text-slate-400">Would you like to accept this booking or reject it?</p>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-[#040e0b] p-4 space-y-2 text-sm">
              <p className="font-semibold">{personName(selected.booking.customer, "Customer unavailable")}</p>
              <p className="text-slate-500 dark:text-slate-400">{scheduledDate(selected.booking.date)}</p>
              <p className="whitespace-pre-wrap break-words">{selected.booking.problem_details?.trim() || "Problem details unavailable"}</p>
            </div>
            {selected.error && <p role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-sm text-rose-700 dark:text-rose-300">{selected.error}</p>}
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="button" disabled={!!selected.pending} onClick={() => submitDecision("r")} className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 font-bold text-sm text-rose-700 dark:text-rose-300 hover:bg-rose-100 disabled:opacity-50">{selected.pending === "r" ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}{selected.pending === "r" ? "Rejecting…" : "Reject booking"}</button>
              <button type="button" disabled={!!selected.pending} onClick={() => submitDecision("c")} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-sm text-white hover:bg-emerald-700 disabled:opacity-50">{selected.pending === "c" ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}{selected.pending === "c" ? "Accepting…" : "Accept booking"}</button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
