"use client";

import React, { useState, useEffect } from "react";
import { decodeUKPlate, checkVehicleCompliance, DecodedPlate } from "@/lib/compliance";
import { ComplianceResult } from "@/types/zone";
import {
  Car,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Info,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import AdContainer from "./AdContainer";

interface VehicleCheckerProps {
  preselectedZoneSlug?: string;
  className?: string;
}

export default function VehicleChecker({ preselectedZoneSlug, className = "" }: VehicleCheckerProps) {
  const [vrm, setVrm] = useState("");
  const [regYear, setRegYear] = useState<number>(2017);
  const [fuelType, setFuelType] = useState<"petrol" | "diesel" | "hybrid" | "electric">("diesel");
  const [vehicleType, setVehicleType] = useState<"car" | "van" | "motorcycle" | "hgv">("car");
  const [plateInfo, setPlateInfo] = useState<DecodedPlate | null>(null);
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "england" | "scotland">("all");

  // Real-time plate auto-decoding
  useEffect(() => {
    if (!vrm.trim()) {
      setPlateInfo(null);
      return;
    }

    const decoded = decodeUKPlate(vrm);
    if (decoded.isValid && decoded.year) {
      setPlateInfo(decoded);
      setRegYear(decoded.year);
    } else {
      setPlateInfo(decoded);
    }
  }, [vrm]);

  // Run compliance check whenever inputs change
  useEffect(() => {
    const res = checkVehicleCompliance({
      vrm: vrm.trim() ? vrm.toUpperCase() : undefined,
      regYear,
      fuelType,
      vehicleType,
      platePeriod: plateInfo?.period,
    });
    setResult(res);
  }, [vrm, regYear, fuelType, vehicleType, plateInfo]);

  // Year options list from 1995 to 2026
  const currentYear = 2026;
  const years = Array.from({ length: currentYear - 1995 + 1 }, (_, i) => currentYear - i);

  // Quick preset test plates
  const presetExamples = [
    { label: "Euro 6 Diesel ('65)", reg: "EO65 ABC", fuel: "diesel" as const, year: 2015 },
    { label: "Euro 5 Diesel ('14)", reg: "YK64 XYZ", fuel: "diesel" as const, year: 2014 },
    { label: "Euro 4 Petrol ('07)", reg: "AB07 CDE", fuel: "petrol" as const, year: 2007 },
    { label: "Pre-Euro Petrol ('03)", reg: "LD03 WXY", fuel: "petrol" as const, year: 2003 },
    { label: "Modern EV ('24)", reg: "EV74 GRN", fuel: "electric" as const, year: 2024 },
  ];

  const handleApplyPreset = (ex: typeof presetExamples[0]) => {
    setVrm(ex.reg);
    setFuelType(ex.fuel);
    setRegYear(ex.year);
  };

  const filteredZones = result?.zonesStatus.filter((z) => {
    if (preselectedZoneSlug) return z.slug === preselectedZoneSlug;
    if (activeTab === "england") return !z.zoneName.includes("LEZ") || z.zoneName.includes("London");
    if (activeTab === "scotland") return z.zoneName.includes("LEZ") && !z.zoneName.includes("London");
    return true;
  });

  const hasAnyChargeable = result?.zonesStatus.some((z) => !z.isCompliant);

  return (
    <div id="checker" className={`w-full ${className}`}>
      <div className="bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-zinc-800 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-zinc-900 dark:via-[#141414] dark:to-zinc-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                DVLA Euro Emission Rules (2026 Ready)
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                Instant UK Vehicle Compliance Checker
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                Enter your registration or select vehicle specs to test London ULEZ, Scottish LEZs, and all 14 UK Clean Air Zones.
              </p>
            </div>
            {/* Quick Test Badges */}
            <div className="hidden lg:flex flex-col items-end gap-1">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Quick Test Plates:</span>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {presetExamples.slice(0, 3).map((ex) => (
                  <button
                    key={ex.reg}
                    onClick={() => handleApplyPreset(ex)}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-primary hover:border-primary border border-slate-300 dark:border-zinc-700 font-mono transition-colors"
                  >
                    {ex.reg}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Checker Inputs Form */}
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Registration Plate Input (UK Yellow Plate Visual) */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
                1. UK Registration Number (VRM)
              </label>

              {/* Realistic UK Rear Yellow Plate */}
              <div className="relative group">
                <div className="flex items-center h-14 w-full rounded-md bg-[#FFD200] border-2 border-black/80 shadow-md p-1.5 focus-within:ring-2 focus-within:ring-primary">
                  {/* Left GB / UK Blue Band */}
                  <div className="h-full w-9 rounded-sm bg-[#003399] flex flex-col items-center justify-between py-1 text-white select-none mr-2 flex-shrink-0">
                    <span className="text-[9px] font-bold">GB</span>
                    <div className="w-2.5 h-2.5 rounded-full border border-yellow-300 flex items-center justify-center text-[7px] font-bold text-yellow-300">
                      ★
                    </div>
                    <span className="text-[8px] font-semibold">UK</span>
                  </div>

                  {/* Input field */}
                  <input
                    type="text"
                    value={vrm}
                    onChange={(e) => setVrm(e.target.value.toUpperCase())}
                    placeholder="e.g. AB15 CDE"
                    maxLength={8}
                    className="w-full h-full bg-transparent text-black text-2xl font-black tracking-widest text-center uppercase focus:outline-none placeholder:text-black/35 font-mono"
                  />
                </div>
              </div>

              {/* Plate Decoder Feedback */}
              {plateInfo?.isValid && plateInfo.year ? (
                <div className="mt-2.5 flex items-start gap-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs">
                  <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-primary">Plate Decoded: </span>
                    <span className="text-zinc-800 dark:text-zinc-300 font-medium">
                      {plateInfo.description}
                    </span>
                  </div>
                </div>
              ) : vrm.trim().length >= 2 ? (
                <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Tip: Modern UK plates (e.g. <span className="text-primary font-mono font-bold">65</span> = Sept 2015, <span className="text-primary font-mono font-bold">19</span> = early 2019) auto-detect the registration year.
                </p>
              ) : null}
            </div>

            {/* Quick preset mobile buttons */}
            <div className="mt-3 lg:hidden flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Try:</span>
              {presetExamples.map((ex) => (
                <button
                  key={ex.reg}
                  onClick={() => handleApplyPreset(ex)}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-primary font-mono border border-slate-300 dark:border-zinc-700"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Type, Fuel & Manual Year Selectors */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Vehicle Type */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
                2. Vehicle Type
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as any)}
                className="w-full h-11 px-3 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm font-medium focus:border-primary focus:outline-none"
              >
                <option value="car">Car / SUV / Estate</option>
                <option value="van">Van / LCV (up to 3.5t)</option>
                <option value="motorcycle">Motorcycle / Moped</option>
                <option value="hgv">HGV / Bus / Coach</option>
              </select>
            </div>

            {/* Fuel Type */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
                3. Fuel Type
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as any)}
                className="w-full h-11 px-3 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm font-medium focus:border-primary focus:outline-none"
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid (Petrol/Diesel)</option>
                <option value="electric">Electric (EV - 100% Free)</option>
              </select>
            </div>

            {/* Registration Year */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
                4. Reg Year
              </label>
              <select
                value={regYear}
                onChange={(e) => setRegYear(parseInt(e.target.value, 10))}
                className="w-full h-11 px-3 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm font-medium focus:border-primary focus:outline-none"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y} {y === 2015 ? "(Euro 6 boundary)" : y === 2006 ? "(Euro 4 boundary)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Summary specification badge */}
            <div className="sm:col-span-3 p-3 rounded-lg bg-slate-100/80 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <span className="font-semibold text-zinc-500 dark:text-zinc-400">Estimated Rating:</span>
                <span className="font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                  {result?.euroStandardEstimate}
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {fuelType === "diesel"
                  ? "Diesels must be Euro 6 (Sept 2015+)."
                  : fuelType === "petrol"
                  ? "Petrols must be Euro 4 (2006+)."
                  : "Zero-emissions qualify for exemptions."}
              </span>
            </div>
          </div>
        </div>

        {/* Results Banner Summary */}
        {result && (
          <div className="px-5 sm:px-6 py-4 bg-slate-50 dark:bg-zinc-900 border-t border-b border-slate-200 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    hasAnyChargeable
                      ? "bg-amber-500/20 text-primary border border-primary/30"
                      : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {hasAnyChargeable ? (
                    <AlertTriangle className="w-5 h-5 text-primary" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                    {hasAnyChargeable ? (
                      <span>
                        Subject to Charges or Restrictions in Some UK Zones
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-500">
                        100% Compliant Across All UK Clean Air Zones & ULEZ
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Based on DVLA standards for a {regYear} {fuelType.toUpperCase()} {vehicleType.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Filter tabs */}
              {!preselectedZoneSlug && (
                <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-zinc-950 p-1 rounded-lg border border-slate-300 dark:border-zinc-800 self-start sm:self-auto text-xs">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      activeTab === "all"
                        ? "bg-primary text-white shadow-sm"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    All UK ({result.zonesStatus.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("england")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      activeTab === "england"
                        ? "bg-primary text-white shadow-sm"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    England
                  </button>
                  <button
                    onClick={() => setActiveTab("scotland")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      activeTab === "scotland"
                        ? "bg-primary text-white shadow-sm"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    Scotland LEZs
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detailed Zone-by-Zone Results Grid */}
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredZones?.map((z) => {
            const isBan = z.charge.includes("BANNED");

            return (
              <div
                key={z.zoneId}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isBan
                    ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40"
                    : !z.isCompliant
                    ? "bg-orange-50/70 dark:bg-amber-950/20 border-orange-200 dark:border-primary/40"
                    : "bg-slate-50/60 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                        {z.zoneName}
                      </h4>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{z.city}</span>
                    </div>
                    {/* Status Pill */}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                        isBan
                          ? "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                          : !z.isCompliant
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {z.charge}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                    {z.details}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-zinc-800/60 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-medium">Status: {z.statusText}</span>
                  <Link
                    href={`/zone/${z.slug}`}
                    className="text-primary hover:text-primary-hover font-semibold inline-flex items-center gap-1"
                  >
                    Details <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* HIGH-CONVERTING AFFILIATE / LEAD ACTION CARD (Requirement #3) */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-zinc-900 dark:via-[#181818] dark:to-zinc-900 border-t border-slate-200 dark:border-zinc-800">
          <div className="rounded-xl border-2 border-primary/80 bg-white dark:bg-zinc-950 p-5 shadow-lg relative overflow-hidden">
            {/* Ambient orange glow */}
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary text-white mb-2">
                  <TrendingUp className="w-3 h-3" />
                  Vehicle Upgrade & History Protection
                </div>
                <h4 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                  {hasAnyChargeable
                    ? "Driving a non-compliant car in UK clean air zones?"
                    : "Check your vehicle's exact Euro emission standard & logbook specs"}
                </h4>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Avoid £180 ULEZ fines and £60 Scottish LEZ penalties. Verify your exact Euro NOx rating on the DVLA database, or get an instant valuation to sell or upgrade to a 100% compliant car.
                </p>
              </div>

              {/* Dual CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto flex-shrink-0">
                <a
                  href="https://www.carvertical.com"
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white border border-slate-300 dark:border-zinc-700 flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <span>Check Vehicle History (HPI)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                </a>

                <a
                  href="https://www.motorway.co.uk"
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/25 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Value My Car &rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* CLS-safe AdSense Container */}
        <div className="px-5 pb-5">
          <AdContainer slot="checker-bottom" format="horizontal" />
        </div>
      </div>
    </div>
  );
}
