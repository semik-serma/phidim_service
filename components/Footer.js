"use client";

import Link from "next/link";
import { Phone, Mail, MapPin, ShieldCheck, ExternalLink } from "lucide-react";
import { FaYoutube, FaFacebookF, FaLinkedinIn } from "react-icons/fa6";
import { RopePullingDevBadge } from "./RopePullingDevBadge";

export const Footer = ({
  onSelectCategory,
  onOpenAbout,
  onOpenContact
}) => {
  const handleSelectCategory = (cat) => {
    if (onSelectCategory) {
      onSelectCategory(cat);
    } else if (typeof window !== "undefined") {
      window.location.href = `/?tab=services&category=${encodeURIComponent(cat)}`;
    }
  };

  const handleOpenAbout = () => {
    if (onOpenAbout) {
      onOpenAbout();
    } else if (typeof window !== "undefined") {
      window.location.href = `/?tab=about`;
    }
  };

  const handleOpenContact = () => {
    if (onOpenContact) {
      onOpenContact();
    } else if (typeof window !== "undefined") {
      window.location.href = `/?tab=contact-us`;
    }
  };

  return (
    <footer className="bg-slate-900 text-gray-300 pt-12 pb-6 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          {/* Col 1: About */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-green-500/80 shadow-md bg-slate-950 p-0.5 shrink-0">
                <img
                  src="/logo.png"
                  alt="Phidim Service Logo"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <span className="text-lg font-black text-white tracking-tight">PHIDIM SERVICE</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Panchthar&apos;s primary service & technology destination for technical doorstep repairs, house wiring, Dahua CCTV systems, DishHome DTH, and local technical solutions.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-green-400">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Certified Field Technicians</span>
            </div>
            
            <div className="pt-3 flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Connect:</span>
              <a
                href="https://www.facebook.com/dhanraj.serma.14"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#1877f2] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-sm hover:shadow-md hover:shadow-blue-500/30"
                title="Facebook: Dhanraj Serma"
              >
                <FaFacebookF className="w-4 h-4" />
              </a>
              <a
                href="https://www.youtube.com/@semikserma"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9.5 h-9.5 rounded-full bg-[#ff0000] hover:bg-[#e60000] text-white flex items-center justify-center hover:scale-115 active:scale-95 transition-all shadow-md hover:shadow-lg hover:shadow-red-600/40 ring-2 ring-red-500/20"
                title="YouTube: @semikserma"
              >
                <FaYoutube className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/semik-serma-8263a3391/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#0a66c2] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-sm hover:shadow-md hover:shadow-sky-500/30"
                title="LinkedIn: Semik Serma"
              >
                <FaLinkedinIn className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links & Location Hubs */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Navigation & Locations</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/battery-runtime-calculator" className="hover:text-green-400 transition-colors text-green-400 font-bold block">
                  ⚡ Battery Runtime Calculator
                </Link>
              </li>
              <li>
                <Link href="/nepal-electricity-bill-calculator" className="hover:text-green-400 transition-colors text-emerald-400 font-bold block">
                  🇳🇵 Nepal Electricity Bill Calculator
                </Link>
              </li>
              <li>
                <button onClick={() => handleSelectCategory("ALL")} className="hover:text-green-400 transition-colors cursor-pointer">
                  Our Technical Services
                </button>
              </li>
              <li>
                <Link href="/services" className="hover:text-green-400 transition-colors text-yellow-400 font-bold block">
                  🛠️ All Phidim Services
                </Link>
              </li>
              <li>
                <Link href="/phidim" className="hover:text-green-400 transition-colors text-emerald-400 font-bold block">
                  📍 Services in Phidim
                </Link>
              </li>
              <li>
                <Link href="/panchthar" className="hover:text-green-400 transition-colors text-indigo-400 font-bold block">
                  📍 Services in Panchthar
                </Link>
              </li>
              <li>
                <button onClick={handleOpenAbout} className="hover:text-green-400 transition-colors cursor-pointer">
                  About Phidim Service
                </button>
              </li>
              <li>
                <button onClick={handleOpenContact} className="hover:text-green-400 transition-colors cursor-pointer">
                  Contact & Support
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Technical Service Categories */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Service Categories</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => handleSelectCategory("Electrical & Inverter")} className="hover:text-green-400 transition-colors cursor-pointer">
                  Electrical & Inverter Repair
                </button>
              </li>
              <li>
                <button onClick={() => handleSelectCategory("CCTV & Security")} className="hover:text-green-400 transition-colors cursor-pointer">
                  CCTV & HD Security Setup
                </button>
              </li>
              <li>
                <button onClick={() => handleSelectCategory("AC & Refrigeration")} className="hover:text-green-400 transition-colors cursor-pointer">
                  AC Servicing & Gas Refill
                </button>
              </li>
              <li>
                <button onClick={() => handleSelectCategory("Fiber & LAN Networking")} className="hover:text-green-400 transition-colors cursor-pointer">
                  Fiber Splicing & LAN Networking
                </button>
              </li>
              <li>
                <button onClick={() => handleSelectCategory("Plumbing & Sanitary")} className="hover:text-green-400 transition-colors cursor-pointer">
                  Plumbing & Water Pump Overhaul
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Phidim Store Location</h4>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>Main Road, Ward No. 1, Phidim, Panchthar, Koshi Province, Nepal</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-500 shrink-0" />
                <span>+977 986-2772457</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>info@phidimservice.com.np</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Gateways & Bottom Bar */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span>© {new Date().getFullYear()} <span className="text-white font-bold">Phidim Service</span>. All Rights Reserved.</span>
            <span className="text-gray-700 hidden sm:inline">•</span>
            <RopePullingDevBadge />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-gray-400">Accepted Payments:</span>
            <span className="bg-green-600 text-white px-2 py-0.5 rounded-xs font-black text-[10px]">eSewa</span>
            <span className="bg-purple-600 text-white px-2 py-0.5 rounded-xs font-black text-[10px]">Khalti</span>
            <span className="bg-amber-600 text-white px-2 py-0.5 rounded-xs font-black text-[10px]">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
