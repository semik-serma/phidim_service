"use client";

import { useState } from "react";
import { Info, AlertCircle } from "lucide-react";

export function CalculatorInput({
  id,
  label,
  value,
  onChange,
  unit,
  placeholder,
  infoText,
  min = 0,
  max,
  step = "any",
  error,
  disabled = false,
  required = true,
  quickOptions,
}) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  return (
    <div className="space-y-1.5 text-left">
      {/* Label and Info */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-xs font-bold text-gray-700 flex items-center gap-1.5 select-none"
        >
          <span>{label}</span>
          {required && <span className="text-red-500 font-black">*</span>}
          {infoText && (
            <div className="relative inline-block">
              <button
                type="button"
                aria-label={`More information about ${label}`}
                onClick={() => setIsTooltipOpen(!isTooltipOpen)}
                onMouseEnter={() => setIsTooltipOpen(true)}
                onMouseLeave={() => setIsTooltipOpen(false)}
                className="text-gray-400 hover:text-green-600 transition-colors p-0.5 rounded cursor-pointer"
              >
                <Info size={13} />
              </button>

              {isTooltipOpen && (
                <div className="absolute left-0 bottom-full mb-1.5 w-60 p-2.5 bg-slate-900 text-white text-[11px] leading-relaxed rounded-lg shadow-xl z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150 border border-slate-700">
                  <div className="font-semibold text-green-400 mb-0.5">{label}</div>
                  {infoText}
                </div>
              )}
            </div>
          )}
        </label>

        {/* Optional Quick options pills (e.g. 12V, 24V, 48V) */}
        {quickOptions && quickOptions.length > 0 && (
          <div className="flex items-center gap-1">
            {quickOptions.map((opt) => (
              <button
                key={opt.label || opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                  String(value) === String(opt.value)
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
              >
                {opt.label || opt.value}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input container with embedded unit badge */}
      <div
        className={`relative flex items-center rounded-xl border transition-all duration-150 bg-white overflow-hidden shadow-2xs ${
          error
            ? "border-red-500 ring-2 ring-red-500/20"
            : disabled
            ? "bg-gray-100 border-gray-200 opacity-75"
            : "border-gray-300 hover:border-gray-400 focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-600/20"
        }`}
      >
        <input
          id={id}
          name={id}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full py-2.5 px-3.5 text-base md:text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-hidden bg-transparent"
        />

        {/* Embedded Unit Indicator Badge */}
        {unit && (
          <div className="px-3.5 py-2.5 bg-gray-50 border-l border-gray-200 text-xs font-black text-gray-600 select-none shrink-0 tracking-wider">
            {unit}
          </div>
        )}
      </div>

      {/* Validation Error Message */}
      {error && (
        <div className="flex items-center gap-1 text-[11px] font-bold text-red-600 pt-0.5 animate-in fade-in slide-in-from-top-1">
          <AlertCircle size={12} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
