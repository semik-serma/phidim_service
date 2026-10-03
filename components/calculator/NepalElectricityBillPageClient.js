"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Home,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { ElectricalCalculator } from "./ElectricalCalculator";
import { NepalElectricityBillSeoContent } from "./NepalElectricityBillSeoContent";
import { ServiceBookingModal } from "@/components/ServiceBookingModal";

export function NepalElectricityBillPageClient() {
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Guarantee default top scroll on page mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const handleBookService = (service) => {
    setSelectedServiceForBooking(service);
    setIsBookingOpen(true);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* 1. Breadcrumb Navigation & Exit Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs font-semibold text-gray-500 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-2xs w-fit"
          >
            <Link href="/" className="hover:text-green-600 transition-colors flex items-center gap-1">
              <Home size={13} />
              <span>Home</span>
            </Link>
            <ChevronRight size={13} className="text-gray-400" />
            <Link href="/services" className="hover:text-green-600 transition-colors">
              Services
            </Link>
            <ChevronRight size={13} className="text-gray-400" />
            <span className="text-green-700 font-bold">Nepal Electricity Bill Calculator</span>
          </nav>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-green-700 bg-white hover:bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200 shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Exit to Home</span>
          </Link>
        </div>

        {/* 2. Main Calculator Engine with H1, Inputs, Progressive Slabs & Dominant Result */}
        <ElectricalCalculator
          initialMode="electricity-bill"
          onBookService={handleBookService}
        />

        {/* 3. Comprehensive SEO Sections: Educational Guides, Slabs Table, FAQs, Disclaimer */}
        <NepalElectricityBillSeoContent />
      </div>

      {/* Service Booking Modal */}
      <ServiceBookingModal
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          setSelectedServiceForBooking(null);
        }}
        service={selectedServiceForBooking}
        onBookingSuccess={(booking) => {
          showToast(`Service booking requested for ${booking.serviceName}!`);
        }}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

