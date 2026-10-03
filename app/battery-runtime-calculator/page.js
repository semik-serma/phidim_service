import { SeoHeaderNavbar } from "@/components/SeoHeaderNavbar";
import { Footer } from "@/components/Footer";
import { CalculatorPageClient } from "@/components/calculator/CalculatorPageClient";

export const metadata = {
  title: "Battery Runtime Calculator - Battery Backup Time, Ah, Wh & Watts",
  description:
    "Calculate battery runtime and backup time from battery voltage, Ah, watts, inverter efficiency, and usable battery capacity. Supports 12V, 24V and 48V batteries.",
  keywords: [
    "battery runtime calculator",
    "battery backup time calculator",
    "battery run time calculator",
    "battery capacity calculator",
    "battery backup calculator",
    "inverter runtime calculator",
    "inverter battery runtime calculator",
    "battery watt hour calculator",
    "ah to wh calculator",
    "battery energy calculator",
    "12v battery runtime calculator",
    "24v battery runtime calculator",
    "48v battery runtime calculator",
    "ups battery backup calculator",
    "battery backup nepal",
    "inverter repair phidim",
  ],
  alternates: {
    canonical: "https://phidimservice.com.np/battery-runtime-calculator",
  },
  openGraph: {
    title: "Battery Runtime Calculator - Battery Backup Time, Ah, Wh & Watts",
    description:
      "Calculate battery runtime and backup time from battery voltage, Ah, watts, inverter efficiency, and usable battery capacity. Supports 12V, 24V and 48V batteries.",
    url: "https://phidimservice.com.np/battery-runtime-calculator",
    siteName: "Phidim Service",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "Phidim Service Battery Runtime Calculator",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Battery Runtime Calculator - Battery Backup Time, Ah, Wh & Watts",
    description:
      "Calculate battery runtime and backup time from battery voltage, Ah, watts, inverter efficiency, and usable battery capacity. Supports 12V, 24V and 48V batteries.",
    images: ["/logo.png"],
  },
  other: {
    "geo.region": "NP-KO",
    "geo.placename": "Phidim, Panchthar, Koshi Province, Nepal",
    "geo.position": "27.1485;87.7634",
    "ICBM": "27.1485, 87.7634",
  },
};

export default function BatteryRuntimeCalculatorPage() {
  // Structured Data Schema matching visible page content exactly
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://phidimservice.com.np/battery-runtime-calculator/#webpage",
        "url": "https://phidimservice.com.np/battery-runtime-calculator",
        "name": "Battery Runtime Calculator - Battery Backup Time, Ah, Wh & Watts",
        "description":
          "Calculate battery runtime and backup time from battery voltage, Ah, watts, inverter efficiency, and usable battery capacity. Supports 12V, 24V and 48V batteries.",
        "breadcrumb": {
          "@id": "https://phidimservice.com.np/battery-runtime-calculator/#breadcrumb",
        },
        "inLanguage": "en-US",
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://phidimservice.com.np/battery-runtime-calculator/#breadcrumb",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://phidimservice.com.np",
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Services",
            "item": "https://phidimservice.com.np/services",
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Battery Runtime Calculator",
            "item": "https://phidimservice.com.np/battery-runtime-calculator",
          },
        ],
      },
      {
        "@type": "WebApplication",
        "@id": "https://phidimservice.com.np/battery-runtime-calculator/#app",
        "name": "Battery Runtime Calculator",
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "All",
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "NPR",
        },
        "description":
          "Interactive client-side electrical engineering tool to calculate battery backup time, Ah to Wh energy, operating runtime, and battery current for 12V, 24V, and 48V inverter systems.",
      },
      {
        "@type": "FAQPage",
        "@id": "https://phidimservice.com.np/battery-runtime-calculator/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is a battery runtime calculator?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "A battery runtime calculator is an electrical calculation tool that estimates how many hours and minutes a battery bank can supply power to a connected electrical load before reaching its safe discharge limit. It accounts for nominal battery voltage, capacity in Amp-hours (Ah), continuous load in Watts (W), inverter conversion efficiency, and usable depth of discharge (DoD).",
            },
          },
          {
            "@type": "Question",
            "name": "How do I calculate battery backup time?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "First, determine total stored energy in Watt-hours (Wh) by multiplying Battery Voltage (V) by Battery Capacity (Ah). Next, multiply total energy by inverter efficiency (typically 90%–94%) and usable capacity percentage (typically 80%–90%) to calculate usable Watt-hours. Finally, divide usable Watt-hours by your continuous load in Watts (W). The formula is: Runtime (hours) = (Voltage × Ah × Inverter Efficiency × Usable Capacity %) ÷ Load (Watts).",
            },
          },
          {
            "@type": "Question",
            "name": "How many hours will a 12V 100Ah battery last?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "A 12V 100Ah battery stores 1,200 Watt-hours (Wh) of nominal energy. With a standard 92% inverter efficiency and 90% usable battery capacity, you have approximately 993.6 usable Watt-hours. Under a typical 300W load (lights, fans, and television), it will run for approximately 3 hours and 19 minutes (993.6 ÷ 300 = 3.31 hours). Under a lighter 100W load, it can run for approximately 9.9 hours.",
            },
          },
          {
            "@type": "Question",
            "name": "How does battery voltage affect runtime?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Battery voltage directly multiplies stored energy for any given Ah rating. A 24V 100Ah battery bank stores 2,400 Wh—exactly twice the energy of a 12V 100Ah battery (1,200 Wh)—and delivers double the runtime under the same load. Additionally, higher voltage systems draw lower DC current (Amperes) for the same wattage, minimizing resistive heating losses (I²R) in cables and inverter circuitry.",
            },
          },
          {
            "@type": "Question",
            "name": "What is the difference between Ah and Wh?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Amp-hours (Ah) measures electrical charge (current delivered over time), whereas Watt-hours (Wh) measures total electrical energy (work performed). Ah alone cannot define total energy without knowing the system voltage. Multiplying Ah by Voltage yields Watt-hours (Wh = V × Ah). For example, a 12V 100Ah battery has 1,200 Wh, while a 24V 50Ah battery also has 1,200 Wh, despite having half the Ah rating.",
            },
          },
          {
            "@type": "Question",
            "name": "Does inverter efficiency affect battery runtime?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Yes. Inverters must convert Direct Current (DC) from batteries into Alternating Current (AC) for household appliances. Modern pure sine wave inverters typically operate at 90% to 95% efficiency, while older or square-wave units may operate between 80% and 85%. An inverter with 92% efficiency dissipates 8% of energy as heat, reducing your actual runtime by 8% compared to a theoretical 100% efficient system.",
            },
          },
          {
            "@type": "Question",
            "name": "Can I calculate inverter backup time?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Yes. Inverter backup time is simply the runtime of the connected battery bank while powering AC loads through the inverter. By entering your battery voltage, capacity (Ah), inverter efficiency, and appliance power consumption (W), this calculator calculates backup duration. You can also use the optional Inverter Sizing Check to verify that your continuous wattage does not exceed the inverter's real power rating.",
            },
          },
          {
            "@type": "Question",
            "name": "What is the difference between VA and watts?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "VA (Volt-Amperes) measures apparent power, which encompasses both real power and reactive power drawn by inductive loads such as ceiling fans, refrigerator compressors, and pumps. Watts (W) measures real power that actually performs work. Real power equals apparent power multiplied by the power factor (W = VA × Power Factor). For instance, a 900 VA inverter with a 0.8 power factor delivers a maximum of 720 Watts of continuous real power (900 × 0.8 = 720 W).",
            },
          },
          {
            "@type": "Question",
            "name": "Can I use this calculator for UPS batteries?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Yes. An Uninterruptible Power Supply (UPS) utilizes the same battery chemistry and inverter principles as larger home backup systems. For a desktop or server UPS, enter the internal battery voltage (commonly 12V or 24V) and Ah rating (typically 7Ah, 9Ah, or 18Ah), along with the computer load (e.g., 150W to 250W), to determine backup time.",
            },
          },
          {
            "@type": "Question",
            "name": "Why is actual runtime different from the calculated runtime?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "This calculator provides an engineering estimate based on constant load and standard conditions. Actual runtime varies due to Peukert's Law (lead-acid batteries lose effective capacity at high discharge currents), battery aging and sulfation, ambient temperature drops, motor startup inrush surges, cable resistance losses, and the inverter's own standby power consumption (usually 10W–25W).",
            },
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Search Engine Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SeoHeaderNavbar activeTabName="CALCULATOR" />

      <main className="flex-1">
        <CalculatorPageClient />
      </main>

      <Footer />
    </div>
  );
}
