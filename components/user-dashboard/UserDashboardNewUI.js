"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness, ChevronLeft, ChevronRight, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getBookingsList, subscribeBookings } from "@/lib/bookingStore";
import styles from "./UserDashboardNewUI.module.css";

export default function UserDashboardNewUI() {
  const { user, logout } = useAuth();
  const email = typeof user?.email === "string" ? user.email.trim().toLowerCase() : "";
  const [bookingState, setBookingState] = useState({ owner: "", bookings: [] });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const bookings = email && bookingState.owner === email ? bookingState.bookings : [];

  useEffect(() => {
    if (!email) return;
    const updateBookings = (list) => {
      setBookingState({
        owner: email,
        bookings: (Array.isArray(list) ? list : []).filter(
          booking => typeof booking?.customerEmail === "string"
            && booking.customerEmail.trim().toLowerCase() === email
        ),
      });
    };
    updateBookings(getBookingsList(email));
    return subscribeBookings(updateBookings);
  }, [email]);

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
            <div><h1 id="my-bookings-title">My Bookings</h1><p>{bookings.length} booking{bookings.length === 1 ? "" : "s"}</p></div>
          </div>
          {bookings.length === 0 ? (
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
                      <td className={styles.service}>{booking.serviceName || "Service unavailable"}</td>
                      <td>{booking.technician?.name || "Not assigned"}</td>
                      <td>
                        <span className={styles.status} data-status={booking.status}>
                          {booking.status || "Status unavailable"}
                        </span>
                      </td>
                      <td>{booking.date || "Not scheduled"}{booking.timeSlot && <span className={styles.timeSlot}>{booking.timeSlot}</span>}</td>
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
