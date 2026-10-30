import { HomeReveal } from "./home/HomeMotion";
import { useState, useEffect, useMemo } from "react";
import {
  FaScrewdriverWrench,
  FaGlobe,
  FaBuilding,
  FaBolt,
  FaSatelliteDish,
  FaCertificate,
  FaUserGear,
  FaHandshake,
  FaLaptopCode,
  FaPhone,
} from "react-icons/fa6";
import {
  Zap,
  Camera,
  Monitor,
  Wifi,
  Wrench,
  ShieldCheck,
  MapPin,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
  Cable,
  Award,
  Globe,
  ExternalLink,
  Droplet,
  Tv,
  Wind,
  Home,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Categories API
// ---------------------------------------------------------------------------
const CATEGORIES_API_URL = "/api/django/categories/";

// Keyword -> icon/color rules so dynamic category names coming back from the
// API still land on a sensible icon + color scheme. Falls back to a plain
// wrench icon / slate palette for anything that doesn't match.
const ICON_RULES = [
  { test: /elect|wiring|inverter/i, icon: Zap, color: "amber" },
  { test: /cctv|camera|secur/i, icon: Camera, color: "blue" },
  {
    test: /computer|laptop|\bit\b|electronics/i,
    icon: Monitor,
    color: "slate",
  },
  { test: /\btv\b|led|dth/i, icon: Tv, color: "indigo" },
  { test: /fiber|\blan\b|network|wifi|dish/i, icon: Wifi, color: "cyan" },
  { test: /\bac\b|cool|refrig|\bair\b|\bfan\b/i, icon: Wind, color: "teal" },
  { test: /plumb|water|pipe|sanit/i, icon: Droplet, color: "sky" },
  { test: /appliance|home/i, icon: Home, color: "rose" },
  { test: /solar|battery|power/i, icon: Zap, color: "orange" },
];

// Tailwind classes keyed by color so the preview cards keep the same
// hand-styled look as before, just driven by data now.
const COLOR_CLASSES = {
  amber: {
    cardClass: "bg-amber-50/60 border border-amber-200 hover:border-amber-400",
    iconClass: "bg-amber-500",
  },
  blue: {
    cardClass: "bg-blue-50/60 border border-blue-200 hover:border-blue-400",
    iconClass: "bg-blue-600",
  },
  slate: {
    cardClass: "bg-slate-50 border border-slate-200 hover:border-slate-400",
    iconClass: "bg-slate-900",
  },
  indigo: {
    cardClass:
      "bg-indigo-50/60 border border-indigo-200 hover:border-indigo-400",
    iconClass: "bg-indigo-600",
  },
  cyan: {
    cardClass: "bg-cyan-50/60 border border-cyan-200 hover:border-cyan-400",
    iconClass: "bg-cyan-600",
  },
  teal: {
    cardClass: "bg-teal-50/60 border border-teal-200 hover:border-teal-400",
    iconClass: "bg-teal-600",
  },
  sky: {
    cardClass: "bg-sky-50/60 border border-sky-200 hover:border-sky-400",
    iconClass: "bg-sky-600",
  },
  rose: {
    cardClass: "bg-rose-50/60 border border-rose-200 hover:border-rose-400",
    iconClass: "bg-rose-600",
  },
  orange: {
    cardClass:
      "bg-orange-50/60 border border-orange-200 hover:border-orange-400",
    iconClass: "bg-orange-600",
  },
  gray: {
    cardClass: "bg-gray-50 border border-gray-200 hover:border-gray-400",
    iconClass: "bg-gray-700",
  },
};

const pickIconAndColor = (name = "") => {
  const match = ICON_RULES.find((rule) => rule.test.test(name));
  if (match) return { icon: match.icon, color: match.color };
  return { icon: Wrench, color: "gray" };
};

// Builds the short descriptive line under each preview card title. Prefers
// the category's own description from the API; falls back to listing its
// service names when the description is empty/placeholder-ish.
const buildBlurb = (cat) => {
  if (cat.description && cat.description.trim().length > 0) {
    return cat.description.trim();
  }
  const names = (cat.services || []).map((s) => s.name).filter(Boolean);
  if (names.length > 0) {
    return names.join(", ") + " in Phidim.";
  }
  return "On-site technician services available in Phidim.";
};

export const HomePageOverview = ({ onNavigateTab, onOpenWhatsApp }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);

        // 1. Load cached categories first
        const cachedCategories = localStorage.getItem(
          "phidim_service_categories",
        );

        if (cachedCategories && isMounted) {
          try {
            const parsedCategories = JSON.parse(cachedCategories);

            if (Array.isArray(parsedCategories)) {
              setCategories(parsedCategories);
            }
          } catch (error) {
            console.error("Failed to parse cached categories:", error);
          }
        }

        // 2. Fetch latest categories from API
        const res = await fetch(CATEGORIES_API_URL);

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const data = await res.json();

        if (isMounted) {
          const categories = Array.isArray(data) ? data : [];

          // 3. Update UI
          setCategories(categories);

          // 4. Save latest API data
          localStorage.setItem(
            "phidim_service_categories",
            JSON.stringify(categories),
          );
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err?.message || "Failed to load services");

          // Keep cached data if API fails
          const cachedCategories = localStorage.getItem(
            "phidim_service_categories",
          );

          if (cachedCategories) {
            try {
              const parsedCategories = JSON.parse(cachedCategories);

              if (Array.isArray(parsedCategories)) {
                setCategories(parsedCategories);
              }
            } catch (error) {
              console.error("Invalid cached categories:", error);
            }
          }
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

  // Only active categories that actually have services qualify for the
  // homepage "Our Services" preview.
  const activeCategories = useMemo(
    () =>
      categories.filter(
        (cat) =>
          cat?.is_active &&
          Array.isArray(cat.services) &&
          cat.services.length > 0,
      ),
    [categories],
  );

  // The preview grid only has room for 4 cards.
  const previewCategories = useMemo(
    () =>
      activeCategories.slice(0, 4).map((cat) => {
        const { icon, color } = pickIconAndColor(cat.name);
        const { cardClass, iconClass } = COLOR_CLASSES[color];
        return {
          id: cat.id,
          name: cat.name,
          blurb: buildBlurb(cat),
          icon,
          cardClass,
          iconClass,
        };
      }),
    [activeCategories],
  );

  const categoryCountLabel =
    activeCategories.length > 0
      ? `View All ${activeCategories.length} Categories`
      : "View All Services";

  return (
    <div className="space-y-12 pb-12">
      {/* 1. HERO WELCOME SECTION ("Little information from Home") */}
      <HomeReveal as="section" className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 lg:p-14 shadow-2xl border border-slate-800 relative overflow-hidden w-full">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight w-full">
              Professional On-Site Technical Services in Panchthar
            </h1>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-normal">
              Welcome to{" "}
              <strong className="text-green-400">Phidim Service</strong> — your
              one-stop solution for Electrical Wiring, CCTV Camera Installation,
              DishHome DTH, Computer Repair, and Plumbing across Phidim
              Municipality and Panchthar district.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigateTab("ALL SERVICES")}
                className="bg-green-600 hover:bg-green-700 text-white font-black px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg cursor-pointer"
              >
                <span>Browse All Services</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() =>
                  onOpenWhatsApp(
                    "Hello Phidim Service! I need doorstep technician assistance.",
                  )
                }
                className="bg-white/10 hover:bg-white/20 text-white font-extrabold px-5 py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-colors border border-white/20 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-green-400 fill-current" />
                <span>WhatsApp +977 986-2772457</span>
              </button>
            </div>
          </div>

          {/* Quick Feature Badges Column */}
          <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3.5 backdrop-blur-xs">
            <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-white/10 pb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-green-400" />
              <span>Why Phidim Service?</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 text-gray-200">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span>
                  <strong>30-Minute Emergency Response</strong> in Phidim Ward
                  1, 2, 3 & 4.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-gray-200">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Certified Field Engineers</strong> for Fiber Net, CCTV
                  & Electrical.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-gray-200">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Transparent Local Pricing</strong> with genuine
                  replacement parts.
                </span>
              </div>
            </div>
          </div>
        </div>
      </HomeReveal>

      {/* 2. ALL SERVICES PREVIEW ("Little information from All Services") */}
      <HomeReveal as="section" className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-green-600 font-extrabold text-xs uppercase tracking-widest mb-1">
              <Wrench className="w-4 h-4" />
              <span>On-Demand Technical Solutions</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              <FaScrewdriverWrench aria-hidden="true" className="inline-block w-[1em] h-[1em] align-middle mr-2" />
              Our Services | हाम्रो सेवाहरू
            </h2>
          </div>

          <button
            onClick={() => onNavigateTab("ALL SERVICES")}
            className="text-xs font-black text-green-700 hover:text-green-800 flex items-center gap-1 bg-green-50 px-4 py-2 rounded-xl border border-green-200 self-start sm:self-auto cursor-pointer hover:bg-green-100 transition-colors"
          >
            <span>{categoryCountLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2 animate-pulse"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-200" />
                <div className="h-3.5 w-2/3 bg-gray-200 rounded" />
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-3 w-5/6 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && fetchError && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
            <p className="text-xs text-gray-500 font-semibold">
              Couldn&apos;t load services right now. Please try again shortly.
            </p>
          </div>
        )}

        {!isLoading && !fetchError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {previewCategories.map((category, index) => {
              const CategoryIcon = category.icon;
              return (
                <HomeReveal
                  delay={index * 0.06}
                  key={category.id}
                  className={`${category.cardClass} rounded-2xl p-4 space-y-2 transition-colors`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${category.iconClass} text-white flex items-center justify-center font-black`}
                  >
                    <CategoryIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-gray-900">
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed line-clamp-3">
                    {category.blurb}
                  </p>
                </HomeReveal>
              );
            })}
          </div>
        )}
      </HomeReveal>

      {/* 3. LAN NETWORKING PREVIEW ("Little information about LAN Networking") */}
      <HomeReveal as="section" className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-cyan-400 font-extrabold text-xs uppercase tracking-widest mb-1">
              <Cable className="w-4 h-4" />
              <span>High-Speed Infrastructure</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              <FaGlobe aria-hidden="true" className="inline-block w-[1em] h-[1em] align-middle mr-2" />
              LAN Networking & Optical Fiber Splicing
            </h2>
          </div>

          <button
            onClick={() => onNavigateTab("LAN NETWORKING")}
            className="text-xs font-black text-cyan-900 bg-cyan-400 hover:bg-cyan-300 px-4 py-2 rounded-xl self-start sm:self-auto cursor-pointer transition-colors"
          >
            Explore LAN Networking
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
            <h3 className="text-sm font-extrabold text-cyan-300">
              <FaBuilding aria-hidden="true" className="inline-block w-[1em] h-[1em] align-middle mr-2" />
              Office & Hotel Structured Cabling
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Cat6 structured copper network cabling, patch panel punch-down,
              and Gigabit network switches for hotels, shops, and offices in
              Phidim.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
            <h3 className="text-sm font-extrabold text-cyan-300">
              <FaBolt aria-hidden="true" className="inline-block w-[1em] h-[1em] align-middle mr-2" />
              Fiber Splicing & OTDR Test
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Precision fusion fiber splicing, loss testing, joint closure
              installation, and drop wire repairs for ISPs & business networks.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
            <h3 className="text-sm font-extrabold text-cyan-300">
              <FaSatelliteDish aria-hidden="true" className="inline-block w-[1em] h-[1em] align-middle mr-2" />
              DishHome DTH Packages
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Get 100 Mbps, 200 Mbps & 300 Mbps DishHome DTH connected at your
              doorstep with free Dual-Band WiFi router installation.
            </p>
          </div>
        </div>
      </HomeReveal>

      {/* 4. GUARANTEES & SERVICE EXCELLENCE METRICS */}
      <HomeReveal as="section" className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-emerald-800 shadow-md space-y-6">
        <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-emerald-400 font-extrabold text-xs uppercase tracking-widest mb-1"></div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Phidim Service Standard Guarantees
            </h2>
          </div>
          <span className="text-xs font-bold bg-white/10 border border-white/20 text-emerald-300 px-3 py-1 rounded-full self-start sm:self-auto">
            Phidim & Panchthar Region
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              <FaBolt aria-hidden="true" className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-white text-sm">
              30-Min On-Site Dispatch
            </h3>
            <p className="text-gray-300 leading-relaxed">
              Fast emergency response across Wards 1, 2, 3 & 4 in Phidim
              Municipality.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              <FaCertificate aria-hidden="true" className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-white text-sm">
              Genuine Spare Parts
            </h3>
            <p className="text-gray-300 leading-relaxed">
              Original Dahua, Uniarch, Cat6 cables, and certified electrical
              breakers used.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              <FaUserGear aria-hidden="true" className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-white text-sm">
              Certified Local Engineers
            </h3>
            <p className="text-gray-300 leading-relaxed">
              Trained professionals with field experience in networking, CCTV,
              and wiring.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              <FaHandshake aria-hidden="true" className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-white text-sm">
              Transparent Pricing
            </h3>
            <p className="text-gray-300 leading-relaxed">
              No hidden fees or unexpected surcharges. Clear upfront labor and
              part quotes.
            </p>
          </div>
        </div>
      </HomeReveal>

      {/* 5. ABOUT US PREVIEW ("Little information about Us") */}
      <HomeReveal as="section" className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 text-green-600 font-extrabold text-xs uppercase tracking-widest">
              <Users className="w-4 h-4" />
              <span>Local Trust & Innovation</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              <FaLaptopCode aria-hidden="true" className="inline-block w-[1em] h-[1em] align-middle mr-2" />
              About Phidim Service
            </h2>

            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-normal">
              Founded by local developer and tech enthusiast{" "}
              <strong className="text-gray-900 font-extrabold">
                Semik Serma
              </strong>
              , <strong>Phidim Service</strong> is built to empower homes and
              businesses in Panchthar with reliable, on-demand technical
              engineering and repair services.
            </p>

            <div className="pt-1 flex items-center gap-3">
              <button
                onClick={() => onNavigateTab("ABOUT")}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
              >
                <span>Read Full About Us</span>
                <ArrowRight className="w-3.5 h-3.5 text-green-400" />
              </button>
            </div>
          </div>

          {/* Developer Card Snapshot */}
          <div className="md:col-span-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-green-600 to-emerald-400 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md">
              SS
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">
                Semik Serma
              </h3>
              <p className="text-xs text-green-800 font-bold">
                Founder & Lead Software Engineer
              </p>
            </div>
            <p className="text-[11px] text-gray-600 italic">
              &quot;Delivering certified technical excellence and digital
              convenience to Panchthar.&quot;
            </p>
            <a
              href="https://portfolio.phidimservice.com.np"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 font-extrabold px-3 py-1.5 rounded-xl text-xs transition-all border border-slate-700 shadow-xs cursor-pointer"
              title="Visit Semik Serma's Portfolio Website"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>portfolio.phidimservice.com.np</span>
              <ExternalLink className="w-3 h-3 text-cyan-400" />
            </a>
          </div>
        </div>
      </HomeReveal>

      {/* 5. CONTACT US PREVIEW ("Little information about Contact Us") */}
      <HomeReveal as="section" className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-green-400 font-extrabold text-xs uppercase tracking-widest mb-1">
              <MapPin className="w-4 h-4" />
              <span>Phidim Municipality Coverage</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              <FaPhone aria-hidden="true" className="inline-block w-[1em] h-[1em] align-middle mr-2" />
              Contact Us & Support
            </h2>
          </div>

          <button
            onClick={() => onNavigateTab("CONTACT US")}
            className="text-xs font-black text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl self-start sm:self-auto cursor-pointer transition-colors"
          >
            Go to Contact Page
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5">
            <span className="text-green-400 font-black flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-400" />
              Location Address
            </span>
            <p className="text-gray-300 font-medium">
              Phidim Ward No. 1 (Main Bazar), Panchthar District, Koshi
              Province, Nepal
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5">
            <span className="text-green-400 font-black flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-green-400 fill-current" />
              WhatsApp Direct
            </span>
            <p className="text-gray-300 font-medium">
              +977 986-2772457 (Instant On-Site Booking)
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5">
            <span className="text-green-400 font-black flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-400" />
              Service Hours
            </span>
            <p className="text-gray-300 font-medium">
              Sunday - Friday: 8:00 AM - 7:00 PM (On-Call Technicians Available)
            </p>
          </div>
        </div>
      </HomeReveal>
    </div>
  );
};
