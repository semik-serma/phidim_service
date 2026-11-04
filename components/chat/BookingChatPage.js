"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchBookings } from "@/services/bookingService";
import { BookingChatModal } from "./BookingChatModal";

export default function BookingChatPage({ bookingId, dashboard }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ booking: null, error: "", owner: null });
  const owner = isAuthenticated ? `${user?.id}:${user?.role}` : null;

  useEffect(() => {
    if (isLoading || !owner) return;
    const controller = new AbortController();
    setState({ booking: null, error: "", owner });
    fetchBookings({ signal: controller.signal }).then(bookings => {
      if (controller.signal.aborted) return;
      const booking = bookings.find(item => item.id === bookingId);
      setState({ owner, booking, error: booking ? "" : "This booking is unavailable or you no longer have access." });
    }).catch(error => {
      if (!controller.signal.aborted) setState({ owner, booking: null, error: error.message });
    });
    return () => controller.abort();
  }, [bookingId, owner, isLoading, attempt]);

  if (owner && state.owner === owner && state.booking) {
    return <BookingChatModal key={`${owner}:${bookingId}`} booking={state.booking} onClose={() => router.push(dashboard)} />;
  }
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Booking conversation</h1>
        <p role="status" className="my-4 text-sm text-slate-500">{state.owner === owner && state.error ? state.error : "Loading your conversation…"}</p>
        {state.owner === owner && state.error && <button onClick={() => setAttempt(value => value + 1)} className="mr-4 text-sm font-semibold text-emerald-600">Try again</button>}
        <button onClick={() => router.push(dashboard)} className="text-sm font-semibold text-slate-600 dark:text-slate-300">Back to dashboard</button>
      </div>
    </main>
  );
}
