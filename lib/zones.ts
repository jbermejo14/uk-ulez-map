import { ZoneData } from "@/types/zone";
import zonesRaw from "@/data/zones.json";

export const allZones: ZoneData[] = zonesRaw as ZoneData[];

export function getZoneBySlug(slug: string): ZoneData | undefined {
  return allZones.find((z) => z.slug.toLowerCase() === slug.toLowerCase());
}

export function getAllZoneSlugs(): string[] {
  return allZones.map((z) => z.slug);
}

export function getZonesByRegion(region: "England" | "Scotland"): ZoneData[] {
  return allZones.filter((z) => z.region === region);
}

/**
 * Basic point-in-polygon ray casting algorithm to check if a lat/lng is inside a zone's boundary.
 */
export function isPointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function findZonesForLocation(lat: number, lng: number): ZoneData[] {
  return allZones.filter((z) => isPointInPolygon(lat, lng, z.polygon));
}
