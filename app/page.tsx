import React from "react";
import VehicleChecker from "@/components/VehicleChecker";
import ZoneExplorer from "@/components/ZoneExplorer";
import AdContainer from "@/components/AdContainer";
import { allZones } from "@/lib/zones";
import {
  HelpCircle,
  FileText,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const generalFaqs = [
    {
      question: "What are the standard emission rules for UK ULEZ and Clean Air Zones?",
      answer:
        "The standard nationwide requirements are: Euro 4 for petrol cars and vans (generally registered with the DVLA from January 2006 onwards), and Euro 6 for diesel cars and vans (generally registered from September 2015 [65-plate] onwards). Pure electric vehicles (EVs) are 100% compliant across all UK zones.",
    },
    {
      question: "How do Scottish Low Emission Zones (Glasgow, Edinburgh, Dundee, Aberdeen) differ from English CAZs?",
      answer:
        "In English Clean Air Zones (such as Birmingham and Bristol) and the London ULEZ, you can pay a daily charge (typically £8–£12.50) if your vehicle does not meet the standards. In Scotland, there is NO daily pay option. Non-compliant vehicles are completely banned, and entering incurs an automatic £60 Penalty Charge Notice (PCN), which doubles on each subsequent entry up to £480 for cars and £960 for HGVs.",
    },
    {
      question: "How does the registration plate decoder identify my car's year?",
      answer:
        "Modern UK number plates since September 2001 use a two-digit age identifier. Plates issued between March and August use the two digits of the year (e.g., '15' = 2015, '24' = 2024). Plates issued between September and February add 50 (e.g., '65' = late 2015, '74' = late 2024). This allows our system to instantly detect your registration period and determine whether a diesel car meets the critical September 2015 Euro 6 mandate.",
    },
    {
      question: "Do private passenger cars have to pay in Bath, Sheffield, Bradford, or Newcastle?",
      answer:
        "NO. Bath, Sheffield, Newcastle, and Bradford operate Class C (or C+) Clean Air Zones. Class C zones only charge commercial vehicles (vans, LGVs, taxis, buses, and HGVs). Private passenger cars and motorcycles are completely EXEMPT from charges in these cities.",
    },
    {
      question: "Are foreign registered vehicles required to comply with UK emission zones?",
      answer:
        "Yes. Foreign-registered vehicles must also meet the same emissions standards. However, because foreign plates are not automatically listed in the DVLA database, drivers must register their vehicle with Transport for London (for ULEZ) or the national Clean Air Zone service at least 10 days before driving into the zones to avoid erroneous penalty charges.",
    },
    {
      question: "What are the rules for historic and classic cars?",
      answer:
        "In England, vehicles constructed before 1 January 1984 (or registered in the DVLA 'historic vehicle' tax class for vehicles over 40 years old) are generally exempt from ULEZ and CAZ charges. In Scotland, the exemption applies to non-commercial historic vehicles over 30 years old.",
    },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": generalFaqs.map((f) => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer,
      },
    })),
  };

  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative pt-12 pb-8 sm:pt-16 sm:pb-12 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-zinc-800 overflow-hidden bg-gradient-to-b from-slate-100 via-white to-slate-50 dark:from-[#0A0A0A] dark:via-[#141414] dark:to-[#0A0A0A] transition-colors">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/25 mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            2026 UK Clean Air, ULEZ & Scottish LEZ Coverage Active
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-900 dark:text-white max-w-4xl mx-auto leading-tight sm:leading-none mb-4">
            UK Clean Air Zones & <span className="text-primary">ULEZ Map Checker</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed mb-6">
            Instant UK number plate decoder & compliance check across London ULEZ, Congestion Charge, Scottish LEZ bans, and all English Clean Air Zones. Avoid £180 penalty notices.
          </p>

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 text-xs font-semibold max-w-4xl mx-auto">
            <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-sm">
              <span className="text-primary font-bold">14</span> Active UK Zones
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-sm">
              <span className="text-primary font-bold">£12.50</span> London ULEZ
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-sm">
              <span className="text-red-600 dark:text-red-400 font-bold">£60 Fine</span> Scottish LEZ (No Pass)
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-sm">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">£0</span> Bath/Sheffield Private Cars
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col gap-12">
        {/* Feature A: Instant Number Plate & Vehicle Compliance Checker */}
        <VehicleChecker />

        {/* Feature B: Interactive Clean Air Zones & ULEZ Map with List Switcher */}
        <ZoneExplorer zones={allZones} />

        {/* CLS-safe Mid-Page AdSense Placeholder */}
        <AdContainer slot="homepage-mid-content" format="horizontal" />

        {/* Feature C: Quick Jump Grid to All 14 Programmatic SEO Pages */}
        <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800 shadow-xl transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-primary block mb-1">
                Programmatic Directory
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                All 14 UK Clean Air & Low Emission Zones (2026 Guides)
              </h3>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Select a city for dedicated boundaries, payment deadlines, and vehicle rules
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {allZones.map((z) => (
              <Link
                key={z.slug}
                href={`/zone/${z.slug}`}
                className="group p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/40 hover:border-primary dark:hover:border-primary transition-all flex flex-col justify-between shadow-sm hover:shadow"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-primary transition-colors">
                      {z.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {z.region}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">{z.summary}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-zinc-800/80 flex items-center justify-between text-xs text-primary font-semibold">
                  <span>Cars: {z.dailyChargeCar}</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Comprehensive UK Clean Air Rules, Standards & FAQ Section */}
        <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800 shadow-xl transition-colors">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 mb-2">
              <HelpCircle className="w-3.5 h-3.5" />
              Frequently Asked Questions & UK Emission Guidance
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              UK Clean Air Zones, ULEZ & Scottish LEZ Guide (2026)
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
              Everything you need to know about Euro 4 and Euro 6 standards, number plate age letters, PCN fines, and exemptions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {generalFaqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80"
              >
                <h4 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white mb-2">
                  {faq.question}
                </h4>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          {/* Standards Summary Matrix */}
          <div className="mt-8 p-5 rounded-xl bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
            <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Quick Summary: UK Emission Standards By Vehicle Category
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                    <th className="py-2 pr-4 font-semibold">Fuel / Vehicle</th>
                    <th className="py-2 px-4 font-semibold">Required Standard</th>
                    <th className="py-2 px-4 font-semibold">Typical Reg Date</th>
                    <th className="py-2 pl-4 font-semibold">Exempt / Free Zones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/60">
                  <tr>
                    <td className="py-2.5 pr-4 font-bold text-zinc-900 dark:text-white">Petrol Cars & Vans</td>
                    <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">Euro 4 (NOx)</td>
                    <td className="py-2.5 px-4">January 2006 onwards ('06' plate)</td>
                    <td className="py-2.5 pl-4">Free in ULEZ & CAZs if Euro 4+</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-bold text-zinc-900 dark:text-white">Diesel Cars & Vans</td>
                    <td className="py-2.5 px-4 text-amber-600 dark:text-amber-400 font-semibold">Euro 6 (NOx & PM)</td>
                    <td className="py-2.5 px-4">September 2015 onwards ('65' plate)</td>
                    <td className="py-2.5 pl-4">Pre-Sept 2015 charged / banned</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-bold text-zinc-900 dark:text-white">Electric Vehicles (EV)</td>
                    <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">Zero Emissions</td>
                    <td className="py-2.5 px-4">Any year</td>
                    <td className="py-2.5 pl-4">100% Free across all UK zones</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-bold text-zinc-900 dark:text-white">Motorcycles / Mopeds</td>
                    <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">Euro 3</td>
                    <td className="py-2.5 px-4">July 2007 onwards</td>
                    <td className="py-2.5 pl-4">Free in most CAZs and ULEZ</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
