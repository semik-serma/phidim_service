"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Zap,
  Camera,
  Monitor,
  Wind,
  Tv,
  Wifi,
  Droplet,
  Wrench,
  Check,
  Phone,
  MessageCircle,
  Home,
  ChevronRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  CalendarCheck,
  Search,
  X,
  Filter,
  RotateCcw,
  Sparkles,
  Loader2,
} from "lucide-react";
import { SERVICES } from "@/data/services";
import { useAuth } from "@/context/AuthContext";
import { handleUnauthenticatedBooking } from "@/lib/backendWarning";

// ---------------------------------------------------------------------------
// Categories API
// ---------------------------------------------------------------------------
const CATEGORIES_API_URL = "/api/django/categories/";

// Keyword -> icon/color rules so dynamic category names coming back from the
// API still land on a sensible icon + color scheme. Falls back to a plain
// wrench icon / gray palette for anything that doesn't match.
const ICON_RULES = [
  { test: /elect|wiring|inverter/i, icon: Zap, color: "amber" },
  { test: /cctv|camera|secur/i, icon: Camera, color: "blue" },
  { test: /computer|laptop|\bit\b|electronics/i, icon: Monitor, color: "slate" },
  { test: /\bfan\b/i, icon: Wind, color: "emerald" },
  { test: /\btv\b|led|dth/i, icon: Tv, color: "indigo" },
  { test: /fiber|\blan\b|network|wifi|dish/i, icon: Wifi, color: "cyan" },
  { test: /\bac\b|cool|refrig|\bair\b/i, icon: Wind, color: "teal" },
  { test: /plumb|water|pipe|sanit/i, icon: Droplet, color: "sky" },
  { test: /appliance|home/i, icon: Home, color: "rose" },
  { test: /solar|battery|power/i, icon: Zap, color: "orange" },
];

const COLOR_CLASSES = {
  amber: {
    bgClass: "bg-amber-50/70 border-amber-200/90",
    badgeClass: "bg-amber-500/20 text-amber-900 border-amber-300",
  },
  blue: {
    bgClass: "bg-blue-50/70 border-blue-200/90",
    badgeClass: "bg-blue-500/20 text-blue-900 border-blue-300",
  },
  slate: {
    bgClass: "bg-slate-50 border-slate-200/90",
    badgeClass: "bg-slate-900 text-white",
  },
  emerald: {
    bgClass: "bg-emerald-50/70 border-emerald-200/90",
    badgeClass: "bg-emerald-500/20 text-emerald-900 border-emerald-300",
  },
  indigo: {
    bgClass: "bg-indigo-50/70 border-indigo-200/90",
    badgeClass: "bg-indigo-500/20 text-indigo-900 border-indigo-300",
  },
  cyan: {
    bgClass: "bg-cyan-50/70 border-cyan-200/90",
    badgeClass: "bg-cyan-500/20 text-cyan-900 border-cyan-300",
  },
  teal: {
    bgClass: "bg-teal-50/70 border-teal-200/90",
    badgeClass: "bg-teal-500/20 text-teal-900 border-teal-300",
  },
  sky: {
    bgClass: "bg-sky-50/70 border-sky-200/90",
    badgeClass: "bg-sky-500/20 text-sky-900 border-sky-300",
  },
  rose: {
    bgClass: "bg-rose-50/70 border-rose-200/90",
    badgeClass: "bg-rose-500/20 text-rose-900 border-rose-300",
  },
  orange: {
    bgClass: "bg-orange-50/70 border-orange-200/90",
    badgeClass: "bg-orange-500/20 text-orange-900 border-orange-300",
  },
  gray: {
    bgClass: "bg-gray-50 border-gray-200/90",
    badgeClass: "bg-gray-700 text-white",
  },
};

const pickIconAndColor = (name = "") => {
  const match = ICON_RULES.find((rule) => rule.test.test(name));
  if (match) return { icon: match.icon, color: match.color };
  return { icon: Wrench, color: "gray" };
};

const slugify = (name = "", id) =>
  `${name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-${id}`;

export const OurServicesPage = ({
  selectedCategory: propCategory = "ALL",
  setSelectedCategory: propSetSelectedCategory,
  searchQuery: propSearch = "",
  setSearchQuery: propSetSearch,
  onNavigateHome,
  onNavigateContact,
  onBookService,
}) => {
  const { isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(propCategory || "ALL");
  const [searchQuery, setSearchQuery] = useState(propSearch || "");

  // Live categories/services pulled from the backend
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);
        const res = await fetch(CATEGORIES_API_URL);
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }
        const data = await res.json();
        if (isMounted) {
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err?.message || "Failed to load services");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize when parent props change (e.g. from Header search/dropdown)
  useEffect(() => {
    if (propCategory) {
      setSelectedCategory(propCategory);
    }
  }, [propCategory]);

  useEffect(() => {
    if (propSearch !== undefined) {
      setSearchQuery(propSearch);
    }
  }, [propSearch]);

  const handleCategoryChange = (catName) => {
    setSelectedCategory(catName);
    if (propSetSelectedCategory) {
      propSetSelectedCategory(catName);
    }
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (propSetSearch) {
      propSetSearch(val);
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory("ALL");
    setSearchQuery("");
    if (propSetSelectedCategory) propSetSelectedCategory("ALL");
    if (propSetSearch) propSetSearch("");
  };

  // Transform the raw /categories/ API payload into the card shape the UI
  // renders. Only active categories that actually have services are shown.
  const servicesData = useMemo(() => {
    return categories
      .filter(
        (cat) =>
          cat?.is_active && Array.isArray(cat.services) && cat.services.length > 0
      )
      .map((cat) => {
        const { icon, color } = pickIconAndColor(cat.name);
        const { bgClass, badgeClass } = COLOR_CLASSES[color];
        return {
          id: slugify(cat.name, cat.id),
          rawId: cat.id,
          title: cat.name,
          summaryTitle: cat.name,
          categoryName: cat.name,
          description: cat.description,
          photo: cat.photo,
          icon,
          color,
          bgClass,
          badgeClass,
          items: cat.services.map((s) => s.name),
          rawServices: cat.services,
        };
      });
  }, [categories]);

  // Robust category matching function supporting both IDs and display names
  const isCategoryMatch = (service, filterCat) => {
    if (!filterCat || filterCat === "ALL" || filterCat === "All Services") return true;

    const f = filterCat.toLowerCase().trim();
    const sId = (service.id || "").toLowerCase();
    const sTitle = (service.title || "").toLowerCase();
    const sSummary = (service.summaryTitle || "").toLowerCase();
    const sCatName = (service.categoryName || "").toLowerCase();

    return (
      sId === f ||
      sCatName === f ||
      sSummary.includes(f) ||
      sTitle.includes(f) ||
      f.includes(sId)
    );
  };

  const filteredServices = useMemo(() => {
    return servicesData.filter((service) => {
      const matchesCategory = isCategoryMatch(service, selectedCategory);

      const q = (searchQuery || "").trim().toLowerCase();
      if (!q) return matchesCategory;

      const matchesSearch =
        service.title.toLowerCase().includes(q) ||
        service.summaryTitle.toLowerCase().includes(q) ||
        service.id.toLowerCase().includes(q) ||
        service.items.some((item) => item.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [servicesData, selectedCategory, searchQuery]);

  const handleBookServiceAction = (service) => {
    if (!isAuthenticated) {
      handleUnauthenticatedBooking();
      return;
    }

    const firstRawService = service.rawServices?.[0];

    const matched =
      SERVICES.find(
        (s) =>
          s.category.toLowerCase().includes(service.categoryName.toLowerCase()) ||
          s.name.toLowerCase().includes(service.categoryName.toLowerCase())
      ) || {
        id: firstRawService ? `srv-${firstRawService.id}` : `srv-${service.rawId}`,
        name: firstRawService ? firstRawService.name : service.title,
        category: service.categoryName,
        basePrice: 500,
        duration: "1-2 hours",
        warranty: "30 Days Service Guarantee",
      };

    if (onBookService) {
      onBookService(matched);
    } else {
      const text = encodeURIComponent(
        `Hello Phidim Service! I want to book on-site service for: ${service.title}. Please dispatch a technician in Phidim.`
      );
      window.open(`https://wa.me/9779862772457?text=${text}`, "_blank");
    }
  };

  const handleWhatsAppDirect = (serviceTitle) => {
    const text = encodeURIComponent(
      `Hello Phidim Service! I want to book on-site service for: ${serviceTitle}. Please dispatch a technician in Phidim.`
    );
    window.open(`https://wa.me/9779862772457?text=${text}`, "_blank");
  };

  // Filter pills are now generated from whatever categories the API returns
  const filterPills = useMemo(() => {
    const pills = [{ id: "ALL", label: "All Services (सबै सेवाहरू)" }];
    servicesData.forEach((service) => {
      pills.push({ id: service.id, label: service.title });
    });
    return pills;
  }, [servicesData]);

  const hasActiveFilters = selectedCategory !== "ALL" || searchQuery.trim() !== "";

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Top Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between text-xs text-gray-600 font-medium">
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateHome}
              className="hover:text-green-600 flex items-center gap-1 cursor-pointer font-semibold"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-black">Our Services (हाम्रो सेवाहरू)</span>
          </div>

          <div className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {filteredServices.length} Categories Available
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Page Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 md:p-10 shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-green-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest">
              <Wrench className="w-3.5 h-3.5" />
              <span>Phidim Service • Trusted Technician Network</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              🔧 Our Services | हाम्रो सेवाहरू
            </h1>

            <p className="text-sm sm:text-base text-green-300 font-bold">
              Fast, Reliable, and Professional Doorstep Assistance in Phidim & Panchthar! 🏠⚡
            </p>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-normal">
              Need a certified electrician, computer technician, CCTV installer, AC mechanic, or plumber? Filter below or contact us directly at <strong className="text-white">+977 986-2772457</strong>.
            </p>
          </div>
        </div>

        {/* Live Filter & Search Controls Bar */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Live Search Input */}
            <div className="relative w-full sm:w-80 md:w-96">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter services by name or task..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9.5 pr-8 py-2 text-xs font-semibold bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:border-green-600 focus:ring-2 focus:ring-green-600/20 transition-all text-gray-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Active Filter State Summary / Reset */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-bold text-gray-600">
                  Showing <strong className="text-gray-950 font-black">{filteredServices.length}</strong> services
                </span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-xl text-xs font-black border border-rose-200 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear Filters</span>
                </button>
              </div>
            )}
          </div>

          {/* Interactive Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
            {filterPills.map((pill) => {
              const isSelected =
                pill.id === "ALL"
                  ? selectedCategory === "ALL" || selectedCategory === "All Services"
                  : selectedCategory === pill.id;

              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => handleCategoryChange(pill.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer shadow-2xs ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs scale-102 ring-2 ring-emerald-500/40"
                      : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-black text-gray-900">Loading Services...</h3>
              <p className="text-xs text-gray-500">Fetching the latest categories and services.</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && fetchError && (
          <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
              <Filter className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-black text-gray-900">Couldn&apos;t Load Services</h3>
              <p className="text-xs text-gray-500">{fetchError}</p>
            </div>
          </div>
        )}

        {/* DETAILED SERVICES GRID */}
        {!isLoading && !fetchError && (
          filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredServices.map((service) => {
                const ServiceIcon = service.icon;
                return (
                  <div
                    key={service.id}
                    className={`border rounded-3xl p-6 space-y-4 shadow-xs transition-all hover:shadow-md ${service.bgClass}`}
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-black/10 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white shadow-xs flex items-center justify-center font-black">
                          <ServiceIcon className="w-5 h-5 text-gray-900" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-black text-gray-950">
                            {service.title}
                          </h3>
                          <p className="text-[11px] text-gray-600 font-semibold mt-0.5">
                            Phidim Doorstep Technician Service
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${service.badgeClass}`}
                      >
                        AVAILABLE
                      </span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-gray-800 font-medium">
                      {service.items.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 bg-white/70 p-2 rounded-xl border border-black/5"
                        >
                          <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span className="font-semibold text-gray-900">{item}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black/10">
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-600 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        <span>Quick 30-min Dispatch</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleBookServiceAction(service)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs hover:scale-102 cursor-pointer"
                          title="Book Certified Technician"
                        >
                          <CalendarCheck className="w-3.5 h-3.5" />
                          <span>Book Service</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleWhatsAppDirect(service.title)}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          title="Quick WhatsApp Booking"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-green-400 fill-current" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty Search / Filter Result State */
            <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                <Filter className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-black text-gray-900">
                  No Services Match Your Filter
                </h3>
                <p className="text-xs text-gray-500">
                  We couldn&apos;t find any service matching &quot;{searchQuery || selectedCategory}&quot;. Try selecting another category or clear the search filters.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Show All Services (सबै सेवाहरू)</span>
              </button>
            </div>
          )
        )}

        {/* BOTTOM CALLOUT / CONTACT HELPLINE */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800 shadow-xl">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span>Need Immediate Assistance from Our Service Team?</span>
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed font-medium">
              Phidim Service technicians are equipped with genuine spare parts, diagnostic meters, and professional tools for home, office, and business repair.
            </p>
            <p className="text-xs font-bold text-green-400">
              Hotline: +977 986-2772457 • Phidim Municipality, Nepal
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="https://wa.me/9779862772457?text=Hello%20Phidim%20Service!%20I%20need%20a%20technician."
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white font-extrabold px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>WhatsApp +977 986-2772457</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};