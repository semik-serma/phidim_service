/**
 * Professional Electrical Calculation Engine for Phidim Service
 * 100% Client-Side Pure JavaScript logic
 *
 * Supported Calculation Functions:
 * - calculateVoltage, calculateCurrent, calculateResistance (Ohm's Law)
 * - calculatePower (Watts, Voltage, Current)
 * - calculateDcPower (W = V * A)
 * - calculateAcPower (VA, Real W, Power Factor)
 * - calculateVa, calculatePowerFactor, calculateWatts (VA / Watts / PF conversion)
 * - calculateBatteryEnergy, calculateUsableEnergy, calculateRuntime, calculateBatteryCurrent
 * - calculateInverterCapacity
 * - calculateBatteryInverterSystem (Advanced Combined Mode)
 * - Warnings System: High Battery Current, Overload, Voltage/Efficiency cautions
 * - Formatting: Intelligent number rounding, compact K/M metric formatting, time formatting (< 60m, 1h-24h, > 24h)
 */

// Helper to round numbers gracefully avoiding floating point inaccuracies (e.g. 2.4840000000000004 -> 2.484)
export function roundNumber(num, maxDecimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return 0;
  const factor = Math.pow(10, maxDecimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

// Format numbers with commas and optional decimal precision
export function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return "0";
  const rounded = roundNumber(num, decimals);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
  }).format(rounded);
}

// Compact metric formatting (e.g. 1000 -> 1K, 1500 -> 1.5K, 10000 -> 10K, 1000000 -> 1M)
export function formatCompactMetric(value, unit = "") {
  if (value === null || value === undefined || isNaN(value)) return `0 ${unit}`.trim();
  const abs = Math.abs(value);
  let formatted = "";
  if (abs >= 1000000) {
    formatted = `${roundNumber(value / 1000000, 2)}M`;
  } else if (abs >= 1000) {
    formatted = `${roundNumber(value / 1000, 2)}K`;
  } else {
    formatted = `${roundNumber(value, 2)}`;
  }
  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Format duration according to user specification:
 * - Less than 60 minutes: e.g. "35 minutes"
 * - Between 1 and 24 hours: e.g. "2h 29m"
 * - Longer values (>= 24h): e.g. "1d 4h 20m"
 */
export function formatDuration(decimalHours) {
  if (decimalHours === null || decimalHours === undefined || isNaN(decimalHours) || decimalHours <= 0) {
    return "0 minutes";
  }

  const totalMinutes = Math.round(decimalHours * 60);
  if (totalMinutes < 1) {
    return "< 1 minute";
  }

  // Less than 60 minutes -> "35 minutes"
  if (totalMinutes < 60) {
    return `${totalMinutes} ${totalMinutes === 1 ? "minute" : "minutes"}`;
  }

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  // Between 1 and 24 hours -> "2h 29m"
  if (totalHours < 24) {
    if (remainingMinutes === 0) return `${totalHours}h`;
    return `${totalHours}h ${remainingMinutes}m`;
  }

  // Greater than or equal to 24 hours -> "1d 4h 20m"
  const days = Math.floor(totalHours / 24);
  const hoursAfterDays = totalHours % 24;

  const parts = [`${days}d`];
  if (hoursAfterDays > 0) parts.push(`${hoursAfterDays}h`);
  if (remainingMinutes > 0) parts.push(`${remainingMinutes}m`);

  return parts.join(" ");
}

export function formatDurationLong(decimalHours) {
  if (decimalHours === null || decimalHours === undefined || isNaN(decimalHours) || decimalHours <= 0) {
    return "0 minutes";
  }

  const totalMinutes = Math.round(decimalHours * 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} ${totalMinutes === 1 ? "minute" : "minutes"}`;
  }

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  const parts = [];
  if (totalHours > 0) {
    parts.push(`${totalHours} ${totalHours === 1 ? "hour" : "hours"}`);
  }
  if (remainingMinutes > 0) {
    parts.push(`${remainingMinutes} ${remainingMinutes === 1 ? "minute" : "minutes"}`);
  }

  return parts.join(" ") || "< 1 minute";
}

// ==========================================
// 1. OHM'S LAW: V = I * R
// ==========================================
export function calculateVoltage(current, resistance) {
  return current * resistance;
}

export function calculateCurrent(voltage, resistance) {
  if (resistance === 0) throw new Error("Resistance cannot be zero.");
  return voltage / resistance;
}

export function calculateResistance(voltage, current) {
  if (current === 0) throw new Error("Current cannot be zero.");
  return voltage / current;
}

// 1.1 Dedicated Voltage Calculator Functions
export function calculateVoltageFromCurrentResistance(current, resistance) {
  return current * resistance;
}

export function calculateVoltageFromPowerCurrent(powerWatts, current) {
  if (current === 0) throw new Error("Current cannot be zero.");
  return powerWatts / current;
}

export function calculateVoltageFromPowerResistance(powerWatts, resistance) {
  if (powerWatts * resistance < 0) throw new Error("Power and resistance product cannot be negative.");
  return Math.sqrt(powerWatts * resistance);
}

export function calculateVoltageDedicated({ method = "current-resistance", current, resistance, power }) {
  if (method === "current-resistance") {
    if (current === undefined || current === "" || resistance === undefined || resistance === "") {
      return { error: "Please enter both Current (A) and Resistance (Ω)." };
    }
    const i = parseFloat(current);
    const r = parseFloat(resistance);
    if (isNaN(i) || isNaN(r)) return { error: "Please enter valid numeric values for Current and Resistance." };
    if (i <= 0) return { error: "Current must be greater than 0 A." };
    if (r <= 0) return { error: "Resistance must be greater than 0 Ω." };

    const v = calculateVoltageFromCurrentResistance(i, r);
    return {
      success: true,
      resultValue: formatNumber(v, 2),
      unit: "V",
      mainLabel: "Voltage",
      subLabel: "Voltage = Current × Resistance (V = I × R)",
      secondaryDetails: [
        { label: "Current (I)", value: `${formatNumber(i, 2)} A` },
        { label: "Resistance (R)", value: `${formatNumber(r, 2)} Ω` },
        { label: "Power Dissipation (P)", value: `${formatNumber(v * i, 2)} W` },
      ],
      steps: [
        { formula: "V = I × R", text: "Voltage = Current × Resistance" },
        {
          formula: `${formatNumber(i, 2)} A × ${formatNumber(r, 2)} Ω = ${formatNumber(v, 2)} V`,
          text: "Multiply Current by Resistance",
        },
      ],
    };
  }

  if (method === "power-current") {
    if (power === undefined || power === "" || current === undefined || current === "") {
      return { error: "Please enter both Power (W) and Current (A)." };
    }
    const p = parseFloat(power);
    const i = parseFloat(current);
    if (isNaN(p) || isNaN(i)) return { error: "Please enter valid numeric values for Power and Current." };
    if (p <= 0) return { error: "Power must be greater than 0 W." };
    if (i <= 0) return { error: "Current must be greater than 0 A to prevent division by zero." };

    const v = calculateVoltageFromPowerCurrent(p, i);
    return {
      success: true,
      resultValue: formatNumber(v, 2),
      unit: "V",
      mainLabel: "Voltage",
      subLabel: "Voltage = Power ÷ Current (V = W ÷ A)",
      secondaryDetails: [
        { label: "Power (P)", value: `${formatNumber(p, 2)} W` },
        { label: "Current (I)", value: `${formatNumber(i, 2)} A` },
        { label: "Equivalent Resistance (R)", value: `${formatNumber(v / i, 2)} Ω` },
      ],
      steps: [
        { formula: "V = W ÷ A", text: "Voltage = Power ÷ Current" },
        {
          formula: `${formatNumber(p, 2)} W ÷ ${formatNumber(i, 2)} A = ${formatNumber(v, 2)} V`,
          text: "Divide Power by Current",
        },
      ],
    };
  }

  if (method === "power-resistance") {
    if (power === undefined || power === "" || resistance === undefined || resistance === "") {
      return { error: "Please enter both Power (W) and Resistance (Ω)." };
    }
    const p = parseFloat(power);
    const r = parseFloat(resistance);
    if (isNaN(p) || isNaN(r)) return { error: "Please enter valid numeric values for Power and Resistance." };
    if (p <= 0) return { error: "Power must be greater than 0 W." };
    if (r <= 0) return { error: "Resistance must be greater than 0 Ω." };

    const v = calculateVoltageFromPowerResistance(p, r);
    return {
      success: true,
      resultValue: formatNumber(v, 2),
      unit: "V",
      mainLabel: "Voltage",
      subLabel: "Voltage = √(Power × Resistance) (V = √(W × R))",
      secondaryDetails: [
        { label: "Power (P)", value: `${formatNumber(p, 2)} W` },
        { label: "Resistance (R)", value: `${formatNumber(r, 2)} Ω` },
        { label: "Resulting Current (I)", value: `${formatNumber(v / r, 2)} A` },
      ],
      steps: [
        { formula: "V = √(W × R)", text: "Voltage = Square Root of (Power × Resistance)" },
        {
          formula: `√(${formatNumber(p, 2)} W × ${formatNumber(r, 2)} Ω) = √(${formatNumber(p * r, 2)}) = ${formatNumber(v, 2)} V`,
          text: "Multiply Power and Resistance, then compute square root",
        },
      ],
    };
  }

  return { error: "Please select a valid voltage calculation method." };
}

export function calculateOhmsLaw({ target = "voltage", voltage, current, resistance }) {
  const v = parseFloat(voltage);
  const i = parseFloat(current);
  const r = parseFloat(resistance);

  if (target === "voltage") {
    if (isNaN(i) || isNaN(r)) return { error: "Please enter both Current (A) and Resistance (Ω)." };
    if (i < 0 || r < 0) return { error: "Current and Resistance cannot be negative." };
    const result = calculateVoltage(i, r);
    return {
      success: true,
      resultValue: roundNumber(result, 2),
      unit: "V",
      mainLabel: "CALCULATED VOLTAGE",
      secondaryDetails: [
        { label: "Current (I)", value: `${formatNumber(i, 2)} A` },
        { label: "Resistance (R)", value: `${formatNumber(r, 2)} Ω` },
        { label: "Power Dissipation (P)", value: `${formatNumber(result * i, 2)} W` },
      ],
      steps: [
        { formula: "V = I × R", text: "Voltage = Current × Resistance" },
        { formula: `${i} A × ${r} Ω = ${roundNumber(result, 2)} V`, text: "Multiply values" },
      ],
    };
  }

  if (target === "current") {
    if (isNaN(v) || isNaN(r)) return { error: "Please enter both Voltage (V) and Resistance (Ω)." };
    if (r <= 0) return { error: "Resistance must be greater than 0 Ω to prevent division by zero." };
    if (v < 0) return { error: "Voltage cannot be negative." };
    const result = calculateCurrent(v, r);
    return {
      success: true,
      resultValue: roundNumber(result, 2),
      unit: "A",
      mainLabel: "CALCULATED CURRENT",
      secondaryDetails: [
        { label: "Voltage (V)", value: `${formatNumber(v, 2)} V` },
        { label: "Resistance (R)", value: `${formatNumber(r, 2)} Ω` },
        { label: "Power Dissipation (P)", value: `${formatNumber(v * result, 2)} W` },
      ],
      steps: [
        { formula: "I = V ÷ R", text: "Current = Voltage ÷ Resistance" },
        { formula: `${v} V ÷ ${r} Ω = ${roundNumber(result, 2)} A`, text: "Divide voltage by resistance" },
      ],
    };
  }

  if (target === "resistance") {
    if (isNaN(v) || isNaN(i)) return { error: "Please enter both Voltage (V) and Current (A)." };
    if (i <= 0) return { error: "Current must be greater than 0 A to avoid division by zero." };
    if (v < 0) return { error: "Voltage cannot be negative." };
    const result = calculateResistance(v, i);
    return {
      success: true,
      resultValue: roundNumber(result, 2),
      unit: "Ω",
      mainLabel: "CALCULATED RESISTANCE",
      secondaryDetails: [
        { label: "Voltage (V)", value: `${formatNumber(v, 2)} V` },
        { label: "Current (I)", value: `${formatNumber(i, 2)} A` },
        { label: "Power Dissipation (P)", value: `${formatNumber(v * i, 2)} W` },
      ],
      steps: [
        { formula: "R = V ÷ I", text: "Resistance = Voltage ÷ Current" },
        { formula: `${v} V ÷ ${i} A = ${roundNumber(result, 2)} Ω`, text: "Divide voltage by current" },
      ],
    };
  }

  return { error: "Invalid Ohm's Law target." };
}

// ==========================================
// 2. POWER / WATTS (BASIC): P = V * I
// ==========================================
export function calculatePower({ target = "power", power, voltage, current }) {
  const p = parseFloat(power);
  const v = parseFloat(voltage);
  const i = parseFloat(current);

  if (target === "power") {
    if (isNaN(v) || isNaN(i)) return { error: "Please enter both Voltage (V) and Current (A)." };
    if (v < 0 || i < 0) return { error: "Voltage and Current cannot be negative." };
    const result = v * i;
    return {
      success: true,
      resultValue: roundNumber(result, 2),
      unit: "W",
      mainLabel: "CALCULATED POWER",
      secondaryDetails: [
        { label: "Voltage (V)", value: `${formatNumber(v, 2)} V` },
        { label: "Current (I)", value: `${formatNumber(i, 2)} A` },
        { label: "Kilowatts (kW)", value: `${roundNumber(result / 1000, 3)} kW` },
      ],
      steps: [
        { formula: "P = V × I", text: "Power = Voltage × Current" },
        { formula: `${v} V × ${i} A = ${roundNumber(result, 2)} W`, text: "Multiply voltage by current" },
      ],
    };
  }

  if (target === "voltage") {
    if (isNaN(p) || isNaN(i)) return { error: "Please enter both Power (W) and Current (A)." };
    if (i <= 0) return { error: "Current must be greater than 0 A." };
    if (p < 0) return { error: "Power cannot be negative." };
    const result = p / i;
    return {
      success: true,
      resultValue: roundNumber(result, 2),
      unit: "V",
      mainLabel: "CALCULATED VOLTAGE",
      secondaryDetails: [
        { label: "Power (P)", value: `${formatNumber(p, 2)} W` },
        { label: "Current (I)", value: `${formatNumber(i, 2)} A` },
      ],
      steps: [
        { formula: "V = P ÷ I", text: "Voltage = Power ÷ Current" },
        { formula: `${p} W ÷ ${i} A = ${roundNumber(result, 2)} V`, text: "Divide power by current" },
      ],
    };
  }

  if (target === "current") {
    if (isNaN(p) || isNaN(v)) return { error: "Please enter both Power (W) and Voltage (V)." };
    if (v <= 0) return { error: "Voltage must be greater than 0 V." };
    if (p < 0) return { error: "Power cannot be negative." };
    const result = p / v;
    return {
      success: true,
      resultValue: roundNumber(result, 2),
      unit: "A",
      mainLabel: "CALCULATED CURRENT",
      secondaryDetails: [
        { label: "Power (P)", value: `${formatNumber(p, 2)} W` },
        { label: "Voltage (V)", value: `${formatNumber(v, 2)} V` },
      ],
      steps: [
        { formula: "I = P ÷ V", text: "Current = Power ÷ Voltage" },
        { formula: `${p} W ÷ ${v} V = ${roundNumber(result, 2)} A`, text: "Divide power by voltage" },
      ],
    };
  }

  return { error: "Invalid Power target." };
}

// ==========================================
// 3. DC CALCULATOR: W = V * A
// ==========================================
export function calculateDcPower({ voltage, current }) {
  const v = parseFloat(voltage);
  const i = parseFloat(current);

  if (isNaN(v) || isNaN(i)) return { error: "Please enter DC Voltage (V) and Current (A)." };
  if (v <= 0) return { error: "DC Voltage must be greater than 0 V." };
  if (i < 0) return { error: "DC Current cannot be negative." };

  const watts = v * i;
  return {
    success: true,
    resultValue: roundNumber(watts, 2),
    unit: "W",
    mainLabel: "POWER",
    subLabel: "Direct Current (DC) power output in Watts",
    secondaryDetails: [
      { label: "DC Voltage", value: `${formatNumber(v, 2)} V` },
      { label: "DC Current", value: `${formatNumber(i, 2)} A` },
      { label: "Equivalent Power", value: `${roundNumber(watts / 1000, 3)} kW` },
    ],
    steps: [
      { formula: "W = V × A", text: "Power (Watts) = Voltage (Volts) × Current (Amperes)" },
      { formula: `${v} V × ${i} A = ${roundNumber(watts, 2)} W`, text: "Multiply voltage by current" },
    ],
    notes: "DC power has a constant unidirectional voltage, meaning no power factor is required.",
  };
}

// ==========================================
// 4. AC CALCULATOR: Real W & Apparent VA
// ==========================================
export function calculateAcPower({ voltage, current, powerFactor = 0.8 }) {
  const v = parseFloat(voltage);
  const i = parseFloat(current);
  const pf = parseFloat(powerFactor);

  if (isNaN(v) || isNaN(i)) return { error: "Please enter Voltage (V) and Current (A)." };
  if (v <= 0) return { error: "Voltage must be greater than 0 V (e.g. 230 V in Nepal)." };
  if (i <= 0) return { error: "Current must be greater than 0 A." };
  if (isNaN(pf) || pf <= 0 || pf > 1) {
    return { error: "Power factor must be between 0.01 and 1.0 (typically 0.8 for home appliances)." };
  }

  const apparentVA = v * i;
  const realWatts = apparentVA * pf;

  return {
    success: true,
    resultValue: roundNumber(realWatts, 1),
    unit: "W",
    mainLabel: "REAL POWER",
    subLabel: `Real usable power with ${formatNumber(apparentVA, 1)} VA apparent power`,
    secondaryDetails: [
      { label: "Apparent Power", value: `${formatNumber(apparentVA, 1)} VA` },
      { label: "Real Power", value: `${formatNumber(realWatts, 1)} W` },
      { label: "Power Factor (PF)", value: `${roundNumber(pf, 2)}` },
      { label: "Reactive Power (VAR approx.)", value: `${formatNumber(Math.sqrt(Math.max(0, apparentVA * apparentVA - realWatts * realWatts)), 1)} VAR` },
    ],
    steps: [
      {
        formula: "Apparent Power (VA) = Voltage (V) × Current (A)",
        text: `${v} V × ${i} A = ${formatNumber(apparentVA, 1)} VA`,
      },
      {
        formula: "Real Power (W) = Voltage (V) × Current (A) × Power Factor",
        text: `${v} V × ${i} A × ${pf} = ${formatNumber(realWatts, 1)} W`,
      },
    ],
    notes: "VA = apparent power (total load drawn from grid/source). W = real power (actual work done by appliances). PF = power factor (ratio of real to apparent power).",
  };
}

// ==========================================
// 5. VA / WATTS / POWER FACTOR CONVERSION
// ==========================================
export function calculateVaFromWatts(watts, powerFactor) {
  if (powerFactor <= 0) throw new Error("Power Factor must be greater than zero.");
  return watts / powerFactor;
}

export function calculateWattsFromVa(va, powerFactor) {
  return va * powerFactor;
}

export function calculatePowerFactorFromWattsVa(watts, va) {
  if (va <= 0) throw new Error("VA must be greater than zero.");
  return watts / va;
}

export function calculateVaWattsPf({ target = "watts", va, watts, powerFactor }) {
  const v = parseFloat(va);
  const w = parseFloat(watts);
  const pf = parseFloat(powerFactor);

  if (target === "watts") {
    if (isNaN(v) || isNaN(pf)) return { error: "Please enter Inverter/Apparent VA and Power Factor." };
    if (v <= 0) return { error: "VA must be greater than 0." };
    if (pf <= 0 || pf > 1) return { error: "Power factor must be between 0.01 and 1.0 (typically 0.8)." };
    const result = calculateWattsFromVa(v, pf);
    return {
      success: true,
      resultValue: roundNumber(result, 1),
      unit: "W",
      mainLabel: "REAL POWER (WATTS)",
      secondaryDetails: [
        { label: "Apparent Power", value: `${formatNumber(v, 1)} VA` },
        { label: "Power Factor", value: `${roundNumber(pf, 2)}` },
        { label: "Kilowatts (kW)", value: `${roundNumber(result / 1000, 3)} kW` },
      ],
      steps: [
        { formula: "W = VA × PF", text: "Real Power = Apparent Power × Power Factor" },
        { formula: `${formatNumber(v, 1)} VA × ${pf} = ${formatNumber(result, 1)} W`, text: "Multiply VA by Power Factor" },
      ],
      explanation: "Apparent power (VA) includes both active and reactive power. Power factor describes how effectively power is converted into real usable watts.",
    };
  }

  if (target === "va") {
    if (isNaN(w) || isNaN(pf)) return { error: "Please enter Real Power (W) and Power Factor." };
    if (w <= 0) return { error: "Watts must be greater than 0." };
    if (pf <= 0 || pf > 1) return { error: "Power factor must be between 0.01 and 1.0." };
    const result = calculateVaFromWatts(w, pf);
    return {
      success: true,
      resultValue: roundNumber(result, 1),
      unit: "VA",
      mainLabel: "APPARENT POWER (VA)",
      secondaryDetails: [
        { label: "Real Power", value: `${formatNumber(w, 1)} W` },
        { label: "Power Factor", value: `${roundNumber(pf, 2)}` },
      ],
      steps: [
        { formula: "VA = W ÷ PF", text: "Apparent Power = Real Power ÷ Power Factor" },
        { formula: `${formatNumber(w, 1)} W ÷ ${pf} = ${formatNumber(result, 1)} VA`, text: "Divide Watts by Power Factor" },
      ],
    };
  }

  if (target === "pf") {
    if (isNaN(w) || isNaN(v)) return { error: "Please enter Real Power (W) and Apparent Power (VA)." };
    if (v <= 0) return { error: "VA must be greater than 0 to avoid division by zero." };
    if (w <= 0) return { error: "Watts must be greater than 0." };
    if (w > v) return { error: "Real power (Watts) cannot exceed apparent power (VA)." };
    const result = calculatePowerFactorFromWattsVa(w, v);
    return {
      success: true,
      resultValue: roundNumber(result, 3),
      unit: "PF",
      mainLabel: "POWER FACTOR",
      secondaryDetails: [
        { label: "Real Power", value: `${formatNumber(w, 1)} W` },
        { label: "Apparent Power", value: `${formatNumber(v, 1)} VA` },
      ],
      steps: [
        { formula: "PF = W ÷ VA", text: "Power Factor = Real Power ÷ Apparent Power" },
        { formula: `${formatNumber(w, 1)} W ÷ ${formatNumber(v, 1)} VA = ${roundNumber(result, 3)}`, text: "Divide Watts by VA" },
      ],
    };
  }

  return { error: "Invalid VA/Watts/PF target." };
}

// ==========================================
// 6. BATTERY RUNTIME & CURRENT DRAW
// ==========================================
export function calculateBatteryEnergy(voltage, capacityAh) {
  return voltage * capacityAh;
}

export function calculateUsableEnergy(batteryEnergyWh, efficiencyPercent, usableCapacityPercent) {
  return batteryEnergyWh * (efficiencyPercent / 100) * (usableCapacityPercent / 100);
}

export function calculateRuntime(usableEnergyWh, loadWatts) {
  if (loadWatts <= 0) throw new Error("Load must be greater than zero.");
  return usableEnergyWh / loadWatts;
}

export function calculateBatteryCurrent(loadWatts, batteryVoltage, efficiencyPercent) {
  const denom = batteryVoltage * (efficiencyPercent / 100);
  if (denom <= 0) throw new Error("Invalid voltage or efficiency.");
  return loadWatts / denom;
}

export function calculateBatteryRuntime({
  voltage,
  capacityAh,
  loadWatts,
  efficiency = 92,
  usableCapacityPercent = 90,
}) {
  const v = parseFloat(voltage);
  const ah = parseFloat(capacityAh);
  const load = parseFloat(loadWatts);
  const eff = parseFloat(efficiency);
  const usable = parseFloat(usableCapacityPercent);

  if (isNaN(v) || v <= 0) return { error: "Please enter a valid Battery Voltage (e.g., 12 V or 24 V)." };
  if (isNaN(ah) || ah <= 0) return { error: "Battery Capacity must be greater than 0 Ah (e.g., 150 Ah)." };
  if (isNaN(load) || load <= 0) return { error: "Load / Power Consumption must be greater than 0 W." };
  if (isNaN(eff) || eff <= 0 || eff > 100) {
    return { error: "Inverter Efficiency must be between 1% and 100% (typically 90% to 94%)." };
  }
  if (isNaN(usable) || usable <= 0 || usable > 100) {
    return { error: "Usable Battery Capacity must be between 1% and 100% (typically 80% to 90%)." };
  }

  // 1. Total Battery Energy (Wh) = Voltage × Capacity
  const totalEnergyWh = calculateBatteryEnergy(v, ah);

  // 2. Usable Energy (Wh) = Total Energy × Efficiency × Usable Capacity %
  const usableEnergyWh = calculateUsableEnergy(totalEnergyWh, eff, usable);

  // 3. Runtime in decimal hours = Usable Energy ÷ Load
  const runtimeHours = calculateRuntime(usableEnergyWh, load);

  // 4. Approximate Battery-Side DC Current = Load ÷ (Voltage × Efficiency)
  const batteryCurrent = calculateBatteryCurrent(load, v, eff);

  // Warning System Evaluation
  const warnings = [];
  if (batteryCurrent > 250) {
    warnings.push({
      level: "WARNING",
      title: "High Current Warning",
      message: `This calculation requires a very high battery current (~${formatNumber(batteryCurrent, 0)} A). Actual system design requires properly rated batteries, cables, protection devices, and equipment.`,
    });
  } else if (batteryCurrent > 120) {
    warnings.push({
      level: "WARNING",
      title: "Elevated Battery Discharge",
      message: `Approximate battery current is ~${formatNumber(batteryCurrent, 1)} A. Ensure your battery cable sizing (e.g., 35mm² to 50mm² copper) and terminal lugs prevent resistive overheating.`,
    });
  }

  if (eff < 80) {
    warnings.push({
      level: "WARNING",
      title: "Low Inverter Efficiency",
      message: "Efficiency is configured below 80%. Consider upgrading to a high-efficiency pure sine wave inverter to maximize backup runtime.",
    });
  }

  return {
    success: true,
    runtimeHours,
    formattedRuntime: formatDuration(runtimeHours),
    formattedRuntimeLong: formatDurationLong(runtimeHours),
    batteryEnergyWh: totalEnergyWh,
    usableEnergyWh,
    batteryCurrent,
    mainLabel: "ESTIMATED RUNTIME",
    subLabel: "Approximate operating time under current load",
    warnings,
    secondaryDetails: [
      { label: "Battery Energy", value: `${formatNumber(totalEnergyWh, 0)} Wh` },
      { label: "Usable Energy", value: `${formatNumber(usableEnergyWh, 1)} Wh` },
      { label: "Continuous Load", value: `${formatNumber(load, 0)} W` },
      { label: "Inverter Efficiency", value: `${roundNumber(eff, 1)}%` },
      { label: "Usable Battery Capacity", value: `${roundNumber(usable, 1)}%` },
      { label: "Approx. Battery Current", value: `~${roundNumber(batteryCurrent, 1)} A` },
    ],
    steps: [
      {
        formula: "Battery Energy (Wh) = Battery Voltage × Battery Capacity",
        text: `${v} V × ${ah} Ah = ${formatNumber(totalEnergyWh, 0)} Wh`,
      },
      {
        formula: "Usable Energy (Wh) = Battery Energy × Inverter Efficiency × Usable Capacity %",
        text: `${formatNumber(totalEnergyWh, 0)} Wh × ${eff / 100} × ${usable / 100} = ${formatNumber(usableEnergyWh, 1)} Wh`,
      },
      {
        formula: "Runtime = Usable Energy ÷ Load (W)",
        text: `${formatNumber(usableEnergyWh, 1)} Wh ÷ ${load} W = ${roundNumber(runtimeHours, 3)} hours (≈ ${formatDuration(runtimeHours)})`,
      },
      {
        formula: "Approx. Battery Current ≈ Load ÷ (Voltage × Efficiency)",
        text: `${load} W ÷ (${v} V × ${eff / 100}) ≈ ${roundNumber(batteryCurrent, 1)} A`,
      },
    ],
    disclaimer:
      "Estimated runtime. Actual backup time may vary depending on battery chemistry, age, load profile, ambient temperature, and system losses. Verify equipment ratings and consult a qualified technician.",
  };
}

// ==========================================
// 7. INVERTER CAPACITY & LOAD MATCHING
// ==========================================
export function calculateInverterRealPower(inverterVa, powerFactor) {
  return inverterVa * powerFactor;
}

export function calculateInverterCapacity({ inverterVA, powerFactor = 0.8, loadWatts }) {
  const va = parseFloat(inverterVA);
  const pf = parseFloat(powerFactor);
  const load = loadWatts !== undefined && loadWatts !== "" ? parseFloat(loadWatts) : null;

  if (isNaN(va) || va <= 0) return { error: "Please enter Inverter Rating in VA (e.g., 900 VA, 1050 VA)." };
  if (isNaN(pf) || pf <= 0 || pf > 1) {
    return { error: "Power Factor must be between 0.1 and 1.0 (typically 0.8 for home inverters)." };
  }

  const realWatts = calculateInverterRealPower(va, pf);

  let status = null;
  const warnings = [];

  if (load !== null && !isNaN(load) && load > 0) {
    const isWithin = load <= realWatts;
    const loadPercent = Math.round((load / realWatts) * 100);

    if (isWithin) {
      status = {
        level: "SUCCESS",
        text: "LOAD WITHIN ESTIMATED INVERTER CAPACITY",
        subtext: `Your ${formatNumber(load, 0)} W load is approximately ${loadPercent}% of the ${formatNumber(realWatts, 0)} W continuous inverter limit.`,
      };
    } else {
      status = {
        level: "WARNING",
        text: "LOAD EXCEEDS ESTIMATED INVERTER CAPACITY",
        subtext: `Warning: ${formatNumber(load, 0)} W load exceeds the inverter's continuous rating of ${formatNumber(realWatts, 0)} W (${loadPercent}% load). This can trigger overload shutdown or trip MCB breakers!`,
      };
      warnings.push({
        level: "WARNING",
        title: "Inverter Overload Risk",
        message: `Your connected load (${formatNumber(load, 0)} W) exceeds the inverter's estimated real power capability of ${formatNumber(realWatts, 0)} W.`,
      });
    }
  }

  const secondaryDetails = [
    { label: "Inverter Rating", value: `${formatNumber(va, 0)} VA` },
    { label: "Estimated Real Power Capability", value: `${formatNumber(realWatts, 0)} W` },
    { label: "Assumed Power Factor", value: `${roundNumber(pf, 2)}` },
  ];

  if (load !== null && !isNaN(load) && load > 0) {
    secondaryDetails.push({ label: "Selected Continuous Load", value: `${formatNumber(load, 0)} W` });
  }

  return {
    success: true,
    resultValue: roundNumber(realWatts, 0),
    unit: "W",
    mainLabel: "ESTIMATED REAL POWER CAPABILITY",
    subLabel: `Continuous output limit for a ${formatNumber(va, 0)} VA inverter at ${roundNumber(pf, 2)} PF`,
    status,
    warnings,
    secondaryDetails,
    steps: [
      {
        formula: "Real Power Capability (Watts) = Inverter Rating (VA) × Power Factor",
        text: `${formatNumber(va, 0)} VA × ${pf} = ${formatNumber(realWatts, 0)} W`,
      },
    ],
    explanation:
      "Why is 900 VA not 900 W? Inverter capacity is rated in VA (apparent power). Because home appliances have inductance (fans, refrigerators, transformers), the power factor (typically 0.8) reduces actual usable wattage.",
    disclaimer:
      "Results are estimates. Actual performance depends on the equipment, ambient temperature, battery state, and system losses. Verify equipment nameplate ratings.",
  };
}

// ==========================================
// 8. BATTERY + INVERTER COMBINED SYSTEM
// ==========================================
export function calculateBatteryInverterSystem({
  inverterVA,
  powerFactor = 0.8,
  batteryVoltage,
  batteryCapacityAh,
  loadWatts,
  inverterEfficiency = 92,
  usableCapacityPercent = 90,
}) {
  const va = parseFloat(inverterVA);
  const pf = parseFloat(powerFactor);
  const v = parseFloat(batteryVoltage);
  const ah = parseFloat(batteryCapacityAh);
  const load = parseFloat(loadWatts);
  const eff = parseFloat(inverterEfficiency);
  const usable = parseFloat(usableCapacityPercent);

  if (isNaN(va) || va <= 0) return { error: "Please enter Inverter Rating in VA (e.g., 900 VA)." };
  if (isNaN(pf) || pf <= 0 || pf > 1) return { error: "Power Factor must be between 0.1 and 1.0." };
  if (isNaN(v) || v <= 0) return { error: "Please enter Battery Voltage (e.g., 12 V or 24 V)." };
  if (isNaN(ah) || ah <= 0) return { error: "Please enter Battery Capacity in Ah (e.g., 150 Ah)." };
  if (isNaN(load) || load <= 0) return { error: "Please enter continuous Load in Watts (e.g., 600 W)." };
  if (isNaN(eff) || eff <= 0 || eff > 100) return { error: "Inverter Efficiency must be between 1% and 100%." };
  if (isNaN(usable) || usable <= 0 || usable > 100) return { error: "Usable Battery Capacity must be between 1% and 100%." };

  // 1. Inverter Real Power Capability
  const realPowerWatts = calculateInverterRealPower(va, pf);

  // 2. Battery Energy
  const totalBatteryWh = calculateBatteryEnergy(v, ah);

  // 3. Usable Energy
  const usableBatteryWh = calculateUsableEnergy(totalBatteryWh, eff, usable);

  // 4. Runtime
  const runtimeHours = calculateRuntime(usableBatteryWh, load);

  // 5. Battery-Side Current
  const batteryCurrent = calculateBatteryCurrent(load, v, eff);

  // 6. Inverter Status
  const isWithinCapacity = load <= realPowerWatts;
  const loadPercentageOfInverter = Math.round((load / realPowerWatts) * 100);

  const status = {
    level: isWithinCapacity ? "SUCCESS" : "WARNING",
    text: isWithinCapacity
      ? "LOAD WITHIN ESTIMATED INVERTER CAPACITY"
      : "LOAD EXCEEDS ESTIMATED INVERTER CAPACITY",
    subtext: isWithinCapacity
      ? `Your ${formatNumber(load, 0)} W load utilizes approximately ${loadPercentageOfInverter}% of the ${formatNumber(realPowerWatts, 0)} W continuous inverter capability.`
      : `Warning: ${formatNumber(load, 0)} W load exceeds the inverter's estimated real power capability of ${formatNumber(realPowerWatts, 0)} W (${loadPercentageOfInverter}% load). Inverter may trip or shut down!`,
  };

  // Warnings system
  const warnings = [];

  if (!isWithinCapacity) {
    warnings.push({
      level: "WARNING",
      title: "Inverter Capacity Exceeded",
      message: `The connected load (${formatNumber(load, 0)} W) exceeds the inverter's maximum continuous rating (${formatNumber(realPowerWatts, 0)} W). Consider downsizing running appliances or upgrading to a larger inverter.`,
    });
  }

  if (batteryCurrent > 250) {
    warnings.push({
      level: "WARNING",
      title: "High Battery Current",
      message: `This calculated load requires approximately ${formatNumber(batteryCurrent, 0)} A from the battery. Such a high current indicates a very demanding system and requires properly sized batteries, conductors, protection, and inverter equipment.`,
    });
  } else if (batteryCurrent > 120) {
    warnings.push({
      level: "WARNING",
      title: "Elevated Battery Discharge",
      message: `Estimated battery current is ~${formatNumber(batteryCurrent, 1)} A. Heavy continuous draw requires thick battery interconnection cables and adequate ventilation.`,
    });
  }

  return {
    success: true,
    realPowerWatts: roundNumber(realPowerWatts, 0),
    runtimeHours,
    formattedRuntime: formatDuration(runtimeHours),
    formattedRuntimeLong: formatDurationLong(runtimeHours),
    batteryEnergyWh: totalBatteryWh,
    usableEnergyWh: usableBatteryWh,
    batteryCurrent: roundNumber(batteryCurrent, 1),
    isWithinCapacity,
    loadPercentage: loadPercentageOfInverter,
    status,
    warnings,
    mainLabel: "ESTIMATED RUNTIME",
    subLabel: `Approximate operating time for ${formatNumber(load, 0)} W load on a ${v}V ${ah}Ah battery bank`,
    secondaryDetails: [
      { label: "Estimated Real Power Capability", value: `${formatNumber(realPowerWatts, 0)} W (${formatNumber(va, 0)} VA)` },
      { label: "Battery Energy", value: `${formatNumber(totalBatteryWh, 0)} Wh` },
      { label: "Usable Energy", value: `${formatNumber(usableBatteryWh, 1)} Wh` },
      { label: "Continuous Load", value: `${formatNumber(load, 0)} W (${loadPercentageOfInverter}%)` },
      { label: "Inverter Efficiency", value: `${roundNumber(eff, 1)}%` },
      { label: "Usable Battery Capacity", value: `${roundNumber(usable, 1)}%` },
      { label: "Approx. Battery Current", value: `~${roundNumber(batteryCurrent, 1)} A` },
    ],
    steps: [
      {
        formula: "Inverter Real Power Capability = Inverter VA × Power Factor",
        text: `${formatNumber(va, 0)} VA × ${pf} = ${formatNumber(realPowerWatts, 0)} W`,
      },
      {
        formula: "Battery Energy (Wh) = Battery Voltage × Battery Capacity",
        text: `${v} V × ${ah} Ah = ${formatNumber(totalBatteryWh, 0)} Wh`,
      },
      {
        formula: "Usable Energy (Wh) = Battery Energy × Inverter Efficiency × Usable Capacity %",
        text: `${formatNumber(totalBatteryWh, 0)} Wh × ${eff / 100} × ${usable / 100} = ${formatNumber(usableBatteryWh, 1)} Wh`,
      },
      {
        formula: "Estimated Runtime = Usable Energy ÷ Load Watts",
        text: `${formatNumber(usableBatteryWh, 1)} Wh ÷ ${load} W = ${roundNumber(runtimeHours, 3)} hours (≈ ${formatDuration(runtimeHours)})`,
      },
      {
        formula: "Approx. Battery Current ≈ Load ÷ (Battery Voltage × Efficiency)",
        text: `${load} W ÷ (${v} V × ${eff / 100}) ≈ ${roundNumber(batteryCurrent, 1)} A`,
      },
    ],
    disclaimer:
      "Results are estimates. Actual performance depends on the equipment, battery, installation, environmental conditions, and system losses. Verify equipment ratings and consult a qualified professional for real installations.",
  };
}

// ==========================================
// 8. NEPAL ELECTRICITY COST & UNIT CALCULATOR
// ==========================================
export function calculateDailyKwh(powerWatts, hoursPerDay) {
  return (powerWatts * hoursPerDay) / 1000;
}

export function calculateTotalKwh(powerWatts, hoursPerDay, numberOfDays) {
  return (powerWatts * hoursPerDay * numberOfDays) / 1000;
}

export function calculateElectricityCost(totalUnits, ratePerUnit) {
  return totalUnits * ratePerUnit;
}

export function calculateNepalElectricityCost({
  powerWatts,
  hoursPerDay,
  numberOfDays = 30,
  ratePerUnit = 12,
}) {
  if (
    powerWatts === undefined ||
    powerWatts === "" ||
    hoursPerDay === undefined ||
    hoursPerDay === "" ||
    numberOfDays === undefined ||
    numberOfDays === "" ||
    ratePerUnit === undefined ||
    ratePerUnit === ""
  ) {
    return { error: "Please fill in all fields (Watts, Hours/day, Days, and Rate)." };
  }

  const w = parseFloat(powerWatts);
  const h = parseFloat(hoursPerDay);
  const d = parseFloat(numberOfDays);
  const r = parseFloat(ratePerUnit);

  if (isNaN(w) || isNaN(h) || isNaN(d) || isNaN(r)) {
    return { error: "Please enter valid numeric numbers for all fields." };
  }

  if (w <= 0) return { error: "Power consumption must be greater than 0 W." };
  if (h <= 0 || h > 24) return { error: "Usage hours per day must be between 0.1 and 24 hours." };
  if (d <= 0) return { error: "Number of days must be greater than 0." };
  if (r <= 0) return { error: "Electricity rate must be greater than 0 Rs/unit." };

  const dailyKwh = calculateDailyKwh(w, h);
  const totalKwh = calculateTotalKwh(w, h, d);
  const totalUnits = totalKwh; // 1 Unit = 1 kWh
  const totalCost = calculateElectricityCost(totalUnits, r);

  return {
    success: true,
    isCurrency: true,
    resultValue: formatNumber(totalCost, 2),
    formattedCost: `Rs ${formatNumber(totalCost, 2)}`,
    unit: "NPR",
    mainLabel: "ESTIMATED ELECTRICITY COST",
    subLabel: `Based on ${formatNumber(totalUnits, 2)} Units consumed @ Rs ${formatNumber(r, 2)}/unit`,
    dailyKwh,
    totalKwh,
    totalUnits,
    totalCost,
    secondaryDetails: [
      { label: "Daily Consumption", value: `${formatNumber(dailyKwh, 2)} kWh` },
      { label: "Total Consumption", value: `${formatNumber(totalKwh, 2)} kWh` },
      { label: "Electricity Usage", value: `${formatNumber(totalUnits, 2)} Units` },
      { label: "Electricity Rate", value: `Rs ${formatNumber(r, 2)} / unit` },
      { label: "Duration", value: `${formatNumber(d, 0)} days (${formatNumber(h, 1)} h/day)` },
    ],
    steps: [
      {
        formula: "Daily kWh = (Power W × Hours per day) ÷ 1000",
        text: `(${formatNumber(w, 1)} W × ${formatNumber(h, 1)} h) ÷ 1000 = ${formatNumber(dailyKwh, 2)} kWh`,
      },
      {
        formula: "Total kWh = (Power W × Hours/day × Days) ÷ 1000",
        text: `(${formatNumber(w, 1)} W × ${formatNumber(h, 1)} h × ${formatNumber(d, 0)} days) ÷ 1000 = ${formatNumber(totalKwh, 2)} kWh`,
      },
      {
        formula: "Total Units = Total kWh (1 Unit = 1 kWh)",
        text: `Total Units = ${formatNumber(totalUnits, 2)} Units`,
      },
      {
        formula: "Total Cost (NPR) = Total Units × Electricity Rate",
        text: `${formatNumber(totalUnits, 2)} Units × Rs ${formatNumber(r, 2)} = Rs ${formatNumber(totalCost, 2)}`,
      },
    ],
  };
}

// ==========================================
// 9. NEPAL ELECTRICITY BILL CALCULATOR (NEA TARIFFS)
// ==========================================

/**
 * Format currency in Nepali Rupees (NPR) with Indian/Nepali grouping (e.g. Rs 1,359.50 or Rs 12,450.50)
 */
export function formatNPR(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return "Rs 0.00";
  const rounded = roundNumber(num, decimals);
  const parts = rounded.toFixed(decimals).split(".");
  let intPart = parts[0];
  const decPart = parts[1];
  const isNegative = intPart.startsWith("-");
  if (isNegative) intPart = intPart.slice(1);

  let lastThree = intPart.slice(-3);
  const otherNumbers = intPart.slice(0, -3);
  if (otherNumbers !== "") {
    lastThree = "," + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  return `Rs ${isNegative ? "-" : ""}${formattedInt}.${decPart}`;
}

export const NEPALI_MONTHS = [
  { id: "baishakh", nameEn: "Baishakh", nameNp: "बैशाख", season: "marg-jestha", seasonLabel: "Marg–Jestha (Winter/Spring)" },
  { id: "jestha", nameEn: "Jestha", nameNp: "जेठ", season: "marg-jestha", seasonLabel: "Marg–Jestha (Winter/Spring)" },
  { id: "ashadh", nameEn: "Ashadh (Ashad)", nameNp: "असार", season: "ashad-kartik", seasonLabel: "Ashad–Kartik (Summer/Monsoon)" },
  { id: "shrawan", nameEn: "Shrawan (Sawan)", nameNp: "साउन", season: "ashad-kartik", seasonLabel: "Ashad–Kartik (Summer/Monsoon)" },
  { id: "bhadra", nameEn: "Bhadra (Bhadau)", nameNp: "भदौ", season: "ashad-kartik", seasonLabel: "Ashad–Kartik (Summer/Monsoon)" },
  { id: "ashwin", nameEn: "Ashwin (Asoj)", nameNp: "असोज", season: "ashad-kartik", seasonLabel: "Ashad–Kartik (Summer/Monsoon)" },
  { id: "kartik", nameEn: "Kartik", nameNp: "कात्तिक", season: "ashad-kartik", seasonLabel: "Ashad–Kartik (Summer/Monsoon)" },
  { id: "mangsir", nameEn: "Mangsir (Marg)", nameNp: "मंसिर", season: "marg-jestha", seasonLabel: "Marg–Jestha (Winter/Spring)" },
  { id: "poush", nameEn: "Poush", nameNp: "पुस", season: "marg-jestha", seasonLabel: "Marg–Jestha (Winter/Spring)" },
  { id: "magh", nameEn: "Magh", nameNp: "माघ", season: "marg-jestha", seasonLabel: "Marg–Jestha (Winter/Spring)" },
  { id: "falgun", nameEn: "Falgun (Phagun)", nameNp: "फागुन", season: "marg-jestha", seasonLabel: "Marg–Jestha (Winter/Spring)" },
  { id: "chaitra", nameEn: "Chaitra (Chait)", nameNp: "चैत", season: "marg-jestha", seasonLabel: "Marg–Jestha (Winter/Spring)" },
];

export function getNEASeason(monthIdOrSeason) {
  if (!monthIdOrSeason) return "ashad-kartik";
  const normalized = String(monthIdOrSeason).toLowerCase().trim();
  if (normalized === "ashad-kartik" || normalized === "ashadh-kartik" || normalized === "summer") {
    return "ashad-kartik";
  }
  if (normalized === "marg-jestha" || normalized === "mangsir-jestha" || normalized === "winter") {
    return "marg-jestha";
  }
  const found = NEPALI_MONTHS.find((m) => m.id === normalized || m.nameEn.toLowerCase().includes(normalized));
  return found ? found.season : "ashad-kartik";
}

/**
 * Verified NEA Official Domestic Tariff Structure (FY 2024/25)
 * Centralized configuration object to ensure seamless future tariff updates
 */
export const NEA_TARIFFS = {
  version: "FY 2024/25",
  source: "Nepal Electricity Authority (NEA) Domestic Consumer Tariff",
  singlePhase: {
    voltage: "230V Low Voltage",
    slabs: [
      { id: "0-20", min: 0, max: 20, label: "0–20 Units", labelNp: "०–२० युनिट" },
      { id: "21-30", min: 20, max: 30, label: "21–30 Units", labelNp: "२१–३० युनिट" },
      { id: "31-50", min: 30, max: 50, label: "31–50 Units", labelNp: "३१–५० युनिट" },
      { id: "51-100", min: 50, max: 100, label: "51–100 Units", labelNp: "५१–१०० युनिट" },
      { id: "101-250", min: 100, max: 250, label: "101–250 Units", labelNp: "१०१–२५० युनिट" },
      { id: "above-250", min: 250, max: Infinity, label: "Above 250 Units", labelNp: "२५० युनिटभन्दा माथि" },
    ],
    capacities: {
      "5A": {
        id: "5A",
        name: "5 Amp",
        nameNp: "५ एम्पियर",
        description: "Small Household / Rural connection",
        minimumCharges: {
          "0-20": 30,
          "21-30": 50,
          "31-50": 50,
          "51-100": 75,
          "101-250": 100,
          "above-250": 150,
        },
        rates: {
          "0-20": 0.0, // Free if <=20 units; 3.00/unit if >20 units
          "21-30": 6.5,
          "31-50": 8.0,
          "51-100": 9.5,
          "101-250": 9.5,
          "above-250": 11.0,
        },
        specialFirstSlabRateIfExceeds20: 3.0,
      },
      "15A": {
        id: "15A",
        name: "15 Amp",
        nameNp: "१५ एम्पियर",
        description: "Standard Nepali Household connection (Most Common)",
        minimumCharges: {
          "0-20": 50,
          "21-30": 75,
          "31-50": 75,
          "51-100": 100,
          "101-250": 125,
          "above-250": 175,
        },
        rates: {
          "0-20": 4.0,
          "21-30": 6.5,
          "31-50": 8.0,
          "51-100": 9.5,
          "101-250": 9.5,
          "above-250": 11.0,
        },
      },
      "30A": {
        id: "30A",
        name: "30 Amp",
        nameNp: "३० एम्पियर",
        description: "Medium to Large Household (Water pump, heavy loads)",
        minimumCharges: {
          "0-20": 75,
          "21-30": 100,
          "31-50": 100,
          "51-100": 125,
          "101-250": 150,
          "above-250": 200,
        },
        rates: {
          "0-20": 5.0,
          "21-30": 6.5,
          "31-50": 8.0,
          "51-100": 9.5,
          "101-250": 9.5,
          "above-250": 11.0,
        },
      },
      "60A": {
        id: "60A",
        name: "60 Amp",
        nameNp: "६० एम्पियर",
        description: "Heavy Residential / Multi-flat building",
        minimumCharges: {
          "0-20": 125,
          "21-30": 125,
          "31-50": 125,
          "51-100": 150,
          "101-250": 200,
          "above-250": 250,
        },
        rates: {
          "0-20": 6.0,
          "21-30": 6.5,
          "31-50": 8.0,
          "51-100": 9.5,
          "101-250": 9.5,
          "above-250": 11.0,
        },
      },
    },
  },
  threePhase: {
    voltage: "400V Low Voltage",
    capacities: {
      upTo10KVA: {
        id: "upTo10KVA",
        name: "Up to 10 kVA",
        nameNp: "१० केभीएसम्म",
        description: "Three-Phase domestic load up to 10 kVA",
        minimumCharge: 1100,
        rates: {
          "ashad-kartik": 10.5,
          "marg-jestha": 11.5,
        },
      },
      above10KVA: {
        id: "above10KVA",
        name: "Above 10 kVA",
        nameNp: "१० केभीएभन्दा माथि",
        description: "Three-Phase domestic load above 10 kVA",
        minimumCharge: 1800,
        rates: {
          "ashad-kartik": 10.5,
          "marg-jestha": 11.5,
        },
      },
    },
  },
};

/**
 * Calculate units from meter readings
 */
export function calculateUnitsFromMeterReadings(previousReading, currentReading) {
  if (
    previousReading === undefined ||
    previousReading === "" ||
    currentReading === undefined ||
    currentReading === ""
  ) {
    return { error: "Please enter both previous and current meter readings." };
  }

  const prev = parseFloat(previousReading);
  const curr = parseFloat(currentReading);

  if (isNaN(prev) || isNaN(curr)) {
    return { error: "Meter readings must be valid numbers." };
  }

  if (prev < 0 || curr < 0) {
    return { error: "Meter readings cannot be negative numbers." };
  }

  if (curr < prev) {
    return { error: "Current meter reading cannot be lower than the previous reading." };
  }

  const unitsConsumed = roundNumber(curr - prev, 2);
  return {
    success: true,
    previousReading: prev,
    currentReading: curr,
    unitsConsumed,
  };
}

/**
 * Single-Phase Progressive Slab Calculation Engine
 */
export function calculateSinglePhaseBill({ meterCapacity = "15A", units = 0 }) {
  const capData = NEA_TARIFFS.singlePhase.capacities[meterCapacity];
  if (!capData) {
    return { error: `Invalid single-phase meter capacity "${meterCapacity}". Choose 5A, 15A, 30A, or 60A.` };
  }

  const u = Math.max(0, parseFloat(units) || 0);

  // Determine applicable slab tier for minimum charge
  let applicableTier = "0-20";
  if (u > 250) applicableTier = "above-250";
  else if (u > 100) applicableTier = "101-250";
  else if (u > 50) applicableTier = "51-100";
  else if (u > 30) applicableTier = "31-50";
  else if (u > 20) applicableTier = "21-30";

  const minimumCharge = capData.minimumCharges[applicableTier];

  // Progressive slab breakdown
  const slabBreakdown = [];
  let remainingUnits = u;
  let energyChargeTotal = 0;

  for (const slab of NEA_TARIFFS.singlePhase.slabs) {
    const slabSpan = slab.max === Infinity ? Infinity : slab.max - slab.min;
    let unitsInSlab = 0;

    if (remainingUnits > 0) {
      if (slabSpan === Infinity) {
        unitsInSlab = remainingUnits;
        remainingUnits = 0;
      } else {
        unitsInSlab = Math.min(remainingUnits, slabSpan);
        remainingUnits -= unitsInSlab;
      }
    }

    // Determine slab rate
    let slabRate = capData.rates[slab.id];
    // Special rule for 5A: If user consumed more than 20 units total, first 20 units charged @ Rs 3.00/unit
    if (meterCapacity === "5A" && slab.id === "0-20" && u > 20) {
      slabRate = capData.specialFirstSlabRateIfExceeds20;
    }

    const slabAmount = roundNumber(unitsInSlab * slabRate, 2);
    energyChargeTotal += slabAmount;

    // We include active slabs (unitsInSlab > 0), or at least the first slab if consumption is 0
    if (unitsInSlab > 0 || (u === 0 && slab.id === "0-20")) {
      slabBreakdown.push({
        id: slab.id,
        range: slab.label,
        rangeNp: slab.labelNp,
        units: roundNumber(unitsInSlab, 2),
        rate: slabRate,
        formattedRate: formatNPR(slabRate),
        amount: slabAmount,
        formattedAmount: formatNPR(slabAmount),
        calculationText: `${formatNumber(unitsInSlab, 1)} × ${formatNPR(slabRate)} = ${formatNPR(slabAmount)}`,
      });
    }
  }

  energyChargeTotal = roundNumber(energyChargeTotal, 2);
  const totalBill = roundNumber(energyChargeTotal + minimumCharge, 2);

  return {
    success: true,
    phase: "single",
    phaseLabel: "Single Phase (230V)",
    phaseLabelNp: "सिंगल फेज (२३० भोल्ट)",
    meterCapacity,
    meterCapacityLabel: capData.name,
    meterCapacityLabelNp: capData.nameNp,
    units: u,
    applicableTier,
    minimumCharge,
    energyCharge: energyChargeTotal,
    totalBill,
    slabBreakdown,
  };
}

/**
 * Three-Phase Low-Voltage Bill Calculation Engine
 */
export function calculateThreePhaseBill({ capacity = "upTo10KVA", units = 0, season = "ashad-kartik" }) {
  const capData = NEA_TARIFFS.threePhase.capacities[capacity];
  if (!capData) {
    return { error: `Invalid three-phase capacity "${capacity}". Choose upTo10KVA or above10KVA.` };
  }

  const u = Math.max(0, parseFloat(units) || 0);
  const activeSeason = getNEASeason(season);
  const rate = capData.rates[activeSeason];
  const minimumCharge = capData.minimumCharge;
  const energyCharge = roundNumber(u * rate, 2);
  const totalBill = roundNumber(energyCharge + minimumCharge, 2);

  const seasonLabel =
    activeSeason === "ashad-kartik" ? "Ashad–Kartik (Summer/Monsoon)" : "Marg–Jestha (Winter/Spring)";
  const seasonLabelNp =
    activeSeason === "ashad-kartik" ? "असार–कात्तिक (गर्मी/वर्षा)" : "मंसिर–जेठ (हिउँद/वसन्त)";

  const slabBreakdown = [
    {
      id: activeSeason,
      range: `Total Energy (${seasonLabel})`,
      rangeNp: `कुल ऊर्जा (${seasonLabelNp})`,
      units: roundNumber(u, 2),
      rate,
      formattedRate: formatNPR(rate),
      amount: energyCharge,
      formattedAmount: formatNPR(energyCharge),
      calculationText: `${formatNumber(u, 1)} × ${formatNPR(rate)} = ${formatNPR(energyCharge)}`,
    },
  ];

  return {
    success: true,
    phase: "three",
    phaseLabel: "Three Phase (400V)",
    phaseLabelNp: "थ्री फेज (४०० भोल्ट)",
    meterCapacity: capacity,
    meterCapacityLabel: capData.name,
    meterCapacityLabelNp: capData.nameNp,
    units: u,
    season: activeSeason,
    seasonLabel,
    seasonLabelNp,
    energyRate: rate,
    minimumCharge,
    energyCharge,
    totalBill,
    slabBreakdown,
  };
}

/**
 * Dedicated NEA Electricity Bill Calculation Master Function
 */
export function calculateNEABill({
  phase = "single",
  meterCapacity = "15A",
  units,
  billingMonth = "ashadh",
  season,
  inputMode = "units",
  previousReading,
  currentReading,
}) {
  let computedUnits = units;

  // If calculating from meter readings
  if (inputMode === "readings") {
    const readingResult = calculateUnitsFromMeterReadings(previousReading, currentReading);
    if (readingResult.error) {
      return { error: readingResult.error };
    }
    computedUnits = readingResult.unitsConsumed;
  } else {
    if (units === undefined || units === null || units === "") {
      return { error: "Please enter electricity consumption units (kWh)." };
    }
    const parsed = parseFloat(units);
    if (isNaN(parsed)) {
      return { error: "Consumption units must be a valid number." };
    }
    if (parsed < 0) {
      return { error: "Consumed units cannot be negative. Must be 0 or greater." };
    }
    computedUnits = parsed;
  }

  // Resolve Season & Month
  const resolvedSeason = season ? getNEASeason(season) : getNEASeason(billingMonth);
  const selectedMonthObj = NEPALI_MONTHS.find((m) => m.id === billingMonth) || NEPALI_MONTHS[2]; // Default Ashadh

  let billData;
  if (phase === "three") {
    // Normalise capacity
    const threeCap =
      meterCapacity === "above10KVA" || meterCapacity === "above-10" ? "above10KVA" : "upTo10KVA";
    billData = calculateThreePhaseBill({
      capacity: threeCap,
      units: computedUnits,
      season: resolvedSeason,
    });
  } else {
    // Single Phase (default)
    const validSingleCaps = ["5A", "15A", "30A", "60A"];
    const singleCap = validSingleCaps.includes(meterCapacity) ? meterCapacity : "15A";
    billData = calculateSinglePhaseBill({
      meterCapacity: singleCap,
      units: computedUnits,
    });
  }

  if (billData.error) {
    return billData;
  }

  // Build formula steps for expandable explanation
  const steps = [];
  if (billData.phase === "single") {
    const slabTexts = billData.slabBreakdown.map((s) => `${s.range}: ${s.calculationText}`).join("; ");
    steps.push({
      formula: "Progressive Energy Charge = Σ (Slab Units × Slab Rate)",
      text: slabTexts.length > 0 ? slabTexts : "No units consumed (0 kWh)",
    });
    steps.push({
      formula: `Minimum Charge for ${billData.meterCapacityLabel} (${billData.applicableTier} bracket)`,
      text: `Minimum Demand Charge = ${formatNPR(billData.minimumCharge)}`,
    });
    steps.push({
      formula: "Total Estimated Bill = Energy Charge + Minimum Charge",
      text: `${formatNPR(billData.energyCharge)} + ${formatNPR(billData.minimumCharge)} = ${formatNPR(billData.totalBill)}`,
    });
  } else {
    steps.push({
      formula: `Three-Phase Energy Charge = Consumed Units × Seasonal Rate (${billData.seasonLabel})`,
      text: `${formatNumber(billData.units, 1)} Units × ${formatNPR(billData.energyRate)}/unit = ${formatNPR(billData.energyCharge)}`,
    });
    steps.push({
      formula: `Minimum Charge for ${billData.meterCapacityLabel}`,
      text: `Minimum Demand Charge = ${formatNPR(billData.minimumCharge)}`,
    });
    steps.push({
      formula: "Total Estimated Bill = Energy Charge + Minimum Charge",
      text: `${formatNPR(billData.energyCharge)} + ${formatNPR(billData.minimumCharge)} = ${formatNPR(billData.totalBill)}`,
    });
  }

  // Secondary details for display
  const secondaryDetails = [
    { label: "Connection / Phase", value: billData.phaseLabel },
    { label: "Meter Capacity", value: billData.meterCapacityLabel },
    { label: "Electricity Consumed", value: `${formatNumber(billData.units, 2)} Units (kWh)` },
    {
      label: "Billing Period",
      value: `${selectedMonthObj.nameEn} (${resolvedSeason === "ashad-kartik" ? "Ashad–Kartik" : "Marg–Jestha"})`,
    },
    { label: "Energy Charge", value: formatNPR(billData.energyCharge) },
    { label: "Minimum / Demand Charge", value: formatNPR(billData.minimumCharge) },
    { label: "Total Estimated Bill", value: formatNPR(billData.totalBill) },
  ];

  return {
    success: true,
    isCurrency: true,
    phase: billData.phase,
    phaseLabel: billData.phaseLabel,
    phaseLabelNp: billData.phaseLabelNp,
    meterCapacity: billData.meterCapacity,
    meterCapacityLabel: billData.meterCapacityLabel,
    meterCapacityLabelNp: billData.meterCapacityLabelNp,
    units: billData.units,
    billingMonth: selectedMonthObj.id,
    billingMonthLabel: `${selectedMonthObj.nameEn} (${selectedMonthObj.nameNp})`,
    season: resolvedSeason,
    seasonLabel: resolvedSeason === "ashad-kartik" ? "Ashad–Kartik (Summer/Monsoon)" : "Marg–Jestha (Winter/Spring)",
    seasonLabelNp: resolvedSeason === "ashad-kartik" ? "असार–कात्तिक" : "मंसिर–जेठ",
    energyCharge: billData.energyCharge,
    minimumCharge: billData.minimumCharge,
    totalBill: billData.totalBill,
    formattedCost: formatNPR(billData.totalBill),
    formattedEnergyCharge: formatNPR(billData.energyCharge),
    formattedMinimumCharge: formatNPR(billData.minimumCharge),
    formattedUnits: `${formatNumber(billData.units, 1)} Units`,
    unit: "NPR",
    resultValue: formatNumber(billData.totalBill, 2),
    mainLabel: "ESTIMATED ELECTRICITY BILL",
    mainLabelNp: "अनुमानित बिजुली बिल",
    subLabel: `${formatNumber(billData.units, 1)} Units consumed • ${billData.phaseLabel} (${billData.meterCapacityLabel})`,
    slabBreakdown: billData.slabBreakdown,
    steps,
    secondaryDetails,
    disclaimer:
      "Estimated bill based on published Nepal Electricity Authority (NEA) FY 2024/25 domestic consumer tariffs. Actual invoices may vary depending on meter reading dates, applicable rebates, late payment fees, seasonal adjustments, or official tariff amendments.",
    tariffSource: {
      authority: "Nepal Electricity Authority (NEA)",
      category: "Domestic Consumers (Low Voltage)",
      fiscalYear: "FY 2024/25",
    },
  };
}
