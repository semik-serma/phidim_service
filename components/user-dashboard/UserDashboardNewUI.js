"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness, ChevronLeft, ChevronRight, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchBookings } from "@/services/bookingService";
import BookingLiveLocationButton from "./BookingLiveLocationButton";
import styles from "./UserDashboardNewUI.module.css";

function technicianName(technician) {
  return [technician?.first_name, technician?.last_name]
    .filter(value => typeof value === "string" && value.trim())
    .join(" ").trim() || "Not assigned";
}

function scheduledDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || !Number.isFinite(date.getTime())) return "Not scheduled";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kathmandu", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).format(date) + " (Nepal time)";
}

export default function UserDashboardNewUI() {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const allowed = !authLoading && isAuthenticated && ["USER", "ADMIN"].includes(user?.role);
  const owner = allowed ? `${user.id}:${user.email}:${user.role}` : null;
  const [revision, setRevision] = useState(0);
  const [bookingState, setBookingState] = useState({ owner: null, revision: -1, bookings: [], loading: true, error: "" });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = owner && bookingState.owner === owner && bookingState.revision === revision;
  const bookings = current ? bookingState.bookings : [];
  const loading = !current || bookingState.loading;
  const error = current ? bookingState.error : "";

  useEffect(() => {
    if (!owner) return;
    const controller = new AbortController();
    setBookingState({ owner, revision, bookings: [], loading: true, error: "" });
    // Use the same authenticated endpoint as the technician dashboard.
    fetchBookings({ signal: controller.signal }).then(bookings => {
      if (!controller.signal.aborted) setBookingState({ owner, revision, bookings, loading: false, error: "" });
    }).catch(error => {
      if (!controller.signal.aborted) setBookingState({ owner, revision, bookings: [], loading: false, error: error.message || "Unable to load bookings. Please retry." });
    });
    return () => controller.abort();
  }, [owner, revision]);

  if (!allowed) return null;

  return (
    <div className={`${styles.dashboard} ${collapsed ? styles.collapsed : ""}`} data-dashboard="true"
      onKeyDown={event => { if (event.key === "Escape") setMobileOpen(false); }}>
      {mobileOpen && <button type="button" className={styles.backdrop} onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}
      <aside id="user-dashboard-sidebar" aria-label="User sidebar" className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ""}`}>
        <div className={styles.brand}>
          <span className={styles.logo}><ShieldCheck size={21} aria-hidden="true" /></span>
          <div className={styles.brandText}><strong>Phidim Service</strong><span>Customer dashboard</span></div>
          <button type="button" className={styles.collapseButton} onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button type="button" className={styles.closeButton} onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={19} /></button>
        </div>
        <nav aria-label="User dashboard navigation" className={styles.navigation}>
          <a href="#my-bookings" aria-current="page" className={styles.activeLink} onClick={() => setMobileOpen(false)} title="My Bookings">
            <BriefcaseBusiness size={20} aria-hidden="true" /><span>My Bookings</span>
          </a>
          <button type="button" onClick={logout} className={styles.logout} aria-label="Logout" title="Logout">
            <LogOut size={19} aria-hidden="true" /><span>Logout</span>
          </button>
        </nav>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <button type="button" className={styles.menuButton} onClick={() => setMobileOpen(true)} aria-label="Open sidebar navigation" aria-expanded={mobileOpen} aria-controls="user-dashboard-sidebar"><Menu size={20} /></button>
          <span>User Dashboard</span>
        </header>
        <main className={styles.content}>
        <section id="my-bookings" aria-labelledby="my-bookings-title" className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.bookingIcon}><BriefcaseBusiness size={24} aria-hidden="true" /></span>
            <div><h1 id="my-bookings-title">My Bookings</h1>{!loading && !error && <p>{bookings.length} booking{bookings.length === 1 ? "" : "s"}</p>}</div>
          </div>
          {loading ? (
            <p className={styles.empty} role="status">Loading bookings…</p>
          ) : error ? (
            <div className={styles.empty}>
              <p role="alert">{error}</p>
              <button type="button" className={styles.retryButton} onClick={() => setRevision(value => value + 1)}>Retry</button>
            </div>
          ) : bookings.length === 0 ? (
            <p className={styles.empty}>No bookings yet</p>
          ) : (
            <div className={styles.tableScroll} role="region" aria-label="Bookings table" tabIndex={0}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Booking ID</th>
                    <th scope="col">Service</th>
                    <th scope="col">Technician</th>
                    <th scope="col">Status</th>
                    <th scope="col">Scheduled</th>
                    <th scope="col">Fee (NPR)</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking, index) => (
                    <tr key={booking.id ?? index}>
                      <th scope="row" className={styles.bookingId}>{booking.id ?? "Unavailable"}</th>
                      <td className={styles.service}>{booking.problem_details || "Service unavailable"}</td>
                      <td>
                        {technicianName(booking.technician)}
                        <BookingLiveLocationButton key={`${owner}:${booking.id}`} bookingId={booking.id} />
                      </td>
                      <td>
                        <span className={styles.status} data-status={booking.status}>
                          {booking.status_display || booking.status || "Status unavailable"}
                        </span>
                      </td>
                      <td>{scheduledDate(booking.date)}</td>
                      <td>{booking.amount ?? booking.numericAmount ?? "Unavailable"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      </div>
    </div>
  );
}
