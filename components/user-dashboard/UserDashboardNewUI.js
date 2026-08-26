"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  BookOpen,
  LayoutGrid,
  Search,
  Bookmark,
  MessageSquare,
  Settings,
  ChevronDown,
  Plus,
  Mic,
  Send,
  Phone,
  Video,
  Check,
  CheckCheck,
  X,
  Sparkles,
  Home,
  LogOut,
  User,
  ShieldCheck,
  Wrench,
  Zap,
  Droplet,
  Wifi,
  Wind,
  Tv,
  Monitor,
  Camera,
  MapPin,
  Clock,
  ExternalLink,
  Info,
  CalendarCheck,
  MoreVertical,
  Paperclip,
  Smile,
  CheckCircle2,
  Trash2,
  Users,
  UserCheck,
  UserPlus,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { useCall } from "@/components/calls/CallProvider";
import {
  getConversationMessages,
  saveMessageToConversation,
  clearConversationMessages,
  subscribeChatStore,
  playMessageChime,
} from "@/lib/chatStore.js";
import { getStoredRealUsers, DEFAULT_REAL_USERS, subscribeUserRegistry } from "@/lib/userRegistry.js";
import { fetchWeather } from "@/services/weatherService.js";
import { SERVICE_CATEGORIES, SERVICES } from "@/data/services.js";
import { AccountSettings } from "@/components/AccountSettings";

const CATEGORY_ICON_MAP = {
  all: Wrench,
  electrical: Zap,
  cctv: Camera,
  fiber: Wifi,
  "ac-cooling": Wind,
  "dth-tv": Tv,
  plumbing: Droplet,
  computer: Monitor,
};

// Category mapping helper to match technician specialties
const SPECIALTY_MAP = {
  "plumbing": ["plumb", "pipe", "sanitary", "water", "drain", "leak"],
  "electrical": ["electr", "wire", "inverter", "solar", "power", "switch"],
  "cctv": ["cctv", "camera", "security", "alarm", "surveillance", "nvr"],
  "fiber": ["fiber", "internet", "lan", "network", "router", "splice", "wifi"],
  "ac-cooling": ["ac", "cool", "refrigerat", "air condition", "compressor"],
  "dth-tv": ["dishhome", "dth", "tv", "dish", "antenna"],
  "computer": ["computer", "it", "laptop", "pc", "software"],
};

export default function UserDashboardNewUI() {
  const { user, logout } = useAuth();
  const { startCall } = useCall() || {};

  // Fallback current user
  const currentUser = user || {
    id: "usr-cust-semik",
    name: "Semik Serma",
    displayName: "Semik Serma",
    email: "semikserma@gmail.com",
    role: "USER",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  };

  // Clock & Weather State
  const [localTimeStr, setLocalTimeStr] = useState("3:00 AM");
  const [nepalTimeStr, setNepalTimeStr] = useState("3:00 AM");
  const [weatherInfo, setWeatherInfo] = useState("Today 3:00 AM Rain At Phidim");

  // Category selection state
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // User search & connected people state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL"); // "ALL" | "TECHNICIAN" | "USER" | "ADMIN" | "CONNECTED"
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inputText, setInputText] = useState("");
  const [chatVersion, setChatVersion] = useState(0);
  const [registryVersion, setRegistryVersion] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [connectedUserIds, setConnectedUserIds] = useState(new Set(["usr-tech-rajesh", "usr-cust-semik", "usr-tech-anita", "usr-tech-suman", "usr-admin-dhanraj"]));

  // Mobile sidebar toggle
  const [mobileContactsOpen, setMobileContactsOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Click Outside Refs for Dropdowns
  const categoryRef = useRef(null);
  const profileRef = useRef(null);
  const filterRef = useRef(null);
  const attachMenuRef = useRef(null);

  // Global click outside listener to auto-close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setIsCategoryMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilterDropdown(false);
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Live Clocks (Local and Nepal Time) & Weather
  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      const localStr = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
      setLocalTimeStr(localStr);

      const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
      const nepalOffset = 5.75 * 3600000;
      const nepalDate = new Date(utcTime + nepalOffset);
      const nptStr = nepalDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
      setNepalTimeStr(nptStr);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Phidim Weather
  useEffect(() => {
    let isMounted = true;
    const loadWeather = async () => {
      try {
        const data = await fetchWeather();
        if (isMounted && data) {
          const conditionLabel = data.condition?.label || (data.isRainingNow ? "Rain" : "Partly Cloudy");
          const temp = data.currentTemp ? `${data.currentTemp}°C` : "";
          const rainText = data.isRainingNow ? "Rain At Phidim" : `${conditionLabel} At Phidim ${temp}`.trim();
          setWeatherInfo(`Today ${nepalTimeStr} ${rainText}`);
        }
      } catch (e) {
        if (isMounted) {
          setWeatherInfo(`Today ${nepalTimeStr} Rain At Phidim`);
        }
      }
    };
    loadWeather();
    const wInterval = setInterval(loadWeather, 5 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(wInterval);
    };
  }, [nepalTimeStr]);

  // 2. Real-time Subscriptions
  useEffect(() => {
    const unsubChat = subscribeChatStore(() => {
      setChatVersion((v) => v + 1);
    });
    const unsubRegistry = subscribeUserRegistry(() => {
      setRegistryVersion((v) => v + 1);
    });
    return () => {
      unsubChat();
      unsubRegistry();
    };
  }, []);

  // 3. Construct Contacts & Connected People List
  const contacts = useMemo(() => {
    const localReal = getStoredRealUsers();
    const myEmail = (currentUser?.email || "").toLowerCase().trim();
    const map = new Map();

    const semikUser = {
      id: "usr-cust-semik",
      name: "Semik Serma",
      displayName: "Semik Serma",
      role: "USER",
      email: "semikserma@gmail.com",
      phone: "+977 9862772400",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      bio: "Connected community friend & customer in Phidim.",
      location: "Phidim-1, Panchthar",
      online: true,
      lastMessage: "Hey, Good Morning Semik Serma",
      category: "Customer Friend",
    };

    [semikUser, ...DEFAULT_REAL_USERS, ...localReal].forEach((u) => {
      if (u && (u.email || u.id)) {
        const key = (u.email || u.id).toLowerCase().trim();
        if (key && key !== myEmail) {
          // Determine category/specialty tag
          let cat = u.category || u.specialty || "";
          if (!cat) {
            const bioLower = (u.bio || "" + u.displayName || "").toLowerCase();
            if (bioLower.includes("cctv") || bioLower.includes("security")) cat = "CCTV & Security";
            else if (bioLower.includes("electric")) cat = "Electrical & Inverter";
            else if (bioLower.includes("plumb")) cat = "Plumbing & Sanitary";
            else if (bioLower.includes("fiber") || bioLower.includes("dth")) cat = "DishHome & Fiber";
            else if (u.role === "TECHNICIAN") cat = "General Technician";
            else cat = "Connected User";
          }

          map.set(key, {
            ...u,
            displayName: u.displayName || u.name || key.split("@")[0] || "User",
            role: u.role || "USER",
            online: u.online !== false,
            category: cat,
            lastMessage: u.lastMessage || (u.name === "Semik Serma" ? "Hey, Good Morning Semik Serma" : `Connected in ${u.location || "Phidim"}`),
          });
        }
      }
    });

    return Array.from(map.values());
  }, [currentUser?.email, registryVersion]);

  // Default select Semik Serma
  useEffect(() => {
    if (!selectedUser && contacts.length > 0) {
      const semik = contacts.find((c) => c.name?.toLowerCase().includes("semik")) || contacts[0];
      setSelectedUser(semik);
    }
  }, [contacts, selectedUser]);

  // Filtered Contacts based on Category Selection & Search
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const name = (c.displayName || c.name || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      const bio = (c.bio || "").toLowerCase();
      const category = (c.category || "").toLowerCase();
      const role = (c.role || "").toUpperCase();
      const q = searchQuery.toLowerCase().trim();

      // 1. Search Query Match
      const matchesSearch =
        !q ||
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        bio.includes(q) ||
        category.includes(q);

      // 2. Role Filter Match
      const matchesRole =
        roleFilter === "ALL" ||
        (roleFilter === "CONNECTED" && connectedUserIds.has(c.id)) ||
        (roleFilter === "TECHNICIAN" && role === "TECHNICIAN") ||
        (roleFilter === "USER" && (role === "USER" || role === "CUSTOMER")) ||
        (roleFilter === "ADMIN" && role === "ADMIN");

      // 3. Category Selection Match
      let matchesCategory = true;
      if (selectedCategory !== "All") {
        const catLower = selectedCategory.toLowerCase();
        const keywords = SPECIALTY_MAP[selectedCategory.toLowerCase()] || [catLower];
        matchesCategory =
          category.includes(catLower) ||
          keywords.some((k) => category.includes(k) || bio.includes(k) || name.includes(k));
      }

      return matchesSearch && matchesRole && matchesCategory;
    });
  }, [contacts, searchQuery, roleFilter, selectedCategory, connectedUserIds]);

  // 4. Current Conversation Messages
  const currentMessages = useMemo(() => {
    if (!selectedUser) return [];
    const myId = currentUser?.email || currentUser?.id || "user";
    const theirId = selectedUser?.email || selectedUser?.id || "semik";
    const msgs = getConversationMessages(myId, theirId);

    if (msgs.length === 0 && selectedUser.name?.toLowerCase().includes("semik")) {
      return [
        {
          id: "init-semik-1",
          sender: theirId,
          text: "Hey, Good Morning Semik Serma",
          timestamp: "3:00 AM",
          status: "delivered",
        },
      ];
    }
    return msgs;
  }, [selectedUser, currentUser?.email, currentUser?.id, chatVersion]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  // Send Message Handler
  const handleSendMessage = (textToSend = null) => {
    const text = (textToSend !== null ? textToSend : inputText).trim();
    if (!text || !selectedUser) return;

    const myId = currentUser?.email || currentUser?.id || "user";
    const theirId = selectedUser?.email || selectedUser?.id || "semik";

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: myId,
      senderName: currentUser?.displayName || currentUser?.name || "Me",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true }),
      status: "delivered",
    };

    saveMessageToConversation(myId, theirId, newMsg);
    playMessageChime();
    setInputText("");
    setChatVersion((v) => v + 1);

    // Auto reply for realistic connection
    if (selectedUser.role === "TECHNICIAN" || selectedUser.name?.toLowerCase().includes("semik")) {
      setTimeout(() => {
        const replyMsg = {
          id: `reply-${Date.now()}`,
          sender: theirId,
          senderName: selectedUser.displayName || selectedUser.name,
          text: `Hello! I received your message. I am active and connected in Phidim.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true }),
          status: "delivered",
        };
        saveMessageToConversation(myId, theirId, replyMsg);
        playMessageChime();
        setChatVersion((v) => v + 1);
      }, 1200);
    }
  };

  // Call Handlers
  const handleStartCall = (type = "voice") => {
    if (!selectedUser) return;
    if (startCall) {
      startCall(
        {
          name: selectedUser.displayName || selectedUser.name,
          role: selectedUser.role || "User",
          avatar: selectedUser.avatar || "",
          phone: selectedUser.phone || "+977 9862772457",
          email: selectedUser.email,
        },
        type
      );
    } else {
      showToast(`Initiating ${type} call with ${selectedUser.displayName || selectedUser.name}...`);
    }
  };

  // Voice recording simulation
  const handleToggleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      handleSendMessage("🎙️ [Voice Audio Note - 0:14s]");
      showToast("Voice note sent to " + (selectedUser?.displayName || selectedUser?.name));
    } else {
      setIsRecording(true);
      showToast("Recording voice message... Click mic again to send.");
    }
  };

  // Toggle connection status
  const handleToggleConnect = (uId) => {
    setConnectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(uId)) {
        next.delete(uId);
        showToast("Removed connection");
      } else {
        next.add(uId);
        showToast("Connected successfully! Added to your connected list.");
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#f4f7f5] dark:bg-[#040e0b] text-slate-900 dark:text-slate-100 overflow-hidden font-dm-sans select-none" data-dashboard="true">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 bg-[#074b1a]/95 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl border border-emerald-400/40 flex items-center gap-2.5 backdrop-blur-xl"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 1. TOP GREEN HEADER BAR (Glassmorphism)                                    */}
      {/* ========================================================================= */}
      <header className="h-[52px] sm:h-[56px] glass-effect-header text-white px-3 sm:px-6 flex items-center justify-between shadow-md relative z-40 flex-shrink-0">
        {/* Left: App Title */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileContactsOpen(!mobileContactsOpen)}
            className="lg:hidden p-1.5 rounded-xl bg-emerald-800/70 hover:bg-emerald-700 text-white backdrop-blur-md transition-all"
            title="Toggle Connected People"
          >
            <Users size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-black shadow-inner border border-white/25">
              <ShieldCheck size={18} className="text-white drop-shadow" />
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white drop-shadow-sm truncate">
              Phidim Service <span className="text-emerald-200">User-Dashboard</span>
            </h1>
          </div>
        </div>

        {/* Center: Live Weather & Dual Time Pill */}
        <div className="hidden md:flex items-center justify-center">
          <div className="bg-[#054316]/80 hover:bg-[#054316]/95 border border-white/20 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-3 lg:gap-5 text-[11px] lg:text-xs font-semibold text-white/95 shadow-inner transition-colors">
            <span className="flex items-center gap-1.5 text-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {weatherInfo}
            </span>
            <span className="text-white/40">|</span>
            <span className="text-emerald-200">Local-Time:{localTimeStr}</span>
            <span className="text-white/40">|</span>
            <span className="text-emerald-300 font-bold">Nepal-Time:{nepalTimeStr}</span>
          </div>
        </div>

        {/* Right Action: Homepage Link */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/25 backdrop-blur-md transition-all shadow-xs"
          >
            <Home size={13} />
            <span>Main Site</span>
          </Link>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. FULL-WIDTH SUB-NAVBAR WITH FULL-WIDTH YELLOW ACCENT LINE               */}
      {/* ========================================================================= */}
      <div className="h-[52px] sm:h-[54px] glass-effect-yellow-bar px-3 sm:px-6 flex items-center justify-between gap-3 flex-shrink-0 z-30 w-full relative">
        {/* Left: Select Category Dropdown */}
        <div ref={categoryRef} className="relative">
          <button
            onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-400 px-3 py-1.5 rounded-xl hover:bg-emerald-50/80 dark:hover:bg-emerald-950/50 backdrop-blur-md transition-all"
          >
            <span className="truncate">
              {selectedCategory === "All" ? "Technician Category" : `Category: ${selectedCategory}`}
            </span>
            <ChevronDown size={15} className={`transition-transform duration-200 ${isCategoryMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Select Category Popover Menu */}
          <AnimatePresence>
            {isCategoryMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute left-0 top-11 w-64 bg-white/95 dark:bg-[#071911]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-emerald-500/20 p-2 z-50 space-y-1"
              >
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-emerald-900/40 flex items-center justify-between">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Select Category</p>
                  {selectedCategory !== "All" && (
                    <button
                      onClick={() => {
                        setSelectedCategory("All");
                        setIsCategoryMenuOpen(false);
                      }}
                      className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Reset to All
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto space-y-0.5">
                  <button
                    onClick={() => {
                      setSelectedCategory("All");
                      setIsCategoryMenuOpen(false);
                      showToast("Showing all categories");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                      selectedCategory === "All"
                        ? "bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-800"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Wrench size={15} className="text-emerald-600 dark:text-emerald-400" />
                      <span>All Categories</span>
                    </span>
                    {selectedCategory === "All" && <Check size={14} className="text-emerald-700 dark:text-emerald-300" />}
                  </button>

                  {SERVICE_CATEGORIES.filter((c) => c.id !== "all").map((cat) => {
                    const IconComponent = CATEGORY_ICON_MAP[cat.id] || Wrench;
                    const isCatSelected = selectedCategory === cat.name;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          setIsCategoryMenuOpen(false);
                          showToast(`Filtered connected people by category: ${cat.name}`);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                          isCatSelected
                            ? "bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-800"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <IconComponent size={15} className="text-emerald-600 dark:text-emerald-400" />
                          <span>{cat.name}</span>
                        </span>
                        {isCatSelected ? (
                          <Check size={14} className="text-emerald-700 dark:text-emerald-300" />
                        ) : (
                          <span className="text-[10px] text-slate-400">({cat.count})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Middle: Prominent Offer Banner (Dark Green Pill) */}
        <div
          onClick={() => setIsOfferModalOpen(true)}
          className="flex-1 max-w-2xl mx-2 bg-gradient-to-r from-[#0e7024] to-[#0a561c] hover:from-[#11842b] hover:to-[#0c6622] text-white px-4 sm:px-6 py-2 rounded-full shadow-sm border border-emerald-400/30 flex items-center justify-between gap-2 cursor-pointer transition-all hover:scale-[1.01] backdrop-blur-md"
          title="Click to view discount details"
        >
          <p className="text-[11px] sm:text-xs font-bold truncate text-center flex-1 tracking-tight">
            Offer! Offer! Offer!, Now the Plumbling Service is Now 20% At Discount For 20% For 10 Days Go And Book A Service Now
          </p>
          <span className="text-yellow-300 font-extrabold text-xs flex-shrink-0 animate-pulse">20% OFF</span>
        </div>

        {/* Right: User Profile Avatar */}
        <div ref={profileRef} className="relative flex-shrink-0">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-9 h-9 rounded-full ring-2 ring-emerald-500/70 overflow-hidden shadow-sm hover:ring-emerald-400 transition-all flex items-center justify-center bg-slate-100 dark:bg-emerald-950"
            title="User Profile & Settings"
          >
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name || "User"} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                {(currentUser?.name || currentUser?.displayName || "U").substring(0, 2).toUpperCase()}
              </div>
            )}
          </button>

          {/* Profile Dropdown */}
          <AnimatePresence>
            {isProfileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-11 w-60 bg-white/95 dark:bg-[#071911]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-emerald-500/20 p-2 z-50 space-y-1"
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-emerald-900/40">
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{currentUser?.displayName || currentUser?.name || "Customer User"}</p>
                  <p className="text-[10px] text-slate-400 truncate">{currentUser?.email || "user@phidim.np"}</p>
                </div>

                <Link
                  href="/"
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-800 rounded-xl transition-colors"
                >
                  <Home size={14} className="text-emerald-600" /> Go to Main Website
                </Link>

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsSettingsModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-800 rounded-xl transition-colors text-left"
                >
                  <Settings size={14} className="text-blue-600" /> Account Settings
                </button>

                <div className="pt-1 border-t border-slate-100 dark:border-emerald-900/40">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors text-left"
                  >
                    <LogOut size={14} /> Log Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN BODY CONTAINER: DUAL SIDEBAR + CHAT WORKSPACE                      */}
      {/* (Both sidebars are now situated a little down below full-width yellow line) */}
      {/* ========================================================================= */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* ----------------------------------------------------------------------- */}
        {/* 3A. LEFT DARK GREEN RAIL NAVIGATION (Frosted Glass)                     */}
        {/* ----------------------------------------------------------------------- */}
        <nav
          aria-label="User Navigation Rail"
          className="w-[52px] sm:w-[58px] glass-effect-rail text-white flex flex-col items-center py-4 justify-between flex-shrink-0 z-20 shadow-lg"
        >
          {/* Top Icons */}
          <div className="flex flex-col items-center gap-3 w-full px-1">
            {/* Category Select Icon */}
            <button
              onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
              className={`p-2.5 rounded-xl transition-all ${
                isCategoryMenuOpen
                  ? "bg-white/25 text-white shadow-inner ring-1 ring-white/30 backdrop-blur-md"
                  : "text-emerald-100/80 hover:bg-white/15 hover:text-white"
              }`}
              title="Select Technician Category"
            >
              <LayoutGrid size={20} />
            </button>

            {/* Search Users Icon */}
            <button
              onClick={() => {
                const searchEl = document.getElementById("people-search-input");
                if (searchEl) searchEl.focus();
              }}
              className="p-2.5 rounded-xl text-emerald-100/80 hover:bg-white/15 hover:text-white transition-all"
              title="Search Users & Connected People"
            >
              <Search size={20} />
            </button>

            {/* Find Connected People Icon */}
            <button
              onClick={() => {
                if (roleFilter === "CONNECTED") {
                  setRoleFilter("ALL");
                  showToast("Showing all users");
                } else {
                  setRoleFilter("CONNECTED");
                  showToast("Showing connected people");
                }
              }}
              className={`p-2.5 rounded-xl transition-all ${
                roleFilter === "CONNECTED"
                  ? "bg-white/25 text-white shadow-inner ring-1 ring-white/30 backdrop-blur-md"
                  : "text-emerald-100/80 hover:bg-white/15 hover:text-white"
              }`}
              title="Filter Connected People"
            >
              <Users size={20} />
            </button>

            {/* Chat Messages Icon */}
            <button
              onClick={() => {
                setRoleFilter("ALL");
                setSelectedCategory("All");
              }}
              className="p-2.5 rounded-xl bg-white/25 text-white shadow-inner ring-1 ring-white/30 backdrop-blur-md"
              title="Chat Messages"
            >
              <MessageSquare size={20} />
            </button>
          </div>

          {/* Bottom Settings Icon */}
          <div className="w-full flex justify-center px-1">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2.5 rounded-xl text-emerald-100/80 hover:bg-white/15 hover:text-white transition-all"
              title="Account Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </nav>

        {/* ----------------------------------------------------------------------- */}
        {/* 3B. SECONDARY VIBRANT GREEN SIDEBAR PANEL (SEARCH & CONNECTED PEOPLES)   */}
        {/* ----------------------------------------------------------------------- */}
        <aside
          className={`w-[290px] sm:w-[320px] glass-effect-sidebar flex flex-col flex-shrink-0 z-20 transition-transform duration-300 ${
            mobileContactsOpen ? "absolute inset-y-0 left-[52px] z-40 shadow-2xl" : "hidden lg:flex"
          }`}
        >
          {/* Top Search Users Input Box */}
          <div className="p-3.5 border-b border-white/15 space-y-2">
            <div ref={filterRef} className="relative">
              <div className="bg-white/95 dark:bg-emerald-950/80 backdrop-blur-md rounded-full px-3.5 py-2 flex items-center justify-between shadow-sm border border-white/40 dark:border-emerald-700/40 focus-within:ring-2 focus-within:ring-emerald-800">
                <input
                  id="people-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Peoples Connected with You"
                  className="w-full text-xs text-slate-800 dark:text-white placeholder-slate-400 bg-transparent outline-none pr-1 truncate font-medium"
                />

                <div className="flex items-center gap-1.5 text-slate-500 dark:text-emerald-300 flex-shrink-0">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="hover:text-slate-900 dark:hover:text-white transition-colors p-0.5"
                    title="Filter search type"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <Search size={14} className="text-slate-500 dark:text-emerald-300" />
                </div>
              </div>

              {/* Search Filter Dropdown */}
              <AnimatePresence>
                {showFilterDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute left-0 right-0 top-11 bg-white/95 dark:bg-[#071911]/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-slate-200 dark:border-emerald-800/40 py-1.5 z-50 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {[
                      { id: "ALL", label: "All Users & Technicians" },
                      { id: "CONNECTED", label: "Connected Friends Only" },
                      { id: "TECHNICIAN", label: "Technicians Only" },
                      { id: "USER", label: "Customers & Friends" },
                      { id: "ADMIN", label: "Official Admin Support" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          setRoleFilter(f.id);
                          setShowFilterDropdown(false);
                          showToast(`Filter applied: ${f.label}`);
                        }}
                        className={`w-full text-left px-3.5 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 flex items-center justify-between ${
                          roleFilter === f.id ? "text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50/60 dark:bg-emerald-950/40" : ""
                        }`}
                      >
                        <span>{f.label}</span>
                        {roleFilter === f.id && <Check size={14} />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Active Filters Tag Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {roleFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold border border-white/25">
                  <span>Filter: {roleFilter}</span>
                  <button onClick={() => setRoleFilter("ALL")} className="hover:text-rose-200">
                    <X size={10} />
                  </button>
                </span>
              )}
              {selectedCategory !== "All" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-yellow-400/30 backdrop-blur-md text-white text-[10px] font-bold border border-yellow-300/40">
                  <span>{selectedCategory}</span>
                  <button onClick={() => setSelectedCategory("All")} className="hover:text-rose-200">
                    <X size={10} />
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* User List Stream */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/10 px-2 py-1 space-y-1">
            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-white/80 text-xs font-medium space-y-2">
                <p>No connected people found matching &quot;{searchQuery}&quot;.</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setRoleFilter("ALL");
                    setSelectedCategory("All");
                  }}
                  className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white text-[11px] font-bold transition-all border border-white/25"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredContacts.map((person) => {
                const isSelected = selectedUser?.email === person.email || selectedUser?.id === person.id;
                const isConnected = connectedUserIds.has(person.id);

                return (
                  <div
                    key={person.id || person.email}
                    onClick={() => {
                      setSelectedUser(person);
                      if (mobileContactsOpen) setMobileContactsOpen(false);
                    }}
                    className={`group relative flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "bg-[#258e33]/95 backdrop-blur-md text-white shadow-md border border-white/30"
                        : "hover:bg-white/15 backdrop-blur-sm text-white border border-transparent"
                    }`}
                  >
                    {/* User Avatar */}
                    <div className="relative flex-shrink-0">
                      {person.avatar ? (
                        <img
                          src={person.avatar}
                          alt={person.displayName || person.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-white/50 shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center ring-2 ring-white/50 shadow-sm">
                          {(person.displayName || person.name || "U").substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      {person.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-300 ring-2 ring-[#3bb54a]" />
                      )}
                    </div>

                    {/* Text Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-xs text-white truncate leading-tight">
                          {person.displayName || person.name}
                        </p>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${
                          person.role === "ADMIN"
                            ? "bg-rose-950/80 text-rose-200 border-rose-400/40"
                            : person.role === "TECHNICIAN"
                            ? "bg-emerald-950/80 text-emerald-200 border-emerald-400/30"
                            : "bg-blue-950/80 text-blue-200 border-blue-400/30"
                        }`}>
                          {person.role === "ADMIN" ? "Admin" : person.role === "TECHNICIAN" ? "Tech" : "User"}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-100/90 truncate flex items-center gap-1 mt-0.5">
                        <span className="truncate">{person.lastMessage}</span>
                        <CheckCheck size={12} className="text-emerald-200 flex-shrink-0" />
                      </p>
                    </div>

                    {/* Quick Connect / Bookmark Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleConnect(person.id);
                      }}
                      className={`p-1 rounded-full transition-colors ${
                        isConnected ? "text-amber-300" : "text-white/40 hover:text-white"
                      }`}
                      title={isConnected ? "Connected with you" : "Connect with person"}
                    >
                      <Bookmark size={13} fill={isConnected ? "currentColor" : "none"} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ----------------------------------------------------------------------- */}
        {/* 3C. MAIN CONTENT WORKSPACE (Frosted Glass Canvas)                        */}
        {/* ----------------------------------------------------------------------- */}
        <main className="flex-1 bg-gradient-to-br from-[#f8faf9]/90 via-[#f0f6f2]/80 to-[#e9f3eb]/90 dark:from-[#06150e]/95 dark:via-[#091e14]/90 dark:to-[#05110b]/95 backdrop-blur-xl flex flex-col justify-between overflow-hidden relative">
          {/* Active Chat Header with Call Actions */}
          {selectedUser && (
            <div className="px-6 py-2.5 bg-white/75 dark:bg-[#071d13]/75 backdrop-blur-xl border-b border-slate-200/80 dark:border-emerald-900/40 flex items-center justify-between flex-shrink-0 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.displayName || selectedUser.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/40 shadow-sm"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-emerald-500/40 shadow-sm">
                      {(selectedUser.displayName || selectedUser.name || "U").substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  {selectedUser.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <span>{selectedUser.displayName || selectedUser.name}</span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-700/50">
                      {selectedUser.category || selectedUser.role}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {selectedUser.online ? "Active Now • Panchthar, Nepal" : "Offline"}
                  </p>
                </div>
              </div>

              {/* Call buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartCall("voice")}
                  className="p-2 rounded-xl bg-white/80 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 hover:text-emerald-700 text-slate-600 dark:text-slate-200 transition-all border border-slate-200/80 dark:border-emerald-800/40 shadow-xs"
                  title="Start Voice Call"
                >
                  <Phone size={15} />
                </button>
                <button
                  onClick={() => handleStartCall("video")}
                  className="p-2 rounded-xl bg-white/80 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 hover:text-emerald-700 text-slate-600 dark:text-slate-200 transition-all border border-slate-200/80 dark:border-emerald-800/40 shadow-xs"
                  title="Start Video Call"
                >
                  <Video size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Chat Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {currentMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100/70 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner border border-emerald-500/20 backdrop-blur-md">
                  <MessageSquare size={30} />
                </div>
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                  Start chatting with {selectedUser?.displayName || selectedUser?.name || "your contact"}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Connect directly with technicians and community friends in Phidim.
                </p>
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  {[
                    "Hello! Are you available in Phidim?",
                    "Can you share service availability?",
                    "Hello! Nice connecting with you.",
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(preset)}
                      className="text-xs px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 hover:text-emerald-800 dark:hover:text-emerald-200 text-slate-700 dark:text-slate-300 transition-all font-medium border border-slate-200/80 dark:border-emerald-800/40 shadow-xs backdrop-blur-md"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              currentMessages.map((msg, index) => {
                const isMe =
                  msg.sender === (currentUser?.email || currentUser?.id || "user") ||
                  msg.sender === currentUser?.email ||
                  msg.sender === "me";

                return (
                  <motion.div
                    key={msg.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[78%] sm:max-w-md px-4 py-2.5 rounded-2xl shadow-sm text-xs leading-relaxed ${
                        isMe
                          ? "bg-gradient-to-br from-[#0d872d]/95 to-[#096d24]/95 text-white rounded-br-none backdrop-blur-md border border-emerald-400/30 shadow-md"
                          : "bg-white/90 dark:bg-[#082215]/90 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/80 dark:border-emerald-800/40 backdrop-blur-md shadow-xs"
                      }`}
                    >
                      <p className="break-words font-medium">{msg.text}</p>
                      <div
                        className={`flex items-center gap-1 justify-end text-[10px] mt-1 ${
                          isMe ? "text-emerald-100" : "text-slate-400"
                        }`}
                      >
                        <span>{msg.timestamp || "Just now"}</span>
                        {isMe && <CheckCheck size={12} className="text-emerald-200" />}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ===================================================================== */}
          {/* 3. BOTTOM FLOATING PILL CHAT INPUT BAR (Glassmorphism)                */}
          {/* ===================================================================== */}
          <div className="p-4 sm:p-6 bg-transparent flex-shrink-0">
            <div ref={attachMenuRef} className="relative max-w-4xl mx-auto w-full">
              {/* Attachment Popover */}
              <AnimatePresence>
                {showAttachMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-4 bottom-14 bg-white/95 dark:bg-[#071911]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-emerald-800/40 p-2 z-50 flex flex-col gap-1 w-48 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    <button
                      onClick={() => {
                        setShowAttachMenu(false);
                        handleSendMessage("📍 My Location: Phidim Bazar, Ward 1, Panchthar");
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-800 text-left"
                    >
                      <MapPin size={15} className="text-blue-600" /> Share Location
                    </button>
                    <button
                      onClick={() => {
                        setShowAttachMenu(false);
                        handleSendMessage("📸 [Photo Attachment]");
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-800 text-left"
                    >
                      <Camera size={15} className="text-amber-600" /> Attach Photo
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floating Rounded Pill */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="glass-effect-input rounded-full px-3.5 sm:px-5 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-3 transition-all focus-within:border-emerald-600 focus-within:shadow-[0_8px_32px_rgba(13,135,45,0.2)]"
              >
                {/* Plus Icon */}
                <button
                  type="button"
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 hover:text-emerald-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors flex-shrink-0"
                  title="Quick Actions"
                >
                  <Plus size={18} />
                </button>

                {/* Input Text Box */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Hello Start Chatting tother With Groups And Wth Friends"
                  className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 outline-none font-medium truncate"
                />

                {/* Microphone Voice Button */}
                <button
                  type="button"
                  onClick={handleToggleVoiceRecord}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                    isRecording
                      ? "bg-rose-600 text-white animate-pulse"
                      : "text-slate-500 hover:text-emerald-700 hover:bg-slate-100 dark:hover:bg-emerald-950/60"
                  }`}
                  title={isRecording ? "Stop & Send Voice Note" : "Record Voice Note"}
                >
                  <Mic size={18} />
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                    inputText.trim()
                      ? "bg-[#0d872d] text-white hover:bg-[#0b7025] shadow-sm hover:scale-105"
                      : "text-slate-400 hover:text-slate-600 cursor-not-allowed"
                  }`}
                  title="Send Message"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODALS (Offer, Settings)                                                */}
      {/* ========================================================================= */}

      {/* Offer Promo Modal */}
      <AnimatePresence>
        {isOfferModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/95 dark:bg-[#071911]/95 backdrop-blur-2xl rounded-3xl p-6 max-w-md w-full shadow-2xl border border-emerald-500/30 space-y-4 relative"
            >
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-emerald-950/60 hover:bg-slate-200 text-slate-500"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Droplet size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Special Promo</span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">20% Off Plumbing Services</h3>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Enjoy a flat <strong>20% discount</strong> on all plumbing services in Phidim for the next 10 days!
              </p>

              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Promo Code</p>
                  <p className="text-sm font-mono font-black text-emerald-700 dark:text-emerald-300">PLUMB20</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText("PLUMB20");
                    showToast("Promo code PLUMB20 copied!");
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all hover:scale-102"
                >
                  Copy Code
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Account Settings Modal */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/95 dark:bg-[#071911]/95 backdrop-blur-2xl rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-emerald-500/30 space-y-4 max-h-[90vh] overflow-y-auto relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-emerald-900/40">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings size={18} className="text-emerald-600 dark:text-emerald-400" /> Account Settings
                </h3>
                <button
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="p-1.5 rounded-full bg-slate-100 dark:bg-emerald-950/60 hover:bg-slate-200 text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>

              <AccountSettings onShowToast={showToast} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

