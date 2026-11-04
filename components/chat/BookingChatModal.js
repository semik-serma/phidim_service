"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare,
  Send,
  X,
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

  const socketRef = useRef(null);
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
  }, [messages, connectionStatus, scrollToBottom]);

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
    const base = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000";
    const url = new URL(base);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = `/ws/chat/${bookingId}/`;

    const token = getAccessToken();
    if (token) {
      url.search = new URLSearchParams({ token }).toString();
    }
    url.hash = "";
    return url.toString();
  }, [bookingId, getAccessToken]);

  // Connect WebSocket
  useEffect(() => {
    if (!bookingId) return;

    let active = true;
    setConnectionStatus("connecting");
    setStatusMessage(`Connecting to ws/chat/${bookingId}/...`);

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
            playMessageChime();
          }
        } catch (err) {
          console.error("Failed to parse websocket message:", err);
        }
      };

      socket.onerror = (err) => {
        if (!active) return;
        console.error("WebSocket chat error:", err);
        setConnectionStatus("error");
        setStatusMessage("Connection error. Ensure the backend WebSocket server is running.");
      };

      socket.onclose = () => {
        if (!active) return;
        setConnectionStatus("disconnected");
        setStatusMessage("WebSocket disconnected. Click Reconnect to try again.");
      };
    } catch (err) {
      if (active) {
        setConnectionStatus("error");
        setStatusMessage(err?.message || "Failed to initialize WebSocket.");
      }
    }

    return () => {
      active = false;
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
    if (e.key === "Enter" && !e.shiftKey) {
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-chat-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#071912] border border-slate-200 dark:border-emerald-900/50 rounded-3xl shadow-2xl flex flex-col h-[85dvh] max-h-[720px] overflow-hidden">
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
                  Booking #{bookingId} Chat
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {booking?.status_display || booking?.status || "Active"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Chatting with <span className="font-semibold text-slate-700 dark:text-slate-200">{counterpartName}</span> ({counterpartRole})
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

            <button
              type="button"
              onClick={onClose}
              aria-label="Close chat"
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-emerald-950 transition-colors"
            >
              <X size={19} />
            </button>
          </div>
        </header>

        {/* Problem details bar */}
        {booking?.problem_details && (
          <div className="px-5 py-2 bg-emerald-50/60 dark:bg-[#061812] border-b border-emerald-100/60 dark:border-emerald-900/30 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
            <div className="truncate pr-2">
              <span className="font-bold">Service / Problem:</span> {booking.problem_details}
            </div>
            <span className="text-[10px] font-mono opacity-80 shrink-0">ws/chat/{bookingId}/</span>
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
              <p className="text-xs font-mono">ws/chat/{bookingId}/</p>
            </div>
          )}

          {messages.length === 0 && connectionStatus === "connected" && (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <MessageSquare size={24} />
              </div>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  Direct WebSocket Connected
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
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${counterpartName}...`}
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-[#040e0b] border border-slate-200 dark:border-emerald-900/40 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed shadow-md shadow-emerald-600/20"
            >
              <Send size={15} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Press Enter to send</span>
            <span className="font-mono">Route: ws/chat/{bookingId}/</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default BookingChatModal;
