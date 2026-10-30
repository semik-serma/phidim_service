"use client";

import { useEffect, useState } from "react";
import styles from "./UserDashboardNewUI.module.css";

export default function BookingLiveLocationButton({ bookingId }) {
  const [attempt, setAttempt] = useState(0);
  const [connection, setConnection] = useState({ status: "idle", error: "" });

  useEffect(() => {
    if (!attempt) return;
    let active = true;
    let socket;
    setConnection({ status: "connecting", error: "" });
    try {
      const cookie = document.cookie.split(";").map(part => part.trim())
        .find(part => part.startsWith("phidim_access_token="));
      const token = cookie ? decodeURIComponent(cookie.slice("phidim_access_token=".length)) : "";
      if (!token) throw new Error("Please sign in again to view live location.");
      const url = new URL(process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000");
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      url.pathname = `/ws/share-location/${bookingId}/`;
      url.search = new URLSearchParams({ token }).toString();
      url.hash = "";
      socket = new WebSocket(url.href);
      socket.onopen = () => {
        if (!active) return;
        setConnection({ status: "connected", error: "" });
      };
      socket.onmessage = event => {
        if (!active) return;
        let message;
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }
        switch (message?.type) {
          case "connection":
            console.log(`Live location for booking #${bookingId}:`, message.message);
            break;
          case "location_update":
            if (message.booking_id !== bookingId
              || !Number.isFinite(message.latitude) || Math.abs(message.latitude) > 90
              || !Number.isFinite(message.longitude) || Math.abs(message.longitude) > 180) return;
            console.log(`Live location for booking #${bookingId}:`, {
              latitude: message.latitude,
              longitude: message.longitude,
            });
            break;
          case "error":
            if (typeof message.message === "string") {
              console.error(`Live location for booking #${bookingId}:`, message.message);
              setConnection(previous => ({ ...previous, error: message.message }));
            }
            break;
          default:
            break;
        }
      };
      socket.onerror = () => {
        if (active) setConnection({ status: "error", error: "Unable to connect to live location. Please retry." });
      };
      socket.onclose = () => {
        if (active) setConnection(previous => previous.status === "error" ? previous : { status: "closed", error: "" });
      };
    } catch (error) {
      setConnection({ status: "error", error: error.message || "Unable to connect to live location. Please retry." });
    }
    return () => {
      active = false;
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close();
      }
    };
  }, [bookingId, attempt]);

  const connected = connection.status === "connected";
  const connecting = connection.status === "connecting";
  return (
    <div className={styles.liveLocation}>
      <button type="button" className={styles.retryButton}
        disabled={connecting || connected}
        onClick={() => setAttempt(value => value + 1)}>
        {connecting ? "Connecting…" : connected ? "Live location connected" : "Show live location"}
      </button>
      {connection.error && <p role="alert">{connection.error}</p>}
    </div>
  );
}
