import { SeoHeaderNavbar } from "@/components/SeoHeaderNavbar";
import { Footer } from "@/components/Footer";
import { NepalElectricityBillPageClient } from "@/components/calculator/NepalElectricityBillPageClient";

export const metadata = {
  title: "Nepal Electricity Bill Calculator - NEA Bill Estimate",
  description:
    "Calculate your estimated Nepal electricity bill using NEA domestic tariff slabs, meter capacity, phase, and electricity units. Get an estimated bill amount in Nepali Rupees.",
  keywords: [
    "Nepal Electricity Bill Calculator",
    "NEA Bill Calculator",
    "NEA Electricity Bill Calculator",
    "Electricity Bill Calculator Nepal",
    "NEA Tariff Calculator",
    "Nepal Electricity Cost Calculator",
    "Bijuli Bill Calculator Nepal",
    "NEA Bill Estimate",
    "Nepal Electricity Unit Calculator",
    "Electricity Bill Nepal",
    "घरको बिजुली बिल क्याल्कुलेटर",
    "नेपाल बिजुली बिल क्याल्कुलेटर",
    "NEA domestic tariff calculator",
    "progressive slab billing nepal",
    "single phase 15A bill nepal",
    "three phase electricity bill nepal",
    "phidim service calculator",
  ],
  alternates: {
    canonical: "https://phidimservice.com.np/nepal-electricity-bill-calculator",
  },
  openGraph: {
    title: "Nepal Electricity Bill Calculator - NEA Bill Estimate | Phidim Service",
    description:
      "Calculate your estimated Nepal electricity bill using NEA domestic tariff slabs, meter capacity, phase, and electricity units. Get an estimated bill amount in Nepali Rupees.",
    url: "https://phidimservice.com.np/nepal-electricity-bill-calculator",
    siteName: "Phidim Service",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "Nepal Electricity Bill Calculator - Phidim Service",
      },
    ],
    type: "website",
    locale: "ne_NP",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nepal Electricity Bill Calculator - NEA Bill Estimate | Phidim Service",
    description:
      "Accurate Nepal electricity bill estimator based on official NEA FY 2024/25 domestic tariff slabs, meter capacity, and consumed units.",
    images: ["/logo.png"],
  },
  other: {
    "geo.region": "NP-KO",
    "geo.placename": "Phidim, Panchthar, Koshi Province, Nepal",
    "geo.position": "27.1485;87.7634",
    "ICBM": "27.1485, 87.7634",
  },
};

export default function NepalElectricityBillPage() {
  // Structured Data Schema matching visible page content exactly
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://phidimservice.com.np/nepal-electricity-bill-calculator/#webpage",
        "url": "https://phidimservice.com.np/nepal-electricity-bill-calculator",
        "name": "Nepal Electricity Bill Calculator - NEA Bill Estimate",
        "description":
          "Calculate your estimated Nepal electricity bill using NEA domestic tariff slabs, meter capacity, phase, and electricity units. Get an estimated bill amount in Nepali Rupees.",
        "breadcrumb": {
          "@id": "https://phidimservice.com.np/nepal-electricity-bill-calculator/#breadcrumb",
        },
        "inLanguage": "ne-NP",
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://phidimservice.com.np/nepal-electricity-bill-calculator/#breadcrumb",
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
            "name": "Nepal Electricity Bill Calculator",
            "item": "https://phidimservice.com.np/nepal-electricity-bill-calculator",
          },
        ],
      },
      {
        "@type": "WebApplication",
        "@id": "https://phidimservice.com.np/nepal-electricity-bill-calculator/#app",
        "name": "Nepal Electricity Bill Calculator",
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "All",
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "NPR",
        },
        "description":
          "Interactive client-side calculator for estimating Nepal Electricity Authority (NEA) household electricity bills using progressive tariff slabs, 5A/15A/30A/60A meter capacities, and three-phase rates.",
      },
      {
        "@type": "FAQPage",
        "@id": "https://phidimservice.com.np/nepal-electricity-bill-calculator/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "बिजुलीको १ युनिट (1 Unit) भनेको के हो?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "नेपाल विद्युत प्राधिकरण (NEA) को मिटरिङ प्रणाली अनुसार १ युनिट (1 Unit) भनेको १ किलोवाट-घण्टा (1 kWh) विद्युत खपत हो। यसको अर्थ १,००० वाट क्षमताको लोड १ घण्टा लगातार चल्दा ठ्याक्कै १ युनिट बिजुली खपत हुन्छ।",
            },
          },
          {
            "@type": "Question",
            "name": "प्रोग्रेसिभ स्ल्याब बिलिङ (Progressive Slab Billing) भनेको के हो?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "प्रोग्रेसिभ बिलिङ भनेको सबै युनिटलाई एउटै उच्च दरले गुणन नगरी तोकिएको विभिन्न उपभोग स्ल्याबहरू अनुसार क्रमशः फरक-फरक दरमा हिसाब गरिने प्रणाली हो। यसले गर्दा कम बिजुली उपभोग गर्ने उपभोक्तालाई सहुलियत मिल्छ।",
            },
          },
          {
            "@type": "Question",
            "name": "५ एम्पियर (5A) मिटरमा २० युनिटभन्दा बढी खपत हुँदा के नियम लागु हुन्छ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "आधिकारिक NEA महसुल निर्देशिका अनुसार, ५ एम्पियर ग्राहकले महिनामा २० युनिटसम्म खपत गर्दा ऊर्जा शुल्क रु ०.०० (निःशुल्क) हुन्छ। तर यदि खपत २० युनिटभन्दा बढी भयो भने पहिलो २० युनिटको पनि प्रति युनिट रु ३.०० का दरले कुल रु ६० लाग्छ र बाँकी युनिटको अर्को स्ल्याब अनुसार हिसाब हुन्छ।",
            },
          },
          {
            "@type": "Question",
            "name": "१५ एम्पियर मिटरमा १२५ युनिट खपत हुँदा कति बिल आउँछ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "१५ एम्पियर सिंगल फेज मिटरमा १२५ युनिट खपत हुँदा प्रगतिशील स्ल्याब अनुसार ऊर्जा शुल्क रु १,०१७.५० र न्यूनतम डिमान्ड शुल्क रु १२५.०० गरी जम्मा अनुमानित बिल रु १,१४२.५० आउँछ।",
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
        <NepalElectricityBillPageClient />
      </main>

      <Footer />
    </div>
  );
}

