"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Paperclip,
  FileText,
  Download,
  X,
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
import { djangoBrowserUrl } from "@/lib/djangoClient";

const IMAGE_FILE_EXTENSIONS = new Set(["avif", "bmp", "gif", "jfif", "jpeg", "jpg", "png", "svg", "webp"]);

function getChatAttachment(text) {
  if (typeof text !== "string" || !text.trim()) return null;
  try {
    const url = new URL(text.trim(), typeof window === "undefined" ? "http://localhost" : window.location.href);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const filename = decodeURIComponent(url.pathname.split("/").pop() || "").trim();
    const extension = filename.includes(".") ? filename.split(".").pop().toLowerCase() : "";
    if (!extension) return null;
    return { href: url.href, filename: filename || "Attachment", isImage: IMAGE_FILE_EXTENSIONS.has(extension) };
  } catch {
    return null;
  }
}

function ChatAttachment({ attachment }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [href, setHref] = useState(attachment.href);
  const showImage = attachment.isImage && !imageFailed;

  useEffect(() => {
    setHref(djangoBrowserUrl(attachment.href));
  }, [attachment.href]);

  if (showImage) {
    return (
      <div className="chat-attachment-image-wrap">
        <img
          src={href}
          alt={attachment.filename}
          onError={() => setImageFailed(true)}
          className="chat-attachment-image"
        />
        <a href={href} download={attachment.filename} className="chat-attachment-download" aria-label={`Download ${attachment.filename}`} title={`Download ${attachment.filename}`}>
          <Download size={16} aria-hidden="true" />
        </a>
      </div>
    );
  }

  return (
    <a href={href} download={attachment.filename} className="chat-attachment-file" aria-label={`Download ${attachment.filename}`}>
      <FileText size={22} aria-hidden="true" className="shrink-0 text-emerald-600 dark:text-emerald-400" />
      <span className="min-w-0 flex-1 truncate">{attachment.filename}</span>
      <Download size={17} aria-hidden="true" className="shrink-0 text-slate-500 dark:text-slate-400" />
    </a>
  );
}

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

function formatFileSize(size) {
  if (!Number.isFinite(size) || size < 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function BookingChatModal({ booking, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("idle"); // "idle" | "connecting" | "connected" | "disconnected" | "error"
  const [statusMessage, setStatusMessage] = useState("");
  const [retryCounter, setRetryCounter] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadInfo, setUploadInfo] = useState(null);

  const [remoteTyping, setRemoteTyping] = useState(false);
  const typingTimer = useRef(null);
  const remoteTypingTimer = useRef(null);
  const lastTypingSent = useRef(0);
  const localTyping = useRef(false);
  const socketRef = useRef(null);
  const pendingFileUrlRef = useRef("");
  const pendingFileMessageIdRef = useRef("");

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
  const fileInputRef = useRef(null);

  useEffect(() => {
    const previewUrl = uploadInfo?.previewUrl;
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [uploadInfo?.previewUrl]);

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

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
    setUploadInfo({ file, name: file.name, type: file.type, size: file.size, previewUrl, phase: "uploading", progress: 0, error: "" });
    setStatusMessage("");

    if (!booking?.chat_group) {
      setUploadInfo((current) => ({ ...current, phase: "error", error: "This booking is missing its chat group." }));
      setStatusMessage("This booking is missing its chat group. The file was not uploaded.");
      return;
    }
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      setUploadInfo((current) => ({ ...current, phase: "error", error: "Reconnect to chat before uploading." }));
      setStatusMessage("Chat is disconnected. Reconnect before uploading a file.");
      return;
    }

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("chat_group", String(booking.chat_group));

      const result = await new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("POST", "/api/django/attachments/upload/");
        request.setRequestHeader("Authorization", `Bearer ${getAccessToken()}`);
        request.upload.onprogress = (progressEvent) => {
          if (!progressEvent.lengthComputable) return;
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadInfo((current) => current ? { ...current, progress } : current);
        };
        request.onload = () => {
          let payload = null;
          try { payload = JSON.parse(request.responseText); } catch {}
          if (request.status < 200 || request.status >= 300) {
            reject(new Error(payload?.message || payload?.detail || "File upload failed. Please try again."));
            return;
          }
          resolve(payload);
        };
        request.onerror = () => reject(new Error("Could not reach the file upload service. Check your connection and retry."));
        request.onabort = () => reject(new Error("File upload was cancelled."));
        request.send(formData);
      });
      if (result?.success !== true || typeof result?.data?.file_url !== "string" || !result.data.file_url) {
        throw new Error(result?.message || result?.detail || "File upload failed. Please try again.");
      }

      setUploadInfo((current) => current ? {
        ...current,
        fileUrl: result.data.file_url,
        phase: "ready",
        progress: 100,
      } : current);
    } catch (err) {
      console.error("Failed to upload chat file:", err);
      setUploadInfo((current) => current ? { ...current, phase: "error", error: err?.message || "File upload failed." } : current);
      setStatusMessage(err?.message || "File upload failed. Please try again.");
    } finally {
      setUploadingFile(false);
    }
  };

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
            if (pendingFileMessageIdRef.current) {
              const failedId = pendingFileMessageIdRef.current;
              pendingFileMessageIdRef.current = "";
              pendingFileUrlRef.current = "";
              setMessages((previous) => previous.filter((message) => message.id !== failedId));
              setUploadInfo((current) => current ? { ...current, phase: "error", error: eventData.message || "The chat server rejected the file message." } : current);
            }
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

          if (pendingFileUrlRef.current && eventData.data.message === pendingFileUrlRef.current) {
            pendingFileUrlRef.current = "";
            const pendingId = pendingFileMessageIdRef.current;
            pendingFileMessageIdRef.current = "";
            setUploadInfo(null);
            setMessages((previous) => {
              if (previous.some((message) => String(message.id) === String(newMsg.id))) return previous;
              const pendingIndex = previous.findIndex((message) => message.id === pendingId);
              if (pendingIndex < 0) return [...previous, newMsg];
              return previous.map((message, index) => index === pendingIndex ? newMsg : message);
            });
          } else {
            setMessages((prev) => {
              const isDuplicate = prev.some((m) => String(m.id) === String(newMsg.id));
              if (isDuplicate) return prev;
              return [...prev, newMsg];
            });
          }

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
        if (pendingFileMessageIdRef.current) {
          const pendingId = pendingFileMessageIdRef.current;
          pendingFileMessageIdRef.current = "";
          pendingFileUrlRef.current = "";
          setMessages((previous) => previous.filter((message) => message.id !== pendingId));
          setUploadInfo((current) => current ? { ...current, phase: "error", error: "Chat disconnected before confirming the file message." } : current);
        }
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
    const attachmentToSend = !textToSend && uploadInfo?.phase === "ready" ? uploadInfo : null;
    if (!text && !attachmentToSend) return;

    if (text && Array.from(text).length > 5000) {
      setStatusMessage("Message exceeds 5000 characters");
      return;
    }
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setStatusMessage("Chat is disconnected. Reconnect before sending.");
      return;
    }
    try {
      stopTyping();
      if (text) socketRef.current.send(JSON.stringify({ type: "chat.message", message: text }));
      if (attachmentToSend?.fileUrl) {
        const fileUrl = attachmentToSend.fileUrl;
        const pendingId = `pending-file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        pendingFileUrlRef.current = fileUrl;
        pendingFileMessageIdRef.current = pendingId;
        setMessages((previous) => [...previous, {
          id: pendingId,
          text: fileUrl,
          sender: myName,
          sender_id: myId,
          sender_role: user?.role,
          timestamp: new Date().toISOString(),
          isMe: true,
          pending: true,
        }]);
        socketRef.current.send(JSON.stringify({ type: "chat.message", message: fileUrl }));
        setUploadInfo((current) => current?.fileUrl === fileUrl ? { ...current, phase: "sending" } : current);
      }
      setStatusMessage("");
    } catch (err) {
      console.error("Failed to send WebSocket message:", err);
      if (pendingFileMessageIdRef.current) {
        const failedId = pendingFileMessageIdRef.current;
        pendingFileMessageIdRef.current = "";
        pendingFileUrlRef.current = "";
        setMessages((previous) => previous.filter((message) => message.id !== failedId));
        setUploadInfo((current) => current ? { ...current, phase: "ready" } : current);
      }
      setStatusMessage("Unable to send message. Please try again.");
      return;
    }

    // Display the persisted message when the server broadcasts it back.
    if (text) setInputText("");
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
      <div className="chat-workspace mx-auto w-full max-w-5xl bg-white dark:bg-[#071912] border border-slate-200 dark:border-emerald-900/50 rounded-3xl shadow-xl shadow-slate-200/40 flex flex-col h-[calc(100dvh-112px)] min-h-[420px] overflow-hidden">
        {/* Header */}
        <header className="chat-header px-5 py-4 border-b border-slate-100 dark:border-emerald-900/30 bg-slate-50/80 dark:bg-[#040e0b]/80 flex items-center justify-between gap-3">
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
          aria-label="Booking conversation messages"
          className="chat-stream flex-1 overflow-y-auto bg-slate-50/40 dark:bg-[#030b08]/50"
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

          {messages.map((msg, index) => {
            const isMe = msg.isMe;
            const name = isMe ? myName : msg.sender || counterpartName;
            const date = new Date(msg.timestamp);
            const previous = index ? new Date(messages[index - 1].timestamp) : null;
            const showDate = Number.isFinite(date.getTime()) && (!previous || date.toDateString() !== previous.toDateString());
            const attachment = getChatAttachment(msg.text);
            return (
              <div key={msg.id}>
                {showDate && <div className="chat-date">{date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</div>}
                <article className={`chat-entry ${isMe ? "chat-entry-sent" : "chat-entry-received"}`}>
                  <div className="chat-entry-avatar" aria-hidden="true"><span className="chat-initial">{name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase()}</span></div>
                  <div className="chat-entry-body">
                    <div className="chat-entry-meta">
                      <strong>{isMe ? "You" : name}</strong>
                      {isMe && <span className="chat-you">{isTechnician ? "Technician" : "Customer"}</span>}
                      <time dateTime={Number.isFinite(date.getTime()) ? date.toISOString() : undefined}>{formatTime(msg.timestamp)}</time>
                      {msg.pending && <span className="text-[10px] text-slate-400">Sending…</span>}
                    </div>
                    {attachment ? <ChatAttachment attachment={attachment} /> : <p className="chat-entry-text">{msg.text}</p>}
                  </div>
                </article>
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
        <div className="chat-quick-replies px-4 py-2 bg-slate-50 dark:bg-[#040e0b] border-t border-slate-100 dark:border-emerald-900/20 overflow-x-auto flex items-center gap-2 scrollbar-none">
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
        <footer className="chat-composer p-3 sm:p-4 bg-white dark:bg-[#061812] border-t border-slate-100 dark:border-emerald-900/30">
          {uploadInfo && (
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-emerald-900/40 dark:bg-[#040e0b]" aria-live="polite">
              {uploadInfo.previewUrl ? (
                <img src={uploadInfo.previewUrl} alt="" aria-hidden="true" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
              ) : (
                <Paperclip size={20} aria-hidden="true" className="mx-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{uploadInfo.name}</p>
                <p className={`text-xs ${uploadInfo.phase === "error" ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"}`}>
                  {uploadInfo.phase === "uploading" && `Uploading${uploadInfo.progress > 0 ? `… ${uploadInfo.progress}%` : "…"}`}
                  {uploadInfo.phase === "ready" && "Ready to send"}
                  {uploadInfo.phase === "sending" && "Sending to chat…"}
                  {uploadInfo.phase === "error" && uploadInfo.error}
                  {uploadInfo.phase !== "error" && uploadInfo.phase !== "uploading" && ` · ${formatFileSize(uploadInfo.size)}`}
                </p>
                {uploadInfo.phase === "uploading" && (
                  <progress className="mt-1 block h-1.5 w-full accent-emerald-600" max="100" value={uploadInfo.progress} aria-label={`Uploading ${uploadInfo.name}`} />
                )}
              </div>
              {!uploadingFile && uploadInfo.phase !== "sending" && (
                <button type="button" onClick={() => setUploadInfo(null)} aria-label="Remove attachment" title="Remove attachment" className="rounded-lg p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-emerald-950">
                  <X size={16} />
                </button>
              )}
            </div>
          )}
          <div className="chat-composer-field">
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              aria-label="Choose a file to upload"
              onChange={handleFileUpload}
              disabled={uploadingFile || uploadInfo?.phase === "ready" || uploadInfo?.phase === "sending" || connectionStatus !== "connected"}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label={uploadingFile || uploadInfo?.phase === "sending" ? "Sending file" : uploadInfo?.phase === "ready" ? "Remove the current attachment before adding another" : "Upload file"}
              title={uploadingFile ? "Uploading file..." : uploadInfo?.phase === "sending" ? "Sending file..." : uploadInfo?.phase === "ready" ? "Remove the current attachment before adding another" : "Upload file"}
              disabled={uploadingFile || uploadInfo?.phase === "ready" || uploadInfo?.phase === "sending" || connectionStatus !== "connected"}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-900/40 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-950 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Paperclip size={17} className={uploadingFile ? "animate-pulse" : ""} />
            </button>
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
              disabled={(!inputText.trim() && uploadInfo?.phase !== "ready") || connectionStatus !== "connected"}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed shadow-md shadow-emerald-600/20"
            >
              <Send size={15} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
          <div className="chat-composer-hint">
            <span>Press Enter to send</span>
            <span>Booking #{bookingId}</span>
          </div>
        </footer>
      </div>
    </main>
  );
}

export default BookingChatModal;
