"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Briefcase,
  Wrench,
  Navigation,
  CalendarPlus,
  CreditCard,
  MessageSquare,
  Settings,
  HelpCircle,
  Search,
  Bell,
  Sparkles,
  ArrowUpRight,
  Sliders,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  Zap,
  Camera,
  Wifi,
  Wind,
  Tv,
  Droplet,
  Monitor,
  Phone,
  Video,
  X,
  Send,
  Calendar,
  MapPin,
  FileText,
  Download,
  AlertTriangle,
  Menu,
  ChevronDown,
  Layers,
  Star,
  Check,
  MoreHorizontal,
  DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BookingFields, useBookingForm } from "@/components/BookingFields";
import { useAuth } from "@/context/AuthContext";
import { useCall } from "@/components/calls/CallProvider";
import {
  getBookingsList,
  subscribeBookings
} from "@/lib/bookingStore";
import { triggerBackendWarning, BACKEND_READY } from "@/lib/backendWarning";
import {
  getConversationMessages,
  saveMessageToConversation,
  subscribeChatStore,
  playMessageChime
} from "@/lib/chatStore";
import { fetchWeather } from "@/services/weatherService";
import { SERVICES, SERVICE_CATEGORIES } from "@/data/services";
import { AccountSettings } from "@/components/AccountSettings";

// Category Icons Map
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

export default function UserDashboardNewUI({ initialTab = "dashboard" }) {
  const { user, logout } = useAuth();
  const { startCall } = useCall() || {};

  // Active User representation
  const currentUser = user || {
    id: "usr-cust-semik",
    name: "Semik Serma",
    displayName: "Semik Serma",
    email: "semikserma@gmail.com",
    phone: "+977 9862772400",
    role: "USER",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    address: "Phidim-1, Panchthar",
  };

  // Nav state
  const [activeTab, setActiveTab] = useState(
    initialTab === "my-bookings" ? "bookings" : initialTab || "dashboard"
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Time & Weather
  const [nepalTimeStr, setNepalTimeStr] = useState("3:00 AM");
  const [localTimeStr, setLocalTimeStr] = useState("3:00 AM");
  const [weatherInfo, setWeatherInfo] = useState("Today 3:00 AM Rain At Phidim");

  // Bookings Store state
  const [bookings, setBookings] = useState([]);
  const [tableFilter, setTableFilter] = useState("My Bookings"); // "My Bookings" | "Categories" | "Emergency" | "Completed"
  const [timeRange, setTimeRange] = useState("1D"); // "1D" | "2W" | "1M"
  const [serviceCategoryTab, setServiceCategoryTab] = useState("All"); // "All" | "CCTV" | "AC" | "Fiber"

  // Modals state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const bookingForm = useBookingForm(isBookingModalOpen);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [selectedBookingForTracking, setSelectedBookingForTracking] = useState(null);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [activeChatPartner, setActiveChatPartner] = useState(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Booking Form fields
  const [bookServiceId, setBookServiceId] = useState(SERVICES[0]?.id || "srv-cctv-install");
  const [bookAddress, setBookAddress] = useState("Phidim-1, Main Bazar, Panchthar");
  const [bookDate, setBookDate] = useState(new Date().toISOString().split("T")[0]);
  const [bookIsEmergency, setBookIsEmergency] = useState(false);
  const [bookNotes, setBookNotes] = useState("");

  // Chat message input
  const [chatInputText, setChatInputText] = useState("");
  const [chatVersion, setChatVersion] = useState(0);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Dropdown click-outside refs
  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  const chatMessagesEndRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync Clocks (Nepal Time UTC+5:45 & Local Time)
  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      setLocalTimeStr(now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true }));

      const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
      const nepalOffset = 5.75 * 3600000;
      const nepalDate = new Date(utcTime + nepalOffset);
      setNepalTimeStr(nepalDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true }));
    };
    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Phidim Weather
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await fetchWeather();
        if (active && data) {
          const condition = data.condition?.label || (data.isRainingNow ? "Rain" : "Clear");
          const temp = data.currentTemp ? `${data.currentTemp}°C` : "";
          setWeatherInfo(`Phidim ${temp} • ${condition}`);
        }
      } catch (e) {
        if (active) setWeatherInfo("Phidim, Panchthar • 18°C Partly Cloudy");
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  // Load Bookings from Reactive Store
  useEffect(() => {
    setBookings(getBookingsList(currentUser.email));
    const unsubscribe = subscribeBookings((newList) => {
      if (newList) {
        setBookings(newList.filter(booking => !booking.customerEmail || booking.customerEmail.toLowerCase() === currentUser.email?.toLowerCase()));
      }
    });
    return () => unsubscribe();
  }, [currentUser.email]);

  // Subscribe to Chat Store updates
  useEffect(() => {
    const unsub = subscribeChatStore(() => {
      setChatVersion((v) => v + 1);
    });
    return () => unsub();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setIsNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered Bookings Table
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (tableFilter === "Emergency" && !b.isEmergency) return false;
      if (tableFilter === "Completed" && b.status !== "Completed") return false;
      if (tableFilter === "Categories" && serviceCategoryTab !== "All") {
        if (!b.category?.toLowerCase().includes(serviceCategoryTab.toLowerCase())) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = b.serviceName?.toLowerCase().includes(q);
        const matchId = String(b.id ?? "").toLowerCase().includes(q);
        const matchTech = b.technician?.name?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchTech) return false;
      }
      return true;
    });
  }, [bookings, tableFilter, serviceCategoryTab, searchQuery]);

  // Handle Book Service Submission
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    const serviceObj = SERVICES.find((s) => s.id === bookServiceId) || SERVICES[0];

    const newBooking = await bookingForm.submit({
      serviceName: serviceObj.name,
      category: serviceObj.category,
      customerName: currentUser.displayName || currentUser.name || "Semik Serma",
      customerEmail: currentUser.email,
      customerPhone: currentUser.phone || "+977 9862772400",
      address: bookAddress,
      date: bookDate,
      amount: `Rs. ${serviceObj.basePrice?.toLocaleString() || "1,500"}`,
      numericAmount: serviceObj.basePrice || 1500,
      paymentStatus: "Cash / Fonepay on Completion",
      isEmergency: bookIsEmergency,
      notes: bookNotes,
    });

    if (!newBooking) return;
    setIsBookingModalOpen(false);
    showToast(`Booking #${newBooking.id} created. Status: ${newBooking.status}.`);
    setBookNotes("");
  };

  // Open Live Tracking
  const handleOpenTracking = (booking) => {
    setSelectedBookingForTracking(booking || bookings[0]);
    setIsTrackingModalOpen(true);
  };

  // Open Chat Drawer with a Technician
  const handleOpenChat = (partner) => {
    setActiveChatPartner(
      partner || {
        name: "Rajesh Tamang",
        displayName: "Rajesh Tamang",
        role: "TECHNICIAN",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        specialty: "Senior CCTV & Electrical Lead",
        online: true,
      }
    );
    setIsChatDrawerOpen(true);
  };

  // Send message in Chat Drawer
  const handleSendMessage = () => {
    if (!BACKEND_READY) {
      triggerBackendWarning();
      return;
    }
    if (!chatInputText.trim() || !activeChatPartner) return;
    const myId = currentUser.email || "user";
    const theirId = activeChatPartner.email || activeChatPartner.name || "tech";

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: myId,
      senderName: currentUser.displayName || currentUser.name || "Customer",
      text: chatInputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true }),
      status: "delivered",
    };

    saveMessageToConversation(myId, theirId, newMsg);
    playMessageChime();
    setChatInputText("");
    setChatVersion((v) => v + 1);

    // Auto-reply simulation from on-duty technician
    setTimeout(() => {
      const reply = {
        id: `reply-${Date.now()}`,
        sender: theirId,
        senderName: activeChatPartner.displayName || activeChatPartner.name,
        text: "Namaste! I am on duty in Phidim. I have noted your location and will arrive on schedule.",
        timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true }),
        status: "delivered",
      };
      saveMessageToConversation(myId, theirId, reply);
      playMessageChime();
      setChatVersion((v) => v + 1);
    }, 1200);
  };

  // Current chat messages
  const chatMessages = useMemo(() => {
    if (!activeChatPartner) return [];
    const myId = currentUser.email || "user";
    const theirId = activeChatPartner.email || activeChatPartner.name || "tech";
    const msgs = getConversationMessages(myId, theirId);
    if (msgs.length === 0) {
      return [
        {
          id: "init-1",
          sender: theirId,
          senderName: activeChatPartner.displayName || activeChatPartner.name,
          text: `Hello ${currentUser.name}! How can our Phidim technical team assist you today?`,
          timestamp: "Just now",
          status: "delivered",
        },
      ];
    }
    return msgs;
  }, [activeChatPartner, currentUser.email, currentUser.name, chatVersion]);

  useEffect(() => {
    if (isChatDrawerOpen) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatDrawerOpen]);

  // Featured Specialist for bottom-right card
  const featuredTech = {
    name: "Rajesh Tamang",
    title: "Senior CCTV & Electrical Lead",
    rating: "4.98 ★",
    jobsDone: "140+ jobs in Panchthar",
    price: "Rs. 1,500",
    status: "On-Duty Now",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    badge: "Verified Specialist",
  };

  // Popular Services for middle-right card
  const popularServicesList = [
    {
      id: "srv-cctv",
      name: "4-Camera HD CCTV Setup",
      category: "CCTV",
      price: "Rs. 3,500",
      numeric: 3500,
      icon: Camera,
      tag: "Security",
    },
    {
      id: "srv-ac",
      name: "Split AC Gas Refill & Clean",
      category: "AC",
      price: "Rs. 2,200",
      numeric: 2200,
      icon: Wind,
      tag: "Cooling",
    },
    {
      id: "srv-fiber",
      name: "Fiber Splicing & Wi-Fi Ext",
      category: "Fiber",
      price: "Rs. 1,800",
      numeric: 1800,
      icon: Wifi,
      tag: "Internet",
    },
    {
      id: "srv-plumb",
      name: "Sanitary Pipe Leak Fix",
      category: "All",
      price: "Rs. 1,200",
      numeric: 1200,
      icon: Droplet,
      tag: "Plumbing",
    },
  ];

  const filteredPopularServices = useMemo(() => {
    if (serviceCategoryTab === "All") return popularServicesList;
    return popularServicesList.filter((s) => s.category === serviceCategoryTab || s.category === "All");
  }, [serviceCategoryTab]);

  return (
    <div className="bg-[#0b0b0f] text-[#ededed] min-h-screen flex flex-col lg:flex-row font-sans selection:bg-white selection:text-black">
      {/* Toast Notification Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 bg-[#191922] text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-2.5 backdrop-blur-xl"
          >
            <CheckCircle2 size={16} className="text-white" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* LEFT SIDEBAR (EXACT STYLING FROM REFERENCE IMAGE)                        */}
      {/* ========================================================================= */}
      <aside
        className={`w-[245px] lg:w-[250px] bg-[#0f0f14] border-r border-white/[0.06] p-4 flex flex-col justify-between flex-shrink-0 z-30 transition-all duration-300 ${
          mobileSidebarOpen ? "fixed inset-y-0 left-0 shadow-2xl z-50 flex" : "hidden lg:flex"
        }`}
      >
        <div className="space-y-6">
          {/* Top User Profile Widget */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img
                  src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover border border-white/20"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0f0f14]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{currentUser.displayName || currentUser.name}</h4>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-neutral-400 truncate">@semik_serma</span>
                  <span className="bg-white/10 text-white text-[9px] px-1.5 py-0.2 rounded-md font-semibold border border-white/10">
                    Pro
                  </span>
                </div>
              </div>
            </div>
            {mobileSidebarOpen && (
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden text-neutral-400 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Nav Section: MENU */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">MENU</span>
              <Sliders size={12} className="text-neutral-400 hover:text-white cursor-pointer" />
            </div>

            {/* Dashboard Link */}
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === "dashboard"
                  ? "bg-gradient-to-r from-[#1e1e28] to-[#161620] text-white border border-white/10 shadow-inner font-semibold"
                  : "text-neutral-300 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <LayoutDashboard size={16} className={activeTab === "dashboard" ? "text-white" : "text-neutral-400"} />
              <span>Dashboard</span>
            </button>

            {/* My Bookings Link */}
            <button
              onClick={() => {
                setActiveTab("bookings");
                setTableFilter("My Bookings");
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === "bookings"
                  ? "bg-gradient-to-r from-[#1e1e28] to-[#161620] text-white border border-white/10 shadow-inner font-semibold"
                  : "text-neutral-300 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Briefcase size={16} className={activeTab === "bookings" ? "text-white" : "text-neutral-400"} />
                <span>My Bookings</span>
              </div>
              <span className="bg-white/10 text-neutral-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                {bookings.length}
              </span>
            </button>

            {/* Services Catalog */}
            <button
              onClick={() => {
                setActiveTab("services");
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === "services"
                  ? "bg-gradient-to-r from-[#1e1e28] to-[#161620] text-white border border-white/10 shadow-inner font-semibold"
                  : "text-neutral-300 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Wrench size={16} className={activeTab === "services" ? "text-white" : "text-neutral-400"} />
              <span>Services Catalog</span>
            </button>

            {/* Track Technician */}
            <button
              onClick={() => {
                handleOpenTracking();
                setMobileSidebarOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-center gap-3">
                <Navigation size={16} className="text-neutral-400" />
                <span>Track Technician</span>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30 animate-pulse">
                Live
              </span>
            </button>
          </div>

          {/* Nav Section: SERVICES / MANAGEMENT */}
          <div className="space-y-1">
            <div className="px-2 mb-2">
              <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">SERVICES</span>
            </div>

            <button
              onClick={() => {
                setIsBookingModalOpen(true);
                setMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <CalendarPlus size={16} className="text-neutral-400" />
              <span>Book New Service</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("payments");
                setMobileSidebarOpen(false);
                showToast("Opening Payments & Billing Ledger");
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-center gap-3">
                <CreditCard size={16} className="text-neutral-400" />
                <span>Payments & Receipts</span>
              </div>
              <span className="bg-white/10 text-neutral-300 text-[9px] font-semibold px-1.5 py-0.5 rounded-md">
                eSewa
              </span>
            </button>

            <button
              onClick={() => {
                handleOpenChat();
                setMobileSidebarOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-center gap-3">
                <MessageSquare size={16} className="text-neutral-400" />
                <span>Technician Chat</span>
              </div>
              <span className="bg-white text-black text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                2
              </span>
            </button>
          </div>

          {/* Nav Section: UTILITIES */}
          <div className="space-y-1">
            <div className="px-2 mb-2">
              <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">PREFERENCES</span>
            </div>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <Settings size={15} className="text-neutral-400" />
              <span>Settings</span>
            </button>

            <button
              onClick={() => setIsAiModalOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <HelpCircle size={15} className="text-neutral-400" />
              <span>Support Center</span>
            </button>
          </div>
        </div>

        {/* Bottom AI Promo Card (Replicating "Your AI Friend in Trade" from image) */}
        <div
          onClick={() => setIsAiModalOpen(true)}
          className="mt-6 p-3.5 rounded-2xl bg-gradient-to-b from-[#181822] to-[#101016] border border-white/10 hover:border-white/20 transition-all cursor-pointer relative overflow-hidden shadow-lg group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/10">
              <Sparkles size={14} className="text-amber-300 group-hover:rotate-12 transition-transform" />
            </div>
            <span className="text-[9px] bg-white/10 text-neutral-300 px-2 py-0.5 rounded-full font-semibold">
              Phidim
            </span>
          </div>

          <div className="space-y-1">
            <span className="inline-block text-[8px] uppercase tracking-wider text-neutral-300 font-bold bg-white/[0.06] px-1.5 py-0.2 rounded-sm">
              NEW ERA
            </span>
            <p className="text-xs font-bold text-white leading-tight">
              Your AI Assistant <br /> in Phidim
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* ========================================================================= */}
      {/* MAIN CONTENT WORKSPACE                                                   */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6">
        {/* TOP BAR / BREADCRUMB & HEADER */}
        <div className="space-y-2">
          {/* Mobile hamburger + Breadcrumb */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-[#171720] border border-white/10 text-white"
              >
                <Menu size={16} />
              </button>
              <div className="text-xs font-medium text-neutral-400">
                <span>Phidim Service</span>
                <span className="text-neutral-500 mx-1">/</span>
                <span className="text-white font-semibold">Customer Dashboard</span>
              </div>
            </div>

            {/* Weather / Time pill (desktop) */}
            <div className="hidden md:flex items-center gap-2 text-[11px] font-medium bg-[#14141c] border border-white/[0.08] px-3 py-1 rounded-full text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{weatherInfo}</span>
              <span className="text-neutral-600">|</span>
              <span className="text-white font-semibold">NPT: {nepalTimeStr}</span>
            </div>
          </div>

          {/* Main Title Row & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome to Phidim Service !
            </h1>

            {/* Right Controls: Search, Bell, White CTA Button */}
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-56">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search services or bookings..."
                  className="w-full bg-[#15151e] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              {/* Notification Bell */}
              <div ref={notificationRef} className="relative flex-shrink-0">
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="p-2.5 rounded-xl bg-[#15151e] border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white transition-colors relative"
                  title="Notifications"
                >
                  <Bell size={16} />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0b0b0f]" />
                </button>

                {/* Notifications Popover */}
                <AnimatePresence>
                  {isNotificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 top-12 w-80 bg-[#161620] border border-white/15 rounded-2xl p-3 shadow-2xl z-50 space-y-2 backdrop-blur-2xl"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <span className="text-xs font-bold text-white">Notifications</span>
                        <span className="text-[10px] text-emerald-400 font-semibold cursor-pointer hover:underline">
                          Mark all read
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="p-2 rounded-xl bg-white/[0.04] border border-white/5 space-y-0.5">
                          <p className="font-bold text-white text-[11px]">Technician Dispatched</p>
                          <p className="text-[10px] text-neutral-400">
                            Rajesh Tamang is on the way for CCTV Installation (#PS-9482).
                          </p>
                          <span className="text-[9px] text-neutral-500">5 mins ago</span>
                        </div>
                        <div className="p-2 rounded-xl hover:bg-white/[0.02] space-y-0.5">
                          <p className="font-bold text-white text-[11px]">Seasonal Offer Active</p>
                          <p className="text-[10px] text-neutral-400">
                            20% Discount available on Plumbing & Sanitary services in Phidim!
                          </p>
                          <span className="text-[9px] text-neutral-500">1 hour ago</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* White Primary CTA Button: Book Service (Replicating Deposit button) */}
              <button
                onClick={() => setIsBookingModalOpen(true)}
                className="bg-white text-black font-bold text-xs px-5 py-2.5 rounded-full hover:bg-neutral-200 active:scale-95 transition-all shadow-md flex items-center gap-1.5 flex-shrink-0"
              >
                <span>Book Service</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MIDDLE ROW (3 CARDS EXACTLY REPLICATING IMAGE)                           */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
          {/* 1. HERO FEATURE CARD ("Customise your Portfolio" in image) */}
          <div className="xl:col-span-4 bg-[#14141c] border border-white/[0.07] rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
            {/* Top decorative visual / safe box */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#1f1f2a] border border-white/10 flex items-center justify-center text-white shadow-inner">
                <ShieldCheck size={20} className="text-white" />
              </div>
              {/* Subtle visual lines */}
              <div className="space-y-1.5 opacity-40">
                <div className="h-1.5 w-24 bg-white/20 rounded-full" />
                <div className="h-1.5 w-16 bg-white/10 rounded-full" />
              </div>
            </div>

            {/* Title and description */}
            <div className="my-6 space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Customise your Service Plan
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                A curated collection showcasing verified technicians in Panchthar for electrical, CCTV, plumbing & AC.
              </p>
            </div>

            {/* White Action Pill Button */}
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="w-full bg-white text-black font-bold text-xs py-2.5 rounded-full hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center"
            >
              Book a Technician
            </button>
          </div>

          {/* 2. ACTIVITY BAR CHART CARD ("Eth/USDT" in image) */}
          <div className="xl:col-span-4 bg-[#14141c] border border-white/[0.07] rounded-3xl p-5 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
            {/* Header: Title + Time + Dots */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Phidim Service Activity</h3>
                  <span className="text-[10px] text-neutral-400 font-medium">3:00 AM (NPT +5:45)</span>
                </div>
                <button className="text-neutral-500 hover:text-white p-1">
                  <MoreHorizontal size={16} />
                </button>
              </div>

              {/* Legend: Completed vs In Progress */}
              <div className="flex items-center gap-4 text-[10px] font-semibold text-neutral-400 mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-neutral-600" />
                  <span>In Progress</span>
                </div>
              </div>
            </div>

            {/* Vertical Bar Chart (Replicating exact bars from image) */}
            <div className="relative pt-2 pb-1">
              {/* Left scale numbers */}
              <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[9px] text-neutral-600 font-mono select-none">
                <span>16</span>
                <span>15</span>
                <span>14</span>
              </div>

              {/* Bars container */}
              <div className="pl-6 grid grid-cols-7 gap-2 items-end h-28 border-b border-white/[0.08] pb-1">
                {[
                  { day: "Sun", completed: 75, progress: 40 },
                  { day: "Mon", completed: 90, progress: 65 },
                  { day: "Tue", completed: 82, progress: 50 },
                  { day: "Wed", completed: 98, progress: 30 },
                  { day: "Thu", completed: 70, progress: 60 },
                  { day: "Fri", completed: 88, progress: 75 },
                  { day: "Sat", completed: 92, progress: 45 },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="w-full max-w-[18px] flex flex-col gap-1 items-center h-full justify-end">
                      {/* Bar 1: In Progress */}
                      <div
                        className="w-full bg-neutral-700 rounded-full transition-all group-hover:bg-neutral-600"
                        style={{ height: `${item.progress * 0.35}%` }}
                      />
                      {/* Bar 2: Completed (Gradient white to grey) */}
                      <div
                        className="w-full bg-gradient-to-t from-neutral-400 to-white rounded-full transition-all group-hover:from-white group-hover:to-white shadow-sm"
                        style={{ height: `${item.completed * 0.65}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-neutral-400 font-medium group-hover:text-white transition-colors">
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Stat Row: 8.9% -> 98.9% with +2% badge */}
            <div className="flex items-center justify-between pt-3">
              <span className="text-2xl font-extrabold text-white tracking-tight">98.9%</span>
              <div className="flex items-center gap-1 bg-[#1e1e28] text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/10">
                <span className="text-emerald-400">↑ 2%</span>
                <span className="text-neutral-400 text-[10px]">vs last Month</span>
              </div>
            </div>
          </div>

          {/* 3. POPULAR SERVICES / TOKENS CARD ("Type of tokens in my portfolio" in image) */}
          <div className="xl:col-span-4 bg-[#14141c] border border-white/[0.07] rounded-3xl p-5 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
            <div>
              <h3 className="text-sm font-bold text-white mb-2">Popular Doorstep Services</h3>

              {/* Category Pills (All market, Crypto, USDT, BNB -> All, CCTV, AC, Fiber) */}
              <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1 scrollbar-none">
                {["All", "CCTV", "AC", "Fiber"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setServiceCategoryTab(tab)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                      serviceCategoryTab === tab
                        ? "bg-white text-black shadow-sm"
                        : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    {tab === "All" ? "All Services" : tab}
                  </button>
                ))}
              </div>

              {/* Service Rows */}
              <div className="space-y-2.5">
                {filteredPopularServices.slice(0, 3).map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-2xl bg-[#181822]/60 hover:bg-[#181822] border border-white/[0.05] flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white">
                          <Icon size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white truncate max-w-[130px] sm:max-w-[170px]">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-neutral-400 font-mono">{item.price}</p>
                        </div>
                      </div>

                      {/* Dark Pill Action Button (Replicating Withdraw button) */}
                      <button
                        onClick={() => {
                          setBookServiceId(item.id);
                          setIsBookingModalOpen(true);
                        }}
                        className="px-3 py-1 rounded-xl bg-[#22222c] hover:bg-[#2c2c38] text-white text-[11px] font-semibold border border-white/10 transition-all shadow-xs"
                      >
                        Book
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick helper note */}
            <div className="pt-2 text-[10px] text-neutral-500 flex items-center justify-between">
              <span>Standard Panchthar doorstep rate</span>
              <span className="text-white hover:underline cursor-pointer" onClick={() => setActiveTab("services")}>
                View All →
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM ROW (WIDE ASSETS TABLE + RIGHT FEATURED CARD)                      */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* 1. WIDE TABLE CARD ("Assets" in image) */}
          <div className="xl:col-span-8 bg-[#14141c] border border-white/[0.07] rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.3)] space-y-4">
            {/* Header: Title, Grid/List Toggles */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Recent Service Requests</h3>
              <div className="flex items-center gap-1 text-neutral-400">
                <button
                  onClick={() => setTableFilter("My Bookings")}
                  className={`p-1.5 rounded-lg transition-colors ${tableFilter === "My Bookings" ? "text-white bg-white/10" : "hover:text-white"}`}
                >
                  <Layers size={15} />
                </button>
              </div>
            </div>

            {/* Filter Tabs Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                {["My Bookings", "Categories", "Emergency", "Completed"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setTableFilter(tab)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      tableFilter === tab
                        ? "bg-[#22222d] text-white border border-white/10 shadow-xs"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Time Range Pills: 1D, 2W, 1M */}
              <div className="flex items-center gap-1 self-end sm:self-auto bg-[#171722] p-1 rounded-xl border border-white/[0.06]">
                {["1D", "2W", "1M"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                      timeRange === range ? "bg-white text-black" : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Header & Rows */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-neutral-400 text-[11px] font-medium border-b border-white/[0.04]">
                    <th className="pb-3 font-semibold">Service & ID ↓</th>
                    <th className="pb-3 font-semibold">Fee (NPR) ↓</th>
                    <th className="pb-3 font-semibold">Status ↓</th>
                    <th className="pb-3 font-semibold">Specialist ↓</th>
                    <th className="pb-3 font-semibold text-center">Chart ↓</th>
                    <th className="pb-3 font-semibold text-right">Action ↓</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-neutral-500">
                        No service bookings found in this view.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.slice(0, 4).map((booking, idx) => {
                      const isEmergency = booking.isEmergency;
                      const isOnWay = booking.status === "On The Way";
                      const isCompleted = booking.status === "Completed";

                      return (
                        <tr key={booking.id || idx} className="hover:bg-white/[0.02] transition-colors group">
                          {/* 1. Service & ID */}
                          <td className="py-3.5 pr-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white flex-shrink-0">
                                <Wrench size={13} />
                              </div>
                              <div className="min-w-0 max-w-[150px] sm:max-w-[180px]">
                                <p className="font-bold text-white truncate text-xs">{booking.serviceName}</p>
                                <p className="text-[10px] text-neutral-400 font-mono">{booking.id}</p>
                              </div>
                            </div>
                          </td>

                          {/* 2. Price */}
                          <td className="py-3.5 font-bold text-white font-mono">{booking.amount || "Rs. 1,500"}</td>

                          {/* 3. Status Badge */}
                          <td className="py-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                                isOnWay
                                  ? "bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse"
                                  : isCompleted
                                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                  : "bg-blue-500/10 text-blue-300 border-blue-500/30"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isOnWay ? "bg-amber-400" : isCompleted ? "bg-emerald-400" : "bg-blue-400"
                                }`}
                              />
                              {booking.status || "Assigned"}
                            </span>
                          </td>

                          {/* 4. Specialist / Area */}
                          <td className="py-3.5 text-neutral-300 text-[11px]">
                            {booking.technician?.name || "Rajesh Tamang"}
                            <span className="block text-[10px] text-neutral-400">Phidim-1</span>
                          </td>

                          {/* 5. Trend Chart (SVG Sparkline waveform matching image!) */}
                          <td className="py-3.5 text-center">
                            <svg className="w-20 h-6 mx-auto stroke-white/60 fill-none" viewBox="0 0 100 24">
                              <path
                                d={
                                  idx === 0
                                    ? "M0,18 Q25,2 50,14 T100,6"
                                    : idx === 1
                                    ? "M0,8 Q25,20 50,6 T100,16"
                                    : idx === 2
                                    ? "M0,14 Q25,6 50,18 T100,8"
                                    : "M0,16 Q25,12 50,4 T100,10"
                                }
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </td>

                          {/* 6. Action Button */}
                          <td className="py-3.5 text-right">
                            {isOnWay ? (
                              <button
                                onClick={() => handleOpenTracking(booking)}
                                className="px-3 py-1 rounded-xl bg-white text-black text-[11px] font-bold hover:bg-neutral-200 transition-all shadow-xs"
                              >
                                Track
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenChat(booking.technician)}
                                className="px-3 py-1 rounded-xl bg-[#22222d] hover:bg-[#2d2d3b] text-neutral-300 hover:text-white text-[11px] font-semibold border border-white/10 transition-all"
                              >
                                Chat
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. FEATURED CARD ("Monero Xmr" in image) */}
          <div className="xl:col-span-4 bg-[#14141c] border border-white/[0.07] rounded-3xl p-5 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
            {/* Top row with Circle Icon + Top Right Arrow */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-[#20202c] border border-white/10 flex items-center justify-center text-white">
                  <ShieldCheck size={20} className="text-white" />
                </div>
                <button
                  onClick={() => handleOpenChat(featuredTech)}
                  className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/15 text-white flex items-center justify-center transition-colors"
                  title="Direct Action"
                >
                  <ArrowUpRight size={16} />
                </button>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-0.5 mb-6">
                <h3 className="text-base font-bold text-white">{featuredTech.name}</h3>
                <p className="text-xs text-neutral-400">{featuredTech.title}</p>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-semibold">{featuredTech.status}</span>
                </div>
              </div>

              {/* Pricing & Volume/Rating */}
              <div className="space-y-2 border-t border-white/[0.06] pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Starting Visit Fee</span>
                  <span className="font-bold text-white font-mono">{featuredTech.price}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Rating & Reviews</span>
                  <span className="font-bold text-white">{featuredTech.rating}</span>
                </div>
              </div>
            </div>

            {/* Bottom 2 Buttons (Transfer / Trade -> Direct Call / Instant Book) */}
            <div className="grid grid-cols-2 gap-2.5 pt-6">
              <button
                onClick={() => handleOpenChat(featuredTech)}
                className="w-full py-2.5 rounded-2xl bg-[#22222d] hover:bg-[#2b2b3a] text-white text-xs font-semibold border border-white/10 transition-all flex items-center justify-center gap-1.5"
              >
                <Phone size={13} />
                <span>Call / Chat</span>
              </button>

              <button
                onClick={() => {
                  setBookServiceId("srv-cctv-install");
                  setIsBookingModalOpen(true);
                }}
                className="w-full py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all flex items-center justify-center shadow-sm active:scale-95"
              >
                Instant Book
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: NEW SERVICE BOOKING MODAL                                        */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-[#14141e] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 text-white"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
                    <CalendarPlus size={18} />
                  </div>
                  <h3 className="text-base font-bold text-white">Book Doorstep Technician</h3>
                </div>
                <button
                  onClick={() => setIsBookingModalOpen(false)}
                  className="p-1 rounded-xl text-neutral-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleConfirmBooking} className="space-y-3.5 text-xs">
                {/* Service Picker */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300">Select Service Required</label>
                  <select
                    value={bookServiceId}
                    onChange={(e) => setBookServiceId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#1c1c28] border border-white/10 text-white outline-none focus:border-white/40"
                  >
                    {SERVICES.map((srv) => (
                      <option key={srv.id} value={srv.id} className="bg-[#14141e] text-white">
                        {srv.name} — Rs. {srv.basePrice?.toLocaleString()} ({srv.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Customer Address in Phidim */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300">Service Location in Phidim</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      required
                      value={bookAddress}
                      onChange={(e) => setBookAddress(e.target.value)}
                      placeholder="e.g. Phidim-1, Main Bazar, near Clock Tower"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#1c1c28] border border-white/10 text-white outline-none focus:border-white/40"
                    />
                  </div>
                </div>

                {/* Date & Time Slot */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-300">Preferred Date</label>
                    <input
                      type="date"
                      required
                      value={bookDate}
                      onChange={(e) => setBookDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#1c1c28] border border-white/10 text-white outline-none focus:border-white/40"
                    />
                  </div>

                </div>

                <BookingFields form={bookingForm} />

                {/* Problem Description */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300">Problem details *</label>
                  <textarea
                    rows={2}
                    required
                    value={bookNotes}
                    onChange={(e) => setBookNotes(e.target.value)}
                    placeholder="Briefly describe what needs repair..."
                    className="w-full p-2.5 rounded-xl bg-[#1c1c28] border border-white/10 text-white outline-none focus:border-white/40"
                  />
                </div>

                {/* Emergency Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="emergency-check"
                    checked={bookIsEmergency}
                    onChange={(e) => setBookIsEmergency(e.target.checked)}
                    className="w-4 h-4 rounded accent-rose-500 cursor-pointer"
                  />
                  <label htmlFor="emergency-check" className="text-xs text-neutral-300 cursor-pointer">
                    Urgent service request
                  </label>
                </div>

                {/* Confirm Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={bookingForm.disabled}
                    className="w-full py-3 rounded-full bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all shadow-md active:scale-95"
                  >
                    Confirm Doorstep Booking
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: LIVE TECHNICIAN TRACKER MODAL                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isTrackingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#14141e] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 text-white"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Navigation size={18} className="text-emerald-400 animate-pulse" />
                  <h3 className="text-sm font-bold text-white">Live Field Technician Tracker</h3>
                </div>
                <button onClick={() => setIsTrackingModalOpen(false)} className="text-neutral-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {/* Technician Profile */}
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedBookingForTracking?.technician?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"}
                    alt="Technician"
                    className="w-10 h-10 rounded-full object-cover border border-white/20"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {selectedBookingForTracking?.technician?.name || "Rajesh Tamang"}
                    </h4>
                    <p className="text-[10px] text-neutral-400">
                      {selectedBookingForTracking?.technician?.specialty || "CCTV & Electrical Lead"}
                    </p>
                  </div>
                </div>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 animate-pulse">
                  On The Way
                </span>
              </div>

              {/* Route Progress in Phidim */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-[#1a1a26] border border-white/10 text-xs">
                <div className="flex justify-between text-neutral-400 text-[11px]">
                  <span>Estimated Arrival:</span>
                  <span className="text-white font-bold">12 - 18 Mins</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-400 h-2 rounded-full w-3/4 animate-pulse" />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                  <MapPin size={14} className="text-emerald-400" />
                  <span>Approaching Phidim-1, Main Road</span>
                </div>
              </div>

              {/* Call or Chat CTA */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    setIsTrackingModalOpen(false);
                    handleOpenChat(selectedBookingForTracking?.technician);
                  }}
                  className="py-2.5 rounded-xl bg-[#22222e] hover:bg-[#2c2c3b] text-white text-xs font-semibold border border-white/10 transition-all flex items-center justify-center gap-1.5"
                >
                  <MessageSquare size={14} />
                  <span>Send Message</span>
                </button>
                <a
                  href={`tel:${selectedBookingForTracking?.technician?.phone || "+9779842109842"}`}
                  className="py-2.5 rounded-full bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Phone size={14} />
                  <span>Call Technician</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: DIRECT CHAT SLIDE-OVER DRAWER                                   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isChatDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="w-full max-w-md h-full bg-[#13131c] border-l border-white/15 p-4 flex flex-col justify-between shadow-2xl text-white"
            >
              {/* Chat Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <img
                      src={activeChatPartner?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"}
                      alt={activeChatPartner?.name}
                      className="w-9 h-9 rounded-full object-cover border border-white/20"
                    />
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#13131c]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{activeChatPartner?.displayName || activeChatPartner?.name}</h4>
                    <p className="text-[10px] text-neutral-400 font-medium">Technician On Duty • Phidim</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startCall && startCall(activeChatPartner, "video")}
                    className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/15 text-neutral-300"
                    title="Video Call"
                  >
                    <Video size={14} />
                  </button>
                  <button
                    onClick={() => setIsChatDrawerOpen(false)}
                    className="p-2 rounded-xl text-neutral-400 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Chat Messages Stream */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 text-xs">
                {chatMessages.map((msg, i) => {
                  const isMe = msg.sender === currentUser.email || msg.sender === "user";
                  return (
                    <div key={msg.id || i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl space-y-1 ${
                          isMe
                            ? "bg-white text-black font-medium shadow-sm"
                            : "bg-[#1f1f2c] text-white border border-white/10"
                        }`}
                      >
                        <p className="text-xs leading-relaxed">{msg.text}</p>
                        <span className={`text-[9px] block ${isMe ? "text-neutral-600" : "text-neutral-400"}`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatMessagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message to technician..."
                  className="flex-1 bg-[#1c1c28] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/40"
                />
                <button
                  onClick={handleSendMessage}
                  className="p-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 transition-colors"
                >
                  <Send size={15} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 4: PHIDIM SMART AI ASSISTANT DIALOG                                */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#14141e] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 text-white"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Phidim Smart Assistant</h3>
                    <p className="text-[10px] text-neutral-400">Doorstep repair help & technician matching</p>
                  </div>
                </div>
                <button onClick={() => setIsAiModalOpen(false)} className="text-neutral-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1b1b26] border border-white/10 space-y-2 text-xs">
                <p className="text-neutral-300 leading-relaxed">
                  How can we help you in Phidim today? Choose a recommendation or book instantly:
                </p>
                <div className="space-y-1.5 pt-1">
                  {[
                    "My Split AC is leaking water or not cooling",
                    "Optical fiber line snapped or Wi-Fi red light blinking",
                    "Need 4-Camera HD CCTV installation for home or store",
                    "Emergency sanitary pipe burst or water blockage",
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setIsAiModalOpen(false);
                        setBookNotes(preset);
                        setIsBookingModalOpen(true);
                      }}
                      className="w-full text-left p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/5 text-[11px] text-neutral-200 transition-colors"
                    >
                      → {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => {
                    setIsAiModalOpen(false);
                    setIsBookingModalOpen(true);
                  }}
                  className="w-full py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all"
                >
                  Open Booking Form
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 5: ACCOUNT SETTINGS MODAL                                          */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#14141e] border border-white/15 rounded-3xl p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <h3 className="text-base font-bold text-white">Account Settings & Profile</h3>
                <button onClick={() => setIsSettingsModalOpen(false)} className="text-neutral-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <AccountSettings
                onShowToast={(msg) => {
                  showToast(msg);
                  setIsSettingsModalOpen(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
