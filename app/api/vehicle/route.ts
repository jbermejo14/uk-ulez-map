import { NextRequest, NextResponse } from "next/server";
import { DVLAVehicleResponse, VehicleLookupResult } from "@/types/dvla";
import { normalizeVRM } from "@/lib/compliance";

// In-memory 24-hour cache: Map<VRM, { data: DVLAVehicleResponse; queriedAt: string; timestamp: number }>
const cache = new Map<string, { data: DVLAVehicleResponse; queriedAt: string; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory IP rate limiter: Map<IP, { count: number; resetAt: number }>
const ipLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 requests
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // per 1 minute

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipLimiter.get(ip);

  if (!entry || now > entry.resetAt) {
    ipLimiter.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  entry.count += 1;
  return true;
}

// Clean old entries periodically (every 10 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    cache.forEach((v, k) => {
      if (now - v.timestamp > CACHE_TTL_MS) cache.delete(k);
    });
    ipLimiter.forEach((v, ip) => {
      if (now > v.resetAt) ipLimiter.delete(ip);
    });
  }, 10 * 60 * 1000).unref?.();
}

// VRM normalization is imported from @/lib/compliance

export async function POST(req: NextRequest) {
  const apiKey = process.env.DVLA_VES_API_KEY?.trim();

  // If DVLA API key is missing, clearly respond so UI falls back to manual mode gracefully
  if (!apiKey) {
    const res: VehicleLookupResult = {
      success: false,
      source: "system",
      errorCode: "KEY_MISSING",
      message: "DVLA VES API key is not configured on server. Manual entry estimation is active.",
      fallbackToManual: true,
    };
    return NextResponse.json(res, { status: 503 });
  }

  // Rate Limiting per client IP
  const clientIp = getClientIp(req);
  if (!checkRateLimit(clientIp)) {
    const res: VehicleLookupResult = {
      success: false,
      source: "system",
      errorCode: "RATE_LIMITED",
      message: "Too many vehicle lookups from your network. Please wait a minute before trying again.",
      fallbackToManual: true,
    };
    return NextResponse.json(res, { status: 429 });
  }

  // Parse Request Body
  let body: any;
  try {
    body = await req.json();
  } catch {
    const res: VehicleLookupResult = {
      success: false,
      source: "system",
      errorCode: "INVALID_VRM",
      message: "Invalid request payload. Please supply a registrationNumber.",
      fallbackToManual: true,
    };
    return NextResponse.json(res, { status: 400 });
  }

  const vrm = normalizeVRM(body?.registrationNumber);
  if (!vrm) {
    const res: VehicleLookupResult = {
      success: false,
      source: "system",
      errorCode: "INVALID_VRM",
      message: "Invalid UK registration number format. Valid format is 2 to 8 alphanumeric characters (e.g. AB15 CDE).",
      fallbackToManual: true,
    };
    return NextResponse.json(res, { status: 400 });
  }

  // Check 24-hour Server Cache
  const cached = cache.get(vrm);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    const res: VehicleLookupResult = {
      success: true,
      source: "dvla",
      queriedAt: cached.queriedAt,
      data: cached.data,
      cached: true,
    };
    return NextResponse.json(res, { status: 200 });
  }

  // Call Official DVLA Vehicle Enquiry Service (VES) API
  // Production URL according to v1.2.0 spec
  const dvlaEndpoint = "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles";

  try {
    const dvlaRes = await fetch(dvlaEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ registrationNumber: vrm }),
      cache: "no-store",
    });

    if (dvlaRes.status === 200) {
      const data: DVLAVehicleResponse = await dvlaRes.json();
      const queriedAt = new Date().toISOString();

      // Store in 24h cache
      cache.set(vrm, { data, queriedAt, timestamp: now });

      const res: VehicleLookupResult = {
        success: true,
        source: "dvla",
        queriedAt,
        data,
        cached: false,
      };
      return NextResponse.json(res, { status: 200 });
    }

    if (dvlaRes.status === 404) {
      const res: VehicleLookupResult = {
        success: false,
        source: "dvla",
        errorCode: "NOT_FOUND",
        message: "Registration not found in the DVLA database. Please verify the number plate or use manual details.",
        fallbackToManual: true,
      };
      return NextResponse.json(res, { status: 404 });
    }

    if (dvlaRes.status === 400) {
      const errorJson = await dvlaRes.json().catch(() => null);
      const detail = errorJson?.errors?.[0]?.detail || "The DVLA rejected this registration format.";
      const res: VehicleLookupResult = {
        success: false,
        source: "dvla",
        errorCode: "INVALID_VRM",
        message: "Invalid registration plate format according to the DVLA.",
        detail,
        fallbackToManual: true,
      };
      return NextResponse.json(res, { status: 400 });
    }

    if (dvlaRes.status === 429) {
      const res: VehicleLookupResult = {
        success: false,
        source: "dvla",
        errorCode: "RATE_LIMITED",
        message: "DVLA API quota limit reached. Falling back to manual estimation mode.",
        fallbackToManual: true,
      };
      return NextResponse.json(res, { status: 429 });
    }

    // 500, 503 or other DVLA errors
    const res: VehicleLookupResult = {
      success: false,
      source: "dvla",
      errorCode: "DVLA_UNAVAILABLE",
      message: `The DVLA service returned status ${dvlaRes.status}. Falling back to manual estimation mode.`,
      fallbackToManual: true,
    };
    return NextResponse.json(res, { status: 502 });
  } catch (err) {
    const res: VehicleLookupResult = {
      success: false,
      source: "system",
      errorCode: "NETWORK_ERROR",
      message: "Could not connect to the DVLA Vehicle Enquiry Service. Falling back to manual check.",
      fallbackToManual: true,
    };
    return NextResponse.json(res, { status: 504 });
  }
}
