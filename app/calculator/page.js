import { SeoHeaderNavbar } from "@/components/SeoHeaderNavbar";
import { Footer } from "@/components/Footer";
import { CalculatorPageClient } from "@/components/calculator/CalculatorPageClient";

export const metadata = {
  title: "Battery Runtime Calculator - Battery Backup Time, Ah, Wh & Watts",
  description:
    "Calculate battery runtime and backup time from battery voltage, Ah, watts, inverter efficiency, and usable battery capacity. Supports 12V, 24V and 48V batteries.",
  keywords: [
    "battery runtime calculator",
    "battery backup time",
    "battery backup calculator",
    "battery Ah Wh watts calculator",
    "electrical calculator",
    "inverter capacity calculator",
    "inverter size calculator nepal",
    "ohms law calculator",
    "AC power calculator",
    "DC power calculator",
    "power factor calculator",
    "VA to watts converter",
    "inverter repair phidim",
    "electrician in phidim",
    "phidim service calculator",
    "इलेक्ट्रिकल क्यालकुलेटर",
    "फिदिम इन्भर्टर मर्मत",
    "ब्याट्री ब्याकअप क्यालकुलेटर",
  ],
  alternates: {
    canonical: "https://phidimservice.com.np/battery-runtime-calculator",
  },
  openGraph: {
    title: "Battery Runtime Calculator - Battery Backup Time, Ah, Wh & Watts | Phidim Service",
    description:
      "Calculate battery backup runtime (hours & minutes), Ah, Wh, Watts, inverter capacity, Ohm's Law, and load matching with Phidim Service's official electrical engineering calculator.",
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
    title: "Battery Runtime Calculator - Battery Backup Time, Ah, Wh & Watts | Phidim Service",
    description:
      "Accurate battery runtime calculator for backup time, Ah, Wh, Watts, inverter sizing, and power calculations in Phidim, Panchthar.",
    images: ["/logo.png"],
  },
  other: {
    "geo.region": "NP-KO",
    "geo.placename": "Phidim, Panchthar, Koshi Province, Nepal",
    "geo.position": "27.1485;87.7634",
    "ICBM": "27.1485, 87.7634",
  },
};

export default function CalculatorPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <SeoHeaderNavbar activeTabName="CALCULATOR" />

      <main className="flex-1">
        <CalculatorPageClient />
      </main>

      <Footer />
    </div>
  );
}
