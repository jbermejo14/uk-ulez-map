"use client";

import dynamic from "next/dynamic";
import React from "react";
import { ZoneData } from "@/types/zone";

const ZoneMapComponent = dynamic(() => import("./ZoneMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] flex flex-col items-center justify-center bg-slate-100 dark:bg-zinc-900/60 rounded-lg border border-slate-200 dark:border-zinc-800">
      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Loading UK Clean Air Map & Boundaries...</p>
    </div>
  ),
});

interface ZoneMapWrapperProps {
  zones: ZoneData[];
  selectedZoneId?: string;
  onSelectZone?: (zoneId: string) => void;
  height?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  searchedLocation?: { lat: number; lng: number; label: string } | null;
  singleZoneMode?: boolean;
}

export default function ZoneMapWrapper(props: ZoneMapWrapperProps) {
  return <ZoneMapComponent {...props} />;
}
