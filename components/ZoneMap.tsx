"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { ZoneData } from "@/types/zone";
import { useTheme } from "./ThemeProvider";
import { isPointInPolygon } from "@/lib/zones";

interface ZoneMapProps {
  zones: ZoneData[];
  selectedZoneId?: string;
  onSelectZone?: (zoneId: string) => void;
  height?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  searchedLocation?: { lat: number; lng: number; label: string } | null;
  singleZoneMode?: boolean;
}

export default function ZoneMap({
  zones,
  selectedZoneId,
  onSelectZone,
  height = "100%",
  initialCenter = [53.5, -2.0], // UK center
  initialZoom = 6,
  searchedLocation,
  singleZoneMode = false,
}: ZoneMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const polygonsGroupRef = useRef<L.FeatureGroup | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const { theme } = useTheme();
  const [osmStyle, setOsmStyle] = useState<"standard" | "dark">("standard");

  // Sync OSM style with theme initially or allow override
  useEffect(() => {
    setOsmStyle(theme === "dark" ? "dark" : "standard");
  }, [theme]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: false,
    });

    // Custom OpenStreetMap attribution
    L.control
      .attribution({
        prefix:
          '<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a> | &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      })
      .addTo(map);

    mapInstanceRef.current = map;

    const polygonsGroup = L.featureGroup().addTo(map);
    polygonsGroupRef.current = polygonsGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update OpenStreetMap Tile Layer when style or theme changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    // Official OpenStreetMap Tile Server
    const osmTileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const newTileLayer = L.tileLayer(osmTileUrl, {
      subdomains: ["a", "b", "c"],
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      className: osmStyle === "dark" ? "osm-dark-tiles" : "osm-standard-tiles",
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTileLayer;
  }, [osmStyle]);

  // Render Zone Polygons
  useEffect(() => {
    if (!mapInstanceRef.current || !polygonsGroupRef.current) return;

    const group = polygonsGroupRef.current;
    group.clearLayers();

    zones.forEach((zone) => {
      const isSelected = selectedZoneId === zone.id;

      const polygon = L.polygon(zone.polygon, {
        color: "#FF6B00",
        weight: isSelected ? 4 : 2,
        opacity: isSelected ? 1 : 0.85,
        fillColor: "#FF6B00",
        fillOpacity: isSelected ? 0.35 : 0.15,
      });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 13px; min-width: 210px; padding: 4px 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: 700; font-size: 14px; color: ${theme === "dark" ? "#ffffff" : "#111111"};">
              ${zone.shortName}
            </span>
            <span style="background-color: #FF6B00; color: #ffffff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
              ${zone.region}
            </span>
          </div>
          <div style="font-size: 12px; color: ${theme === "dark" ? "#a1a1aa" : "#64748b"}; margin-bottom: 8px;">
            ${zone.typeLabel}
          </div>
          <div style="border-top: 1px solid ${theme === "dark" ? "#27272a" : "#e2e8f0"}; padding-top: 6px; margin-bottom: 8px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: ${theme === "dark" ? "#a1a1aa" : "#64748b"};">Daily Car Charge:</span>
              <strong style="color: ${zone.dailyChargeCar.includes("BANNED") ? "#ef4444" : "#FF6B00"};">${zone.dailyChargeCar}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: ${theme === "dark" ? "#a1a1aa" : "#64748b"};">Hours:</span>
              <span>${zone.operatingHours.includes("24 hours") ? "24/7" : "Daytime"}</span>
            </div>
          </div>
          <a 
            href="/zone/${zone.slug}" 
            style="display: block; text-align: center; background-color: #FF6B00; color: #ffffff; text-decoration: none; font-weight: 600; padding: 6px 10px; border-radius: 6px; font-size: 12px; transition: opacity 0.2s;"
          >
            View Full Zone Guide &rarr;
          </a>
        </div>
      `;

      polygon.bindPopup(popupHtml, {
        closeButton: true,
        autoPan: true,
      });

      polygon.on("click", () => {
        if (onSelectZone) {
          onSelectZone(zone.id);
        }
      });

      polygon.addTo(group);
    });

    // If singleZoneMode or specific selected zone, zoom to fit
    if (singleZoneMode && zones.length === 1) {
      const bounds = L.polygon(zones[0].polygon).getBounds();
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [zones, selectedZoneId, theme, singleZoneMode, onSelectZone]);

  // Pan to selected zone when selection changes from list
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedZoneId) return;
    const target = zones.find((z) => z.id === selectedZoneId);
    if (target) {
      mapInstanceRef.current.setView(
        [target.coordinates.lat, target.coordinates.lng],
        Math.max(target.coordinates.zoom, 11),
        { animate: true }
      );
    }
  }, [selectedZoneId, zones]);

  // Handle Searched Location Marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (searchMarkerRef.current) {
      mapInstanceRef.current.removeLayer(searchMarkerRef.current);
      searchMarkerRef.current = null;
    }

    if (searchedLocation) {
      const { lat, lng, label } = searchedLocation;

      // Check if inside any zone
      const insideZones = zones.filter((z) => isPointInPolygon(lat, lng, z.polygon));
      const hasZone = insideZones.length > 0;

      const customIcon = L.divIcon({
        className: "custom-search-pin",
        html: `
          <div style="position: relative; transform: translate(-50%, -100%);">
            <div style="background-color: #FF6B00; color: #ffffff; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(255, 107, 0, 0.5); border: 2px solid #ffffff;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </div>
            <div style="width: 4px; height: 4px; background: #FF6B00; border-radius: 50%; margin: 2px auto 0;"></div>
          </div>
        `,
        iconSize: [28, 34],
        iconAnchor: [14, 34],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstanceRef.current);

      const statusBadge = hasZone
        ? `<div style="margin-top: 6px; padding: 4px 8px; background: #ef444422; border: 1px solid #ef4444; color: #ef4444; border-radius: 4px; font-weight: 600; font-size: 11px;">Inside: ${insideZones.map((z) => z.shortName).join(", ")}</div>`
        : `<div style="margin-top: 6px; padding: 4px 8px; background: #22c55e22; border: 1px solid #22c55e; color: #22c55e; border-radius: 4px; font-weight: 600; font-size: 11px;">Outside all active UK charging zones</div>`;

      marker
        .bindPopup(
          `
          <div style="padding: 4px; font-size: 13px;">
            <strong>${label}</strong>
            ${statusBadge}
          </div>
        `,
          { closeButton: true }
        )
        .openPopup();

      searchMarkerRef.current = marker;

      mapInstanceRef.current.setView([lat, lng], 13, { animate: true });
    }
  }, [searchedLocation, zones]);

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {/* Floating OpenStreetMap Control Pill */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-white/95 dark:bg-[#141414]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700/80 shadow-lg text-xs font-semibold text-zinc-800 dark:text-zinc-200">
        <span className="text-primary font-bold tracking-tight">OpenStreetMap</span>
        <span className="text-zinc-400 dark:text-zinc-500">&bull;</span>
        <button
          type="button"
          onClick={() => setOsmStyle(osmStyle === "standard" ? "dark" : "standard")}
          className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
          title="Toggle OpenStreetMap Standard / Dark Cartography"
        >
          {osmStyle === "standard" ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Standard
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Dark Filter
            </span>
          )}
        </button>
      </div>

      <div
        ref={mapContainerRef}
        style={{ height, width: "100%" }}
        className="relative z-10 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800"
      />
    </div>
  );
}
