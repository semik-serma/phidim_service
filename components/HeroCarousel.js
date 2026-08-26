"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Wifi,
  ArrowRight,
  CheckCircle2,
  Wind,
  Wrench,
  ShieldCheck,
  Zap,
  Sparkles,
  Camera
} from "lucide-react";
import {
  getHeroCarouselSlides,
  refreshHeroCarouselSlides,
  subscribeHeroCarouselSlides
} from "@/lib/heroCarouselStore";

export const HeroCarousel = ({ onExploreServices, onFiberSelect, onBookService }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [adminSlides, setAdminSlides] = useState(() => getHeroCarouselSlides());

  const defaultSlides = [
    {
      id: "slide-cc-camera",
      bgClass: "bg-gradient-to-r from-[#0c1e33] via-[#162f4d] to-[#204068]",
      subtitle: "SECURITY & CCTV SURVEILLANCE • PHIDIM",
      title: "CC Camera Installation, Repair & Security Maintenance",
      description:
        "High-definition 1080P/4K CCTV & IP camera installation, Dahua/Hikvision NVR cabling, night vision calibration, power supply troubleshooting, and live mobile phone viewing across Phidim & Panchthar.",
      buttonText: "BOOK CC CAMERA SERVICE",
      action: () =>
        onBookService
          ? onBookService({
              id: "srv-cctv-install",
              name: "Full 4-Camera HD CCTV System Installation & NVR Setup",
              category: "CCTV & Security",
              basePrice: 3500,
              duration: "3-4 hours",
              warranty: "1 Year Service Warranty",
            })
          : onExploreServices?.(),
      type: "cc_install_graphic"
    },
    {
      id: "slide-ac-cooling",
      bgClass: "bg-gradient-to-r from-[#083358] via-[#0f4c81] to-[#1b6ca8]",
      subtitle: "AIR CONDITIONER & COOLING • PHIDIM",
      title: "Inverter AC Installation, Copper Piping & Gas Refill",
      description:
        "Professional split & inverter AC copper pipe fitting, outdoor bracket mounting, R32/R410A refrigerant gas refill, and deep indoor jet chemical wash by verified technicians in Phidim & Panchthar.",
      buttonText: "BOOK AC SERVICE",
      action: () =>
        onBookService
          ? onBookService({
              id: "srv-ac-service",
              name: "Complete Split AC Deep Cleaning & Gas Refill Service",
              category: "AC & Refrigeration",
              basePrice: 2200,
              duration: "1.5-2 hours",
              warranty: "90 Days Warranty",
            })
          : onFiberSelect
          ? onFiberSelect()
          : onExploreServices?.(),
      type: "ac_showcase_graphic"
    },
    {
      id: "slide-washing-machine",
      bgClass: "bg-gradient-to-r from-[#1e1b4b] via-[#2e2b6b] to-[#3b3a8c]",
      subtitle: "WASHING MACHINE REPAIR & CARE • PHIDIM",
      title: "Doorstep Washing Machine Repair, PCB & Motor Maintenance",
      description:
        "Certified doorstep repair for front-load, top-load, and semi-automatic washing machines. Fast diagnostics for drum spinning noise, PCB circuit boards, water drainage pumps, and motor faults across Phidim.",
      buttonText: "BOOK WASHING MACHINE SERVICE",
      action: () =>
        onBookService
          ? onBookService({
              id: "srv-washing-machine",
              name: "Washing Machine Repair, Motor & PCB Maintenance",
              category: "Electrical & Inverter",
              basePrice: 1500,
              duration: "1-2 hours",
              warranty: "90 Days Warranty",
            })
          : onExploreServices?.(),
      type: "washing_machine_graphic"
    },
    {
      id: "slide-inverter-repair",
      bgClass: "bg-gradient-to-r from-[#112d26] via-[#1a4338] to-[#235b4c]",
      subtitle: "INVERTER & BATTERY SOLUTIONS • PHIDIM",
      title: "Inverter Repair, Battery Maintenance & UPS Backup Setup",
      description:
        "Doorstep servicing for home inverters, pure sine wave UPS systems, tubular battery electrolyte testing & acid top-up, solar hybrid inverter wiring, and load balancing across Phidim & Panchthar.",
      buttonText: "BOOK INVERTER SERVICE",
      action: () =>
        onBookService
          ? onBookService({
              id: "srv-inverter-repair",
              name: "Inverter & Battery Diagnostics, Repair & UPS Setup",
              category: "Electrical & Inverter",
              basePrice: 1200,
              duration: "1-2 hours",
              warranty: "6 Months Warranty",
            })
          : onExploreServices?.(),
      type: "inverter_graphic"
    },
    {
      id: "slide-fridge",
      bgClass: "bg-gradient-to-r from-[#1b3044] via-[#234563] to-[#2e5d85]",
      subtitle: "REFRIGERATOR & FREEZER CARE • PHIDIM",
      title: "Doorstep Refrigerator Gas Charging & Compressor Repair",
      description:
        "Same-day technician visits for single & double door fridges, deep freezers, compressor replacement, thermostat fixes, and gas charging in Phidim.",
      buttonText: "BOOK FRIDGE REPAIR",
      action: () =>
        onBookService
          ? onBookService({
              id: "srv-fridge-repair",
              name: "Doorstep Refrigerator Gas Charging & Repair",
              category: "AC & Refrigeration",
              basePrice: 1800,
              duration: "1-2 hours",
              warranty: "6 Months Support",
            })
          : onExploreServices
          ? onExploreServices()
          : onFiberSelect?.(),
      type: "fridge_graphic"
    },
    {
      id: "slide-fan-repair",
      bgClass: "bg-gradient-to-r from-[#173a5e] via-[#1e4e7c] to-[#28669e]",
      subtitle: "CEILING FAN & APPLIANCE REPAIR • PHIDIM",
      title: "Ceiling Fan Winding & Home Electrical Maintenance",
      description:
        "Doorstep ceiling fan repair, capacitor replacement, copper motor winding, inverter servicing, and home electrical fittings across Phidim Wards 1 to 14.",
      buttonText: "BOOK APPLIANCE REPAIR",
      action: () =>
        onBookService
          ? onBookService({
              id: "srv-fan-repair",
              name: "Ceiling Fan Winding & Appliance Maintenance",
              category: "Electrical & Inverter",
              basePrice: 600,
              duration: "1 hour",
              warranty: "30 Days Guarantee",
            })
          : onExploreServices
          ? onExploreServices()
          : onFiberSelect?.(),
      type: "fan_graphic"
    },
    {
      id: "slide-dishhome-fiber",
      bgClass: "bg-gradient-to-r from-[#0d3b66] via-[#16528e] to-[#1f69b5]",
      subtitle: "DISHHOME DTH & FIBER DP BOX • PHIDIM",
      title: "DishHome DTH & Optical Fiber DP Box Connection",
      description:
        "Authorized DishHome optical fiber DP box splicing, drop wire routing, ONU dual-band WiFi router setup, and HD setup box installation in Phidim.",
      buttonText: "VIEW FIBER PACKAGES",
      action: onFiberSelect || onExploreServices,
      type: "dp_graphic"
    }
  ];

  // Admin slides lead the rotation so a newly published campaign is visible
  // immediately, while the built-in service slides remain a useful fallback.
  const slides = [
    ...adminSlides.map((slide) => ({
      ...slide,
      type: "admin_image",
      bgClass: "bg-slate-950",
      action: onExploreServices || onFiberSelect,
    })),
    ...defaultSlides
  ];

  useEffect(() => {
    return subscribeHeroCarouselSlides((nextSlides) => {
      setAdminSlides(nextSlides);
      setCurrentSlide(0);
    });
  }, []);

  useEffect(() => {
    refreshHeroCarouselSlides();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const active = slides[currentSlide] || slides[0];

  return (
    <section className="relative overflow-hidden w-full min-h-[440px] sm:min-h-[480px] md:min-h-[520px] lg:min-h-[560px] flex items-center shadow-2xl border-b border-slate-800/40">
      {/* Dynamic Slide Background */}
      <div className={`absolute inset-0 transition-all duration-700 ${active.bgClass}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/30 pointer-events-none" />
      </div>

      {/* Main Slide Container */}
      <div className="relative max-w-7xl mx-auto px-5 md:px-10 w-full py-8 sm:py-10 md:py-14 z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* Left Text Column */}
          <div className="md:col-span-7 text-white space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-left duration-500">
            <span className="inline-block text-xs md:text-sm font-extrabold tracking-widest text-cyan-200 uppercase bg-white/10 px-3 py-1 rounded-sm border border-white/20 backdrop-blur-xs">
              {active.subtitle}
            </span>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-md">
              {active.title}
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-blue-100/95 leading-relaxed max-w-xl font-normal">
              {active.description}
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={active.action}
                className="inline-flex items-center gap-2 border border-white/90 hover:border-white text-white font-extrabold text-xs sm:text-sm px-6 py-2.5 uppercase tracking-wider rounded-md hover:bg-white hover:text-slate-900 transition-all cursor-pointer shadow-lg hover:shadow-xl hover:scale-105"
              >
                <span>{active.buttonText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Service Graphic Column */}
          <div className="md:col-span-5 flex items-center justify-center relative">

            {/* Admin Uploaded Image Banner */}
            {active.type === "admin_image" && (
              <div className="relative h-[260px] sm:h-[300px] md:h-[340px] w-full max-w-md lg:max-w-lg overflow-hidden rounded-2xl border border-white/30 bg-slate-900/40 shadow-2xl">
                <img
                  src={active.image}
                  alt={active.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-white/10" />
                <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md">
                  <CheckCircle2 size={14} className="text-emerald-300" /> Featured
                </div>
              </div>
            )}

            {/* 1. CC Camera Installation & Maintenance Graphic (cc.png) */}
            {(active.type === "cc_install_graphic" || active.type === "cc_camera") && (
              <div className="relative w-full max-w-md lg:max-w-lg bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/30 text-white shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-300 animate-pulse" />
                    <span className="font-extrabold text-sm sm:text-base text-white">
                      CC Camera & Surveillance
                    </span>
                  </div>
                  <span className="bg-emerald-400 text-slate-950 text-[10px] sm:text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                    24/7 SECURITY
                  </span>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-white/20 shadow-md h-52 sm:h-60 md:h-64 group bg-slate-900/60">
                  <img
                    src="/cc.png"
                    alt="CC Camera Installation, Repair and Maintenance in Phidim Panchthar"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex flex-col justify-end p-3 sm:p-4">
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      <span className="text-[11px] font-bold text-cyan-200 bg-slate-950/80 backdrop-blur-xs px-2.5 py-0.5 rounded-md border border-cyan-500/30">
                        Dahua • Hikvision • CP Plus
                      </span>
                      <span className="text-[11px] font-bold text-emerald-200 bg-slate-950/80 backdrop-blur-xs px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                        Live Mobile Phone View
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-white drop-shadow-sm">
                      HD IP Camera Setup, Cabling & Night Vision Calibration
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. AC Installation, Mounting & Gas Charging Graphic (newac.png, newac2.png, newac3.png) */}
            {(active.type === "ac_showcase_graphic" || active.type === "ac_install_graphic" || active.type === "ac_gas_graphic") && (
              <div className="relative w-full max-w-md lg:max-w-lg bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/30 text-white shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wind className="w-5 h-5 text-cyan-300 animate-pulse" />
                    <span className="font-extrabold text-sm sm:text-base text-white">
                      AC Servicing & Gas Refill
                    </span>
                  </div>
                  <span className="bg-cyan-400 text-slate-950 text-[10px] sm:text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                    INVERTER & SPLIT
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2.5">
                  {/* Featured Main Photo */}
                  <div className="col-span-7 relative rounded-xl overflow-hidden border border-white/20 shadow-md h-48 sm:h-56 md:h-60 group bg-slate-900/40">
                    <img
                      src="/newac.png"
                      alt="Inverter Split AC Installation in Phidim"
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent flex items-end p-2.5">
                      <span className="text-[11px] sm:text-xs font-bold text-cyan-200 bg-slate-950/75 backdrop-blur-xs px-2 py-0.5 rounded-md border border-cyan-500/30">
                        Split AC Fitting
                      </span>
                    </div>
                  </div>

                  {/* Two Stacked Photos */}
                  <div className="col-span-5 flex flex-col gap-2.5">
                    <div className="relative rounded-xl overflow-hidden border border-white/20 shadow-md h-[90px] sm:h-[105px] md:h-[113px] group bg-slate-900/40">
                      <img
                        src="/newac2.png"
                        alt="Outdoor Unit Bracket Mounting Phidim"
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-1.5">
                        <span className="text-[10px] font-bold text-cyan-200 bg-slate-950/70 backdrop-blur-xs px-1.5 py-0.5 rounded-xs">
                          Outdoor Mount
                        </span>
                      </div>
                    </div>

                    <div className="relative rounded-xl overflow-hidden border border-white/20 shadow-md h-[90px] sm:h-[105px] md:h-[113px] group bg-slate-900/40">
                      <img
                        src="/newac3.png"
                        alt="AC Chemical Foam Wash and Gas Refill Phidim"
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-1.5">
                        <span className="text-[10px] font-bold text-emerald-200 bg-slate-950/70 backdrop-blur-xs px-1.5 py-0.5 rounded-xs">
                          Gas & Jet Wash
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Washing Machine Repair & Management Graphic (washingmac.jpeg) */}
            {active.type === "washing_machine_graphic" && (
              <div className="relative w-full max-w-md lg:max-w-lg bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/30 text-white shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
                    <span className="font-extrabold text-sm sm:text-base text-white">
                      Washing Machine Repair & Care
                    </span>
                  </div>
                  <span className="bg-indigo-400 text-slate-950 text-[10px] sm:text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                    DOORSTEP REPAIR
                  </span>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-white/20 shadow-md h-52 sm:h-60 md:h-64 group bg-slate-900/60">
                  <img
                    src="/washingmac.jpeg"
                    alt="Washing Machine Repair, Motor and PCB Maintenance in Phidim Panchthar"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex flex-col justify-end p-3 sm:p-4">
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      <span className="text-[11px] font-bold text-indigo-200 bg-slate-950/80 backdrop-blur-xs px-2.5 py-0.5 rounded-md border border-indigo-500/30">
                        Front Load • Top Load • Semi-Auto
                      </span>
                      <span className="text-[11px] font-bold text-cyan-200 bg-slate-950/80 backdrop-blur-xs px-2.5 py-0.5 rounded-md border border-cyan-500/30">
                        PCB & Motor Specialist
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-white drop-shadow-sm">
                      LG, Samsung, IFB, Whirlpool & All Major Brands Servicing
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Inverter Repair & Management Graphic (invert.jpeg) */}
            {active.type === "inverter_graphic" && (
              <div className="relative w-full max-w-md lg:max-w-lg bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/30 text-white shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-300 animate-pulse" />
                    <span className="font-extrabold text-sm sm:text-base text-white">
                      Inverter & Battery Management
                    </span>
                  </div>
                  <span className="bg-emerald-400 text-slate-950 text-[10px] sm:text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                    POWER BACKUP
                  </span>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-white/20 shadow-md h-52 sm:h-60 md:h-64 group bg-slate-900/60">
                  <img
                    src="/invert.jpeg"
                    alt="Inverter Repair, Battery Maintenance and UPS Setup in Phidim Panchthar"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex flex-col justify-end p-3 sm:p-4">
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      <span className="text-[11px] font-bold text-emerald-200 bg-slate-950/80 backdrop-blur-xs px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                        Pure Sine Wave • Solar Hybrid
                      </span>
                      <span className="text-[11px] font-bold text-cyan-200 bg-slate-950/80 backdrop-blur-xs px-2.5 py-0.5 rounded-md border border-cyan-500/30">
                        Tubular Battery Health Care
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-white drop-shadow-sm">
                      Luminous, Microtek, Exide, Livguard Inverter & UPS Repair
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Refrigerator Gas Charging (frggaschr.jpg) */}
            {active.type === "fridge_graphic" && (
              <div className="relative w-full max-w-md lg:max-w-lg bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/30 text-white shadow-2xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-300 animate-pulse" />
                    <span className="font-extrabold text-sm sm:text-base text-white">
                      Refrigerator Gas Charging
                    </span>
                  </div>
                  <span className="bg-cyan-400 text-slate-950 text-[10px] sm:text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                    DOORSTEP
                  </span>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-white/20 shadow-md h-52 sm:h-60 md:h-64 group bg-slate-900/40">
                  <img
                    src="/frggaschr.jpg"
                    alt="Refrigerator Gas Charging Phidim"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent flex items-end p-3">
                    <span className="text-xs sm:text-sm font-bold text-cyan-200 bg-slate-950/75 backdrop-blur-xs px-3 py-1 rounded-lg border border-white/10">
                      Compressor & Gas Charging
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Ceiling Fan & Electrical (Ceilingfan1.jpg) */}
            {active.type === "fan_graphic" && (
              <div className="relative w-full max-w-md lg:max-w-lg bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/30 text-white shadow-2xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-green-400 animate-pulse" />
                    <span className="font-extrabold text-sm sm:text-base text-white">
                      Ceiling Fan & Electrical
                    </span>
                  </div>
                  <span className="bg-green-400 text-slate-950 text-[10px] sm:text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                    ON-SITE
                  </span>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-white/20 shadow-md h-52 sm:h-60 md:h-64 group bg-slate-900/40">
                  <img
                    src="/Ceilingfan1.jpg"
                    alt="Ceiling Fan Repair Phidim"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent flex items-end p-3">
                    <span className="text-xs sm:text-sm font-bold text-green-200 bg-slate-950/75 backdrop-blur-xs px-3 py-1 rounded-lg border border-white/10">
                      Motor Winding, Capacitor & Wiring
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 7. DishHome DP Box & Fiber Networking (image.png) */}
            {active.type === "dp_graphic" && (
              <div className="relative w-full max-w-md lg:max-w-lg bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/30 text-white shadow-2xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-cyan-300 animate-pulse" />
                    <span className="font-extrabold text-sm sm:text-base text-white">
                      DishHome DP Box & Fiber
                    </span>
                  </div>
                  <span className="bg-cyan-400 text-slate-950 text-[10px] sm:text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                    DTH & FIBER
                  </span>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-white/20 shadow-md h-52 sm:h-60 md:h-64 group bg-slate-900/60">
                  <img
                    src="/image.png"
                    alt="DishHome DTH Official Connection Phidim"
                    className="w-full h-full object-contain sm:object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent flex items-end p-3">
                    <span className="text-xs sm:text-sm font-bold text-cyan-200 bg-slate-950/75 backdrop-blur-xs px-3 py-1 rounded-lg border border-white/10">
                      DTH Connection & Fiber Setup
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Slide Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-all z-20 cursor-pointer backdrop-blur-sm border border-white/20 hover:scale-110"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-all z-20 cursor-pointer backdrop-blur-sm border border-white/20 hover:scale-110"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Pagination Indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
              currentSlide === idx ? "bg-white w-6" : "bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </section>
  );
};
