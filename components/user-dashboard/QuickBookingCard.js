import { useState } from "react";
import { motion } from "motion/react";
import {
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  Zap,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BookingFields, useBookingForm } from "@/components/BookingFields";

export function QuickBookingCard({ onConfirmBooking }) {
  const { user } = useAuth();
  const bookingForm = useBookingForm();
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("DishHome & TV Repair");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [location, setLocation] = useState("Phidim Ward 1 (Bazaar)");
  const [isEmergency, setIsEmergency] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const saved = await bookingForm.submit({
      serviceName: category + " Service & Inspection", category,
      customerName: user?.name || user?.displayName || "",
      customerEmail: user?.email || "", customerPhone: user?.phone || "",
      address: location, date, notes, isEmergency,
      basePrice: isEmergency ? 2500 : 1500,
    });
    if (saved && onConfirmBooking) onConfirmBooking(saved);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-emerald-900/30 shadow-sm p-4 sm:p-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <Zap className="text-amber-500" size={18} />
              Quick 1-Click Service Booking
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold border border-amber-500/30">
              Service Request
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Select your service details for service bookings in Panchthar
          </p>
        </div>

        {/* Emergency Toggle Pill */}
        <button
          type="button"
          onClick={() => setIsEmergency(!isEmergency)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-extrabold transition-all cursor-pointer ${
            isEmergency
              ? "bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
          }`}
        >
          <Zap size={13} className={isEmergency ? "fill-white animate-pulse" : "text-amber-500"} />
          <span>{isEmergency ? "Urgent request" : "Emergency Mode"}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* 1. Category */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Service Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-8.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option>DishHome & TV Repair</option>
            <option>4K CCTV Setup</option>
            <option>AC Repair & Servicing</option>
            <option>Electrical Rewiring</option>
            <option>Plumbing Service</option>
            <option>Computer Repair</option>
            <option>High-Speed Fiber Setup</option>
          </select>
        </div>

        {/* 2. Date */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
            <Calendar size={11} className="text-emerald-500" /> Select Date
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-8.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* 4. Location */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
            <MapPin size={11} className="text-rose-500" /> Location / Ward
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full h-8.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option>Phidim Ward 1 (Bazaar)</option>
            <option>Phidim Ward 2 (Ranitar)</option>
            <option>Phidim Ward 3 (Gadhi)</option>
            <option>Phidim Ward 4 (Chowk)</option>
            <option>Phidim Ward 5 (Lumafung)</option>
            <option>Other Panchthar Area</option>
          </select>
        </div>

        <BookingFields form={bookingForm} />
        <label className="col-span-full text-xs font-bold space-y-1">Problem details *
          <textarea required value={notes} onChange={e => setNotes(e.target.value)} placeholder="Describe what needs repair…" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
        </label>

        {/* 6. Submit Button */}
        <div className="flex items-end">
          <button
            type="submit"
            disabled={bookingForm.disabled}
            className="w-full h-8.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Confirm</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
