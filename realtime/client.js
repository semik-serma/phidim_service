"use client";

import { io } from "socket.io-client";

let socket = null;

const CPANEL_LIVE_SOCKET_URL = "https://service.phidimservice.com.np";
const DEFAULT_SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  CPANEL_LIVE_SOCKET_URL;

export function getSocket() {
  if (typeof window === "undefined") return null;

  if (!socket) {
    socket = io(DEFAULT_SOCKET_URL, {
      autoConnect: true,
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    // Auto-failover to live cPanel realtime backend if local socket fails
    socket.on("connect_error", (err) => {
      if (DEFAULT_SOCKET_URL !== CPANEL_LIVE_SOCKET_URL && !socket._failedOver) {
        console.warn(`[Socket Failover] Local socket failed, switching to cPanel live: ${CPANEL_LIVE_SOCKET_URL}`);
        socket._failedOver = true;
        try {
          socket.disconnect();
          socket = io(CPANEL_LIVE_SOCKET_URL, {
            autoConnect: true,
            withCredentials: true,
            transports: ["websocket", "polling"],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            timeout: 10000,
          });
        } catch (e) {
          console.error("[Socket Failover Error]", e);
        }
      }
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function subscribeToEvent(event, callback) {
  const s = getSocket();
  if (!s) return () => {};
  s.on(event, callback);
  return () => s.off(event, callback);
}

const socketInstance = {
  emit: (event, ...args) => {
    const s = getSocket();
    if (s) s.emit(event, ...args);
  },
  on: (event, callback) => {
    const s = getSocket();
    if (s) s.on(event, callback);
  },
  off: (event, callback) => {
    const s = getSocket();
    if (s) s.off(event, callback);
  },
  disconnect: () => {
    disconnectSocket();
  },
  get connected() {
    return socket ? socket.connected : false;
  },
};

export default socketInstance;
