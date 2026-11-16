"use client";

import React, { useState } from "react";
import { ZoneData } from "@/types/zone";
import ZoneMapWrapper from "./ZoneMapWrapper";
import {
  Search,
  MapPin,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Clock,
  Layers,
  ListFilter,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { isPointInPolygon } from "@/lib/zones";

interface ZoneExplorerProps {
  zones: ZoneData[];
}

export default function ZoneExplorer({ zones }: ZoneExplorerProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<string>("london-ulez");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [regionFilter, setRegionFilter] = useState<"all" | "England" | "Scotland">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<{
    type: "success" | "warning" | "error";
    message: string;
  } | null>(null);
  const [searchedLocation, setSearchedLocation] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);

  // Filtered zones
  const filteredZones = zones.filter((zone) => {
    const matchesRegion = regionFilter === "all" || zone.region === regionFilter;
    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "ULEZ" && zone.type === "ULEZ") ||
      (typeFilter === "CAZ" && zone.type.startsWith("CAZ")) ||
      (typeFilter === "LEZ" && zone.type === "LEZ_SCOTLAND") ||
      (typeFilter === "CONGESTION" && zone.type === "CONGESTION") ||
      (typeFilter === "ZEZ" && zone.type === "ZEZ");

    const matchesSearch =
      searchQuery.trim() === "" ||
      zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      zone.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      zone.shortName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRegion && matchesType && matchesSearch;
  });

  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  // UK Postcode or city quick lookup
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setSearchLoading(true);
    setSearchFeedback(null);

    // 1. Check if user typed a known city name in our zones
    const matchingZone = zones.find(
      (z) =>
        z.city.toLowerCase() === query.toLowerCase() ||
        z.name.toLowerCase().includes(query.toLowerCase()) ||
        z.shortName.toLowerCase().includes(query.toLowerCase())
    );

    if (matchingZone) {
      setSelectedZoneId(matchingZone.id);
      setSearchedLocation({
        lat: matchingZone.coordinates.lat,
        lng: matchingZone.coordinates.lng,
        label: matchingZone.name,
      });
      setSearchFeedback({
        type: "success",
        message: `Centered on ${matchingZone.name}.`,
      });
      setSearchLoading(false);
      setMobileView("map");
      return;
    }

    // 2. Try looking up as UK postcode via api.postcodes.io
    try {
      const cleanPostcode = query.replace(/\s+/g, "");
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(cleanPostcode)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 200 && data.result) {
          const lat = data.result.latitude;
          const lng = data.result.longitude;
          const postcodeFormatted = data.result.postcode;

          // Check if coordinates fall inside any zone polygon
          const insideZones = zones.filter((z) => isPointInPolygon(lat, lng, z.polygon));

          setSearchedLocation({
            lat,
            lng,
            label: `Postcode: ${postcodeFormatted}`,
          });

          if (insideZones.length > 0) {
            setSelectedZoneId(insideZones[0].id);
            setSearchFeedback({
              type: "warning",
              message: `⚠️ ${postcodeFormatted} is INSIDE the ${insideZones.map((z) => z.shortName).join(" & ")} charging boundary!`,
            });
          } else {
            setSearchFeedback({
              type: "success",
              message: `✅ ${postcodeFormatted} is currently OUTSIDE UK Clean Air & ULEZ charging zones.`,
            });
          }

          setMobileView("map");
          setSearchLoading(false);
          return;
        }
      }
    } catch (err) {
      // Ignore network errors on search
    }

    // Fallback if not postcode
    setSearchFeedback({
      type: "error",
      message: `Could not find postcode "${query}". Try searching a UK city like "London", "Birmingham", or full postcode like "SW1A 1AA".`,
    });
    setSearchLoading(false);
  };

  return (
    <section id="map-section" className="w-full">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 mb-2">
            <Layers className="w-3.5 h-3.5" />
            14 Active UK Charging & Low Emission Zones
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Interactive UK Clean Air & ULEZ Map
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Explore live boundaries, daily fees, hours, and penalty rates across London, Birmingham, Bristol, Scotland, and English CAZs.
          </p>
        </div>

        {/* Mobile List / Map Tab Switcher */}
        <div className="md:hidden flex items-center bg-slate-200 dark:bg-zinc-900 p-1 rounded-lg border border-slate-300 dark:border-zinc-800">
          <button
            onClick={() => setMobileView("list")}
            className={`flex-1 py-1.5 px-4 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
              mobileView === "list"
                ? "bg-primary text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            Zone List ({filteredZones.length})
          </button>
          <button
            onClick={() => setMobileView("map")}
            className={`flex-1 py-1.5 px-4 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
              mobileView === "map"
                ? "bg-primary text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Map View
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="mb-6 p-4 rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800 shadow-md transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Postcode / City Search Form */}
          <form onSubmit={handleSearchSubmit} className="md:col-span-6 relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search UK city or postcode (e.g. SW1A 1AA, Birmingham, G1)..."
                className="w-full h-10 pl-9 pr-24 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <button
                type="submit"
                disabled={searchLoading}
                className="absolute right-1.5 top-1.5 h-7 px-3 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {searchLoading ? "Checking..." : "Lookup"}
              </button>
            </div>
          </form>

          {/* Region Filters */}
          <div className="md:col-span-3 flex items-center gap-1">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-1 hidden sm:inline">Region:</span>
            <button
              onClick={() => setRegionFilter("all")}
              className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                regionFilter === "all"
                  ? "bg-primary text-white font-semibold shadow-sm"
                  : "bg-slate-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setRegionFilter("England")}
              className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                regionFilter === "England"
                  ? "bg-primary text-white font-semibold shadow-sm"
                  : "bg-slate-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              England (10)
            </button>
            <button
              onClick={() => setRegionFilter("Scotland")}
              className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                regionFilter === "Scotland"
                  ? "bg-primary text-white font-semibold shadow-sm"
                  : "bg-slate-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Scotland (4)
            </button>
          </div>

          {/* Type Filter */}
          <div className="md:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:border-primary focus:outline-none"
            >
              <option value="all">All Zone Types (ULEZ, CAZ, LEZ, ZEZ)</option>
              <option value="ULEZ">London ULEZ</option>
              <option value="CAZ">English Clean Air Zones (Classes B, C, D)</option>
              <option value="LEZ">Scottish LEZs (Total Ban for Non-Compliant)</option>
              <option value="CONGESTION">London Congestion Charge</option>
              <option value="ZEZ">Oxford Zero Emission Zone</option>
            </select>
          </div>
        </div>

        {/* Live Search Feedback banner */}
        {searchFeedback && (
          <div
            className={`mt-3 p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
              searchFeedback.type === "warning"
                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-primary text-amber-800 dark:text-amber-300"
                : searchFeedback.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300"
                : "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-500 text-red-800 dark:text-red-300"
            }`}
          >
            {searchFeedback.type === "warning" ? (
              <AlertCircle className="w-4 h-4 text-primary flex-shrink-0" />
            ) : searchFeedback.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            )}
            <span>{searchFeedback.message}</span>
          </div>
        )}
      </div>

      {/* Split Screen Layout (Desktop: List + Map; Mobile: Switcher) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Zone List Cards */}
        <div
          className={`lg:col-span-5 flex flex-col gap-3 max-h-[720px] overflow-y-auto pr-1 ${
            mobileView === "map" ? "hidden lg:flex" : "flex"
          }`}
        >
          {filteredZones.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800 text-zinc-500 text-sm">
              No zones found matching your filter criteria.
            </div>
          ) : (
            filteredZones.map((zone) => {
              const isSelected = selectedZoneId === zone.id;
              const isBan = zone.dailyChargeCar.includes("BANNED");

              return (
                <div
                  key={zone.id}
                  onClick={() => {
                    setSelectedZoneId(zone.id);
                    setMobileView("map");
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-orange-50/70 dark:bg-zinc-900 shadow-md ring-1 ring-primary/40"
                      : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#141414] hover:border-slate-300 dark:hover:border-zinc-700 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
                          {zone.name}
                        </h3>
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {zone.city} &bull; {zone.typeLabel}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                        isBan
                          ? "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                          : "bg-primary/20 text-primary border border-primary/30"
                      }`}
                    >
                      {zone.dailyChargeCar}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                    {zone.summary}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        {zone.operatingHours.includes("24 hours") ? "24/7" : "Daytime"}
                      </span>
                      <span>Fine: {zone.pcnAmount}</span>
                    </div>

                    <Link
                      href={`/zone/${zone.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-semibold text-primary hover:text-primary-hover flex items-center gap-0.5"
                    >
                      Full Guide <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Interactive Leaflet Map & Selected Zone Details Panel */}
        <div
          className={`lg:col-span-7 flex flex-col gap-4 ${
            mobileView === "list" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Map Container */}
          <div className="h-[460px] sm:h-[500px] w-full relative">
            <ZoneMapWrapper
              zones={zones}
              selectedZoneId={selectedZoneId}
              onSelectZone={(id) => setSelectedZoneId(id)}
              searchedLocation={searchedLocation}
              height="100%"
            />
          </div>

          {/* Selected Zone Quick Summary Card */}
          {selectedZone && (
            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800 shadow-md transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-zinc-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-base text-zinc-900 dark:text-white">
                      {selectedZone.name}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {selectedZone.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{selectedZone.operatingHours}</p>
                </div>

                <Link
                  href={`/zone/${selectedZone.slug}`}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
                >
                  <span>Open {selectedZone.shortName} Guide</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3 text-center">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-900/60">
                  <span className="block text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400">Cars Daily</span>
                  <span className="font-extrabold text-sm text-primary">{selectedZone.dailyChargeCar}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-900/60">
                  <span className="block text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400">Vans Daily</span>
                  <span className="font-extrabold text-sm text-zinc-900 dark:text-white">{selectedZone.dailyChargeVan}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-900/60">
                  <span className="block text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400">Penalty (PCN)</span>
                  <span className="font-extrabold text-sm text-red-600 dark:text-red-400">{selectedZone.pcnAmount}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-900/60">
                  <span className="block text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400">Discount Fine</span>
                  <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">{selectedZone.pcnDiscounted}</span>
                </div>
              </div>

              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                <strong className="text-zinc-800 dark:text-zinc-200">Rule Summary: </strong>
                {selectedZone.pcnRule}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
