import React from "react";
import Link from "next/link";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { allZones } from "@/lib/zones";

export default function Footer() {
  const englandZones = allZones.filter((z) => z.region === "England");
  const scotlandZones = allZones.filter((z) => z.region === "Scotland");

  return (
    <footer className="mt-20 border-t border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-white">
                UK<span className="text-primary">CleanZone</span>
              </span>
            </Link>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-xs">
              The premier UK ULEZ, Clean Air Zone, and Scottish Low Emission Zone vehicle compliance lookup tool and interactive map guide (updated for 2026).
            </p>
            <div className="mt-4 p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
              <span className="text-[11px] font-semibold text-primary block mb-0.5">Official Portals</span>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Data synced with Transport for London (TfL), Gov.uk CAZ central service, and Transport Scotland.
              </p>
            </div>
          </div>

          {/* English Clean Air Zones & ULEZ */}
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-white mb-3 text-xs uppercase tracking-wider">
              England Zones
            </h4>
            <ul className="space-y-1.5">
              {englandZones.map((z) => (
                <li key={z.slug}>
                  <Link
                    href={`/zone/${z.slug}`}
                    className="hover:text-primary transition-colors block text-zinc-600 dark:text-zinc-400"
                  >
                    {z.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Scottish LEZs */}
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-white mb-3 text-xs uppercase tracking-wider">
              Scotland LEZs (Bans)
            </h4>
            <ul className="space-y-1.5">
              {scotlandZones.map((z) => (
                <li key={z.slug}>
                  <Link
                    href={`/zone/${z.slug}`}
                    className="hover:text-primary transition-colors block text-zinc-600 dark:text-zinc-400"
                  >
                    {z.name}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="font-bold text-zinc-900 dark:text-white mt-6 mb-3 text-xs uppercase tracking-wider">
              Key Standards
            </h4>
            <ul className="space-y-1 text-zinc-600 dark:text-zinc-400 text-[11px]">
              <li>&bull; Petrol: Euro 4 (generally 2006+)</li>
              <li>&bull; Diesel: Euro 6 (Sept 2015 / '65' plate+)</li>
              <li>&bull; Electric (EV): 100% compliant</li>
              <li>&bull; Motorbike: Euro 3 (July 2007+)</li>
            </ul>
          </div>

          {/* Useful Official Links & Monetization Affiliates */}
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-white mb-3 text-xs uppercase tracking-wider">
              Official Portals
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://tfl.gov.uk/modes/driving/ultra-low-emission-zone"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary flex items-center gap-1 text-zinc-600 dark:text-zinc-400"
                >
                  <span>TfL Official ULEZ Service</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.gov.uk/clean-air-zones"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary flex items-center gap-1 text-zinc-600 dark:text-zinc-400"
                >
                  <span>Gov.uk Central Clean Air Zones</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.lowemissionzones.scot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary flex items-center gap-1 text-zinc-600 dark:text-zinc-400"
                >
                  <span>Transport Scotland LEZ Portal</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.gov.uk/get-vehicle-information-from-dvla"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary flex items-center gap-1 text-zinc-600 dark:text-zinc-400"
                >
                  <span>DVLA Vehicle Enquiry Service</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
              </li>
            </ul>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-500 block mb-1">Affiliate Disclosure:</span>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal">
                UKCleanZone participates in car valuation and vehicle history affiliate programmes. We may earn a commission when you click external partner links.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-zinc-500">
            &copy; {new Date().getFullYear()} UKCleanZone. Independent utility and guide. Not officially endorsed by TfL or UK local authorities.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-zinc-500">
            <span>Privacy Policy</span>
            <span>&bull;</span>
            <span>Terms of Use</span>
            <span>&bull;</span>
            <span>Cookie Settings</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
