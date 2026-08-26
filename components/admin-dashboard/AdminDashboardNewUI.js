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
  BarChart3,
  Megaphone,
  Tag,
  DollarSign,
  Briefcase,
  TrendingUp,
  Activity,
  Edit3,
  Layers,
  FileText,
  AlertCircle,
  Bell
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

const SPECIALTY_MAP = {
  plumbing: ["plumb", "pipe", "sanitary", "water", "drain", "leak"],
  electrical: ["electr", "wire", "inverter", "solar", "power", "switch"],
  cctv: ["cctv", "camera", "security", "alarm", "surveillance", "nvr"],
  fiber: ["fiber", "internet", "lan", "network", "router", "splice", "wifi"],
  "ac-cooling": ["ac", "cool", "refrigerat", "air condition", "compressor"],
  "dth-tv": ["dishhome", "dth", "tv", "dish", "antenna"],
  computer: ["computer", "it", "laptop", "pc", "software"],
};

export default function AdminDashboardNewUI() {
  const { user, logout } = useAuth();
  const { startCall } = useCall() || {};

  // Master Admin fallback
  const adminUser = user || {
    id: "usr-admin-dhanraj",
    name: "Dhanraj Serma",
    displayName: "Dhanraj Serma (Master Admin)",
    email: "dhanrajserma34@gmail.com",
    role: "ADMIN",
    avatar: "/dhanraj.png",
  };

  // Live Clocks & Weather
  const [localTimeStr, setLocalTimeStr] = useState("3:00 AM");
  const [nepalTimeStr, setNepalTimeStr] = useState("3:00 AM");
  const [weatherInfo, setWeatherInfo] = useState("Today 3:00 AM Rain At Phidim");

  // Admin Workspace Mode: "chat" | "analytics" | "users" | "categories" | "announcements" | "settings"
  const [adminViewMode, setAdminViewMode] = useState("chat");

  // Category & Filter state
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [isOfferEditorOpen, setIsOfferEditorOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);

  // Admin Notifications
  const [notifications, setNotifications] = useState([
    {
      id: "notif-1",
      title: "New Technician Application",
      description: "Ramesh Karki submitted documents for Electrical & Wiring certification.",
      time: "5m ago",
      type: "technician",
      unread: true,
    },
    {
      id: "notif-2",
      title: "Emergency Service Request",
      description: "Urgent water pipe burst reported in Phidim Ward-2, Main Bazar.",
      time: "22m ago",
      type: "booking",
      unread: true,
    },
    {
      id: "notif-3",
      title: "System Synchronization",
      description: "User chat registry and database logs backed up successfully.",
      time: "1h ago",
      type: "system",
      unread: false,
    },
    {
      id: "notif-4",
      title: "Technician On-Duty Alert",
      description: "Suresh Chemjong checked in for CCTV & Networking field support.",
      time: "3h ago",
      type: "duty",
      unread: false,
    },
  ]);

  const unreadNotifsCount = useMemo(() => notifications.filter((n) => n.unread).length, [notifications]);

  // Dynamic Offer Banner Text (Editable by Admin)
  const [offerBannerText, setOfferBannerText] = useState(
    "Offer! Offer! Offer!, Now the Plumbling Service is Now 20% At Discount For 20% For 10 Days Go And Book A Service Now"
  );
  const [bannerInputText, setBannerInputText] = useState(offerBannerText);

  // Search & Users State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL"); // "ALL" | "TECHNICIAN" | "USER" | "ADMIN"
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inputText, setInputText] = useState("");
  const [chatVersion, setChatVersion] = useState(0);
  const [registryVersion, setRegistryVersion] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // Categories & Services State
  const [categoriesList, setCategoriesList] = useState(SERVICE_CATEGORIES);
  const [servicesList, setServicesList] = useState(SERVICES);
  const [newCatName, setNewCatName] = useState("");
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("1500");
  const [newServiceCat, setNewServiceCat] = useState("Plumbing & Sanitary");

  // Mobile sidebar toggle
  const [mobileContactsOpen, setMobileContactsOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Click Outside Refs for Dropdowns
  const categoryRef = useRef(null);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
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
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setIsNotificationMenuOpen(false);
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

  // 3. Construct Contacts List
  const contacts = useMemo(() => {
    const localReal = getStoredRealUsers();
    const myEmail = (adminUser?.email || "").toLowerCase().trim();
    const map = new Map();

    const semikUser = {
      id: "usr-cust-semik",
      name: "Semik Serma",
      displayName: "Semik Serma",
      role: "USER",
      email: "semikserma@gmail.com",
      phone: "+977 9862772400",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      bio: "Customer in Phidim-1, Panchthar.",
      location: "Phidim-1, Panchthar",
      online: true,
      category: "Customer User",
      lastMessage: "Hey, Good Morning Semik Serma",
    };

    [semikUser, ...DEFAULT_REAL_USERS, ...localReal].forEach((u) => {
      if (u && (u.email || u.id)) {
        const key = (u.email || u.id).toLowerCase().trim();
        if (key && key !== myEmail) {
          let cat = u.category || u.specialty || "";
          if (!cat) {
            const bioLower = (u.bio || "" + u.displayName || "").toLowerCase();
            if (bioLower.includes("cctv") || bioLower.includes("security")) cat = "CCTV & Security";
            else if (bioLower.includes("electric")) cat = "Electrical & Inverter";
            else if (bioLower.includes("plumb")) cat = "Plumbing & Sanitary";
            else if (bioLower.includes("fiber") || bioLower.includes("dth")) cat = "DishHome & Fiber";
            else if (u.role === "TECHNICIAN") cat = "General Technician";
            else cat = "Registered Customer";
          }

          map.set(key, {
            ...u,
            displayName: u.displayName || u.name || key.split("@")[0] || "User",
            role: u.role || "USER",
            online: u.online !== false,
            category: cat,
            lastMessage: u.lastMessage || (u.name === "Semik Serma" ? "Hey, Good Morning Semik Serma" : `Active ${u.role} in ${u.location || "Phidim"}`),
          });
        }
      }
    });

    return Array.from(map.values());
  }, [adminUser?.email, registryVersion]);

  // Default select Semik Serma
  useEffect(() => {
    if (!selectedUser && contacts.length > 0) {
      const semik = contacts.find((c) => c.name?.toLowerCase().includes("semik")) || contacts[0];
      setSelectedUser(semik);
    }
  }, [contacts, selectedUser]);

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const name = (c.displayName || c.name || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      const bio = (c.bio || "").toLowerCase();
      const category = (c.category || "").toLowerCase();
      const role = (c.role || "").toUpperCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        bio.includes(q) ||
        category.includes(q);

      const matchesRole =
        roleFilter === "ALL" ||
        (roleFilter === "TECHNICIAN" && role === "TECHNICIAN") ||
        (roleFilter === "USER" && (role === "USER" || role === "CUSTOMER")) ||
        (roleFilter === "ADMIN" && role === "ADMIN");

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
  }, [contacts, searchQuery, roleFilter, selectedCategory]);

  // 4. Current Conversation Messages
  const currentMessages = useMemo(() => {
    if (!selectedUser) return [];
    const myId = adminUser?.email || adminUser?.id || "admin";
    const theirId = selectedUser?.email || selectedUser?.id || "semik";
    const msgs = getConversationMessages(myId, theirId);

    if (msgs.length === 0 && selectedUser.name?.toLowerCase().includes("semik")) {
      return [
        {
          id: "init-admin-semik",
          sender: theirId,
          text: "Hey, Good Morning Semik Serma",
          timestamp: "3:00 AM",
          status: "delivered",
        },
      ];
    }
    return msgs;
  }, [selectedUser, adminUser?.email, adminUser?.id, chatVersion]);

  // Auto scroll to bottom
  useEffect(() => {
    if (adminViewMode === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentMessages, adminViewMode]);

  // Send Message Handler
  const handleSendMessage = (textToSend = null) => {
    const text = (textToSend !== null ? textToSend : inputText).trim();
    if (!text || !selectedUser) return;

    const myId = adminUser?.email || adminUser?.id || "admin";
    const theirId = selectedUser?.email || selectedUser?.id || "semik";

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: myId,
      senderName: adminUser?.displayName || adminUser?.name || "Admin",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true }),
      status: "delivered",
    };

    saveMessageToConversation(myId, theirId, newMsg);
    playMessageChime();
    setInputText("");
    setChatVersion((v) => v + 1);

    if (selectedUser.role === "TECHNICIAN" || selectedUser.name?.toLowerCase().includes("semik")) {
      setTimeout(() => {
        const replyMsg = {
          id: `reply-${Date.now()}`,
          sender: theirId,
          senderName: selectedUser.displayName || selectedUser.name,
          text: `Acknowledged, Admin! I am active and ready for dispatch in Panchthar.`,
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

  const handleToggleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      handleSendMessage("🎙️ [Official Admin Voice Note - 0:15s]");
      showToast("Admin voice message sent!");
    } else {
      setIsRecording(true);
      showToast("Recording admin audio note... Click mic again to send.");
    }
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const newCat = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      icon: "Layers",
      count: 0,
    };
    setCategoriesList((prev) => [...prev, newCat]);
    setNewCatName("");
    showToast(`Category "${newCat.name}" created successfully!`);
  };

  const handleCreateService = (e) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    const newSrv = {
      id: `srv-${Date.now()}`,
      name: newServiceName.trim(),
      category: newServiceCat,
      basePrice: Number(newServicePrice) || 1500,
      description: `Official verified ${newServiceCat} doorstep service in Phidim.`,
    };
    setServicesList((prev) => [newSrv, ...prev]);
    setNewServiceName("");
    setIsAddServiceModalOpen(false);
    showToast(`Service "${newSrv.name}" published successfully!`);
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
        {/* Left: App Title + Role Badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileContactsOpen(!mobileContactsOpen)}
            className="lg:hidden p-1.5 rounded-xl bg-emerald-800/70 hover:bg-emerald-700 text-white backdrop-blur-md transition-all"
            title="Toggle Users Panel"
          >
            <Users size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-black shadow-inner border border-white/25">
              <ShieldCheck size={18} className="text-white drop-shadow" />
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white drop-shadow-sm truncate">
              Phidim Service <span className="text-emerald-200">Admin-Dashboard</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-400/40 text-emerald-300 text-[10px] font-black tracking-wider uppercase hidden sm:inline-block">
              MASTER ADMIN
            </span>
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

        {/* Right Actions: Switch to User View & Main Site */}
        <div className="flex items-center gap-2">
          <Link
            href="/user/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/90 hover:bg-emerald-800 text-white text-xs font-bold border border-emerald-500/40 transition-colors shadow-sm"
            title="Switch to User Dashboard"
          >
            <Users size={13} />
            <span className="hidden sm:inline">User View</span>
          </Link>
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 hover:bg-emerald-700 text-white text-xs font-semibold border border-emerald-600/40 transition-colors"
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
        {/* Left: Technician Category Dropdown */}
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

          {/* Popover Menu */}
          <AnimatePresence>
            {isCategoryMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute left-0 top-11 w-64 bg-white/95 dark:bg-[#071911]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-emerald-500/20 p-2 z-50 space-y-1"
              >
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-emerald-900/40 flex items-center justify-between">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Categories</p>
                  <button
                    onClick={() => {
                      setIsCategoryMenuOpen(false);
                      setAdminViewMode("categories");
                    }}
                    className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Manage →
                  </button>
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

                  {categoriesList.filter((c) => c.id !== "all").map((cat) => {
                    const IconComponent = CATEGORY_ICON_MAP[cat.id] || Wrench;
                    const isCatSelected = selectedCategory === cat.name;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          setIsCategoryMenuOpen(false);
                          showToast(`Filtered technicians by category: ${cat.name}`);
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

        {/* Right Actions: Admin Profile Avatar & Notification Bell */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Admin Profile Avatar */}
          <div ref={profileRef} className="relative flex-shrink-0">
            <button
              onClick={() => {
                setIsProfileMenuOpen(!isProfileMenuOpen);
                setIsNotificationMenuOpen(false);
              }}
              className="w-9 h-9 rounded-full ring-2 ring-emerald-500/70 overflow-hidden shadow-sm hover:ring-emerald-400 transition-all flex items-center justify-center bg-slate-100 dark:bg-emerald-950"
              title="Master Administrator Menu"
            >
              {adminUser?.avatar ? (
                <img src={adminUser.avatar} alt={adminUser.name || "Admin"} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                  {(adminUser?.name || adminUser?.displayName || "A").substring(0, 2).toUpperCase()}
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
                  className="absolute right-0 top-11 w-64 bg-white/95 dark:bg-[#071911]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-emerald-500/20 p-2 z-50 space-y-1"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-emerald-900/40">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{adminUser?.displayName || adminUser?.name || "Master Admin"}</p>
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        ADMIN
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">{adminUser?.email || "admin@phidim.np"}</p>
                  </div>

                  <Link
                    href="/user/dashboard"
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-xl transition-colors"
                  >
                    <Users size={14} className="text-emerald-600 dark:text-emerald-400" /> Switch to User Dashboard
                  </Link>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setAdminViewMode("analytics");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-800 rounded-xl transition-colors text-left"
                  >
                    <BarChart3 size={14} className="text-blue-600" /> Analytics Overview
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setAdminViewMode("categories");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-800 rounded-xl transition-colors text-left"
                  >
                    <LayoutGrid size={14} className="text-amber-600" /> Category Manager
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsSettingsModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-800 rounded-xl transition-colors text-left"
                  >
                    <Settings size={14} className="text-slate-600 dark:text-slate-400" /> System Settings
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

          {/* Notification Icon Button (Right side of profile picture) */}
          <div ref={notificationRef} className="relative flex-shrink-0">
            <button
              onClick={() => {
                setIsNotificationMenuOpen(!isNotificationMenuOpen);
                setIsProfileMenuOpen(false);
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all relative ${
                isNotificationMenuOpen
                  ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400"
                  : "bg-white/80 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-emerald-800/40 shadow-xs"
              }`}
              title="Admin Notifications"
            >
              <Bell size={17} />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center px-1 shadow-sm animate-pulse ring-1 ring-white">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Notification Popover Menu */}
            <AnimatePresence>
              {isNotificationMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 top-11 w-80 sm:w-96 bg-white/95 dark:bg-[#071911]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-emerald-500/20 p-3 z-50 space-y-2"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-emerald-900/40">
                    <div className="flex items-center gap-2">
                      <Bell size={15} className="text-emerald-600 dark:text-emerald-400" />
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white">Admin Notifications</h4>
                    </div>
                    {unreadNotifsCount > 0 && (
                      <button
                        onClick={() => {
                          setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
                          showToast("All notifications marked as read");
                        }}
                        className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-1.5 pr-0.5">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">No notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setNotifications((prev) =>
                              prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item))
                            );
                            if (n.type === "technician" || n.type === "duty") {
                              setAdminViewMode("users");
                              setIsNotificationMenuOpen(false);
                            } else if (n.type === "booking") {
                              setAdminViewMode("analytics");
                              setIsNotificationMenuOpen(false);
                            }
                          }}
                          className={`p-2.5 rounded-xl cursor-pointer transition-all text-xs space-y-0.5 ${
                            n.unread
                              ? "bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/50 text-slate-800 dark:text-slate-100 font-semibold"
                              : "hover:bg-slate-50 dark:hover:bg-emerald-950/30 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">
                              {n.time}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                            {n.description}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN BODY CONTAINER: DUAL SIDEBAR + MAIN WORKSPACE                      */}
      {/* (Both sidebars are situated down below the full-width yellow accent bar)   */}
      {/* ========================================================================= */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* ----------------------------------------------------------------------- */}
        {/* 3A. LEFT DARK GREEN RAIL NAVIGATION (ADMIN CONTROLS)                    */}
        {/* ----------------------------------------------------------------------- */}
        <nav
          aria-label="Admin Navigation Rail"
          className="w-[52px] sm:w-[58px] glass-effect-rail text-white flex flex-col items-center py-4 justify-between flex-shrink-0 z-20 shadow-lg"
        >
          {/* Top Icons */}
          <div className="flex flex-col items-center gap-2.5 w-full px-1">
            {/* Live Chat / Dispatch Mode */}
            <button
              onClick={() => {
                setAdminViewMode("chat");
                showToast("Live Chat & Technician Dispatch Mode");
              }}
              className={`p-2.5 rounded-xl transition-all ${
                adminViewMode === "chat"
                  ? "bg-white/25 text-white shadow-inner ring-1 ring-white/30 backdrop-blur-md"
                  : "text-emerald-100/80 hover:bg-white/15 hover:text-white"
              }`}
              title="Live Chat & Direct Dispatch"
            >
              <MessageSquare size={20} />
            </button>

            {/* Analytics & Operations Mode */}
            <button
              onClick={() => {
                setAdminViewMode("analytics");
                showToast("Operations & KPI Analytics");
              }}
              className={`p-2.5 rounded-xl transition-all ${
                adminViewMode === "analytics"
                  ? "bg-white/25 text-white shadow-inner ring-1 ring-white/30 backdrop-blur-md"
                  : "text-emerald-100/80 hover:bg-white/15 hover:text-white"
              }`}
              title="Operations & KPI Analytics"
            >
              <BarChart3 size={20} />
            </button>

            {/* Service & Category Management Mode */}
            <button
              onClick={() => {
                setAdminViewMode("categories");
                showToast("Category & Service Package Manager");
              }}
              className={`p-2.5 rounded-xl transition-all ${
                adminViewMode === "categories"
                  ? "bg-white/25 text-white shadow-inner ring-1 ring-white/30 backdrop-blur-md"
                  : "text-emerald-100/80 hover:bg-white/15 hover:text-white"
              }`}
              title="Manage Categories & Service Packages"
            >
              <LayoutGrid size={20} />
            </button>

            {/* Users & Technicians Directory Mode */}
            <button
              onClick={() => {
                setAdminViewMode("users");
                showToast("Users & Technicians Directory");
              }}
              className={`p-2.5 rounded-xl transition-all ${
                adminViewMode === "users"
                  ? "bg-white/25 text-white shadow-inner ring-1 ring-white/30 backdrop-blur-md"
                  : "text-emerald-100/80 hover:bg-white/15 hover:text-white"
              }`}
              title="All Registered Users & Technicians"
            >
              <Users size={20} />
            </button>

            {/* Announcement & Offer Editor Mode */}
            <button
              onClick={() => {
                setAdminViewMode("announcements");
                showToast("Announcements & Promo Offer Editor");
              }}
              className={`p-2.5 rounded-xl transition-all ${
                adminViewMode === "announcements"
                  ? "bg-white/25 text-white shadow-inner ring-1 ring-white/30 backdrop-blur-md"
                  : "text-emerald-100/80 hover:bg-white/15 hover:text-white"
              }`}
              title="Broadcast Announcements & Promo Banners"
            >
              <Megaphone size={20} />
            </button>
          </div>

          {/* Bottom Settings Icon */}
          <div className="w-full flex justify-center px-1">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2.5 rounded-xl text-emerald-100/80 hover:bg-white/15 hover:text-white transition-all"
              title="Admin System Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </nav>

        {/* ----------------------------------------------------------------------- */}
        {/* 3B. SECONDARY VIBRANT GREEN SIDEBAR PANEL (ALL USERS & TECHS)           */}
        {/* ----------------------------------------------------------------------- */}
        <aside
          className={`w-[290px] sm:w-[320px] glass-effect-sidebar flex flex-col flex-shrink-0 z-20 transition-transform duration-300 ${
            mobileContactsOpen ? "absolute inset-y-0 left-[52px] z-40 shadow-2xl" : "hidden lg:flex"
          }`}
        >
          {/* Top Search Input Box */}
          <div className="p-3.5 border-b border-white/15 space-y-2">
            <div ref={filterRef} className="relative">
              <div className="bg-white/95 dark:bg-emerald-950/80 backdrop-blur-md rounded-full px-3.5 py-2 flex items-center justify-between shadow-sm border border-white/40 dark:border-emerald-700/40 focus-within:ring-2 focus-within:ring-emerald-800">
                <input
                  id="admin-search-input"
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
                    title="Filter users by role"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <Search size={14} className="text-slate-500 dark:text-emerald-300" />
                </div>
              </div>

              {/* Role filter dropdown */}
              <AnimatePresence>
                {showFilterDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute left-0 right-0 top-11 bg-white/95 dark:bg-[#071911]/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-slate-200 dark:border-emerald-800/40 py-1.5 z-50 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {[
                      { id: "ALL", label: "All Users & Staff" },
                      { id: "TECHNICIAN", label: "Technicians Only" },
                      { id: "USER", label: "Customers & Friends" },
                      { id: "ADMIN", label: "System Admins" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          setRoleFilter(f.id);
                          setShowFilterDropdown(false);
                          showToast(`Filter: ${f.label}`);
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

            {/* Active Category Filter Tag */}
            {selectedCategory !== "All" && (
              <div className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-md text-white text-[11px] font-bold border border-white/25">
                <span className="truncate">Category: {selectedCategory}</span>
                <button
                  onClick={() => setSelectedCategory("All")}
                  className="p-0.5 hover:bg-white/20 rounded"
                  title="Clear Category Filter"
                >
                  <X size={13} />
                </button>
              </div>
            )}
          </div>

          {/* User & Technician Cards */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/10 px-2 py-1 space-y-1">
            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-white/80 text-xs font-medium space-y-2">
                <p>No users found matching &quot;{searchQuery}&quot;.</p>
                {selectedCategory !== "All" && (
                  <button
                    onClick={() => setSelectedCategory("All")}
                    className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white text-[11px] font-bold transition-all border border-white/25"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            ) : (
              filteredContacts.map((person) => {
                const isSelected = selectedUser?.email === person.email || selectedUser?.id === person.id;

                return (
                  <div
                    key={person.id || person.email}
                    onClick={() => {
                      setSelectedUser(person);
                      setAdminViewMode("chat");
                      if (mobileContactsOpen) setMobileContactsOpen(false);
                    }}
                    className={`group relative flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all duration-200 ${
                      isSelected && adminViewMode === "chat"
                        ? "bg-[#258e33]/95 backdrop-blur-md text-white shadow-md border border-white/30"
                        : "hover:bg-white/15 backdrop-blur-sm text-white border border-transparent"
                    }`}
                  >
                    {/* Contact Avatar */}
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

                    {/* Contact Text details */}
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
          {/* =================================================================== */}
          {/* WORKSPACE VIEW: CHAT / ANALYTICS / CATEGORIES / USERS               */}
          {/* =================================================================== */}

          {adminViewMode === "analytics" ? (
            /* 1. OPERATIONS & ANALYTICS MODE */
            <div className="flex-1 overflow-y-auto p-6 space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Phidim Operations & Analytics</h2>
                  <p className="text-xs text-slate-500">Live operational overview of home services across Panchthar district.</p>
                </div>
                <button
                  onClick={() => setAdminViewMode("chat")}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                >
                  ← Back to Chat & Dispatch
                </button>
              </div>

              {/* KPI Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4.5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200">Total Revenue</span>
                  <p className="text-2xl font-black font-mono">NPR 486,200</p>
                  <p className="text-[11px] text-emerald-100 flex items-center gap-1"><TrendingUp size={12} /> +18.4% this month</p>
                </div>

                <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Bookings</span>
                  <p className="text-2xl font-black text-slate-900 font-mono">1,842</p>
                  <p className="text-[11px] text-emerald-600 font-bold">96.8% Completion Rate</p>
                </div>

                <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Active Technicians</span>
                  <p className="text-2xl font-black text-slate-900 font-mono">164</p>
                  <p className="text-[11px] text-blue-600 font-bold">24 on duty right now</p>
                </div>

                <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Customer Base</span>
                  <p className="text-2xl font-black text-slate-900 font-mono">14,800+</p>
                  <p className="text-[11px] text-amber-600 font-bold">4.9 ★ Satisfaction</p>
                </div>
              </div>

              {/* Service Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Activity size={16} className="text-emerald-600" /> Top Requested Services (Phidim Ward 1-4)
                  </h3>
                  <div className="space-y-2">
                    {[
                      { name: "DishHome Fiber Splicing & Wi-Fi", percent: 85, count: "512 bookings" },
                      { name: "Split AC Gas Refill & Jet Wash", percent: 72, count: "398 bookings" },
                      { name: "Plumbing Leak Fix & Sanitary Fitting", percent: 64, count: "320 bookings" },
                      { name: "4-Camera CCTV HD Security Setup", percent: 58, count: "284 bookings" },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{item.name}</span>
                          <span className="text-slate-500">{item.count}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${item.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-blue-600" /> Recent Technician Verifications
                  </h3>
                  <div className="space-y-2">
                    {filteredContacts.filter((c) => c.role === "TECHNICIAN").slice(0, 4).map((tech) => (
                      <div key={tech.id} className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img src={tech.avatar} alt={tech.name} className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <p className="text-xs font-bold text-slate-800">{tech.displayName || tech.name}</p>
                            <p className="text-[10px] text-slate-400">{tech.category || "Field Specialist"}</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Verified
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : adminViewMode === "categories" ? (
            /* 2. CATEGORIES & SERVICES MANAGER MODE */
            <div className="flex-1 overflow-y-auto p-6 space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Technical Category & Service Package Manager</h2>
                  <p className="text-xs text-slate-500">Add, edit, or configure service categories and pricing for Panchthar.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddServiceModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                  >
                    + Add New Service
                  </button>
                  <button
                    onClick={() => setAdminViewMode("chat")}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                  >
                    ← Back to Chat
                  </button>
                </div>
              </div>

              {/* Add category form */}
              <form onSubmit={handleCreateCategory} className="flex gap-2 max-w-md">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="New category name (e.g. Solar Repair)"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-emerald-600"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                >
                  + Add Category
                </button>
              </form>

              {/* Categories list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoriesList.map((cat) => (
                  <div key={cat.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{cat.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Active</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Service offerings in Phidim & Panchthar</p>
                  </div>
                ))}
              </div>
            </div>
          ) : adminViewMode === "users" ? (
            /* 3. ALL USERS DIRECTORY MODE */
            <div className="flex-1 overflow-y-auto p-6 space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Users & Technicians Directory</h2>
                  <p className="text-xs text-slate-500">Overview of all registered customers, field technicians, and staff accounts.</p>
                </div>
                <button
                  onClick={() => setAdminViewMode("chat")}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  ← Back to Chat
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {contacts.map((u) => (
                  <div key={u.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{u.displayName || u.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                        <span className="text-[9px] font-bold text-emerald-700">{u.category || u.role}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setAdminViewMode("chat");
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-sm"
                    >
                      Chat
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : adminViewMode === "announcements" ? (
            /* 4. ANNOUNCEMENTS & PROMO BANNER EDITOR */
            <div className="flex-1 overflow-y-auto p-6 space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Broadcast Announcements & Offer Banner Editor</h2>
                  <p className="text-xs text-slate-500">Edit the top marquee offer banner and publish system notices to all Phidim users.</p>
                </div>
                <button
                  onClick={() => setAdminViewMode("chat")}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  ← Back to Chat
                </button>
              </div>

              {/* Offer Banner Text Editor */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-emerald-50/40 space-y-3 max-w-xl">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Megaphone size={16} className="text-emerald-600" /> Live Offer Banner Text
                </h3>
                <textarea
                  value={bannerInputText}
                  onChange={(e) => setBannerInputText(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-emerald-600"
                />
                <button
                  onClick={() => {
                    setOfferBannerText(bannerInputText);
                    showToast("Live offer banner text updated successfully!");
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0d872d] hover:bg-[#0b7025] text-white text-xs font-bold shadow-sm"
                >
                  Save & Update Banner
                </button>
              </div>
            </div>
          ) : (
            /* 5. DEFAULT: LIVE CHAT & DISPATCH CANVAS */
            <>
              {/* Active Chat Header */}
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

                  {/* Call & Direct Actions */}
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
                      Admin Communication with {selectedUser?.displayName || selectedUser?.name || "User"}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Send official system notices, dispatch job assignments, or respond to customer queries.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center pt-2">
                      {[
                        "Hello! Please confirm your technician duty status.",
                        "Your doorstep service ticket in Phidim is confirmed.",
                        "Please check your technician assignment details.",
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
                      msg.sender === (adminUser?.email || adminUser?.id || "admin") ||
                      msg.sender === adminUser?.email ||
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

              {/* Bottom Floating Pill Chat Input Bar */}
              <div className="p-4 sm:p-6 bg-transparent flex-shrink-0">
                <div ref={attachMenuRef} className="relative max-w-4xl mx-auto w-full">
                  {/* Attachment Popover */}
                  <AnimatePresence>
                    {showAttachMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-4 bottom-14 bg-white/95 dark:bg-[#071911]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-emerald-800/40 p-2 z-50 flex flex-col gap-1 w-56 text-xs font-semibold text-slate-700 dark:text-slate-200"
                      >
                        <button
                          onClick={() => {
                            setShowAttachMenu(false);
                            setIsAddServiceModalOpen(true);
                          }}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-800 text-left"
                        >
                          <Plus size={15} className="text-emerald-600" /> Create Service Package
                        </button>
                        <button
                          onClick={() => {
                            setShowAttachMenu(false);
                            handleSendMessage("📢 [Admin Broadcast]: Official duty schedule updated for Ward 1-4.");
                          }}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-800 text-left"
                        >
                          <Megaphone size={15} className="text-blue-600" /> Send Broadcast Notice
                        </button>
                        <button
                          onClick={() => {
                            setShowAttachMenu(false);
                            handleSendMessage("📍 Admin Location: Phidim Central Office, Ward 1");
                          }}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-800 text-left"
                        >
                          <MapPin size={15} className="text-amber-600" /> Share HQ Address
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
                      title="Admin Actions"
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
            </>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODALS (Offer Banner Editor, Add Service, Settings)                     */}
      {/* ========================================================================= */}

      {/* Offer Banner Editor Modal */}
      <AnimatePresence>
        {isOfferEditorOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/95 dark:bg-[#071911]/95 backdrop-blur-2xl rounded-3xl p-6 max-w-md w-full shadow-2xl border border-emerald-500/30 space-y-4 relative"
            >
              <button
                onClick={() => setIsOfferEditorOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-emerald-950/60 hover:bg-slate-200 text-slate-500"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Megaphone size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Admin Offer Editor</span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Edit Top Offer Banner</h3>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Banner Announcement Text:</label>
                <textarea
                  value={bannerInputText}
                  onChange={(e) => setBannerInputText(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-emerald-800/40 bg-slate-50 dark:bg-emerald-950/50 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setOfferBannerText(bannerInputText);
                    setIsOfferEditorOpen(false);
                    showToast("Live offer banner text updated!");
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-[#0d872d] hover:bg-[#0b7025] text-white text-xs font-bold shadow-md transition-all hover:scale-102"
                >
                  Save & Publish Live
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Service Modal */}
      <AnimatePresence>
        {isAddServiceModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/95 dark:bg-[#071911]/95 backdrop-blur-2xl rounded-3xl p-6 max-w-md w-full shadow-2xl border border-emerald-500/30 space-y-4 relative"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-emerald-900/40">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus size={18} className="text-emerald-600 dark:text-emerald-400" /> Create Technical Service
                </h3>
                <button
                  onClick={() => setIsAddServiceModalOpen(false)}
                  className="p-1.5 rounded-full bg-slate-100 dark:bg-emerald-950/60 hover:bg-slate-200 text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateService} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200">Service Title:</label>
                  <input
                    type="text"
                    required
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="e.g. Inverter Battery Maintenance"
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-emerald-800/40 bg-slate-50 dark:bg-emerald-950/50 outline-none focus:border-emerald-600 text-slate-800 dark:text-slate-100 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200">Category:</label>
                  <select
                    value={newServiceCat}
                    onChange={(e) => setNewServiceCat(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-emerald-800/40 outline-none focus:border-emerald-600 bg-white dark:bg-emerald-950 text-slate-800 dark:text-slate-100 font-medium"
                  >
                    {categoriesList.filter((c) => c.id !== "all").map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200">Base Price (NPR):</label>
                  <input
                    type="number"
                    required
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-emerald-800/40 bg-slate-50 dark:bg-emerald-950/50 outline-none focus:border-emerald-600 text-slate-800 dark:text-slate-100 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#0d872d] hover:bg-[#0b7025] text-white font-bold shadow-md transition-all hover:scale-102"
                >
                  Publish Service to Marketplace
                </button>
              </form>
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
                  <Settings size={18} className="text-emerald-600 dark:text-emerald-400" /> Administrator Settings
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
