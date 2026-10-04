"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Zap,
  Battery,
  Cpu,
  Gauge,
  Activity,
  Calculator,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  PhoneCall,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  XCircle,
  Coins,
  Receipt,
  Calendar,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CalculatorInput } from "./CalculatorInput";
import {
  calculateOhmsLaw,
  calculatePower,
  calculateDcPower,
  calculateAcPower,
  calculateVaWattsPf,
  calculateBatteryRuntime,
  calculateInverterCapacity,
  calculateBatteryInverterSystem,
  calculateVoltageDedicated,
  calculateNepalElectricityCost,
  calculateNEABill,
  formatNumber,
  formatNPR,
  NEPALI_MONTHS,
} from "@/utils/electricalCalculations";

export function ElectricalCalculator({
  onBookService,
  externalPreset,
  onPresetLoaded,
  initialMode = "battery",
}) {
  // Calculator Modes:
  // 1. battery: Battery Runtime
  // 2. electricity-bill: Nepal Electricity Bill Calculator (NEA Slabs) 🇳🇵
  // 3. electricity-cost: Nepal Electricity Cost (NPR) 🇳🇵
  // 4. voltage: Voltage Calculator (Dedicated Mode)
  // 5. inverter: Inverter Capacity
  // 6. combined: Battery + Inverter (Advanced Combined)
  // 7. ohms: Ohm's Law
  // 8. power: Power / Watts
  // 9. dc-power: DC Calculator
  // 10. ac-power: AC Calculator
  // 11. va-pf: VA / Watts / Power Factor
  const [activeMode, setActiveMode] = useState(initialMode);
  const calculatorTopRef = useRef(null);

  // Smoothly change mode and ensure calculator is scrolled into view at default top
  const handleModeChange = (modeId) => {
    setActiveMode(modeId);
    setValidationError("");
    if (calculatorTopRef.current) {
      calculatorTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Sub-targets
  const [ohmsTarget, setOhmsTarget] = useState("voltage"); // 'voltage' | 'current' | 'resistance'
  const [powerTarget, setPowerTarget] = useState("power"); // 'power' | 'voltage' | 'current'
  const [vaPfTarget, setVaPfTarget] = useState("watts"); // 'watts' | 'va' | 'pf'
  const [voltageMethod, setVoltageMethod] = useState("current-resistance"); // 'current-resistance' | 'power-current' | 'power-resistance'
  const [showAdvancedInverter, setShowAdvancedInverter] = useState(false);

  // Default input values matching realistic engineering scenarios
  const initialInputs = {
    // Nepal Electricity Bill Calculator 🇳🇵 (NEA Domestic Slabs FY 2024/25)
    billPhase: "single", // 'single' | 'three'
    billCapacity: "15A", // '5A' | '15A' | '30A' | '60A' | 'upTo10KVA' | 'above10KVA'
    billUnits: "125",
    billMonth: "ashadh", // default month
    billInputMode: "units", // 'units' | 'readings'
    billPrevReading: "1250",
    billCurrReading: "1375",

    // Nepal Electricity Cost Calculator 🇳🇵 (Example: 50W, 12h/day, 30 days, Rs 12/unit -> Rs 216)
    costWatts: "50",
    costHoursPerDay: "12",
    costDays: "30",
    costRatePerUnit: "12",

    // Dedicated Voltage Calculator
    voltageCurrent: "5",
    voltageResistance: "10",
    voltagePower: "100",

    // Ohm's Law
    ohmsVoltage: "12",
    ohmsCurrent: "2",
    ohmsResistance: "6",

    // Basic Power / Watts
    powerWatts: "60",
    powerVoltage: "12",
    powerCurrent: "5",

    // DC Calculator
    dcVoltage: "12",
    dcCurrent: "5",

    // AC Calculator
    acVoltage: "230",
    acCurrent: "5",
    acPowerFactor: "0.8",

    // VA / Watts / PF Conversion
    vaPfVA: "900",
    vaPfWatts: "720",
    vaPfPowerFactor: "0.8",

    // Battery Runtime (Test Case: 12V 150Ah 600W 92% eff, 90% usable -> 2h 29m)
    batteryVoltage: "12",
    batteryCapacityAh: "150",
    batteryLoadWatts: "600",
    batteryEfficiency: "92",
    batteryUsableCapacity: "90",
    batteryInverterVA: "",
    batteryPowerFactor: "0.8",

    // Inverter Capacity
    inverterVA: "900",
    inverterPowerFactor: "0.8",
    inverterLoadWatts: "600",

    // Battery + Inverter Combined System
    combinedInverterVA: "900",
    combinedPowerFactor: "0.8",
    combinedBatteryVoltage: "12",
    combinedBatteryAh: "150",
    combinedLoadWatts: "600",
    combinedEfficiency: "92",
    combinedUsableCapacity: "90",
  };

  const [inputs, setInputs] = useState(initialInputs);
  const [copied, setCopied] = useState(false);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [validationError, setValidationError] = useState("");

  const handleInputChange = (field, val) => {
    setInputs((prev) => ({ ...prev, [field]: val }));
    setValidationError("");
  };

  // Quick Preset Handlers
  const applyBatteryPreset = (preset) => {
    setInputs((prev) => ({
      ...prev,
      batteryVoltage: String(preset.voltage),
      batteryCapacityAh: String(preset.capacity),
      batteryLoadWatts: String(preset.load),
      batteryEfficiency: String(preset.efficiency ?? "92"),
      batteryUsableCapacity: String(preset.usable ?? "90"),
      batteryInverterVA: preset.inverterVA ? String(preset.inverterVA) : prev.batteryInverterVA,
      batteryPowerFactor: preset.powerFactor ? String(preset.powerFactor) : prev.batteryPowerFactor,
    }));
    setValidationError("");
  };

  // Sync with initialMode or external preset if provided
  useEffect(() => {
    if (initialMode) {
      setActiveMode(initialMode);
    }
  }, [initialMode]);

  useEffect(() => {
    if (externalPreset) {
      setActiveMode("battery");
      applyBatteryPreset(externalPreset);
      if (onPresetLoaded) onPresetLoaded();
    }
  }, [externalPreset]);

  const applyCombinedPreset = (preset) => {
    setInputs((prev) => ({
      ...prev,
      combinedInverterVA: String(preset.inverterVA),
      combinedPowerFactor: String(preset.powerFactor ?? "0.8"),
      combinedBatteryVoltage: String(preset.voltage),
      combinedBatteryAh: String(preset.capacity),
      combinedLoadWatts: String(preset.load),
      combinedEfficiency: String(preset.efficiency ?? "92"),
      combinedUsableCapacity: String(preset.usable ?? "90"),
    }));
    setValidationError("");
  };

  // Calculation memo with full precision and active warnings
  const calculationResult = useMemo(() => {
    try {
      if (activeMode === "ohms") {
        return calculateOhmsLaw({
          target: ohmsTarget,
          voltage: inputs.ohmsVoltage,
          current: inputs.ohmsCurrent,
          resistance: inputs.ohmsResistance,
        });
      }

      if (activeMode === "power") {
        return calculatePower({
          target: powerTarget,
          power: inputs.powerWatts,
          voltage: inputs.powerVoltage,
          current: inputs.powerCurrent,
        });
      }

      if (activeMode === "dc-power") {
        return calculateDcPower({
          voltage: inputs.dcVoltage,
          current: inputs.dcCurrent,
        });
      }

      if (activeMode === "ac-power") {
        return calculateAcPower({
          voltage: inputs.acVoltage,
          current: inputs.acCurrent,
          powerFactor: inputs.acPowerFactor,
        });
      }

      if (activeMode === "va-pf") {
        return calculateVaWattsPf({
          target: vaPfTarget,
          va: inputs.vaPfVA,
          watts: inputs.vaPfWatts,
          powerFactor: inputs.vaPfPowerFactor,
        });
      }

      if (activeMode === "battery") {
        const baseResult = calculateBatteryRuntime({
          voltage: inputs.batteryVoltage,
          capacityAh: inputs.batteryCapacityAh,
          loadWatts: inputs.batteryLoadWatts,
          efficiency: inputs.batteryEfficiency,
          usableCapacityPercent: inputs.batteryUsableCapacity,
        });

        if (baseResult?.error) return baseResult;

        // Optional Inverter Capacity check (VA & Power Factor)
        if (baseResult && inputs.batteryInverterVA && parseFloat(inputs.batteryInverterVA) > 0) {
          const va = parseFloat(inputs.batteryInverterVA);
          const pf = parseFloat(inputs.batteryPowerFactor || "0.8");
          const realPowerW = va * pf;
          const loadW = parseFloat(inputs.batteryLoadWatts);
          const isOverloaded = loadW > realPowerW;

          baseResult.inverterCheck = {
            va,
            pf,
            realPowerW,
            isOverloaded,
            statusText: isOverloaded
              ? "Load exceeds estimated inverter capacity."
              : "Load within estimated inverter capacity.",
          };
          baseResult.secondaryDetails = [
            ...baseResult.secondaryDetails,
            {
              label: "Inverter Real Power",
              value: `${formatNumber(realPowerW, 0)} W (${va} VA @ ${pf} PF)`,
            },
          ];
          baseResult.steps = [
            ...baseResult.steps,
            {
              formula: "Inverter Real Power (W) = Inverter VA × Power Factor",
              text: `${va} VA × ${pf} = ${formatNumber(realPowerW, 0)} W (${baseResult.inverterCheck.statusText})`,
            },
          ];
        }

        return baseResult;
      }

      if (activeMode === "inverter") {
        return calculateInverterCapacity({
          inverterVA: inputs.inverterVA,
          powerFactor: inputs.inverterPowerFactor,
          loadWatts: inputs.inverterLoadWatts,
        });
      }

      if (activeMode === "combined") {
        return calculateBatteryInverterSystem({
          inverterVA: inputs.combinedInverterVA,
          powerFactor: inputs.combinedPowerFactor,
          batteryVoltage: inputs.combinedBatteryVoltage,
          batteryCapacityAh: inputs.combinedBatteryAh,
          loadWatts: inputs.combinedLoadWatts,
          inverterEfficiency: inputs.combinedEfficiency,
          usableCapacityPercent: inputs.combinedUsableCapacity,
        });
      }

      if (activeMode === "voltage") {
        return calculateVoltageDedicated({
          method: voltageMethod,
          current: inputs.voltageCurrent,
          resistance: inputs.voltageResistance,
          power: inputs.voltagePower,
        });
      }

      if (activeMode === "electricity-cost") {
        return calculateNepalElectricityCost({
          powerWatts: inputs.costWatts,
          hoursPerDay: inputs.costHoursPerDay,
          numberOfDays: inputs.costDays,
          ratePerUnit: inputs.costRatePerUnit,
        });
      }

      if (activeMode === "electricity-bill") {
        return calculateNEABill({
          phase: inputs.billPhase,
          meterCapacity: inputs.billCapacity,
          units: inputs.billUnits,
          billingMonth: inputs.billMonth,
          inputMode: inputs.billInputMode,
          previousReading: inputs.billPrevReading,
          currentReading: inputs.billCurrReading,
        });
      }

      return null;
    } catch (err) {
      return { error: "An unexpected error occurred during calculation. Please check your inputs." };
    }
  }, [activeMode, ohmsTarget, powerTarget, vaPfTarget, voltageMethod, inputs]);

  const handleCalculate = () => {
    if (calculationResult?.error) {
      setValidationError(calculationResult.error);
    } else {
      setValidationError("");
    }
  };

  const handleReset = () => {
    setInputs(initialInputs);
    setValidationError("");
  };

  // Structured Copy Formatter matching user specification
  const handleCopyResult = () => {
    if (!calculationResult || calculationResult.error) return;

    let lines = ["Electrical Calculation\n"];

    if (activeMode === "battery") {
      lines.push(`Battery:\n${inputs.batteryVoltage} V, ${inputs.batteryCapacityAh} Ah\n`);
      lines.push(`Load:\n${inputs.batteryLoadWatts} W\n`);
      lines.push(`Inverter Efficiency:\n${inputs.batteryEfficiency}%\n`);
      lines.push(`Usable Battery Capacity:\n${inputs.batteryUsableCapacity}%\n`);
      if (calculationResult.batteryEnergyWh) {
        lines.push(`Battery Energy:\n${formatNumber(calculationResult.batteryEnergyWh, 0)} Wh\n`);
      }
      if (calculationResult.usableEnergyWh) {
        lines.push(`Usable Energy:\n${formatNumber(calculationResult.usableEnergyWh, 1)} Wh\n`);
      }
      lines.push(`Estimated Runtime:\n${calculationResult.formattedRuntime}\n`);
      if (calculationResult.batteryCurrent) {
        lines.push(`Approx. Battery Current:\n${formatNumber(calculationResult.batteryCurrent, 1)} A\n`);
      }
    } else if (activeMode === "inverter") {
      lines.push(`Inverter:\n${inputs.inverterVA} VA\n`);
      lines.push(`Power Factor:\n${inputs.inverterPowerFactor}\n`);
      if (inputs.inverterLoadWatts) {
        lines.push(`Load:\n${inputs.inverterLoadWatts} W\n`);
      }
      lines.push(`Estimated Real Power Capability:\n${formatNumber(calculationResult.resultValue, 0)} W\n`);
      if (calculationResult.status) {
        lines.push(`Status:\n${calculationResult.status.text}\n`);
      }
    } else if (activeMode === "combined") {
      lines.push(`Battery:\n${inputs.combinedBatteryVoltage} V, ${inputs.combinedBatteryAh} Ah\n`);
      lines.push(`Load:\n${inputs.combinedLoadWatts} W\n`);
      lines.push(`Inverter Efficiency:\n${inputs.combinedEfficiency}%\n`);
      lines.push(`Usable Battery Capacity:\n${inputs.combinedUsableCapacity}%\n`);
      if (calculationResult.batteryEnergyWh) {
        lines.push(`Battery Energy:\n${formatNumber(calculationResult.batteryEnergyWh, 0)} Wh\n`);
      }
      if (calculationResult.usableEnergyWh) {
        lines.push(`Usable Energy:\n${formatNumber(calculationResult.usableEnergyWh, 1)} Wh\n`);
      }
      lines.push(`Estimated Runtime:\n${calculationResult.formattedRuntime}\n`);
      if (calculationResult.batteryCurrent) {
        lines.push(`Approx. Battery Current:\n${formatNumber(calculationResult.batteryCurrent, 1)} A\n`);
      }
      lines.push(`Inverter:\n${inputs.combinedInverterVA} VA\n`);
      lines.push(`Power Factor:\n${inputs.combinedPowerFactor}\n`);
      if (calculationResult.realPowerWatts) {
        lines.push(`Estimated Real Power Capability:\n${formatNumber(calculationResult.realPowerWatts, 0)} W\n`);
      }
      if (calculationResult.status) {
        lines.push(`Status:\n${calculationResult.status.text}\n`);
      }
    } else if (activeMode === "electricity-cost") {
      lines.push(`Nepal Electricity Cost Calculation (NPR)\n`);
      lines.push(`Power:\n${inputs.costWatts} W\n`);
      lines.push(`Usage:\n${inputs.costHoursPerDay} hours/day for ${inputs.costDays} days\n`);
      lines.push(`Rate:\nRs ${inputs.costRatePerUnit} per unit\n`);
      if (calculationResult.dailyKwh !== undefined) {
        lines.push(`Daily Consumption:\n${formatNumber(calculationResult.dailyKwh, 2)} kWh\n`);
      }
      if (calculationResult.totalKwh !== undefined) {
        lines.push(`Total Consumption:\n${formatNumber(calculationResult.totalKwh, 2)} kWh\n`);
      }
      if (calculationResult.totalUnits !== undefined) {
        lines.push(`Electricity Usage:\n${formatNumber(calculationResult.totalUnits, 2)} Units\n`);
      }
      lines.push(`Estimated Electricity Cost:\n${calculationResult.formattedCost || `Rs ${calculationResult.resultValue}`}\n`);
      if (calculationResult.secondaryDetails) {
        calculationResult.secondaryDetails.forEach((d) => {
          lines.push(`${d.label}: ${d.value}`);
        });
      }
    } else if (activeMode === "electricity-bill") {
      lines = [
        "🇳🇵 Nepal Electricity Bill Estimate\n",
        `Connection: ${calculationResult.phaseLabel || inputs.billPhase}`,
        `Meter: ${calculationResult.meterCapacityLabel || inputs.billCapacity}`,
        `Consumption: ${formatNumber(calculationResult.units, 1)} Units`,
        `Billing Period: ${calculationResult.billingMonthLabel} (${calculationResult.seasonLabel})\n`,
        `Energy Charge: ${calculationResult.formattedEnergyCharge}`,
        `Minimum Charge: ${calculationResult.formattedMinimumCharge}\n`,
        `Estimated Bill: ${calculationResult.formattedCost}\n`,
        `Tariff: NEA Domestic (${calculationResult.tariffSource?.fiscalYear || "FY 2024/25"})`,
        "\nThis is an estimated calculation and may differ from the actual NEA invoice.",
      ];
    } else {
      lines.push(`Mode: ${modes.find((m) => m.id === activeMode)?.label || activeMode}\n`);
      lines.push(`${calculationResult.mainLabel}:\n${calculationResult.resultValue} ${calculationResult.unit || ""}\n`);
      if (calculationResult.secondaryDetails) {
        calculationResult.secondaryDetails.forEach((d) => {
          lines.push(`${d.label}: ${d.value}`);
        });
      }
    }

    navigator.clipboard.writeText(lines.join("\n").trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modes = [
    { id: "battery", label: "Battery Runtime", icon: Battery, badge: "Popular" },
    { id: "electricity-bill", label: "Electricity Bill 🇳🇵", icon: Receipt, badge: "NEA Slabs" },
    { id: "electricity-cost", label: "Electricity Cost 🇳🇵", icon: Coins, badge: "NPR" },
    { id: "voltage", label: "Voltage Calculator", icon: Zap, badge: "New" },
    { id: "inverter", label: "Inverter Capacity", icon: Gauge },
    { id: "combined", label: "Battery + Inverter", icon: Sparkles, badge: "System" },
    { id: "ohms", label: "Ohm's Law", icon: Zap },
    { id: "power", label: "Power / Watts", icon: Calculator },
    { id: "dc-power", label: "DC Calculator", icon: Cpu },
    { id: "ac-power", label: "AC Calculator", icon: Activity },
    { id: "va-pf", label: "VA / Watts / PF", icon: RefreshCw },
  ];

  return (
    <div
      ref={calculatorTopRef}
      id="calculator-engine"
      className="w-full max-w-6xl mx-auto space-y-8 font-sans overflow-x-hidden calculator-scroll-target"
    >
      {/* Top Header Section */}
      <div className="text-center space-y-2.5">

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
          {activeMode === "electricity-bill"
            ? "Nepal Electricity Bill Calculator"
            : "Battery Runtime Calculator"}
        </h1>

        <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto font-medium leading-relaxed">
          {activeMode === "electricity-bill"
            ? "Calculate your estimated Nepal household electricity bill using verified NEA domestic tariff slabs, meter capacity, phase, and electricity units in Nepali Rupees (NPR)."
            : "Use this battery runtime calculator to estimate how long a battery can power your appliances, inverter, UPS, or other electrical loads. Enter your battery voltage, capacity in Ah, power consumption, inverter efficiency, and usable battery capacity."}
        </p>
      </div>

      {/* CALCULATOR MODE SELECTOR (Segmented Control / Cards) */}
      <div className="bg-white p-1.5 sm:p-2 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleModeChange(mode.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer select-none shrink-0 ${
                  isActive
                    ? "bg-green-600 text-white shadow-xs scale-[1.01]"
                    : "text-gray-600 hover:text-green-700 hover:bg-green-50/60"
                }`}
              >
                <Icon size={15} className={isActive ? "text-white" : "text-gray-500"} />
                <span>{mode.label}</span>
                {mode.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider ${
                      isActive ? "bg-white/20 text-white" : "bg-green-100 text-green-800"
                    }`}
                  >
                    {mode.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN TWO-COLUMN BALANCED LAYOUT ON DESKTOP, VERTICAL STACK ON MOBILE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Input Configuration Card */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                <span>
                  {activeMode === "battery" && "Battery Runtime Configuration"}
                  {activeMode === "electricity-bill" && "Nepal Electricity Bill Configuration 🇳🇵"}
                  {activeMode === "electricity-cost" && "Nepal Electricity Cost Calculator 🇳🇵"}
                  {activeMode === "voltage" && "Voltage Calculator"}
                  {activeMode === "inverter" && "Inverter Sizing & Load Check"}
                  {activeMode === "combined" && "Battery + Inverter System"}
                  {activeMode === "ohms" && "Ohm's Law Configuration"}
                  {activeMode === "power" && "Power / Watts Configuration"}
                  {activeMode === "dc-power" && "DC Power Configuration"}
                  {activeMode === "ac-power" && "AC Power Configuration"}
                  {activeMode === "va-pf" && "VA / Watts / Power Factor Configuration"}
                </span>
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Enter the required values. Units are shown beside each field.
              </p>
            </div>

            {/* Subtle Reset Button */}
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 font-bold bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-gray-200"
              title="Restore initial values"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </div>

          {/* Quick Presets for Battery Runtime Mode */}
          {activeMode === "battery" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Quick Presets (Common Backup Setups)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    applyBatteryPreset({ voltage: 12, capacity: 150, load: 600, efficiency: 92, usable: 90 })
                  }
                  className="p-2.5 text-left rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50/40 text-xs transition-colors cursor-pointer"
                >
                  <div className="font-bold text-gray-800">12V 150Ah</div>
                  <div className="text-[10px] text-gray-500">600W Home Load (2h 29m)</div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyBatteryPreset({ voltage: 12, capacity: 100, load: 250, efficiency: 92, usable: 90 })
                  }
                  className="p-2.5 text-left rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50/40 text-xs transition-colors cursor-pointer"
                >
                  <div className="font-bold text-gray-800">12V 100Ah</div>
                  <div className="text-[10px] text-gray-500">250W Lights/Fans</div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyBatteryPreset({ voltage: 24, capacity: 200, load: 1000, efficiency: 92, usable: 90 })
                  }
                  className="p-2.5 text-left rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50/40 text-xs transition-colors cursor-pointer"
                >
                  <div className="font-bold text-gray-800">24V 200Ah</div>
                  <div className="text-[10px] text-gray-500">1000W Heavy Backup</div>
                </button>
              </div>
            </div>
          )}

          {/* Quick Presets for Combined Mode */}
          {activeMode === "combined" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Quick Presets (Test Scenarios)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    applyCombinedPreset({
                      inverterVA: 900,
                      powerFactor: 0.8,
                      voltage: 12,
                      capacity: 150,
                      load: 600,
                      efficiency: 92,
                      usable: 90,
                    })
                  }
                  className="p-2.5 text-left rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50/40 text-xs transition-colors cursor-pointer"
                >
                  <div className="font-bold text-gray-800">900 VA Inverter + 12V 150Ah</div>
                  <div className="text-[10px] text-emerald-700 font-semibold">600W Load (Within Capacity)</div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyCombinedPreset({
                      inverterVA: 900,
                      powerFactor: 0.8,
                      voltage: 12,
                      capacity: 150,
                      load: 800,
                      efficiency: 92,
                      usable: 90,
                    })
                  }
                  className="p-2.5 text-left rounded-xl border border-gray-200 hover:border-amber-500 hover:bg-amber-50/40 text-xs transition-colors cursor-pointer"
                >
                  <div className="font-bold text-gray-800">900 VA Inverter + 12V 150Ah</div>
                  <div className="text-[10px] text-amber-700 font-semibold">800W Load (Exceeds Capacity)</div>
                </button>
              </div>
            </div>
          )}

          {/* MODE 1: OHM'S LAW */}
          {activeMode === "ohms" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Choose what you want to calculate:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "voltage", label: "Voltage (V)" },
                    { id: "current", label: "Current (I)" },
                    { id: "resistance", label: "Resistance (R)" },
                  ].map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => setOhmsTarget(target.id)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer text-center ${
                        ohmsTarget === target.id
                          ? "bg-green-600 text-white shadow-2xs"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                    >
                      {target.label}
                    </button>
                  ))}
                </div>
              </div>

              {ohmsTarget !== "voltage" && (
                <CalculatorInput
                  id="ohmsVoltage"
                  label="Voltage"
                  unit="V"
                  value={inputs.ohmsVoltage}
                  onChange={(v) => handleInputChange("ohmsVoltage", v)}
                  placeholder="e.g. 12"
                  infoText="Electrical potential difference measured in Volts (V)."
                />
              )}

              {ohmsTarget !== "current" && (
                <CalculatorInput
                  id="ohmsCurrent"
                  label="Current"
                  unit="A"
                  value={inputs.ohmsCurrent}
                  onChange={(v) => handleInputChange("ohmsCurrent", v)}
                  placeholder="e.g. 2"
                  infoText="Flow of electric charge measured in Amperes (A)."
                />
              )}

              {ohmsTarget !== "resistance" && (
                <CalculatorInput
                  id="ohmsResistance"
                  label="Resistance"
                  unit="Ω"
                  value={inputs.ohmsResistance}
                  onChange={(v) => handleInputChange("ohmsResistance", v)}
                  placeholder="e.g. 6"
                  infoText="Opposition to electrical current flow measured in Ohms (Ω). Cannot be zero."
                />
              )}
            </div>
          )}

          {/* MODE 2: POWER / WATTS */}
          {activeMode === "power" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Choose what you want to calculate:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "power", label: "Watts (W)" },
                    { id: "voltage", label: "Voltage (V)" },
                    { id: "current", label: "Current (A)" },
                  ].map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => setPowerTarget(target.id)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer text-center ${
                        powerTarget === target.id
                          ? "bg-green-600 text-white shadow-2xs"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                    >
                      {target.label}
                    </button>
                  ))}
                </div>
              </div>

              {powerTarget !== "power" && (
                <CalculatorInput
                  id="powerWatts"
                  label="Power"
                  unit="W"
                  value={inputs.powerWatts}
                  onChange={(v) => handleInputChange("powerWatts", v)}
                  placeholder="e.g. 60"
                  infoText="Watts is the rate of energy conversion (P = V × I)."
                />
              )}

              {powerTarget !== "voltage" && (
                <CalculatorInput
                  id="powerVoltage"
                  label="Voltage"
                  unit="V"
                  value={inputs.powerVoltage}
                  onChange={(v) => handleInputChange("powerVoltage", v)}
                  placeholder="e.g. 12"
                  infoText="Voltage across the load in Volts (V)."
                />
              )}

              {powerTarget !== "current" && (
                <CalculatorInput
                  id="powerCurrent"
                  label="Current"
                  unit="A"
                  value={inputs.powerCurrent}
                  onChange={(v) => handleInputChange("powerCurrent", v)}
                  placeholder="e.g. 5"
                  infoText="Current drawn by the load in Amperes (A)."
                />
              )}
            </div>
          )}

          {/* MODE 3: DC CALCULATOR */}
          {activeMode === "dc-power" && (
            <div className="space-y-4">
              <CalculatorInput
                id="dcVoltage"
                label="Voltage"
                unit="V"
                value={inputs.dcVoltage}
                onChange={(v) => handleInputChange("dcVoltage", v)}
                placeholder="12"
                quickOptions={[{ value: "12", label: "12V" }, { value: "24", label: "24V" }, { value: "48", label: "48V" }]}
                infoText="Direct Current voltage source (e.g. battery or DC power supply)."
              />

              <CalculatorInput
                id="dcCurrent"
                label="Current"
                unit="A"
                value={inputs.dcCurrent}
                onChange={(v) => handleInputChange("dcCurrent", v)}
                placeholder="5"
                infoText="Current in Amperes (A). Standard DC calculations do not require a power factor."
              />
            </div>
          )}

          {/* MODE 4: AC CALCULATOR */}
          {activeMode === "ac-power" && (
            <div className="space-y-4">
              <CalculatorInput
                id="acVoltage"
                label="Voltage"
                unit="V"
                value={inputs.acVoltage}
                onChange={(v) => handleInputChange("acVoltage", v)}
                placeholder="230"
                quickOptions={[{ value: "230", label: "230V (Nepal)" }, { value: "110", label: "110V" }]}
                infoText="AC RMS Voltage. Standard domestic single-phase grid in Nepal is 230 V."
              />

              <CalculatorInput
                id="acCurrent"
                label="Current"
                unit="A"
                value={inputs.acCurrent}
                onChange={(v) => handleInputChange("acCurrent", v)}
                placeholder="5"
                infoText="Alternating current drawn in Amperes (A)."
              />

              <CalculatorInput
                id="acPowerFactor"
                label="Power Factor"
                unit="PF"
                value={inputs.acPowerFactor}
                onChange={(v) => handleInputChange("acPowerFactor", v)}
                placeholder="0.8"
                min="0.1"
                max="1.0"
                step="0.05"
                quickOptions={[{ value: "0.8", label: "0.8 (Inductive)" }, { value: "0.9", label: "0.9" }, { value: "1.0", label: "1.0 (Resistive)" }]}
                infoText="Used in AC systems to relate real power to apparent power (normally between 0.1 and 1.0)."
              />
            </div>
          )}

          {/* MODE 5: VA / WATTS / POWER FACTOR */}
          {activeMode === "va-pf" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Calculate target:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "watts", label: "Watts (Real W)" },
                    { id: "va", label: "VA (Apparent)" },
                    { id: "pf", label: "Power Factor (PF)" },
                  ].map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => setVaPfTarget(target.id)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer text-center ${
                        vaPfTarget === target.id
                          ? "bg-green-600 text-white shadow-2xs"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                    >
                      {target.label}
                    </button>
                  ))}
                </div>
              </div>

              {vaPfTarget !== "va" && (
                <CalculatorInput
                  id="vaPfVA"
                  label="Apparent Power (VA)"
                  unit="VA"
                  value={inputs.vaPfVA}
                  onChange={(v) => handleInputChange("vaPfVA", v)}
                  placeholder="900"
                  infoText="Volt-amperes (apparent power rating). Standard inverter label rating."
                />
              )}

              {vaPfTarget !== "watts" && (
                <CalculatorInput
                  id="vaPfWatts"
                  label="Real Power (Watts)"
                  unit="W"
                  value={inputs.vaPfWatts}
                  onChange={(v) => handleInputChange("vaPfWatts", v)}
                  placeholder="720"
                  infoText="Real usable power consumed by appliances in Watts (W)."
                />
              )}

              {vaPfTarget !== "pf" && (
                <CalculatorInput
                  id="vaPfPowerFactor"
                  label="Power Factor (PF)"
                  unit="PF"
                  value={inputs.vaPfPowerFactor}
                  onChange={(v) => handleInputChange("vaPfPowerFactor", v)}
                  placeholder="0.8"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  infoText="Dimensionless ratio between real power and apparent power."
                />
              )}
            </div>
          )}

          {/* MODE 6: BATTERY RUNTIME */}
          {activeMode === "battery" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CalculatorInput
                  id="batteryVoltage"
                  label="Battery Voltage"
                  unit="V"
                  value={inputs.batteryVoltage}
                  onChange={(v) => handleInputChange("batteryVoltage", v)}
                  placeholder="12"
                  quickOptions={[{ value: "12", label: "12V" }, { value: "24", label: "24V" }, { value: "48", label: "48V" }]}
                  infoText="Nominal DC voltage of the battery or connected battery bank."
                />

                <CalculatorInput
                  id="batteryCapacityAh"
                  label="Battery Capacity"
                  unit="Ah"
                  value={inputs.batteryCapacityAh}
                  onChange={(v) => handleInputChange("batteryCapacityAh", v)}
                  placeholder="150"
                  quickOptions={[{ value: "100", label: "100Ah" }, { value: "150", label: "150Ah" }, { value: "200", label: "200Ah" }]}
                  infoText="Amp-hours. A way of describing battery capacity."
                />
              </div>

              <CalculatorInput
                id="batteryLoadWatts"
                label="Power Consumption / Load"
                unit="W"
                value={inputs.batteryLoadWatts}
                onChange={(v) => handleInputChange("batteryLoadWatts", v)}
                placeholder="600"
                infoText="Total continuous wattage drawn by running appliances (bulbs, fans, TV, PC)."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CalculatorInput
                  id="batteryEfficiency"
                  label="Inverter Efficiency"
                  unit="%"
                  value={inputs.batteryEfficiency}
                  onChange={(v) => handleInputChange("batteryEfficiency", v)}
                  placeholder="92"
                  min="50"
                  max="100"
                  infoText="The percentage of input energy that becomes useful output after losses (typically 90% to 94%)."
                />

                <CalculatorInput
                  id="batteryUsableCapacity"
                  label="Usable Battery Capacity (%)"
                  unit="%"
                  value={inputs.batteryUsableCapacity}
                  onChange={(v) => handleInputChange("batteryUsableCapacity", v)}
                  placeholder="90"
                  min="10"
                  max="100"
                  infoText="This is the percentage of the battery capacity you allow the calculation to use."
                />
              </div>

              {/* Optional Advanced Inverter Rating Check */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAdvancedInverter(!showAdvancedInverter)}
                  className="flex items-center justify-between w-full text-xs font-bold text-gray-600 hover:text-green-700 py-1.5 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Gauge size={14} className="text-gray-400" />
                    <span>Optional Inverter Sizing Check (VA &amp; Power Factor)</span>
                  </span>
                  {showAdvancedInverter ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showAdvancedInverter && (
                  <div className="mt-3 p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 space-y-3 animate-in fade-in">
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Check if your inverter rating can sustain this continuous wattage load. Note: 900 VA does not equal
                      900 W because inductive appliances (fans, motors) draw reactive power.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <CalculatorInput
                        id="batteryInverterVA"
                        label="Inverter Rating (Optional)"
                        unit="VA"
                        value={inputs.batteryInverterVA}
                        onChange={(v) => handleInputChange("batteryInverterVA", v)}
                        placeholder="e.g. 900"
                        quickOptions={[
                          { value: "900", label: "900 VA" },
                          { value: "1100", label: "1100 VA" },
                          { value: "1500", label: "1500 VA" },
                        ]}
                      />
                      <CalculatorInput
                        id="batteryPowerFactor"
                        label="Power Factor"
                        unit="PF"
                        value={inputs.batteryPowerFactor}
                        onChange={(v) => handleInputChange("batteryPowerFactor", v)}
                        placeholder="0.8"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODE: VOLTAGE CALCULATOR (DEDICATED) */}
          {activeMode === "voltage" && (
            <div className="space-y-6">
              {/* Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Select Calculation Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVoltageMethod("current-resistance");
                      setValidationError("");
                    }}
                    className={`p-3 text-left rounded-2xl border transition-all cursor-pointer ${
                      voltageMethod === "current-resistance"
                        ? "border-green-600 bg-green-50/70 text-green-900 shadow-2xs ring-1 ring-green-600/30"
                        : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                    }`}
                  >
                    <div className="font-extrabold text-xs flex items-center justify-between">
                      <span>Current + Resistance</span>
                      {voltageMethod === "current-resistance" && (
                        <span className="w-2 h-2 rounded-full bg-green-600"></span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-gray-500 mt-1">V = I × R</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setVoltageMethod("power-current");
                      setValidationError("");
                    }}
                    className={`p-3 text-left rounded-2xl border transition-all cursor-pointer ${
                      voltageMethod === "power-current"
                        ? "border-green-600 bg-green-50/70 text-green-900 shadow-2xs ring-1 ring-green-600/30"
                        : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                    }`}
                  >
                    <div className="font-extrabold text-xs flex items-center justify-between">
                      <span>Power + Current</span>
                      {voltageMethod === "power-current" && (
                        <span className="w-2 h-2 rounded-full bg-green-600"></span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-gray-500 mt-1">V = W ÷ A</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setVoltageMethod("power-resistance");
                      setValidationError("");
                    }}
                    className={`p-3 text-left rounded-2xl border transition-all cursor-pointer ${
                      voltageMethod === "power-resistance"
                        ? "border-green-600 bg-green-50/70 text-green-900 shadow-2xs ring-1 ring-green-600/30"
                        : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                    }`}
                  >
                    <div className="font-extrabold text-xs flex items-center justify-between">
                      <span>Power + Resistance</span>
                      {voltageMethod === "power-resistance" && (
                        <span className="w-2 h-2 rounded-full bg-green-600"></span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-gray-500 mt-1">V = √(W × R)</div>
                  </button>
                </div>
              </div>

              {/* Dynamically Show Only Inputs for Selected Method */}
              <div className="space-y-4">
                {voltageMethod === "current-resistance" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CalculatorInput
                      id="voltageCurrent"
                      label="Current"
                      unit="A"
                      value={inputs.voltageCurrent}
                      onChange={(v) => handleInputChange("voltageCurrent", v)}
                      placeholder="e.g. 5"
                      min="0.001"
                      step="any"
                      infoText="Electric current flow in Amperes (A)."
                    />
                    <CalculatorInput
                      id="voltageResistance"
                      label="Resistance"
                      unit="Ω"
                      value={inputs.voltageResistance}
                      onChange={(v) => handleInputChange("voltageResistance", v)}
                      placeholder="e.g. 10"
                      min="0.001"
                      step="any"
                      infoText="Circuit resistance in Ohms (Ω)."
                    />
                  </div>
                )}

                {voltageMethod === "power-current" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CalculatorInput
                      id="voltagePower"
                      label="Power"
                      unit="W"
                      value={inputs.voltagePower}
                      onChange={(v) => handleInputChange("voltagePower", v)}
                      placeholder="e.g. 100"
                      min="0.001"
                      step="any"
                      infoText="Power consumption in Watts (W)."
                    />
                    <CalculatorInput
                      id="voltageCurrent"
                      label="Current"
                      unit="A"
                      value={inputs.voltageCurrent}
                      onChange={(v) => handleInputChange("voltageCurrent", v)}
                      placeholder="e.g. 5"
                      min="0.001"
                      step="any"
                      infoText="Current in Amperes (A). Must be greater than 0."
                    />
                  </div>
                )}

                {voltageMethod === "power-resistance" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CalculatorInput
                      id="voltagePower"
                      label="Power"
                      unit="W"
                      value={inputs.voltagePower}
                      onChange={(v) => handleInputChange("voltagePower", v)}
                      placeholder="e.g. 100"
                      min="0.001"
                      step="any"
                      infoText="Power in Watts (W)."
                    />
                    <CalculatorInput
                      id="voltageResistance"
                      label="Resistance"
                      unit="Ω"
                      value={inputs.voltageResistance}
                      onChange={(v) => handleInputChange("voltageResistance", v)}
                      placeholder="e.g. 25"
                      min="0.001"
                      step="any"
                      infoText="Resistance in Ohms (Ω)."
                    />
                  </div>
                )}
              </div>

              {/* Quick Preset Cards matching user validation examples */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Validation Examples
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVoltageMethod("current-resistance");
                      setInputs((prev) => ({ ...prev, voltageCurrent: "5", voltageResistance: "10" }));
                      setValidationError("");
                    }}
                    className="p-2.5 text-left rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50/40 text-xs transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-gray-800">5 A &amp; 10 Ω</div>
                    <div className="text-[10px] text-gray-500">I × R → 50.00 V</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoltageMethod("power-current");
                      setInputs((prev) => ({ ...prev, voltagePower: "100", voltageCurrent: "5" }));
                      setValidationError("");
                    }}
                    className="p-2.5 text-left rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50/40 text-xs transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-gray-800">100 W &amp; 5 A</div>
                    <div className="text-[10px] text-gray-500">W ÷ A → 20.00 V</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoltageMethod("power-resistance");
                      setInputs((prev) => ({ ...prev, voltagePower: "100", voltageResistance: "25" }));
                      setValidationError("");
                    }}
                    className="p-2.5 text-left rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50/40 text-xs transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-gray-800">100 W &amp; 25 Ω</div>
                    <div className="text-[10px] text-gray-500">√(W × R) → 50.00 V</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE: NEPAL ELECTRICITY COST CALCULATOR 🇳🇵 */}
          {activeMode === "electricity-cost" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CalculatorInput
                  id="costWatts"
                  label="Power Consumption"
                  unit="W"
                  value={inputs.costWatts}
                  onChange={(v) => handleInputChange("costWatts", v)}
                  placeholder="e.g. 50"
                  min="0.1"
                  step="any"
                  quickOptions={[
                    { value: "50", label: "50W (Fan/Bulb)" },
                    { value: "200", label: "200W (TV/Fridge)" },
                    { value: "1000", label: "1000W (Heater/AC)" },
                  ]}
                  infoText="Appliance rated wattage in Watts (W). Example: 50 W."
                />

                <CalculatorInput
                  id="costHoursPerDay"
                  label="Usage Hours"
                  unit="h/day"
                  value={inputs.costHoursPerDay}
                  onChange={(v) => handleInputChange("costHoursPerDay", v)}
                  placeholder="e.g. 12"
                  min="0.1"
                  max="24"
                  step="any"
                  quickOptions={[
                    { value: "4", label: "4 hrs" },
                    { value: "8", label: "8 hrs" },
                    { value: "12", label: "12 hrs" },
                    { value: "24", label: "24 hrs" },
                  ]}
                  infoText="Number of hours the appliance is run each day (max 24)."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CalculatorInput
                  id="costDays"
                  label="Number of Days"
                  unit="days"
                  value={inputs.costDays}
                  onChange={(v) => handleInputChange("costDays", v)}
                  placeholder="e.g. 30"
                  min="1"
                  step="1"
                  quickOptions={[
                    { value: "1", label: "1 Day" },
                    { value: "7", label: "7 Days (Week)" },
                    { value: "30", label: "30 Days (Month)" },
                    { value: "365", label: "365 Days (Year)" },
                  ]}
                  infoText="Total duration in days for electricity bill estimation."
                />

                <CalculatorInput
                  id="costRatePerUnit"
                  label="Electricity Rate"
                  unit="Rs/unit"
                  value={inputs.costRatePerUnit}
                  onChange={(v) => handleInputChange("costRatePerUnit", v)}
                  placeholder="e.g. 12"
                  min="0.01"
                  step="any"
                  quickOptions={[
                    { value: "8", label: "Rs 8" },
                    { value: "10", label: "Rs 10" },
                    { value: "12", label: "Rs 12" },
                    { value: "15", label: "Rs 15" },
                  ]}
                  infoText="Tariff rate per unit (1 Unit = 1 kWh) in Nepali Rupees (NPR). Editable as Nepal NEA rates vary by slab & capacity."
                />
              </div>

              {/* Quick Preset Scenarios */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Example Scenarios
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInputs((prev) => ({
                        ...prev,
                        costWatts: "50",
                        costHoursPerDay: "12",
                        costDays: "30",
                        costRatePerUnit: "12",
                      }));
                      setValidationError("");
                    }}
                    className="p-2.5 text-left rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50/40 text-xs transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-gray-800">50W • 12 hrs • 30 days</div>
                    <div className="text-[10px] text-gray-500">18 Units @ Rs 12 → Rs 216</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInputs((prev) => ({
                        ...prev,
                        costWatts: "150",
                        costHoursPerDay: "24",
                        costDays: "30",
                        costRatePerUnit: "10",
                      }));
                      setValidationError("");
                    }}
                    className="p-2.5 text-left rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50/40 text-xs transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-gray-800">Refrigerator (150W 24h)</div>
                    <div className="text-[10px] text-gray-500">108 Units @ Rs 10 → Rs 1,080</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInputs((prev) => ({
                        ...prev,
                        costWatts: "1500",
                        costHoursPerDay: "3",
                        costDays: "30",
                        costRatePerUnit: "12",
                      }));
                      setValidationError("");
                    }}
                    className="p-2.5 text-left rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50/40 text-xs transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-gray-800">Geyser / AC (1500W 3h)</div>
                    <div className="text-[10px] text-gray-500">135 Units @ Rs 12 → Rs 1,620</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE: NEPAL ELECTRICITY BILL CALCULATOR 🇳🇵 (NEA SLABS) */}
          {activeMode === "electricity-bill" && (
            <div className="space-y-6">
              {/* SECTION A: CONNECTION / PHASE TYPE */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Connection / Phase Type (फेज प्रकार)</span>
                  <span className="text-emerald-700 font-bold text-[11px] normal-case bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Low Voltage Domestic
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInputs((prev) => ({
                        ...prev,
                        billPhase: "single",
                        billCapacity: ["5A", "15A", "30A", "60A"].includes(prev.billCapacity)
                          ? prev.billCapacity
                          : "15A",
                      }));
                      setValidationError("");
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      inputs.billPhase === "single"
                        ? "border-green-600 bg-green-50/70 text-green-900 shadow-2xs ring-1 ring-green-600/30"
                        : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs">Single Phase</span>
                      {inputs.billPhase === "single" && (
                        <span className="w-2 h-2 rounded-full bg-green-600"></span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">230V • Normal Household (5A–60A)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInputs((prev) => ({
                        ...prev,
                        billPhase: "three",
                        billCapacity: ["upTo10KVA", "above10KVA"].includes(prev.billCapacity)
                          ? prev.billCapacity
                          : "upTo10KVA",
                      }));
                      setValidationError("");
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      inputs.billPhase === "three"
                        ? "border-green-600 bg-green-50/70 text-green-900 shadow-2xs ring-1 ring-green-600/30"
                        : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs">Three Phase</span>
                      {inputs.billPhase === "three" && (
                        <span className="w-2 h-2 rounded-full bg-green-600"></span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">400V • Heavy Load (kVA Categories)</div>
                  </button>
                </div>
              </div>

              {/* SECTION B: METER CAPACITY (DYNAMIC ACCORDING TO PHASE) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Meter Capacity (मिटर क्षमता)</span>
                  <span className="text-gray-400 font-normal text-[11px] normal-case">
                    {inputs.billPhase === "single" ? "Single Phase Capacities" : "Three Phase Low Voltage"}
                  </span>
                </label>

                {inputs.billPhase === "single" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "5A", label: "5 Amp", desc: "Rural / Basic", badge: "Min Rs 30" },
                      { id: "15A", label: "15 Amp", desc: "Standard Home", badge: "Most Popular", highlight: true },
                      { id: "30A", label: "30 Amp", desc: "Medium Load", badge: "Min Rs 75" },
                      { id: "60A", label: "60 Amp", desc: "Heavy Load", badge: "Min Rs 125" },
                    ].map((cap) => {
                      const isSelected = inputs.billCapacity === cap.id;
                      return (
                        <button
                          key={cap.id}
                          type="button"
                          onClick={() => {
                            handleInputChange("billCapacity", cap.id);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "border-green-600 bg-green-50/70 text-green-950 shadow-2xs ring-1 ring-green-600/30"
                              : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs">{cap.label}</span>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">{cap.desc}</div>
                          </div>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold mt-2 w-fit ${
                              cap.highlight
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {cap.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      {
                        id: "upTo10KVA",
                        label: "Up to 10 kVA",
                        nameNp: "१० केभीएसम्म",
                        desc: "Min Charge: Rs 1,100 / month",
                      },
                      {
                        id: "above10KVA",
                        label: "Above 10 kVA",
                        nameNp: "१० केभीएभन्दा माथि",
                        desc: "Min Charge: Rs 1,800 / month",
                      },
                    ].map((cap) => {
                      const isSelected = inputs.billCapacity === cap.id;
                      return (
                        <button
                          key={cap.id}
                          type="button"
                          onClick={() => {
                            handleInputChange("billCapacity", cap.id);
                          }}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "border-green-600 bg-green-50/70 text-green-950 shadow-2xs ring-1 ring-green-600/30"
                              : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs">
                              {cap.label} ({cap.nameNp})
                            </span>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-green-600"></span>}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">{cap.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION C: BILLING PERIOD / MONTH SELECTOR & SEASON BADGE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="billMonth" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Billing Month / Season (बिलिङ महिना)
                  </label>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {NEPALI_MONTHS.find((m) => m.id === inputs.billMonth)?.seasonLabel || "Ashad–Kartik"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <select
                      id="billMonth"
                      value={inputs.billMonth}
                      onChange={(e) => handleInputChange("billMonth", e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-base sm:text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 cursor-pointer"
                    >
                      {NEPALI_MONTHS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nameEn} ({m.nameNp}) — {m.seasonLabel}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="text-[11px] text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-2.5 flex items-center gap-2">
                    <Calendar size={15} className="text-gray-400 shrink-0" />
                    <span>
                      {inputs.billPhase === "three"
                        ? "Three-phase seasonal rates: Ashad–Kartik @ Rs 10.50/unit, Marg–Jestha @ Rs 11.50/unit."
                        : "Single-phase domestic slabs apply progressively all year round."}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION D: INPUT MODE TOGGLE (Direct Units vs Meter Readings) */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Electricity Consumption (खपत)
                  </span>
                  <div className="flex items-center bg-gray-100 p-0.5 rounded-xl text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => handleInputChange("billInputMode", "units")}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        inputs.billInputMode === "units"
                          ? "bg-white text-gray-900 shadow-2xs"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      Enter Units (युनिट)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange("billInputMode", "readings")}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        inputs.billInputMode === "readings"
                          ? "bg-white text-gray-900 shadow-2xs"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      From Meter Reading (मिटर रिडिङ)
                    </button>
                  </div>
                </div>

                {inputs.billInputMode === "units" ? (
                  <div className="space-y-3">
                    <CalculatorInput
                      id="billUnits"
                      label="Consumed Units (kWh)"
                      unit="Units"
                      value={inputs.billUnits}
                      onChange={(v) => handleInputChange("billUnits", v)}
                      placeholder="e.g. 125"
                      min="0"
                      step="any"
                      infoText="Total electricity consumed during the billing month. 1 Unit = 1 kWh."
                    />

                    {/* Quick Presets for Consumed Units */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                        Quick Unit Presets (द्रुत विकल्प)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[20, 50, 100, 125, 150, 250, 300].map((presetUnits) => (
                          <button
                            key={presetUnits}
                            type="button"
                            onClick={() => {
                              handleInputChange("billUnits", String(presetUnits));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                              inputs.billUnits === String(presetUnits)
                                ? "bg-green-600 text-white border-green-600 shadow-2xs"
                                : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                            }`}
                          >
                            {presetUnits} Units
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 bg-gray-50/80 rounded-2xl border border-gray-200">
                    <div className="text-[11px] text-gray-600 leading-relaxed font-medium">
                      Enter meter readings from your current and previous electricity bills. The calculator computes:
                      <span className="font-mono font-bold text-gray-800 ml-1">Units = Current - Previous</span>.
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <CalculatorInput
                        id="billPrevReading"
                        label="Previous Meter Reading (अघिल्लो)"
                        unit="kWh"
                        value={inputs.billPrevReading}
                        onChange={(v) => handleInputChange("billPrevReading", v)}
                        placeholder="e.g. 1250"
                        min="0"
                        step="any"
                        infoText="Reading shown on the last month's electricity invoice."
                      />

                      <CalculatorInput
                        id="billCurrReading"
                        label="Current Meter Reading (हालको)"
                        unit="kWh"
                        value={inputs.billCurrReading}
                        onChange={(v) => handleInputChange("billCurrReading", v)}
                        placeholder="e.g. 1375"
                        min="0"
                        step="any"
                        infoText="Current reading visible on your physical electric meter display."
                      />
                    </div>

                    {inputs.billPrevReading &&
                      inputs.billCurrReading &&
                      parseFloat(inputs.billCurrReading) >= parseFloat(inputs.billPrevReading) && (
                        <div className="flex items-center justify-between p-2.5 bg-emerald-100/70 text-emerald-900 rounded-xl text-xs font-bold border border-emerald-200">
                          <span>Computed Units Consumed:</span>
                          <span className="font-mono text-sm">
                            {formatNumber(
                              parseFloat(inputs.billCurrReading) - parseFloat(inputs.billPrevReading),
                              1
                            )}{" "}
                            Units
                          </span>
                        </div>
                      )}
                  </div>
                )}

                {/* Ways to calculate bridge: If user doesn't know units */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleModeChange("electricity-cost")}
                    className="w-full text-left inline-flex items-center justify-between gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50/90 hover:bg-emerald-100/90 p-3 rounded-2xl border border-emerald-200/80 transition-all cursor-pointer shadow-2xs group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-200/60 flex items-center justify-center text-xs">💡</span>
                      <span>Don&apos;t know your total units? Estimate from home appliances (उपकरणहरूबाट हिसाब गर्नुहोस्)</span>
                    </span>
                    <span className="text-emerald-700 group-hover:translate-x-0.5 transition-transform font-bold">→</span>
                  </button>
                </div>
              </div>

              {/* Common Household Quick Setup */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">
                  Standard Nepali Household: Single Phase • 15A
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setInputs((prev) => ({
                      ...prev,
                      billPhase: "single",
                      billCapacity: "15A",
                      billUnits: "125",
                      billInputMode: "units",
                    }));
                    setValidationError("");
                  }}
                  className="text-xs font-bold text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Load 15A 125 Units Preset
                </button>
              </div>
            </div>
          )}

          {/* MODE 7: INVERTER CAPACITY */}
          {activeMode === "inverter" && (
            <div className="space-y-4">
              <CalculatorInput
                id="inverterVA"
                label="Inverter Rating"
                unit="VA"
                value={inputs.inverterVA}
                onChange={(v) => handleInputChange("inverterVA", v)}
                placeholder="900"
                quickOptions={[{ value: "850", label: "850VA" }, { value: "900", label: "900VA" }, { value: "1050", label: "1050VA" }, { value: "1500", label: "1500VA" }]}
                infoText="Volt-amperes. A measure of apparent power stamped on the inverter."
              />

              <CalculatorInput
                id="inverterPowerFactor"
                label="Power Factor"
                unit="PF"
                value={inputs.inverterPowerFactor}
                onChange={(v) => handleInputChange("inverterPowerFactor", v)}
                placeholder="0.8"
                min="0.1"
                max="1.0"
                step="0.05"
                infoText="Standard commercial power factor for domestic inverters is 0.8 (e.g. 900 VA × 0.8 = 720 W real capacity)."
              />

              <CalculatorInput
                id="inverterLoadWatts"
                label="Load to Check (Optional)"
                unit="W"
                value={inputs.inverterLoadWatts}
                onChange={(v) => handleInputChange("inverterLoadWatts", v)}
                placeholder="600"
                required={false}
                infoText="Enter your planned load to verify whether it is within the continuous capability of the inverter."
              />
            </div>
          )}

          {/* MODE 8: BATTERY + INVERTER (COMBINED) */}
          {activeMode === "combined" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CalculatorInput
                  id="combinedInverterVA"
                  label="Inverter Rating"
                  unit="VA"
                  value={inputs.combinedInverterVA}
                  onChange={(v) => handleInputChange("combinedInverterVA", v)}
                  placeholder="900"
                  infoText="Inverter rated apparent capacity in VA."
                />

                <CalculatorInput
                  id="combinedPowerFactor"
                  label="Power Factor"
                  unit="PF"
                  value={inputs.combinedPowerFactor}
                  onChange={(v) => handleInputChange("combinedPowerFactor", v)}
                  placeholder="0.8"
                  infoText="Average household appliance power factor (typically 0.8)."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CalculatorInput
                  id="combinedBatteryVoltage"
                  label="Battery Voltage"
                  unit="V"
                  value={inputs.combinedBatteryVoltage}
                  onChange={(v) => handleInputChange("combinedBatteryVoltage", v)}
                  placeholder="12"
                  quickOptions={[{ value: "12", label: "12V" }, { value: "24", label: "24V" }]}
                />

                <CalculatorInput
                  id="combinedBatteryAh"
                  label="Battery Capacity"
                  unit="Ah"
                  value={inputs.combinedBatteryAh}
                  onChange={(v) => handleInputChange("combinedBatteryAh", v)}
                  placeholder="150"
                  quickOptions={[{ value: "100", label: "100Ah" }, { value: "150", label: "150Ah" }, { value: "200", label: "200Ah" }]}
                />
              </div>

              <CalculatorInput
                id="combinedLoadWatts"
                label="Power Consumption / Load"
                unit="W"
                value={inputs.combinedLoadWatts}
                onChange={(v) => handleInputChange("combinedLoadWatts", v)}
                placeholder="600"
                infoText="Total continuous wattage running through the inverter."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CalculatorInput
                  id="combinedEfficiency"
                  label="Inverter Efficiency"
                  unit="%"
                  value={inputs.combinedEfficiency}
                  onChange={(v) => handleInputChange("combinedEfficiency", v)}
                  placeholder="92"
                />

                <CalculatorInput
                  id="combinedUsableCapacity"
                  label="Usable Battery Capacity (%)"
                  unit="%"
                  value={inputs.combinedUsableCapacity}
                  onChange={(v) => handleInputChange("combinedUsableCapacity", v)}
                  placeholder="90"
                  infoText="This is the percentage of the battery capacity you allow the calculation to use."
                />
              </div>
            </div>
          )}

          {/* Validation Error Banner */}
          {validationError && (
            <div className="flex items-center gap-2 p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold animate-in fade-in">
              <XCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* PRIMARY CALCULATE BUTTON */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleCalculate}
              className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.99] text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer"
            >
              <Calculator size={18} />
              <span>Calculate Result</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Dominant Result Card & Warnings */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden space-y-6">
            {/* Background subtle green glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

            {/* Result Card Topbar */}
            <div className="flex items-center justify-between relative z-10 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Calculation Result
                </span>
              </div>

              {calculationResult && !calculationResult.error && (
                <button
                  type="button"
                  onClick={handleCopyResult}
                  className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-slate-700 font-bold"
                  title="Copy result summary"
                >
                  {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              )}
            </div>

            {/* Error State if Invalid Input */}
            {calculationResult?.error ? (
              <div className="py-8 text-center space-y-3 relative z-10">
                <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
                  <XCircle size={24} />
                </div>
                <div className="text-base font-bold text-red-400">{calculationResult.error}</div>
                <p className="text-xs text-slate-400">
                  Please correct the inputs on the left to calculate values.
                </p>
              </div>
            ) : calculationResult ? (
              <div className="space-y-6 relative z-10">
                {/* Visual Status Banner (Success / Warning / Error) */}
                {calculationResult.status && (
                  <div
                    className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                      calculationResult.status.level === "SUCCESS"
                        ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-300"
                        : "bg-rose-950/70 border-rose-500/40 text-rose-300"
                    }`}
                  >
                    {calculationResult.status.level === "SUCCESS" ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="text-xs font-black tracking-wide uppercase">
                        {calculationResult.status.text}
                      </div>
                      <div className="text-[11px] leading-relaxed opacity-90">
                        {calculationResult.status.subtext}
                      </div>
                    </div>
                  </div>
                )}

                {/* Optional Inverter Capacity Check Badge in Battery Mode */}
                {calculationResult.inverterCheck && (
                  <div
                    className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                      calculationResult.inverterCheck.isOverloaded
                        ? "bg-rose-950/70 border-rose-500/40 text-rose-300"
                        : "bg-emerald-950/70 border-emerald-500/40 text-emerald-300"
                    }`}
                  >
                    {calculationResult.inverterCheck.isOverloaded ? (
                      <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <div className="text-xs font-black tracking-wide uppercase">
                        {calculationResult.inverterCheck.statusText}
                      </div>
                      <div className="text-[11px] leading-relaxed opacity-90">
                        Inverter real continuous capacity is ~{formatNumber(calculationResult.inverterCheck.realPowerW, 0)} W
                        ({calculationResult.inverterCheck.va} VA × {calculationResult.inverterCheck.pf} PF).
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary Dominant Result */}
                <div className="text-center py-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 p-6 space-y-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 block">
                    {calculationResult.mainLabel}
                  </span>

                  {/* Big Number Answer */}
                  <div className="text-4xl sm:text-5xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                    {calculationResult.formattedCost ? (
                      <span className="text-green-400 font-mono">
                        {calculationResult.formattedCost}
                      </span>
                    ) : calculationResult.formattedRuntime ? (
                      <span className="text-green-400 font-mono">
                        {calculationResult.formattedRuntime}
                      </span>
                    ) : (
                      <>
                        <span className="text-green-400 font-mono">
                          {formatNumber(calculationResult.resultValue, 2)}
                        </span>
                        {calculationResult.unit && (
                          <span className="text-xl sm:text-2xl text-slate-400 font-bold">
                            {calculationResult.unit}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 font-medium">
                    {calculationResult.formattedRuntimeLong
                      ? calculationResult.formattedRuntimeLong
                      : calculationResult.subLabel || "Calculated using standard electrical equations"}
                  </div>
                </div>

                {/* Ways to calculate bridge: Transfer calculated appliance units directly to NEA Tiered Bill */}
                {activeMode === "electricity-cost" && calculationResult && !calculationResult.error && (
                  <button
                    type="button"
                    onClick={() => {
                      const units = Math.max(0, Math.round(calculationResult.totalUnits || 0));
                      setInputs((prev) => ({
                        ...prev,
                        billUnits: String(units),
                        billInputMode: "units",
                      }));
                      handleModeChange("electricity-bill");
                    }}
                    className="w-full p-3.5 bg-gradient-to-r from-emerald-950 to-slate-900 hover:from-emerald-900 hover:to-slate-800 border border-emerald-500/40 hover:border-emerald-400 rounded-2xl text-emerald-300 font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-md group"
                  >
                    <span className="flex items-center gap-2">
                      <Receipt size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span>Compute NEA Tiered Bill for {formatNumber(calculationResult.totalUnits, 1)} Units (नेपाल विद्युत महसुल)</span>
                    </span>
                    <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform font-black">→</span>
                  </button>
                )}

                {/* Warnings Section (e.g. High Current 1087A) */}
                {calculationResult.warnings && calculationResult.warnings.length > 0 && (
                  <div className="space-y-2">
                    {calculationResult.warnings.map((warn, wIdx) => (
                      <div
                        key={wIdx}
                        className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 flex items-start gap-2.5 text-xs"
                      >
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                        <div className="space-y-0.5">
                          <div className="font-black text-amber-300 uppercase tracking-wide">
                            {warn.title}
                          </div>
                          <div className="text-[11px] leading-relaxed text-amber-200/90">
                            {warn.message}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dedicated Progressive Slab Breakdown for Nepal Electricity Bill */}
                {activeMode === "electricity-bill" && calculationResult.slabBreakdown && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                      <span>Slab Breakdown (स्ल्याब विवरण)</span>
                      <span className="text-[10px] text-green-400 font-bold bg-green-950/60 px-2 py-0.5 rounded border border-green-800/60">
                        {inputs.billPhase === "three" ? "Flat Seasonal Tariff" : "Progressive Domestic"}
                      </span>
                    </div>

                    <div className="bg-slate-950/40 rounded-2xl border border-slate-800/80 divide-y divide-slate-800/60 text-xs overflow-hidden">
                      {calculationResult.slabBreakdown.map((slab, sIdx) => (
                        <div key={sIdx} className="p-3 space-y-1">
                          <div className="flex items-center justify-between font-medium">
                            <span className="text-slate-300 font-bold">{slab.range}</span>
                            <span className="text-green-400 font-bold font-mono">{slab.formattedAmount}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
                            <span>{slab.calculationText}</span>
                            <span className="text-slate-500 text-[10px]">({slab.formattedRate}/unit)</span>
                          </div>
                        </div>
                      ))}

                      <div className="p-3 bg-slate-900/60 flex items-center justify-between font-bold border-t border-slate-800">
                        <span className="text-slate-300">Energy Charge Total</span>
                        <span className="text-green-400 font-mono">{calculationResult.formattedEnergyCharge}</span>
                      </div>

                      <div className="p-3 bg-slate-900/60 flex items-center justify-between font-bold">
                        <span className="text-slate-300">Minimum Demand Charge</span>
                        <span className="text-amber-400 font-mono">{calculationResult.formattedMinimumCharge}</span>
                      </div>

                      <div className="p-3 bg-emerald-950/50 flex items-center justify-between font-black text-sm border-t border-emerald-800/60">
                        <span className="text-emerald-300">Estimated Total Bill</span>
                        <span className="text-emerald-400 font-mono">{calculationResult.formattedCost}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleModeChange("electricity-cost")}
                      className="w-full text-center text-xs text-slate-400 hover:text-emerald-300 transition-colors py-1 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Coins size={12} className="text-emerald-400" />
                      <span>Estimate appliance power &amp; daily costs instead (उपकरणको दैनिक लागत) →</span>
                    </button>
                  </div>
                )}

                {/* Secondary Calculation Details Grid */}
                {calculationResult.secondaryDetails && (
                  <div className="space-y-2">
                    <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                      Calculation Details
                    </div>
                    <div className="bg-slate-950/40 rounded-2xl border border-slate-800/80 divide-y divide-slate-800/60 text-xs">
                      {calculationResult.secondaryDetails.map((detail, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 font-medium">
                          <span className="text-slate-400">{detail.label}</span>
                          <span className="text-white font-bold font-mono">{detail.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* NEA Tariff Data Source Badge */}
                {activeMode === "electricity-bill" && calculationResult.tariffSource && (
                  <div className="p-3 bg-slate-950/50 rounded-2xl border border-slate-800/70 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-300">
                      <span>Tariff Data Version</span>
                      <span className="text-emerald-400 font-mono font-bold">
                        {calculationResult.tariffSource.fiscalYear}
                      </span>
                    </div>
                    <div className="text-slate-400">
                      Source: {calculationResult.tariffSource.authority} • {calculationResult.tariffSource.category}
                    </div>
                  </div>
                )}

                {/* Disclaimer / Inverter notes */}
                {calculationResult.disclaimer && (
                  <p className="text-[11px] text-slate-400 leading-relaxed italic bg-slate-950/30 p-3 rounded-xl border border-slate-800/50">
                    ℹ️ {calculationResult.disclaimer}
                  </p>
                )}

                {calculationResult.explanation && (
                  <p className="text-[11px] text-amber-300/90 leading-relaxed bg-amber-950/30 p-3 rounded-xl border border-amber-900/40">
                    💡 {calculationResult.explanation}
                  </p>
                )}

                {/* Collapsible Step-by-Step Formula Explanation */}
                {calculationResult.steps && calculationResult.steps.length > 0 && (
                  <div className="border-t border-slate-800 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsExplanationOpen(!isExplanationOpen)}
                      className="w-full flex items-center justify-between text-xs font-bold text-green-400 hover:text-green-300 transition-colors cursor-pointer py-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <HelpCircle size={14} />
                        <span>How was this calculated? (Formulas)</span>
                      </span>
                      {isExplanationOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    <AnimatePresence>
                      {isExplanationOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-2 pt-3 text-xs text-slate-300"
                        >
                          {calculationResult.steps.map((step, sIdx) => (
                            <div
                              key={sIdx}
                              className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 font-mono"
                            >
                              <div className="text-green-400 font-bold text-[11px]">{step.formula}</div>
                              <div className="text-slate-400 text-[10px] font-sans">{step.text}</div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Doorstep Technician Support Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl border border-green-200/80 p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-green-800 font-bold text-xs uppercase tracking-wider">
              <PhoneCall size={14} className="text-green-600 animate-pulse" />
              <span>Need Electrical Work in Phidim?</span>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed">
              Have an inverter tripping, house wiring fault, or need new solar battery installation in Panchthar?
              Our certified local technicians are on standby for same-day doorstep service.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <a
                href="tel:+9779862772457"
                className="w-full sm:w-auto text-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors"
              >
                Call Hotline: +977 986-2772457
              </a>
              {onBookService && (
                <button
                  type="button"
                  onClick={() =>
                    onBookService({
                      id: "srv-electrical-inverter",
                      name: "Inverter & Battery Wiring Maintenance",
                      category: "Electrical & Inverter",
                      basePrice: 800,
                    })
                  }
                  className="w-full sm:w-auto text-center px-4 py-2 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Book Electrician
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
