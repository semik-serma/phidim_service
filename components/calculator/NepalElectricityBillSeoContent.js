"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Receipt,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Info,
  Scale,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export function NepalElectricityBillSeoContent({ onSelectPreset }) {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const faqs = [
    {
      q: "बिजुलीको १ युनिट (1 Unit) भनेको के हो? (What is 1 electricity unit?)",
      a: "नेपाल विद्युत प्राधिकरण (NEA) को मिटरिङ प्रणाली अनुसार १ युनिट (1 Unit) भनेको १ किलोवाट-घण्टा (1 kWh) विद्युत खपत हो। यसको अर्थ यदि १,००० वाट (1000 Watts) क्षमताको उपकरण १ घण्टा लगातार चलाउनुभयो भने ठ्याक्कै १ युनिट बिजुली खपत हुन्छ। उदाहरणका लागि, १०० वाटको १० वटा चिम १ घण्टा बाल्दा वा २०० वाटको फ्रिज ५ घण्टा चल्दा १ युनिट बिजुली खर्च हुन्छ।",
    },
    {
      q: "प्रोग्रेसिभ स्ल्याब बिलिङ (Progressive Slab Billing) भनेको के हो?",
      a: "प्रोग्रेसिभ बिलिङ भनेको सबै युनिटलाई एउटै उच्च दरले गुणन नगरी तोकिएको विभिन्न उपभोग स्ल्याबहरू अनुसार क्रमशः फरक-फरक दरमा हिसाब गरिने प्रणाली हो। उदाहरणका लागि यदि तपाईंले १२५ युनिट उपभोग गर्नुभयो भने पहिलो २० युनिटको छुट्टै दर (रु ४.००), २१ देखि ३० युनिटको रु ६.५०, ३१ देखि ५० युनिटको रु ८.००, ५१ देखि १०० सम्मको रु ९.५०, र १०१ देखि १२५ युनिटको रु ९.५० का दरले हिसाब गरिन्छ। यसले गर्दा कम बिजुली उपभोग गर्ने उपभोक्तालाई सहुलियत मिल्छ।",
    },
    {
      q: "५ एम्पियर (5A) मिटरमा २० युनिटभन्दा बढी खपत हुँदा के नियम लागु हुन्छ?",
      a: "आधिकारिक NEA महसुल निर्देशिका अनुसार, ५ एम्पियर ग्राहकले महिनामा २० युनिटसम्म मात्र खपत गरेमा न्यूनतम शुल्क रु ३० मात्र लाग्छ र ऊर्जा शुल्क रु ०.०० (निःशुल्क) हुन्छ। तर यदि खपत २० युनिटभन्दा १ युनिट मात्र पनि बढी (जस्तै २१ वा २५ युनिट) भयो भने, पहिलो २० युनिटको पनि प्रति युनिट रु ३.०० का दरले कुल रु ६० लाग्छ र बाँकी युनिटको अर्को स्ल्याब अनुसार हिसाब हुन्छ।",
    },
    {
      q: "१५ एम्पियर (15A) मिटरको न्यूनतम शुल्क (Minimum Charge) कति लाग्छ?",
      a: "१५ एम्पियर सिंगल फेज मिटरमा न्यूनतम शुल्क तपाईंको महिनाभरिको कुल खपत स्ल्याब अनुसार निर्धारण हुन्छ: ०–२० युनिट खपतमा रु ५०, २१–५० युनिटमा रु ७५, ५१–१०० युनिटमा रु १००, १०१–२५० युनिटमा रु १२५, र २५० युनिटभन्दा माथि खपत हुँदा रु १७५ न्यूनतम शुल्क लाग्छ।",
    },
    {
      q: "सिंगल फेज र थ्री फेज (Single Phase vs Three Phase) मिटरमा के फरक छ?",
      a: "सिंगल फेज (२३० भोल्ट) सामान्य आवासीय घरहरू, पसल र ससाना घरायसी उपकरणहरू (बत्ती, पंखा, फ्रिज, टिभी) का लागि प्रयोग गरिन्छ र यसमा ५A, १५A, ३०A, र ६०A मिटर हुन्छन्। थ्री फेज (४०० भोल्ट) ठूला घरहरू, व्यावसायिक कम्प्लेक्स वा भारी लोड (जस्तै ५ HP भन्दा ठूला मोटर, लिफ्ट, ठूलो एसी) चलाउन प्रयोग गरिन्छ र यसको न्यूनतम मासिक शुल्क (रु १,१०० वा रु १,८००) र दर सिजन अनुसार फरक हुन्छ।",
    },
    {
      q: "थ्री फेजमा असार–कात्तिक र मंसिर–जेठको दर किन फरक हुन्छ?",
      a: "नेपाल विद्युत प्राधिकरणको नियमानुसार थ्री फेज ग्राहकहरूका लागि मौसमी महसुल (Seasonal Tariff) लागु गरिएको छ। वर्षायाम (असारदेखि कात्तिकसम्म) जलविद्युत उत्पादन धेरै हुने भएकाले प्रतियुनिट दर रु १०.५० हुन्छ भने हिउँद/सुख्खायाम (मंसिरदेखि जेठसम्म) नदीको बहाव घट्ने भएकाले प्रतियुनिट दर रु ११.५० कायम गरिएको छ।",
    },
    {
      q: "मिटर रिडिङबाट युनिट कसरी हिसाब गर्ने?",
      a: "मिटर रिडिङबाट युनिट निकाल्न हालको मिटर रिडिङ (Current Reading) बाट अघिल्लो महिनाको रिडिङ (Previous Reading) घटाउनुपर्छ। सूत्र: खपत युनिट = हालको रिडिङ - अघिल्लो रिडिङ। उदाहरण: अघिल्लो रिडिङ १२५० र हालको १३७५ छ भने १३७५ - १२५० = १२५ युनिट खपत भएको मानिन्छ।",
    },
    {
      q: "के यो क्याल्कुलेटरले देखाएको बिल नै आधिकारिक बिल हो?",
      a: "यो क्याल्कुलेटर नेपाल विद्युत प्राधिकरण (NEA) को प्रकाशित आर्थिक वर्ष २०८१/८२ (FY 2024/25) को आधिकारिक घरायसी महसुल तालिकामा आधारित अनुमानक (Estimator) मात्र हो। वास्तविक बिलमा तोकिएको मितिभित्र तिर्दा पाइने छुट (Rebate), ढिला भुक्तानी जरिवाना (Penalty), डिमान्ड चार्ज समायोजन, र अन्य स्थानीय नियमहरू लागु हुन सक्ने भएकाले यो आधिकारिक बीजक होइन।",
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12 font-sans pt-4">
      {/* 1. Quick Overview Banner */}
      <section className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>नेपाल विद्युत प्राधिकरण • आधिकारिक घरायसी महसुल २०८१/८२</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
            नेपाल बिजुली बिल कसरी हिसाब गरिन्छ?
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            नेपाल विद्युत प्राधिकरण (NEA) ले घरायसी ग्राहकका लागि <strong>प्रोग्रेसिभ स्ल्याब महसुल (Progressive Slab Tariff)</strong> लागु गरेको छ।
            यस प्रणालीमा कुल युनिटलाई एउटै दरले गुणन नगरी खपतको दायरा अनुसार छुट्टाछुट्टै दर र न्यूनतम शुल्क जोडेर बिल तयार गरिन्छ।
          </p>
        </div>
      </section>

      {/* 2. Educational Section 1: What is an Electricity Unit & Monthly Consumption */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 font-bold">
            <Zap size={20} />
          </div>
          <h3 className="text-xl font-black text-gray-900">
            बिजुलीको १ युनिट (kWh) भनेको के हो?
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            विद्युत मिटरमा देखिने १ युनिट भनेको वैज्ञानिक भाषामा <strong>१ किलोवाट-घण्टा (1 kWh)</strong> ऊर्जा हो।
            यसको अर्थ १,००० वाटको लोड १ घण्टासम्म चल्दा १ युनिट खपत हुन्छ।
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl border border-gray-200 space-y-2 text-xs font-mono text-gray-700">
            <div className="font-bold text-gray-900 font-sans">द्रुत उदाहरणहरू (Quick Examples):</div>
            <div>• १००W को फ्यान १० घण्टा चल्दा = १,००० Wh = १ युनिट</div>
            <div>• १,०००W को हिटर १ घण्टा चल्दा = १,००० Wh = १ युनिट</div>
            <div>• ५०W को ४ वटा एलइडी बल्ब ५ घण्टा बाल्दा = १ युनिट</div>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 font-bold">
            <Scale size={20} />
          </div>
          <h3 className="text-xl font-black text-gray-900">
            प्रोग्रेसिभ स्ल्याब बिलिङ किन आवश्यक छ?
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            यदि १२५ युनिटलाई सिधै उच्च दर (रु ९.५०) ले गुणन गर्ने हो भने रु १,१८७.५० आउँछ, जुन गलत हो।
            प्रोग्रेसिभ बिलिङमा कम खपत हुने सुरुवाती स्ल्याबहरूमा सस्तो दर लाग्छ:
          </p>
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-1.5 text-xs text-emerald-950 font-medium">
            <div className="font-bold text-emerald-900">१२५ युनिटको सही हिसाब (१५A मिटर):</div>
            <div>• पहिलो २० युनिट: २० × रु ४.०० = रु ८०.००</div>
            <div>• २१–३० युनिट (१० युनिट): १० × रु ६.५० = रु ६५.००</div>
            <div>• ३१–५० युनिट (२० युनिट): २० × रु ८.०० = रु १६०.००</div>
            <div>• ५१–१०० युनिट (५० युनिट): ५० × रु ९.५० = रु ४७५.००</div>
            <div>• बाँकी २५ युनिट: २५ × रु ९.५० = रु २३७.५०</div>
            <div className="pt-1 font-bold text-emerald-900 border-t border-emerald-200">
              ऊर्जा शुल्क रु १,०१७.५० + न्यूनतम शुल्क रु १२५ = <strong>रु १,१४२.५०</strong>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Reference Table: Verified NEA Single-Phase Tariff Slabs (FY 2024/25) */}
      <section className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              <span>आधिकारिक NEA घरायसी महसुल दर (FY 2024/25)</span>
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-1">
              नेपाल विद्युत प्राधिकरण सिंगल फेज २३० भोल्ट घरायसी महसुल संरचना
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 w-fit">
            २३० भोल्ट (घरायसी)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200 font-black text-gray-700 uppercase tracking-wider">
                <th className="py-3 px-3">खपत स्ल्याब (Units)</th>
                <th className="py-3 px-3">५ एम्पियर (5A)</th>
                <th className="py-3 px-3">१५ एम्पियर (15A)</th>
                <th className="py-3 px-3">३० एम्पियर (30A)</th>
                <th className="py-3 px-3">६० एम्पियर (60A)</th>
                <th className="py-3 px-3 text-right">ऊर्जा दर (रु/युनिट)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              <tr className="hover:bg-green-50/30">
                <td className="py-3 px-3 font-bold text-gray-900">०–२० युनिट</td>
                <td className="py-3 px-3">न्यूनतम: रु ३०</td>
                <td className="py-3 px-3">न्यूनतम: रु ५०</td>
                <td className="py-3 px-3">न्यूनतम: रु ७५</td>
                <td className="py-3 px-3">न्यूनतम: रु १२५</td>
                <td className="py-3 px-3 text-right font-bold text-emerald-700 font-mono">
                  ५A: ०.००* | १५A: ४.०० | ३०A: ५.०० | ६०A: ६.००
                </td>
              </tr>
              <tr className="hover:bg-green-50/30">
                <td className="py-3 px-3 font-bold text-gray-900">२१–३० युनिट</td>
                <td className="py-3 px-3">न्यूनतम: रु ५०</td>
                <td className="py-3 px-3">न्यूनतम: रु ७५</td>
                <td className="py-3 px-3">न्यूनतम: रु १००</td>
                <td className="py-3 px-3">न्यूनतम: रु १२५</td>
                <td className="py-3 px-3 text-right font-bold text-emerald-700 font-mono">रु ६.५०</td>
              </tr>
              <tr className="hover:bg-green-50/30">
                <td className="py-3 px-3 font-bold text-gray-900">३१–५० युनिट</td>
                <td className="py-3 px-3">न्यूनतम: रु ५०</td>
                <td className="py-3 px-3">न्यूनतम: रु ७५</td>
                <td className="py-3 px-3">न्यूनतम: रु १००</td>
                <td className="py-3 px-3">न्यूनतम: रु १२५</td>
                <td className="py-3 px-3 text-right font-bold text-emerald-700 font-mono">रु ८.००</td>
              </tr>
              <tr className="hover:bg-green-50/30">
                <td className="py-3 px-3 font-bold text-gray-900">५१–१०० युनिट</td>
                <td className="py-3 px-3">न्यूनतम: रु ७५</td>
                <td className="py-3 px-3">न्यूनतम: रु १००</td>
                <td className="py-3 px-3">न्यूनतम: रु १२५</td>
                <td className="py-3 px-3">न्यूनतम: रु १५०</td>
                <td className="py-3 px-3 text-right font-bold text-emerald-700 font-mono">रु ९.५०</td>
              </tr>
              <tr className="hover:bg-green-50/30">
                <td className="py-3 px-3 font-bold text-gray-900">१०१–२५० युनिट</td>
                <td className="py-3 px-3">न्यूनतम: रु १००</td>
                <td className="py-3 px-3">न्यूनतम: रु १२५</td>
                <td className="py-3 px-3">न्यूनतम: रु १५०</td>
                <td className="py-3 px-3">न्यूनतम: रु २००</td>
                <td className="py-3 px-3 text-right font-bold text-emerald-700 font-mono">रु ९.५०</td>
              </tr>
              <tr className="hover:bg-green-50/30">
                <td className="py-3 px-3 font-bold text-gray-900">२५१ भन्दा माथि</td>
                <td className="py-3 px-3">न्यूनतम: रु १५०</td>
                <td className="py-3 px-3">न्यूनतम: रु १७५</td>
                <td className="py-3 px-3">न्यूनतम: रु २००</td>
                <td className="py-3 px-3">न्यूनतम: रु २५०</td>
                <td className="py-3 px-3 text-right font-bold text-emerald-700 font-mono">रु ११.००</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
          <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>*५ एम्पियरको विशेष नियम:</strong> यदि ५A उपभोक्ताले महिनामा २० युनिटभन्दा बढी खपत गरेमा पहिलो २० युनिटको
            दर रु ०.०० नभई प्रति युनिट <strong>रु ३.००</strong> का दरले लागु हुन्छ। २० युनिट वा सोभन्दा कम खपतमा मात्र ऊर्जा शुल्क निःशुल्क हुन्छ।
          </div>
        </div>
      </section>

      {/* 4. Three-Phase Low Voltage Section */}
      <section className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h3 className="text-xl font-black text-gray-900">
            थ्री फेज (Three Phase 400V) घरायसी महसुल
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-1">
            थ्री फेजमा स्ल्याब नभई मासिक न्यूनतम शुल्क र मौसमी ऊर्जा दर लागु हुन्छ।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-gray-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-gray-900">Up to 10 kVA (१० केभीएसम्म)</span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                Min: Rs 1,100
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-gray-700">
              <div className="flex justify-between">
                <span>असार – कात्तिक (Summer/Monsoon):</span>
                <span className="font-bold font-mono text-emerald-700">रु १०.५० / kWh</span>
              </div>
              <div className="flex justify-between">
                <span>मंसिर – जेठ (Winter/Spring):</span>
                <span className="font-bold font-mono text-emerald-700">रु ११.५० / kWh</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-gray-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-gray-900">Above 10 kVA (१० केभीएभन्दा माथि)</span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                Min: Rs 1,800
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-gray-700">
              <div className="flex justify-between">
                <span>असार – कात्तिक (Summer/Monsoon):</span>
                <span className="font-bold font-mono text-emerald-700">रु १०.५० / kWh</span>
              </div>
              <div className="flex justify-between">
                <span>मंसिर – जेठ (Winter/Spring):</span>
                <span className="font-bold font-mono text-emerald-700">रु ११.५० / kWh</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Frequently Asked Questions (Accordion) */}
      <section className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <HelpCircle size={20} className="text-green-600" />
            <span>बारम्बार सोधिने प्रश्नहरू (Frequently Asked Questions)</span>
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-1">
            नेपाल विद्युत बिलिङ तथा महसुल सम्बन्धी आम उपभोक्ताका मुख्य जिज्ञासाहरू
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {faqs.map((faq, idx) => (
            <div key={idx} className="py-4">
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="flex items-center justify-between w-full text-left gap-4 font-bold text-sm text-gray-900 hover:text-green-700 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                {openFaqIndex === idx ? (
                  <ChevronUp size={16} className="text-green-600 shrink-0" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400 shrink-0" />
                )}
              </button>
              {openFaqIndex === idx && (
                <div className="mt-2.5 text-xs text-gray-600 leading-relaxed pr-4 animate-in fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. Tariff Disclaimer & Transparency Source */}
      <section className="p-6 bg-slate-100 rounded-3xl border border-slate-200 text-xs text-slate-600 space-y-3">
        <div className="flex items-center justify-between font-bold text-slate-800">
          <span>महसुल अस्वीकरण तथा स्रोत (Tariff Disclaimer &amp; Source)</span>
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
            NEA Domestic FY 2024/25
          </span>
        </div>
        <p className="leading-relaxed">
          यो क्याल्कुलेटर नेपाल विद्युत प्राधिकरण (Nepal Electricity Authority - NEA) द्वारा प्रकाशित आधिकारिक घरायसी महसुल दरका आधारमा निर्माण गरिएको हो।
          विद्युत महसुल, डिमान्ड चार्ज तथा बिलिङ नियमहरू समय-समयमा परिमार्जन हुन सक्छन्। यस क्याल्कुलेटरले प्रदान गरेको रकम केवल अनुमानित बिल हो र यसलाई आधिकारिक बिलको रूपमा प्रयोग गर्न मिल्दैन।
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-[11px] text-slate-500">
          <span>स्रोत: नेपाल विद्युत प्राधिकरण (NEA) घरायसी उपभोक्ता महसुल</span>
          <a
            href="https://www.nea.org.np"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-green-700 hover:text-green-800 font-bold hover:underline"
          >
            <span>आधिकारिक NEA वेबसाइट हेर्नुहोस्</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </section>
    </div>
  );
}

