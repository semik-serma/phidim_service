"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare,
  Send,
  ArrowLeft,
  RefreshCw,
  Check,
  CheckCheck,
  User,
  Wrench,
  Clock,
  AlertCircle,
  Wifi,
  WifiOff,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { playMessageChime } from "@/lib/chatStore";

function personDisplayName(person, fallback) {
  if (!person) return fallback;
  if (typeof person === "string") return person;
  const name = [person.first_name, person.last_name]
    .filter((v) => typeof v === "string" && v.trim())
    .join(" ")
    .trim();
  return name || person.name || person.email || fallback;
}

function formatTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (!Number.isFinite(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(d);
}

export function BookingChatModal({ booking, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("idle"); // "idle" | "connecting" | "connected" | "disconnected" | "error"
  const [statusMessage, setStatusMessage] = useState("");
  const [retryCounter, setRetryCounter] = useState(0);

  const [remoteTyping, setRemoteTyping] = useState(false);
  const typingTimer = useRef(null);
  const remoteTypingTimer = useRef(null);
  const lastTypingSent = useRef(0);
  const localTyping = useRef(false);
  const socketRef = useRef(null);

  const stopTyping = useCallback(() => {
    clearTimeout(typingTimer.current);
    if (localTyping.current && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "typing.stop" }));
    }
    localTyping.current = false;
  }, []);

  const handleInputChange = (event) => {
    const value = event.target.value;
    setInputText(value);
    if (!value.trim()) { stopTyping(); return; }
    const socket = socketRef.current;
    if (socket?.readyState !== WebSocket.OPEN) return;
    // Refresh during sustained typing, without sending on every keystroke.
    if (!localTyping.current || Date.now() - lastTypingSent.current >= 2000) {
      socket.send(JSON.stringify({ type: "typing.start" }));
      localTyping.current = true;
      lastTypingSent.current = Date.now();
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, 1500);
  };
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const bookingId = booking?.id;
  const isTechnician = user?.role === "TECHNICIAN";
  const myName = user?.name || personDisplayName(user, isTechnician ? "Technician" : "Customer");
  const myId = user?.id || (isTechnician ? "tech_me" : "user_me");

  const counterpartName = isTechnician
    ? personDisplayName(booking?.customer, "Customer")
    : personDisplayName(booking?.technician, "Technician");

  const counterpartRole = isTechnician ? "Customer" : "Technician";

  // Load cached messages from localStorage
  useEffect(() => {
    if (!bookingId || typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(`phidim_booking_chat_${bookingId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      }
    } catch {
      // ignore storage parsing error
    }
  }, [bookingId]);

  // Persist messages to localStorage
  useEffect(() => {
    if (!bookingId || typeof window === "undefined" || messages.length === 0) return;
    try {
      localStorage.setItem(`phidim_booking_chat_${bookingId}`, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [bookingId, messages]);

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, remoteTyping, connectionStatus, scrollToBottom]);

  // Retrieve authentication access token
  const getAccessToken = useCallback(() => {
    let token = "";
    if (typeof document !== "undefined") {
      const parts = document.cookie.split(";").map((p) => p.trim());
      const accessCookie = parts.find((p) => p.startsWith("phidim_access_token="));
      const jwtCookie = parts.find((p) => p.startsWith("phidim_jwt_token="));
      if (accessCookie) {
        token = decodeURIComponent(accessCookie.slice("phidim_access_token=".length));
      } else if (jwtCookie) {
        token = decodeURIComponent(jwtCookie.slice("phidim_jwt_token=".length));
      }
    }
    if (!token && typeof window !== "undefined") {
      token = localStorage.getItem("phidim_access_token") || localStorage.getItem("token") || "";
    }
    return token;
  }, []);

  // Build WebSocket URL according to route: ws/chat/<int:booking_id>/
  const buildWebSocketUrl = useCallback(() => {
    const base = process.env.NEXT_PUBLIC_DJANGO_WS_URL || process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000";
    const url = new URL(base);
    if (!["http:", "https:", "ws:", "wss:"].includes(url.protocol)) {
      throw new Error("Chat server address is invalid.");
    }
    url.protocol = ["https:", "wss:"].includes(url.protocol) ? "wss:" : "ws:";
    if (typeof window !== "undefined" && window.location?.protocol === "https:" && url.protocol !== "wss:") {
      throw new Error("Chat requires a secure connection. Configure NEXT_PUBLIC_DJANGO_WS_URL with your backend's wss:// address and restart Next.js.");
    }
    url.pathname = `/ws/chat/${bookingId}/`;

    const token = getAccessToken();
    if (!token) throw new Error("Your chat session is missing. Please sign in again.");
    url.search = new URLSearchParams({ token }).toString();
    url.hash = "";
    return url.toString();
  }, [bookingId, getAccessToken]);

  // Connect WebSocket
  useEffect(() => {
    if (!bookingId) return;

    let active = true;
    setConnectionStatus("connecting");
    setStatusMessage("Connecting to your conversation...");
    setRemoteTyping(false);

    let socket;
    try {
      const wsUrl = buildWebSocketUrl();
      socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (!active) return;
        setConnectionStatus("connected");
        setStatusMessage("");
      };

      socket.onmessage = (event) => {
        if (!active) return;
        try {
          const eventData = JSON.parse(event.data);
          if (["chat.typing", "chat_typing", "typing.start", "typing.stop"].includes(eventData.type)) {
            const typing = eventData.data || eventData;
            if (typing.user_id == null || String(typing.user_id) === String(myId)) return;
            const isTyping = eventData.type === "typing.start" ||
              (!["typing.start", "typing.stop"].includes(eventData.type) && typing.is_typing === true);
            clearTimeout(remoteTypingTimer.current);
            setRemoteTyping(isTyping);
            if (isTyping) {
              remoteTypingTimer.current = setTimeout(() => setRemoteTyping(false), 5000);
            }
            return;
          }
          if (eventData.type === "connection") return;
          if (eventData.type === "error") {
            setStatusMessage(eventData.message || "Unable to send message.");
            return;
          }

          const toMessage = (data) => {
            const isMe = String(data.user_id) === String(myId);
            return {
              id: data.id,
              text: data.message,
              sender: isMe ? myName : counterpartName,
              sender_id: data.user_id,
              sender_role: isMe ? user?.role : counterpartRole.toUpperCase(),
              timestamp: data.created_at,
              isMe,
            };
          };
          if (eventData.type === "chat.history" && Array.isArray(eventData.messages)) {
            setMessages(eventData.messages.map(toMessage));
            return;
          }
          if (eventData.type !== "chat.message" || !eventData.data) return;

          const newMsg = toMessage(eventData.data);

          setMessages((prev) => {
            const isDuplicate = prev.some((m) => String(m.id) === String(newMsg.id));
            if (isDuplicate) return prev;
            return [...prev, newMsg];
          });

          setStatusMessage("");
          if (!newMsg.isMe) {
            clearTimeout(remoteTypingTimer.current);
            setRemoteTyping(false);
            playMessageChime();
          }
        } catch (err) {
          console.error("Failed to parse websocket message:", err);
        }
      };

      socket.onerror = () => {
        if (!active) return;
        // Browser error events do not expose the handshake response. The close
        // handler supplies the available code; never log the token-bearing URL.
        setConnectionStatus("error");
        setStatusMessage("Chat connection failed. Waiting for connection details…");
      };

      socket.onclose = (event) => {
        if (!active) return;
        clearTimeout(remoteTypingTimer.current);
        setRemoteTyping(false);
        localTyping.current = false;
        clearTimeout(typingTimer.current);
        const code = event?.code;
        setConnectionStatus("disconnected");
        if (code === 4401) {
          setStatusMessage("Chat authentication was rejected. Please sign in again and reopen this booking.");
        } else if (code === 4403) {
          setStatusMessage("Chat access was denied. This booking may no longer be confirmed or assigned to you.");
        } else if (code === 1008) {
          setStatusMessage("The chat server rejected the connection under its access policy (1008). Check your session and booking access.");
        } else if (code === 1011) {
          setStatusMessage("The chat server encountered an error (1011). Please retry. If it continues, check the Django server logs.");
        } else if (code === 1006) {
          setStatusMessage("Chat could not connect or the connection was interrupted (1006). Check that the chat server is reachable and your session is valid, then reconnect.");
        } else {
          setStatusMessage(`Chat disconnected${code ? ` (${code})` : ""}. Reconnect to continue your conversation.`);
        }
      };
    } catch (err) {
      if (active) {
        setConnectionStatus("error");
        setStatusMessage(err?.message || "Failed to initialize WebSocket.");
      }
    }

    return () => {
      active = false;
      stopTyping();
      clearTimeout(remoteTypingTimer.current);
      if (socket) {
        try {
          socket.close();
        } catch {}
      }
      socketRef.current = null;
    };
  }, [bookingId, retryCounter, buildWebSocketUrl, myId, myName, counterpartName, counterpartRole, user?.role]);

  // Send message
  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    if (Array.from(text).length > 5000) {
      setStatusMessage("Message exceeds 5000 characters");
      return;
    }
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setStatusMessage("Chat is disconnected. Reconnect before sending.");
      return;
    }
    try {
      stopTyping();
      socketRef.current.send(JSON.stringify({ type: "chat.message", message: text }));
      setStatusMessage("");
    } catch (err) {
      console.error("Failed to send WebSocket message:", err);
      setStatusMessage("Unable to send message. Please try again.");
      return;
    }

    // Display the persisted message when the server broadcasts it back.
    setInputText("");
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent?.isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const reconnect = () => {
    setRetryCounter((c) => c + 1);
  };

  const quickReplies = isTechnician
    ? [
        "Hello! I am assigned to your booking.",
        "I am on my way to your location.",
        "I have arrived at your doorstep.",
        "Could you please share any specific landmarks?",
      ]
    : [
        "Hello! When are you expected to arrive?",
        "I am waiting at the location.",
        "Please call me once you reach.",
        "Thank you for the quick update!",
      ];

  return (
    <main className="min-h-dvh bg-slate-100 dark:bg-[#030b08] px-3 py-4 sm:px-8 sm:py-8">
      <div className="mx-auto mb-5 flex max-w-5xl items-center justify-between">
        <button type="button" onClick={onClose} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 dark:text-slate-300"><ArrowLeft size={18} /> Back to dashboard</button>
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Booking messages</span>
      </div>
      <div className="mx-auto w-full max-w-5xl bg-white dark:bg-[#071912] border border-slate-200 dark:border-emerald-900/50 rounded-3xl shadow-xl shadow-slate-200/40 flex flex-col h-[calc(100dvh-112px)] min-h-[420px] overflow-hidden">
        {/* Header */}
        <header className="px-5 py-4 border-b border-slate-100 dark:border-emerald-900/30 bg-slate-50/80 dark:bg-[#040e0b]/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-sm">
              {isTechnician ? <User size={22} /> : <Wrench size={22} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id="booking-chat-modal-title"
                  className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate"
                >
                  {counterpartName}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {booking?.status_display || booking?.status || "Active"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Booking #{bookingId} · {counterpartRole}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                connectionStatus === "connected"
                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                  : connectionStatus === "connecting"
                  ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                  : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-emerald-500 animate-pulse"
                    : connectionStatus === "connecting"
                    ? "bg-amber-500 animate-ping"
                    : "bg-rose-500"
                }`}
              />
              <span className="capitalize">{connectionStatus}</span>
            </div>

            {connectionStatus !== "connected" && (
              <button
                type="button"
                onClick={reconnect}
                title="Reconnect WebSocket"
                className="p-1.5 rounded-xl border border-slate-200 dark:border-emerald-900/40 bg-white dark:bg-[#061812] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-950"
              >
                <RefreshCw size={15} className={connectionStatus === "connecting" ? "animate-spin" : ""} />
              </button>
            )}


          </div>
        </header>

        {/* Problem details bar */}
        {booking?.problem_details && (
          <div className="px-5 py-2 bg-emerald-50/60 dark:bg-[#061812] border-b border-emerald-100/60 dark:border-emerald-900/30 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
            <div className="truncate pr-2">
              <span className="font-bold">Service / Problem:</span> {booking.problem_details}
            </div>
          </div>
        )}

        {/* Message Thread */}
        <div
          role="log"
          aria-live="polite"
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/40 dark:bg-[#030b08]/50"
        >
          {statusMessage && connectionStatus !== "connecting" && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{statusMessage}</span>
              </div>
              <button
                type="button"
                onClick={reconnect}
                className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {connectionStatus === "connecting" && messages.length === 0 && (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm space-y-2">
              <RefreshCw size={24} className="mx-auto animate-spin text-emerald-500" />
              <p>Connecting to chat server...</p>

            </div>
          )}

          {messages.length === 0 && connectionStatus === "connected" && (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <MessageSquare size={24} />
              </div>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  Your conversation starts here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Say hello to {counterpartName} to start discussing this booking.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.isMe;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400 dark:text-slate-500">
                  <span className="font-bold text-slate-600 dark:text-slate-300">
                    {isMe ? "You" : msg.sender || counterpartName}
                  </span>
                  <span>•</span>
                  <span>{formatTime(msg.timestamp)}</span>
                </div>
                <div
                  className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm break-words whitespace-pre-wrap leading-relaxed shadow-sm ${
                    isMe
                      ? "bg-emerald-600 text-white rounded-br-xs"
                      : "bg-white dark:bg-[#0c241b] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-emerald-900/40 rounded-bl-xs"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
          {remoteTyping && (
            <div role="status" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-3 dark:border-emerald-900 dark:bg-emerald-950" aria-hidden="true">
                {[0, 1, 2].map(i => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 motion-reduce:animate-none" style={{ animationDelay: `${i * 150}ms` }} />)}
              </span>
              {counterpartName} is typing…
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Prompts */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-[#040e0b] border-t border-slate-100 dark:border-emerald-900/20 overflow-x-auto flex items-center gap-2 scrollbar-none">
          <Sparkles size={14} className="text-emerald-500 shrink-0" />
          {quickReplies.map((reply, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(reply)}
              className="shrink-0 px-2.5 py-1 rounded-xl bg-white dark:bg-[#061812] border border-slate-200 dark:border-emerald-900/40 text-xs text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-colors cursor-pointer"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <footer className="p-3 sm:p-4 bg-white dark:bg-[#061812] border-t border-slate-100 dark:border-emerald-900/30">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onBlur={stopTyping}
              aria-label={`Message ${counterpartName}`}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${counterpartName}...`}
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-[#040e0b] border border-slate-200 dark:border-emerald-900/40 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              aria-label="Send message"
              disabled={!inputText.trim() || connectionStatus !== "connected"}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed shadow-md shadow-emerald-600/20"
            >
              <Send size={15} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Press Enter to send</span>
            <span>Booking #{bookingId}</span>
          </div>
        </footer>
      </div>
    </main>
  );
}

export default BookingChatModal;
