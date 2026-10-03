"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Battery,
  Gauge,
  HelpCircle,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Cpu,
  RotateCcw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  Wrench,
  Flame,
  Phone,
} from "lucide-react";

export function BatteryRuntimeSeoContent({ onSelectPreset, onBookService }) {
  // Collapsible FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  // 10 Detailed, authentic, user-centric FAQs matching user specification
  const faqs = [
    {
      q: "What is a battery runtime calculator?",
      a: "A battery runtime calculator is an electrical calculation tool that estimates how many hours and minutes a battery bank can supply power to a connected electrical load before reaching its safe discharge limit. It accounts for nominal battery voltage, capacity in Amp-hours (Ah), continuous load in Watts (W), inverter conversion efficiency, and usable depth of discharge (DoD).",
    },
    {
      q: "How do I calculate battery backup time?",
      a: "First, determine total stored energy in Watt-hours (Wh) by multiplying Battery Voltage (V) by Battery Capacity (Ah). Next, multiply total energy by inverter efficiency (typically 90%–94%) and usable capacity percentage (typically 80%–90%) to calculate usable Watt-hours. Finally, divide usable Watt-hours by your continuous load in Watts (W). The formula is: Runtime (hours) = (Voltage × Ah × Inverter Efficiency × Usable Capacity %) ÷ Load (Watts).",
    },
    {
      q: "How many hours will a 12V 100Ah battery last?",
      a: "A 12V 100Ah battery stores 1,200 Watt-hours (Wh) of nominal energy. With a standard 92% inverter efficiency and 90% usable battery capacity, you have approximately 993.6 usable Watt-hours. Under a typical 300W load (lights, fans, and television), it will run for approximately 3 hours and 19 minutes (993.6 ÷ 300 = 3.31 hours). Under a lighter 100W load, it can run for approximately 9.9 hours.",
    },
    {
      q: "How does battery voltage affect runtime?",
      a: "Battery voltage directly multiplies stored energy for any given Ah rating. A 24V 100Ah battery bank stores 2,400 Wh—exactly twice the energy of a 12V 100Ah battery (1,200 Wh)—and delivers double the runtime under the same load. Additionally, higher voltage systems draw lower DC current (Amperes) for the same wattage, minimizing resistive heating losses (I²R) in cables and inverter circuitry.",
    },
    {
      q: "What is the difference between Ah and Wh?",
      a: "Amp-hours (Ah) measures electrical charge (current delivered over time), whereas Watt-hours (Wh) measures total electrical energy (work performed). Ah alone cannot define total energy without knowing the system voltage. Multiplying Ah by Voltage yields Watt-hours (Wh = V × Ah). For example, a 12V 100Ah battery has 1,200 Wh, while a 24V 50Ah battery also has 1,200 Wh, despite having half the Ah rating.",
    },
    {
      q: "Does inverter efficiency affect battery runtime?",
      a: "Yes. Inverters must convert Direct Current (DC) from batteries into Alternating Current (AC) for household appliances. Modern pure sine wave inverters typically operate at 90% to 95% efficiency, while older or square-wave units may operate between 80% and 85%. An inverter with 92% efficiency dissipates 8% of energy as heat, reducing your actual runtime by 8% compared to a theoretical 100% efficient system.",
    },
    {
      q: "Can I calculate inverter backup time?",
      a: "Yes. Inverter backup time is simply the runtime of the connected battery bank while powering AC loads through the inverter. By entering your battery voltage, capacity (Ah), inverter efficiency, and appliance power consumption (W), this calculator calculates backup duration. You can also use the optional Inverter Sizing Check to verify that your continuous wattage does not exceed the inverter's real power rating.",
    },
    {
      q: "What is the difference between VA and watts?",
      a: "VA (Volt-Amperes) measures apparent power, which encompasses both real power and reactive power drawn by inductive loads such as ceiling fans, refrigerator compressors, and pumps. Watts (W) measures real power that actually performs work. Real power equals apparent power multiplied by the power factor (W = VA × Power Factor). For instance, a 900 VA inverter with a 0.8 power factor delivers a maximum of 720 Watts of continuous real power (900 × 0.8 = 720 W).",
    },
    {
      q: "Can I use this calculator for UPS batteries?",
      a: "Yes. An Uninterruptible Power Supply (UPS) utilizes the same battery chemistry and inverter principles as larger home backup systems. For a desktop or server UPS, enter the internal battery voltage (commonly 12V or 24V) and Ah rating (typically 7Ah, 9Ah, or 18Ah), along with the computer load (e.g., 150W to 250W), to determine backup time.",
    },
    {
      q: "Why is actual runtime different from the calculated runtime?",
      a: "This calculator provides an engineering estimate based on constant load and standard conditions. Actual runtime varies due to Peukert's Law (lead-acid batteries lose effective capacity at high discharge currents), battery aging and sulfation, ambient temperature drops, motor startup inrush surges, cable resistance losses, and the inverter's own standby power consumption (usually 10W–25W).",
    },
  ];

  const practicalExamples = [
    {
      title: "12V 100Ah Battery with 300W Load",
      subtitle: "Typical Home Essentials (LEDs, Fan, Wi-Fi & Laptop)",
      voltage: 12,
      capacity: 100,
      load: 300,
      efficiency: 92,
      usable: 90,
      batteryEnergy: "1,200 Wh",
      usableEnergy: "993.6 Wh",
      runtime: "3h 19m",
      current: "~27.2 A",
      explanation:
        "1,200 Wh total energy × 0.92 efficiency × 0.90 usable = 993.6 Wh usable. 993.6 ÷ 300W = 3.31 hours.",
    },
    {
      title: "12V 150Ah Battery with 600W Load",
      subtitle: "Standard Home Inverter Setup (TV, Fans, Lights & PC)",
      voltage: 12,
      capacity: 150,
      load: 600,
      efficiency: 92,
      usable: 90,
      batteryEnergy: "1,800 Wh",
      usableEnergy: "1,490.4 Wh",
      runtime: "2h 29m",
      current: "~54.3 A",
      explanation:
        "1,800 Wh total energy × 0.92 efficiency × 0.90 usable = 1,490.4 Wh usable. 1,490.4 ÷ 600W = 2.484 hours.",
    },
    {
      title: "24V 200Ah Battery with 1,000W Load",
      subtitle: "High-Capacity Dual-Battery Inverter (Small Office or Shop)",
      voltage: 24,
      capacity: 200,
      load: 1000,
      efficiency: 92,
      usable: 90,
      batteryEnergy: "4,800 Wh",
      usableEnergy: "3,974.4 Wh",
      runtime: "3h 58m",
      current: "~45.3 A",
      explanation:
        "4,800 Wh total energy × 0.92 efficiency × 0.90 usable = 3,974.4 Wh usable. 3,974.4 ÷ 1,000W = 3.974 hours.",
    },
    {
      title: "48V 100Ah Battery with 2,000W Load",
      subtitle: "Whole-Home Solar Backup & Telecom Inverter Bank",
      voltage: 48,
      capacity: 100,
      load: 2000,
      efficiency: 92,
      usable: 90,
      batteryEnergy: "4,800 Wh",
      usableEnergy: "3,974.4 Wh",
      runtime: "1h 59m",
      current: "~45.3 A",
      explanation:
        "4,800 Wh total energy × 0.92 efficiency × 0.90 usable = 3,974.4 Wh usable. 3,974.4 ÷ 2,000W = 1.987 hours.",
    },
  ];

  return (
    <div className="space-y-12 text-gray-800">
      {/* SECTION 6: HOW IT WORKS & CORE CONCEPTS */}
      <section className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-xs space-y-8">
        <div className="border-b border-gray-100 pb-5">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2">
            <Info size={14} className="text-emerald-600" />
            <span>Core Engineering Principles</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            How Battery Runtime Works
          </h2>
          <p className="text-sm text-gray-600 mt-1 max-w-3xl leading-relaxed">
            Estimating battery backup duration requires understanding how stored electrical energy translates into
            real-world operating time through an inverter. Here are the five critical factors that govern runtime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Concept 1: What is Battery Runtime */}
          <div className="p-6 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
              <Battery size={20} />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">What is Battery Runtime?</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Battery runtime is the duration (in hours and minutes) that a fully charged battery bank can deliver
              power to connected loads before its terminal voltage drops to the inverter&apos;s low-voltage cutoff.
            </p>
          </div>

          {/* Concept 2: Ah vs Wh */}
          <div className="p-6 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
              <Zap size={20} />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Difference Between Ah and Wh</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Amp-hours (Ah) indicate current over time, but do not state total energy without voltage. Watt-hours (Wh)
              reflect true energy: <span className="font-semibold text-gray-900">Wh = V × Ah</span>. A 24V 100Ah battery
              holds twice the energy of a 12V 100Ah battery.
            </p>
          </div>

          {/* Concept 3: Load Impact */}
          <div className="p-6 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
              <Gauge size={20} />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">How Load Affects Runtime</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Power consumption (Watts) has an inverse relationship with runtime. Doubling your appliance wattage cuts
              runtime in half. Minimizing non-essential loads during power outages extends backup duration significantly.
            </p>
          </div>

          {/* Concept 4: Inverter Efficiency */}
          <div className="p-6 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
              <Cpu size={20} />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Inverter Efficiency Losses</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Converting DC battery voltage to 230V AC consumes power. Premium pure sine wave inverters operate at 90%–95%
              efficiency, while square wave units drop to 80%. An 8% loss reduces available energy accordingly.
            </p>
          </div>

          {/* Concept 5: Usable Capacity & DoD */}
          <div className="p-6 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
              <RotateCcw size={20} />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Usable Battery Capacity (DoD)</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Draining a lead-acid or tubular battery to 0% causes irreversible plate degradation. Setting usable
              capacity to 80%–90% protects cycle life, while lithium (LiFePO4) batteries safely allow up to 90%–95% DoD.
            </p>
          </div>

          {/* Concept 6: VA vs Watts */}
          <div className="p-6 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-black">
              <Sparkles size={20} />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Why VA Does Not Equal Watts</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Inverters are rated in VA (apparent power). Real usable power is Watts = VA × Power Factor. A 900 VA
              inverter with an average 0.8 power factor delivers 720 Watts of continuous real power, not 900 Watts.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 7: HOW TO CALCULATE BATTERY RUNTIME (FORMULA SECTION) */}
      <section className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-xs space-y-8">
        <div className="border-b border-gray-100 pb-5">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2">
            <Zap size={14} className="text-blue-600" />
            <span>Mathematical Derivations</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            How to Calculate Battery Runtime
          </h2>
          <p className="text-sm text-gray-600 mt-1 max-w-3xl leading-relaxed">
            The calculation relies on three straightforward engineering formulas. Convert all percentages into decimal
            fractions (e.g., 92% = 0.92) before computing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Formula Card 1 */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-xs font-black uppercase tracking-widest text-emerald-400">Step 1</div>
              <h3 className="text-base font-extrabold">Total Stored Energy</h3>
              <p className="text-xs text-slate-300">Multiply nominal battery voltage by capacity in Amp-hours.</p>
            </div>
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 font-bold space-y-1">
              <div>Energy (Wh) = V × Ah</div>
              <div className="text-slate-400 text-[11px]">Example: 12V × 150Ah = 1,800 Wh</div>
            </div>
          </div>

          {/* Formula Card 2 */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-xs font-black uppercase tracking-widest text-blue-400">Step 2</div>
              <h3 className="text-base font-extrabold">Usable Energy</h3>
              <p className="text-xs text-slate-300">Factor in inverter efficiency and allowed depth of discharge.</p>
            </div>
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-blue-300 font-bold space-y-1">
              <div>Usable Wh = Wh × Eff × DoD</div>
              <div className="text-slate-400 text-[11px]">1,800 × 0.92 × 0.90 = 1,490.4 Wh</div>
            </div>
          </div>

          {/* Formula Card 3 */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-xs font-black uppercase tracking-widest text-amber-400">Step 3</div>
              <h3 className="text-base font-extrabold">Operating Runtime</h3>
              <p className="text-xs text-slate-300">Divide usable energy by total continuous appliance wattage.</p>
            </div>
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 font-bold space-y-1">
              <div>Runtime (h) = Usable Wh ÷ Load (W)</div>
              <div className="text-slate-400 text-[11px]">1,490.4 ÷ 600W = 2.484h (≈ 2h 29m)</div>
            </div>
          </div>
        </div>

        {/* Battery Current Formula Banner */}
        <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
              <Zap size={16} className="text-emerald-700" />
              <span>Approximate Battery Current Formula</span>
            </h4>
            <p className="text-xs text-emerald-800 max-w-2xl leading-relaxed">
              Determine the DC current drawn from the battery bank:{" "}
              <span className="font-mono font-bold">Current (A) ≈ Load (W) ÷ (Voltage × Efficiency)</span>. For a 600W
              load on a 12V battery with 92% efficiency: 600 ÷ (12 × 0.92) ≈ 54.3 A.
            </p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-emerald-300 font-mono text-xs font-extrabold text-emerald-900 shrink-0 shadow-2xs">
            I ≈ W ÷ (V × Eff)
          </div>
        </div>
      </section>

      {/* SECTION 8: PRACTICAL EXAMPLES */}
      <section className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-xs space-y-8">
        <div className="border-b border-gray-100 pb-5">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles size={14} className="text-amber-600" />
            <span>Real-World Scenarios</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Practical Battery Runtime Examples
          </h2>
          <p className="text-sm text-gray-600 mt-1 max-w-3xl leading-relaxed">
            See how different battery capacities and loads perform in everyday residential, commercial, and solar
            environments. Click any example to load it directly into the calculator above.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {practicalExamples.map((ex, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-gray-50/70 border border-gray-200 hover:border-green-500 transition-all space-y-4 relative flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-green-700 uppercase tracking-wider">Example {idx + 1}</span>
                  <span className="text-xs font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700">
                    {ex.voltage}V • {ex.capacity}Ah • {ex.load}W
                  </span>
                </div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">{ex.title}</h3>
                <p className="text-xs text-gray-500 font-medium">{ex.subtitle}</p>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Battery Wh</span>
                    <span className="font-bold text-gray-800">{ex.batteryEnergy}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Usable Wh</span>
                    <span className="font-bold text-gray-800">{ex.usableEnergy}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Runtime</span>
                    <span className="font-black text-green-700">{ex.runtime}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Battery Current</span>
                    <span className="font-bold text-gray-800">{ex.current}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-200/80 font-mono text-[11px] leading-relaxed">
                  {ex.explanation}
                </p>
              </div>

              {onSelectPreset && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectPreset(ex);
                    window.scrollTo({ top: 120, behavior: "smooth" });
                  }}
                  className="w-full mt-2 py-2.5 px-4 bg-white hover:bg-green-600 hover:text-white text-green-700 font-extrabold text-xs rounded-xl border border-green-300 hover:border-green-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>Load {ex.voltage}V {ex.capacity}Ah into Calculator</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 italic text-center">
          * Note: Calculation examples assume 92% inverter efficiency and 90% usable capacity. Actual backup time will
          vary with ambient temperature, battery age, and real load dynamics.
        </p>
      </section>

      {/* SECTION 9: 12V VS 24V VS 48V COMPARISON */}
      <section className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-xs space-y-8">
        <div className="border-b border-gray-100 pb-5">
          <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2">
            <Cpu size={14} className="text-purple-600" />
            <span>System Voltage Engineering</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            12V vs 24V vs 48V Battery Systems Comparison
          </h2>
          <p className="text-sm text-gray-600 mt-1 max-w-3xl leading-relaxed">
            Selecting the right system voltage is crucial for minimizing DC current, reducing cable thickness, and
            preventing thermal losses when powering higher wattage loads.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-3.5 rounded-tl-xl font-bold uppercase tracking-wider">System Voltage</th>
                <th className="p-3.5 font-bold uppercase tracking-wider">Battery Configuration</th>
                <th className="p-3.5 font-bold uppercase tracking-wider">Stored Energy (150Ah)</th>
                <th className="p-3.5 font-bold uppercase tracking-wider">Current @ 1,200W Load</th>
                <th className="p-3.5 font-bold uppercase tracking-wider">Recommended Cable Gauge</th>
                <th className="p-3.5 rounded-tr-xl font-bold uppercase tracking-wider">Ideal Use Case</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 border-b border-gray-200">
              <tr className="hover:bg-gray-50/80 transition-colors">
                <td className="p-4 font-black text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>12V DC</span>
                </td>
                <td className="p-4 text-gray-600">Single 12V battery or parallel bank</td>
                <td className="p-4 font-mono font-bold text-gray-800">1,800 Wh</td>
                <td className="p-4 font-mono font-bold text-amber-700">~108.7 A (Heavy)</td>
                <td className="p-4 text-gray-600">35–50 mm² (AWG 1/0)</td>
                <td className="p-4 text-gray-700">Small homes, single-room lighting, campervans, under 1,000 VA</td>
              </tr>
              <tr className="hover:bg-gray-50/80 transition-colors bg-green-50/30">
                <td className="p-4 font-black text-green-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span>24V DC</span>
                </td>
                <td className="p-4 text-gray-600">Two 12V batteries wired in series</td>
                <td className="p-4 font-mono font-bold text-gray-800">3,600 Wh</td>
                <td className="p-4 font-mono font-bold text-emerald-700">~54.3 A (Moderate)</td>
                <td className="p-4 text-gray-600">16–25 mm² (AWG 4)</td>
                <td className="p-4 text-gray-700">Standard home inverters, retail shops, offices, 1kVA–2.5kVA</td>
              </tr>
              <tr className="hover:bg-gray-50/80 transition-colors">
                <td className="p-4 font-black text-purple-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>48V DC</span>
                </td>
                <td className="p-4 text-gray-600">Four 12V batteries in series (or 48V rack)</td>
                <td className="p-4 font-mono font-bold text-gray-800">7,200 Wh</td>
                <td className="p-4 font-mono font-bold text-purple-700">~27.2 A (Low loss)</td>
                <td className="p-4 text-gray-600">10–16 mm² (AWG 6)</td>
                <td className="p-4 text-gray-700">Whole-home solar, telecom towers, commercial setups, &gt; 3kVA</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-600 leading-relaxed space-y-2">
          <p className="font-extrabold text-gray-900">Why Higher Voltage Improves Efficiency:</p>
          <p>
            Power loss across copper wiring follows Ohm&apos;s relationship <span className="font-mono font-bold">P = I²R</span>.
            Doubling system voltage from 12V to 24V reduces current by 50%, which reduces line heat dissipation by 75%
            for the same conductor diameter. For continuous loads exceeding 1,000 Watts, 24V or 48V architectures are
            highly recommended.
          </p>
        </div>
      </section>

      {/* SECTION 10: FAQ SECTION (10 HIGH VALUE REAL QUESTIONS) */}
      <section className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-xs space-y-8">
        <div className="border-b border-gray-100 pb-5">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2">
            <HelpCircle size={14} className="text-emerald-600" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Battery Runtime &amp; Backup FAQs
          </h2>
          <p className="text-sm text-gray-600 mt-1 max-w-3xl leading-relaxed">
            Practical, technically verified answers to common questions about battery capacity, inverter sizing, and
            backup calculations.
          </p>
        </div>

        <div className="divide-y divide-gray-200 border-y border-gray-200">
          {faqs.map((faq, fIdx) => {
            const isOpen = openFaqIndex === fIdx;
            return (
              <div key={fIdx} className="py-4">
                <button
                  type="button"
                  onClick={() => toggleFaq(fIdx)}
                  className="w-full flex items-center justify-between text-left gap-4 cursor-pointer group"
                  aria-expanded={isOpen}
                >
                  <h3 className="text-sm sm:text-base font-extrabold text-gray-900 group-hover:text-green-700 transition-colors">
                    {faq.q}
                  </h3>
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                      isOpen ? "bg-green-100 text-green-800 rotate-180" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <ChevronDown size={15} />
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-3 pr-6 text-xs sm:text-sm text-gray-600 leading-relaxed animate-in fade-in">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 11: IMPORTANT LIMITATIONS, E-E-A-T & ELECTRICAL SAFETY */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black tracking-tight">
              Engineering Limitations &amp; Electrical Safety
            </h3>
            <p className="text-xs text-slate-400">
              Important factors to consider before finalizing battery bank capacity and wiring.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-slate-300">
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <h4 className="font-extrabold text-amber-400 text-sm flex items-center gap-1.5">
              <AlertTriangle size={15} />
              <span>Real-World Performance Variables</span>
            </h4>
            <ul className="space-y-2 list-disc list-inside text-slate-300">
              <li>
                <strong className="text-white">Peukert&apos;s Effect:</strong> Lead-acid batteries discharge faster under heavy
                loads. Drawing 0.5C current yields substantially less usable Wh than a light 0.05C rate.
              </li>
              <li>
                <strong className="text-white">Ambient Temperature:</strong> Operating below 15°C slows chemical kinetics,
                reducing effective capacity by up to 20%. Temperatures above 35°C increase capacity slightly but accelerate aging.
              </li>
              <li>
                <strong className="text-white">Inverter Self-Consumption:</strong> Inverters draw 10W to 30W continuously to
                power internal logic, fans, and sensing circuits, even when no AC appliances are running.
              </li>
              <li>
                <strong className="text-white">Motor Inrush Surges:</strong> Compressors and water pumps draw 3× to 5× their
                running wattage during the initial 1–2 seconds of startup.
              </li>
            </ul>
          </div>

          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <h4 className="font-extrabold text-rose-400 text-sm flex items-center gap-1.5">
              <Flame size={15} />
              <span>DC Electrical Safety Guidelines</span>
            </h4>
            <ul className="space-y-2 list-disc list-inside text-slate-300">
              <li>
                <strong className="text-white">Cable Sizing:</strong> Low voltage means high DC current. Never use undersized
                AC house wire for battery interconnects. Always use rated high-strand welding or battery cable.
              </li>
              <li>
                <strong className="text-white">Overcurrent Protection:</strong> Install a Class-T or ANL DC fuse close to the
                positive battery terminal to protect against dead shorts.
              </li>
              <li>
                <strong className="text-white">Terminal Torque:</strong> Loose battery lugs cause high contact resistance,
                resulting in thermal melting or fire hazard under sustained loads.
              </li>
              <li>
                <strong className="text-white">Ventilation:</strong> Flooded lead-acid batteries emit hydrogen gas during
                absorption charging. Ensure battery enclosures have adequate cross-ventilation.
              </li>
            </ul>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 text-center">
          Disclaimer: This calculator is designed for informational and preliminary sizing purposes. Actual system
          installations must comply with local electrical codes and be inspected by a certified electrical technician.
        </p>
      </section>

      {/* LOCAL NEPAL & PHIDIM SERVICES INTERNAL LINKING BANNER */}
      <section className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-emerald-800/60 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 text-emerald-300 text-xs font-black uppercase tracking-wider">
            <ShieldCheck size={14} />
            <span>Phidim Service • Certified Electricians in Nepal</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            Need Doorstep Inverter Installation or Battery Maintenance in Panchthar?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Useful for homes, offices, shops, UPS systems, and solar inverter systems in Nepal. Our certified technicians
            service all 14 wards of Phidim Municipality and surrounding Panchthar districts with same-day battery testing,
            MCB breaker installation, and inverter repair.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <Link
              href="/services/electrician-phidim"
              className="text-emerald-300 hover:text-white underline font-semibold transition-colors"
            >
              Certified Electrician in Phidim
            </Link>
            <span className="text-slate-500">•</span>
            <Link
              href="/services"
              className="text-emerald-300 hover:text-white underline font-semibold transition-colors"
            >
              All Technical Services
            </Link>
            <span className="text-slate-500">•</span>
            <Link
              href="/phidim"
              className="text-emerald-300 hover:text-white underline font-semibold transition-colors"
            >
              Services in Phidim
            </Link>
            <span className="text-slate-500">•</span>
            <Link
              href="/panchthar"
              className="text-emerald-300 hover:text-white underline font-semibold transition-colors"
            >
              Panchthar District Coverage
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <a
            href="tel:+9779862772457"
            className="w-full sm:w-auto px-6 py-3.5 bg-green-600 hover:bg-green-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 tracking-wide"
          >
            <Phone size={15} />
            <span>Call +977 986-2772457</span>
          </a>
          <button
            type="button"
            onClick={() =>
              onBookService?.({
                id: "srv-electrical-inverter",
                name: "Inverter & Battery Wiring Maintenance",
                category: "Electrical & Inverter",
                basePrice: 800,
              })
            }
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
          >
            Book Technician Online
          </button>
        </div>
      </section>
    </div>
  );
}
