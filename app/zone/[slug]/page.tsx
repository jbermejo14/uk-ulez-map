import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { getZoneBySlug, getAllZoneSlugs, allZones } from "@/lib/zones";
import ZoneMapWrapper from "@/components/ZoneMapWrapper";
import VehicleChecker from "@/components/VehicleChecker";
import AdContainer from "@/components/AdContainer";
import {
  Clock,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  FileCheck,
  AlertOctagon,
  CreditCard,
  MapPin,
} from "lucide-react";

interface ZonePageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return getAllZoneSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ZonePageProps): Promise<Metadata> {
  const zone = getZoneBySlug(params.slug);
  if (!zone) {
    return {
      title: "Zone Not Found | UKCleanZone",
    };
  }

  const title = `${zone.name} Map, Daily Charges & Vehicle Checker (2026)`;
  const description = `Complete 2026 driver guide for the ${zone.name}. Check if your car or van must pay the ${zone.dailyChargeCar} daily fee or faces a ${zone.pcnAmount} PCN fine. Interactive map & official payment portal.`;

  return {
    title,
    description,
    keywords: [
      `${zone.name} checker`,
      `${zone.shortName} charges`,
      `${zone.city} clean air zone map`,
      `${zone.city} ULEZ rules`,
      `${zone.name} boundary map`,
      `${zone.shortName} fine PCN`,
      `pay ${zone.shortName} online`,
    ],
    openGraph: {
      title: `${title} | UKCleanZone`,
      description,
      url: `https://ukcleanzone.co.uk/zone/${zone.slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | UKCleanZone`,
      description,
    },
  };
}

export default function ZonePage({ params }: ZonePageProps) {
  const zone = getZoneBySlug(params.slug);

  if (!zone) {
    notFound();
  }

  const isBanZone = zone.dailyChargeCar.includes("BANNED");

  // Schema.org Structured Data: BreadcrumbList + FAQPage
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://ukcleanzone.co.uk",
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "UK Zones",
        "item": "https://ukcleanzone.co.uk/#map-section",
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": zone.name,
        "item": `https://ukcleanzone.co.uk/zone/${zone.slug}`,
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": zone.faqs.map((f) => ({
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <nav className="bg-slate-100 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 py-2.5 px-4 sm:px-6 lg:px-8 text-xs transition-colors">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
          <Link href="/#map-section" className="hover:text-primary transition-colors">
            UK Zones
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
          <span className="text-zinc-900 dark:text-white font-semibold truncate">
            {zone.name}
          </span>
        </div>
      </nav>

      {/* Zone Header Hero */}
      <section className="pt-8 pb-6 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-zinc-800 bg-gradient-to-b from-slate-100 to-white dark:from-[#0A0A0A] dark:to-[#141414] transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-white">
              {zone.region}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {zone.typeLabel}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Status: {zone.status}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700">
              Last checked: {zone.lastVerified}
            </span>
            <a
              href={zone.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary hover:underline flex items-center gap-1 border border-primary/20"
              title="View the operator's official source"
            >
              <span>Official source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {zone.unverifiedFields && zone.unverifiedFields.length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/50 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <span className="font-bold">Verification note:</span>
              <span>Details awaiting official confirmation: {zone.unverifiedFields.join(", ")}</span>
            </div>
          )}

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
            {zone.name} Map, Daily Charges & Vehicle Checker (2026)
          </h1>

          <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-4xl leading-relaxed">
            {zone.description}
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
              <span className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase">Daily Car Charge</span>
              <span className={`text-lg font-black ${isBanZone ? "text-red-600 dark:text-red-400" : "text-primary"}`}>
                {zone.dailyChargeCar}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
              <span className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase">Daily Van Charge</span>
              <span className="text-lg font-black text-zinc-900 dark:text-white">
                {zone.dailyChargeVan}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
              <span className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase">Penalty Fine (PCN)</span>
              <span className="text-lg font-black text-red-600 dark:text-red-400">
                {zone.pcnAmount}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
              <span className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase">Operating Hours</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {zone.operatingHours.includes("24 hours") ? "24/7 All Year" : "Daytime"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col gap-10">
        {/* Embedded Interactive Map for This Specific Zone */}
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#141414] p-4 sm:p-6 shadow-xl transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {zone.name} Boundary Map
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Camera-monitored perimeter. Vehicles entering within this orange boundary are captured by ANPR.
              </p>
            </div>
            <a
              href={zone.paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
            >
              <span>Official Payment Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="h-[440px] sm:h-[480px] w-full rounded-xl overflow-hidden">
            <ZoneMapWrapper
              zones={[zone]}
              selectedZoneId={zone.id}
              initialCenter={[zone.coordinates.lat, zone.coordinates.lng]}
              initialZoom={zone.coordinates.zoom}
              singleZoneMode={true}
              height="100%"
            />
          </div>
        </div>

        {/* Embedded Compliance Checker Pre-configured for this zone */}
        <div>
          <div className="mb-3">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
              Check Vehicle Compliance for {zone.name}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              Test your registration or vehicle specifications specifically against {zone.shortName} standards.
            </p>
          </div>
          <VehicleChecker preselectedZoneSlug={zone.slug} />
        </div>

        {/* AdSense Placement */}
        <AdContainer slot={`zone-${zone.slug}-mid`} format="horizontal" />

        {/* Structured Breakdown Table (Requirement #2.C) */}
        <section className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#141414] p-5 sm:p-7 shadow-xl transition-colors">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-2">
            {zone.name} Daily Charges Breakdown by Vehicle Type
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            Detailed breakdown of charges, required Euro standards, and payment requirements.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase text-xs">
                  <th className="py-3 pr-4 font-semibold">Vehicle Category</th>
                  <th className="py-3 px-4 font-semibold">Charging Status</th>
                  <th className="py-3 px-4 font-semibold">Daily Rate</th>
                  <th className="py-3 pl-4 font-semibold">Standard & Conditions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/60">
                {zone.vehicleCharges.map((charge, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-900/30">
                    <td className="py-3 pr-4 font-bold text-zinc-900 dark:text-white">
                      {charge.vehicleType}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          charge.dailyRate.includes("BANNED")
                            ? "bg-red-500/20 text-red-600 dark:text-red-400"
                            : charge.isCharged
                            ? "bg-primary/20 text-primary"
                            : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {charge.isCharged ? "Subject to Charge" : "Exempt (£0)"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-primary">{charge.dailyRate}</td>
                    <td className="py-3 pl-4 text-zinc-500 dark:text-zinc-400">{charge.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Key Rule Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-zinc-800 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
              <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 mb-1.5">
                <Clock className="w-4 h-4 text-primary" />
                Operating Schedule
              </span>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{zone.operatingHours}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
              <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 mb-1.5">
                <AlertOctagon className="w-4 h-4 text-red-500" />
                Penalty Notice (PCN)
              </span>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {zone.pcnAmount} standard fine, reduced to {zone.pcnDiscounted} if settled within 14 days. {zone.pcnRule}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
              <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 mb-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Payment Window
              </span>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{zone.paymentWindow}</p>
            </div>
          </div>
        </section>

        {/* Exemptions Section */}
        <section className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#141414] p-5 sm:p-7 shadow-xl transition-colors">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Exemptions & Discounts for {zone.name}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-5">
            The following vehicle categories and situations qualify for an exemption or statutory discount:
          </p>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
            {zone.exemptions.map((ex, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{ex}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Zone Specific FAQs */}
        <section className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#141414] p-5 sm:p-7 shadow-xl transition-colors">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-6">
            Frequently Asked Questions: {zone.name}
          </h2>
          <div className="space-y-4">
            {zone.faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800"
              >
                <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white mb-2">
                  {faq.question}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Other UK Zones Internal Linking Matrix */}
        <section className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-sm transition-colors">
          <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-4">
            Compare with Other UK Clean Air Zones
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {allZones
              .filter((z) => z.id !== zone.id)
              .map((other) => (
                <Link
                  key={other.slug}
                  href={`/zone/${other.slug}`}
                  className="p-2.5 rounded-lg bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-primary transition-colors truncate"
                >
                  &rarr; {other.shortName}
                </Link>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
