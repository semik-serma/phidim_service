
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

// Load Leaflet only in the browser
const TechnicianMap = dynamic(
  () => import("@/components/TechnicianMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-xl bg-slate-100 dark:bg-emerald-950">
        <p className="text-sm text-slate-500">
          Loading map...
        </p>
      </div>
    ),
  }
);

export default function BookingLiveLocationPage({ bookingId }) {
  const [attempt, setAttempt] = useState(0);

  const [connection, setConnection] = useState({
    status: "connecting",
    error: "",
  });

  const [location, setLocation] = useState(null);
  const [now, setNow] = useState(0);

  // ==========================================
  // DJANGO WEBSOCKET CONNECTION
  // ==========================================
  useEffect(() => {
    if (!bookingId) return;

    let active = true;
    let socket = null;
    let retryTimer = null;

    const clock = setInterval(() => {
      setNow(Date.now());
    }, 10000);

    setLocation(null);

    function connect() {
      if (!active) return;

      setConnection({
        status: "connecting",
        error: "",
      });

      try {
        // Get authentication token
        const cookie = document.cookie
          .split(";")
          .map((part) => part.trim())
          .find((part) =>
            part.startsWith("phidim_access_token=")
          );

        const token = cookie
          ? decodeURIComponent(
              cookie.slice("phidim_access_token=".length)
            )
          : "";

        if (!token) {
          throw new Error(
            "Please sign in again to view live location."
          );
        }

        // WebSocket URL
        const url = new URL(
          process.env.NEXT_PUBLIC_DJANGO_API_URL ||
            "http://localhost:8000"
        );

        url.protocol =
          url.protocol === "https:" ? "wss:" : "ws:";

        url.pathname = `/ws/share-location/${bookingId}/`;

        url.search = new URLSearchParams({
          token,
        }).toString();

        url.hash = "";

        // Create WebSocket
        socket = new WebSocket(url.href);

        // ----------------------------------
        // Connected
        // ----------------------------------
        socket.onopen = () => {
          if (!active) return;

          setConnection({
            status: "connected",
            error: "",
          });
        };

        // ----------------------------------
        // Receive technician location
        // ----------------------------------
        socket.onmessage = (event) => {
          if (!active) return;

          let message;

          try {
            message = JSON.parse(event.data);
          } catch {
            return;
          }

          // Handle backend errors
          if (
            message?.type === "error" &&
            typeof message.message === "string"
          ) {
            setConnection((previous) => ({
              ...previous,
              error: message.message,
            }));
            return;
          }

          if (message?.type !== "location_update") {
            return;
          }

          // Validate booking ID
          if (
            String(message.booking_id) !== String(bookingId)
          ) {
            return;
          }

          // Convert coordinates into numbers
          const latitude = Number(message.latitude);
          const longitude = Number(message.longitude);

          // Validate GPS coordinates
          if (
            !Number.isFinite(latitude) ||
            Math.abs(latitude) > 90 ||
            !Number.isFinite(longitude) ||
            Math.abs(longitude) > 180
          ) {
            return;
          }

          const receivedAt = Date.now();

          // Only update location state.
          // TechnicianMap moves the marker.
          // The map itself is not re-created.
          setLocation({
            latitude,
            longitude,
            receivedAt,
          });

          setNow(receivedAt);

          setConnection({
            status: "connected",
            error: "",
          });

          console.log("Technician GPS updated:", {
            latitude,
            longitude,
          });
        };

        // ----------------------------------
        // WebSocket error
        // ----------------------------------
        socket.onerror = () => {
          if (!active) return;

          setConnection({
            status: "error",
            error: "Unable to connect to live location.",
          });

          socket.close();
        };

        // ----------------------------------
        // Automatic reconnect
        // ----------------------------------
        socket.onclose = () => {
          if (!active) return;

          setConnection({
            status: "reconnecting",
            error:
              "Connection lost. Reconnecting in 5 seconds.",
          });

          clearTimeout(retryTimer);

          retryTimer = setTimeout(() => {
            connect();
          }, 5000);
        };
      } catch (error) {
        if (!active) return;

        setConnection({
          status: "error",
          error:
            error.message ||
            "Unable to connect to live location.",
        });
      }
    }

    connect();

    // ----------------------------------
    // Cleanup
    // ----------------------------------
    return () => {
      active = false;

      clearInterval(clock);
      clearTimeout(retryTimer);

      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;

        socket.close();
      }
    };
  }, [bookingId, attempt]);

  // ==========================================
  // LOCATION INFORMATION
  // ==========================================

  const stale =
    location &&
    now - location.receivedAt >= 60000;

  const coordinates = location
    ? `${location.latitude},${location.longitude}`
    : "";

  const status =
    connection.status === "connected"
      ? location
        ? stale
          ? "Waiting for a fresh location"
          : "Receiving live updates"
        : "Waiting for the technician to share their location"
      : connection.status === "connecting"
        ? "Connecting to technician location..."
        : connection.status === "reconnecting"
          ? "Reconnecting..."
          : "Location connection unavailable";

  // ==========================================
  // USER INTERFACE
  // ==========================================

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-[#061812] dark:text-slate-100 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Back Navigation */}
        <Link
          href="/user/dashboard"
          className="inline-block text-sm font-semibold text-emerald-700 dark:text-emerald-400"
        >
          ← Back to dashboard
        </Link>

        {/* Page Header */}
        <header>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Booking #{bookingId}
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Technician Live Location
          </h1>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Track your technician's location in real time.
            The marker updates automatically without
            reloading the map.
          </p>
        </header>

        {/* Location Section */}
        <section
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/30 sm:p-6"
          aria-label="Latest technician location"
        >

          {/* Connection Status */}
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`h-3 w-3 rounded-full ${
                connection.status === "connected"
                  ? "bg-emerald-500"
                  : connection.status === "connecting" ||
                      connection.status === "reconnecting"
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
            />

            <p role="status" className="font-semibold">
              {status}
            </p>
          </div>

          {/* Error Message */}
          {connection.error && (
            <p
              role="alert"
              className="text-sm text-rose-600 dark:text-rose-400"
            >
              {connection.error}
            </p>
          )}

          {/* Manual Reconnect Button */}
          {["error", "reconnecting"].includes(
            connection.status
          ) && (
            <button
              type="button"
              onClick={() =>
                setAttempt((value) => value + 1)
              }
              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Reconnect Now
            </button>
          )}

          {/* Location Available */}
          {location ? (
            <>
              {/* Coordinates */}
              <div
                className="space-y-2"
                aria-live="polite"
                aria-atomic="true"
              >
                <p className="text-sm">
                  Latest coordinates:{" "}
                  <strong>
                    {location.latitude.toFixed(7)},{" "}
                    {location.longitude.toFixed(7)}
                  </strong>
                </p>

                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Last received:{" "}
                  <time
                    dateTime={new Date(
                      location.receivedAt
                    ).toISOString()}
                  >
                    {new Date(
                      location.receivedAt
                    ).toLocaleTimeString("en-GB", {
                      timeZone: "Asia/Kathmandu",
                    })}
                    {" "}(Nepal time)
                  </time>
                </p>
              </div>

              {/* Stale Location Warning */}
              {(stale ||
                connection.status !== "connected") && (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Showing the last received location.
                  The technician may have moved
                  since this update.
                </p>
              )}

              {/* LIVE MAP - NO FULL RELOAD */}
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-emerald-900">
                <TechnicianMap
                  latitude={location.latitude}
                  longitude={location.longitude}
                />
              </div>

              {/* Google Maps External Link */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
              >
                Open Latest Location in Google Maps ↗
              </a>
            </>
          ) : (
            // No Location Yet
            <div className="flex min-h-72 items-center justify-center rounded-xl bg-slate-100 p-8 text-center text-slate-600 dark:bg-emerald-950 dark:text-slate-300">
              <div className="space-y-3">
                <p className="text-lg font-semibold">
                  Waiting for technician location
                </p>

                <p className="text-sm">
                  Keep this page open. The map will
                  appear automatically when the first
                  GPS location is received.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
