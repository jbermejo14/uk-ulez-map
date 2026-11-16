"use client";

import React, { useState, useEffect } from "react";
import { decodeUKPlate, checkVehicleCompliance, DecodedPlate, normalizeFuelType } from "@/lib/compliance";
import { ComplianceResult } from "@/types/zone";
import { DVLAVehicleResponse, VehicleLookupResult } from "@/types/dvla";
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
  Search,
  Database,
  AlertCircle,
  Check,
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
  const [regMonth, setRegMonth] = useState<number | undefined>(undefined);
  const [fuelType, setFuelType] = useState<"petrol" | "diesel" | "hybrid" | "electric">("diesel");
  const [vehicleType, setVehicleType] = useState<"car" | "van" | "motorcycle" | "hgv">("car");
  const [plateInfo, setPlateInfo] = useState<DecodedPlate | null>(null);

  // DVLA live lookup state
  const [dvlaLoading, setDvlaLoading] = useState(false);
  const [dvlaData, setDvlaData] = useState<DVLAVehicleResponse | null>(null);
  const [dvlaQueriedAt, setDvlaQueriedAt] = useState<string | null>(null);
  const [dvlaStatus, setDvlaStatus] = useState<{
    type: "success" | "info" | "warning" | "error";
    message: string;
    detail?: string;
  } | null>(null);

  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "england" | "scotland">("all");

  // Real-time plate auto-decoding (fallback pattern parser)
  useEffect(() => {
    if (!vrm.trim()) {
      setPlateInfo(null);
      setDvlaData(null);
      setDvlaQueriedAt(null);
      setDvlaStatus(null);
      return;
    }

    const decoded = decodeUKPlate(vrm);
    setPlateInfo(decoded);
    if (!dvlaData && decoded.isValid && decoded.year) {
      setRegYear(decoded.year);
    }
  }, [vrm, dvlaData]);

  // Run compliance check whenever inputs or DVLA data change
  useEffect(() => {
    const res = checkVehicleCompliance({
      vrm: vrm.trim() ? vrm.toUpperCase() : undefined,
      regYear,
      regMonth,
      fuelType,
      vehicleType,
      platePeriod: plateInfo?.period,
      dvlaData: dvlaData || undefined,
      queriedAt: dvlaQueriedAt || undefined,
    });
    setResult(res);
  }, [vrm, regYear, regMonth, fuelType, vehicleType, plateInfo, dvlaData, dvlaQueriedAt]);

  // Handler for querying DVLA VES API via server route /api/vehicle
  const handleQueryDVLA = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanVrm = vrm.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

    if (cleanVrm.length < 2) {
      setDvlaStatus({
        type: "warning",
        message: "Please enter a valid UK registration number (at least 2 characters).",
      });
      return;
    }

    setDvlaLoading(true);
    setDvlaStatus(null);

    try {
      const response = await fetch("/api/vehicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber: cleanVrm }),
      });

      const data: VehicleLookupResult = await response.json();

      if (response.ok && data.success) {
        setDvlaData(data.data);
        setDvlaQueriedAt(data.queriedAt);

        // Auto-populate form from DVLA
        if (data.data.yearOfFirstRegistration) {
          setRegYear(data.data.yearOfFirstRegistration);
        } else if (data.data.yearOfManufacture) {
          setRegYear(data.data.yearOfManufacture);
        }

        if (data.data.monthOfFirstRegistration) {
          setRegMonth(data.data.monthOfFirstRegistration);
        }

        if (data.data.fuelType) {
          setFuelType(normalizeFuelType(data.data.fuelType));
        }

        // Map typeApproval to vehicleType
        const typeApp = data.data.typeApproval?.toUpperCase() || "";
        if (typeApp.startsWith("N1")) setVehicleType("van");
        else if (typeApp.startsWith("L")) setVehicleType("motorcycle");
        else if (typeApp.startsWith("N2") || typeApp.startsWith("N3")) setVehicleType("hgv");
        else setVehicleType("car");

        const formattedDate = new Date(data.queriedAt).toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        });

        setDvlaStatus({
          type: "success",
          message: `Vehicle data: DVLA (${formattedDate})`,
          detail: `${data.data.make || ""} ${data.data.fuelType || ""} • ${
            data.data.euroStatus ? `Registered Euro standard: ${data.data.euroStatus}` : "No euroStatus on record (estimated from registration date)"
          }`,
        });
      } else {
        // Fallback to manual
        setDvlaData(null);
        setDvlaQueriedAt(null);

        const errorMsg = !data.success ? data.message : "Could not connect to the DVLA.";
        setDvlaStatus({
          type: "info",
          message: `${errorMsg} Switching to manual estimate mode.`,
        });
      }
    } catch (err) {
      setDvlaData(null);
      setDvlaQueriedAt(null);
      setDvlaStatus({
        type: "info",
        message: "Could not connect to the DVLA service. Switching to manual estimate mode.",
      });
    } finally {
      setDvlaLoading(false);
    }
  };

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
    setDvlaData(null);
    setDvlaQueriedAt(null);
    setDvlaStatus(null);
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
                UK Emissions & Low Emission Zone Checker
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                ULEZ, CAZ and LEZ Compliance Checker
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                Look up your vehicle details (via the DVLA or estimated from the number plate) to check charges and restrictions in London, Scotland and England's Clean Air Zones.
              </p>
            </div>
            {/* Quick Test Badges */}
            <div className="hidden lg:flex flex-col items-end gap-1">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Try an example:</span>
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
            <form onSubmit={handleQueryDVLA}>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
                1. UK registration number (VRM)
              </label>

              {/* Realistic UK Rear Yellow Plate */}
              <div className="relative group mb-2">
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

              {/* Action Buttons: Consult DVLA or Manual Decode */}
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={dvlaLoading || !vrm.trim()}
                  className="flex-1 h-9 px-3 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  {dvlaLoading ? (
                    <span>Checking DVLA...</span>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5" />
                      <span>Look up on DVLA (VES)</span>
                    </>
                  )}
                </button>
              </div>

              {/* DVLA Status Notification */}
              {dvlaStatus && (
                <div
                  className={`mt-2.5 p-2.5 rounded-lg text-xs border ${
                    dvlaStatus.type === "success"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300"
                      : dvlaStatus.type === "warning"
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300"
                      : "bg-slate-100 dark:bg-zinc-900 border-slate-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {dvlaStatus.type === "success" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-primary" />
                    )}
                    <span>{dvlaStatus.message}</span>
                  </div>
                  {dvlaStatus.detail && (
                    <div className="mt-1 text-[11px] opacity-90">{dvlaStatus.detail}</div>
                  )}
                </div>
              )}

              {/* Plate Decoder Fallback Info */}
              {!dvlaData && plateInfo?.isValid && plateInfo.year && (
                <div className="mt-2.5 flex items-start gap-2 p-2.5 rounded-lg bg-slate-100 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
                  <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-zinc-900 dark:text-white">Estimate from number plate: </span>
                    <span>{plateInfo.description}</span>
                    <span className="block text-[10px] text-zinc-500 mt-0.5">(Manual fallback mode; not checked with the DVLA)</span>
                  </div>
                </div>
              )}
            </form>

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
                2. Vehicle type
              </label>
              <select
                value={vehicleType}
                onChange={(e) => {
                  setVehicleType(e.target.value as any);
                  setDvlaData(null); // modified manually
                }}
                className="w-full h-11 px-3 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm font-medium focus:border-primary focus:outline-none"
              >
                <option value="car">Car / SUV (M1)</option>
                <option value="van">Van / LCV (up to 3.5t, N1)</option>
                <option value="motorcycle">Motorcycle / Moped</option>
                <option value="hgv">HGV / Lorry / Bus</option>
              </select>
            </div>

            {/* Fuel Type */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
                3. Fuel type
              </label>
              <select
                value={fuelType}
                onChange={(e) => {
                  setFuelType(e.target.value as any);
                  setDvlaData(null);
                }}
                className="w-full h-11 px-3 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm font-medium focus:border-primary focus:outline-none"
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid (petrol/diesel)</option>
                <option value="electric">Electric (100% EV)</option>
              </select>
            </div>

            {/* Registration Year */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
                4. Year of registration
              </label>
              <select
                value={regYear}
                onChange={(e) => {
                  setRegYear(parseInt(e.target.value, 10));
                  setDvlaData(null);
                }}
                className="w-full h-11 px-3 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm font-medium focus:border-primary focus:outline-none"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y} {y === 2015 ? "(Sept 2015 Euro 6)" : y === 2006 ? "(Euro 4 petrol)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Summary Specification & Certainty Bar */}
            <div className="sm:col-span-3 p-3 rounded-lg bg-slate-100/80 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <span className="font-semibold text-zinc-500 dark:text-zinc-400">Estimated Euro standard:</span>
                <span className="font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                  {result?.euroStandardEstimate}
                </span>
              </div>

              {/* Certainty Indicator Badge */}
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 text-[11px]">Confidence level:</span>
                {result?.certainty === "confirmado" ? (
                  <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Confirmed (DVLA)
                  </span>
                ) : result?.certainty === "probable" ? (
                  <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Likely (estimate)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-zinc-500/20 text-zinc-700 dark:text-zinc-400 border border-zinc-500/30 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" /> Unknown
                  </span>
                )}
              </div>
            </div>

            {/* Reason explanation */}
            {result?.certaintyReason && (
              <div className="sm:col-span-3 text-[11px] text-zinc-500 dark:text-zinc-400 px-1">
                {result.certaintyReason}
              </div>
            )}
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
                      <span>Charges or restrictions may apply in some UK zones</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-500">
                        Estimated to comply in all low emission zones
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {result.dataSource === "dvla" ? (
                      <span>Vehicle data: DVLA ({new Date(result.queriedAt!).toLocaleDateString("en-GB")})</span>
                    ) : (
                      <span>Estimate based on year {regYear} and fuel type {fuelType.toUpperCase()} (not checked with the DVLA)</span>
                    )}
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
                    All ({result.zonesStatus.length})
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
                    Scottish LEZs
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MANDATORY LEGAL DISCLAIMER NOTICE (Requirement #6) */}
        <div className="px-5 sm:px-6 py-3 bg-amber-50/80 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Important legal notice:</strong> The result of this checker is indicative only. Local exemptions (Blue Badge, residents' discounts, historic vehicles or approved technical adaptations) are not checked by this tool. The final and binding decision rests solely with Transport for London (TfL) or the council that operates each zone. Always check with the relevant official checker before you travel.
          </div>
        </div>

        {/* Detailed Zone-by-Zone Results Grid */}
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredZones?.map((z) => {
            const isBan = z.charge.includes("BANNED");
            const needsOfficialVerification = z.certainty !== "confirmado";

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

                  {/* Certainty Tag & Warning for Non-Confirmed */}
                  <div className="mb-3 flex items-center gap-1.5 text-[11px]">
                    <span className="text-zinc-400">Confidence:</span>
                    {z.certainty === "confirmado" ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Confirmed with DVLA
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {z.certainty === "probable" ? "Likely (estimated)" : "Unknown"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-200 dark:border-zinc-800/60 flex flex-col gap-2 text-xs">
                  {/* Link to official operator checker when certainty is not confirmed */}
                  {needsOfficialVerification && (
                    <a
                      href={z.officialCheckerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-1.5 px-2.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-semibold flex items-center justify-between transition-colors"
                      title={`Check on the official portal for ${z.zoneName}`}
                    >
                      <span>Check with {z.officialCheckerName}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <div className="flex items-center justify-between text-zinc-500">
                    <span className="truncate">{z.statusText}</span>
                    <Link
                      href={`/zone/${z.slug}`}
                      className="text-primary hover:text-primary-hover font-semibold inline-flex items-center gap-1 flex-shrink-0"
                    >
                      Guide <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* HIGH-CONVERTING AFFILIATE / LEAD ACTION CARD */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-zinc-900 dark:via-[#181818] dark:to-zinc-900 border-t border-slate-200 dark:border-zinc-800">
          <div className="rounded-xl border-2 border-primary/80 bg-white dark:bg-zinc-950 p-5 shadow-lg relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary text-white mb-2">
                  <TrendingUp className="w-3 h-3" />
                  Vehicle History Check & Valuation
                </div>
                <h4 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                  {hasAnyChargeable
                    ? "Vehicle facing charges or restrictions in low emission zones?"
                    : "Check the exact Euro standard and full history of the vehicle"}
                </h4>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Avoid £180 ULEZ penalty charges and automatic £60 penalties in Scotland. Check the emissions details on your V5C logbook or request a free valuation to switch to a fully compliant vehicle.
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
                  <span>Vehicle History (HPI)</span>
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
