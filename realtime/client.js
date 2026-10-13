"use client";

import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  if (typeof window === "undefined") return null;

  if (!socket) {
    socket = io({
      path: "/api/realtime",
      autoConnect: true,
      withCredentials: true,
      // HTTP polling works through the Next.js rewrite and the port 3000 tunnel.
      transports: ["polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
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
