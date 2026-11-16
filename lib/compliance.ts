import { ComplianceResult, CertaintyLevel, ZoneStatusResult } from "@/types/zone";
import { DVLAVehicleResponse } from "@/types/dvla";

export interface DecodedPlate {
  isValid: boolean;
  rawPlate: string;
  formattedPlate: string;
  year?: number;
  period?: "early" | "late";
  description?: string;
}

/**
 * Validates and normalizes UK vehicle registration number (VRM).
 */
export function normalizeVRM(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;
  const clean = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length < 2 || clean.length > 8) return null;
  return clean;
}

/**
 * Decodes a UK Registration plate string into an estimated year and registration period.
 * Fallback only when DVLA API is not available or unconfigured.
 */
export function decodeUKPlate(plate: string): DecodedPlate {
  const clean = plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (!clean || clean.length < 2 || clean.length > 8) {
    return { isValid: false, rawPlate: plate, formattedPlate: clean };
  }

  // Modern UK format: 2 letters, 2 digits, 3 letters (e.g., AB15CDE, EO65ABC)
  const modernRegex = /^([A-Z]{2})([0-9]{2})([A-Z]{3})$/;
  const modernMatch = clean.match(modernRegex);

  if (modernMatch) {
    const ageDigits = parseInt(modernMatch[2], 10);
    const prefix = modernMatch[1];
    const suffix = modernMatch[3];
    const formatted = `${prefix}${modernMatch[2]} ${suffix}`;

    if (ageDigits >= 51 && ageDigits <= 99) {
      const year = 2000 + (ageDigits - 50);
      return {
        isValid: true,
        rawPlate: plate,
        formattedPlate: formatted,
        year,
        period: "late",
        description: `Plate age identifier: Late ${year} (Sept ${year} – Feb ${year + 1}) [${ageDigits} Plate]`,
      };
    } else if (ageDigits >= 2 && ageDigits <= 49) {
      const year = 2000 + ageDigits;
      return {
        isValid: true,
        rawPlate: plate,
        formattedPlate: formatted,
        year,
        period: "early",
        description: `Plate age identifier: Early ${year} (Mar ${year} – Aug ${year}) [${ageDigits < 10 ? "0" + ageDigits : ageDigits} Plate]`,
      };
    }
  }

  // Prefix format (1983 - Aug 2001): e.g. A123 BCD, Y123 ABC
  const prefixRegex = /^([A-Y])([0-9]{1,3})([A-Z]{3})$/;
  const prefixMatch = clean.match(prefixRegex);
  if (prefixMatch) {
    const letter = prefixMatch[1];
    const prefixYears: Record<string, number> = {
      A: 1983, B: 1984, C: 1985, D: 1986, E: 1987, F: 1988, G: 1989,
      H: 1990, J: 1991, K: 1992, L: 1993, M: 1994, N: 1995, P: 1996,
      R: 1997, S: 1998, T: 1999, V: 1999, W: 2000, X: 2000, Y: 2001,
    };
    if (prefixYears[letter]) {
      return {
        isValid: true,
        rawPlate: plate,
        formattedPlate: `${letter}${prefixMatch[2]} ${prefixMatch[3]}`,
        year: prefixYears[letter],
        period: "early",
        description: `Prefix style plate: estimated ${prefixYears[letter]} registration`,
      };
    }
  }

  return {
    isValid: false,
    rawPlate: plate,
    formattedPlate: clean,
  };
}

export interface CheckOptions {
  vrm?: string;
  regYear: number;
  regMonth?: number; // 1 = Jan, 12 = Dec
  fuelType: "petrol" | "diesel" | "hybrid" | "electric";
  vehicleType: "car" | "van" | "motorcycle" | "hgv";
  platePeriod?: "early" | "late";
  dvlaData?: DVLAVehicleResponse;
  queriedAt?: string;
}

/**
 * Normalizes fuel type strings from DVLA or manual selection.
 */
export function normalizeFuelType(fuel?: string): "petrol" | "diesel" | "hybrid" | "electric" {
  if (!fuel) return "petrol";
  const upper = fuel.toUpperCase();
  if (upper.includes("ELECTRIC") && !upper.includes("HYBRID")) return "electric";
  if (upper.includes("HYBRID")) return "hybrid";
  if (upper.includes("DIESEL")) return "diesel";
  return "petrol";
}

/**
 * Parses DVLA Euro Status (e.g. "Euro 6", "Euro 4", "EURO 6d", "Euro VI").
 */
export function parseEuroStatusNumber(status?: string): number | null {
  if (!status) return null;
  const clean = status.trim().toUpperCase();

  // Match Roman numerals for HGVs/buses (Euro VI, V, IV, etc.)
  if (clean.includes("VI") || clean.includes("6")) return 6;
  if (clean.includes("IV") || clean.includes("4")) return 4;
  if (clean.includes("V") || clean.includes("5")) return 5;
  if (clean.includes("III") || clean.includes("3")) return 3;
  if (clean.includes("II") || clean.includes("2")) return 2;
  if (clean.includes("I") || clean.includes("1")) return 1;

  const match = clean.match(/EURO\s*([0-9])/);
  if (match) return parseInt(match[1], 10);
  return null;
}

/**
 * Evaluates vehicle compliance across all UK Low Emission and Clean Air Zones
 * with explicit certainty attribution: "confirmado" | "probable" | "desconocido".
 */
export function checkVehicleCompliance(opts: CheckOptions): ComplianceResult {
  const { vrm, regYear, regMonth, fuelType, vehicleType, platePeriod, dvlaData, queriedAt } = opts;
  const isFromDVLA = Boolean(dvlaData);
  const isElectric: boolean = fuelType === "electric" || Boolean(dvlaData?.fuelType?.toUpperCase().includes("ELECTRIC") && !dvlaData?.fuelType?.toUpperCase().includes("HYBRID"));

  // Check if DVLA provided an official euroStatus
  const dvlaEuroRaw = dvlaData?.euroStatus?.trim();
  const dvlaEuroNum = parseEuroStatusNumber(dvlaEuroRaw);

  // Overall certainty calculation
  let overallCertainty: CertaintyLevel = "probable";
  let certaintyReason = "";
  let euroStandardEstimate = "Euro 6";

  if (isElectric) {
    if (isFromDVLA) {
      overallCertainty = "confirmado";
      certaintyReason = "Vehicle is confirmed 100% Zero Emission (Electric) on the DVLA register.";
    } else {
      overallCertainty = "probable";
      certaintyReason = "Manual input indicates Electric (EV). Verify on the official portal to ensure register discount.";
    }
    euroStandardEstimate = "Zero Emission (EV)";
  } else if (isFromDVLA && dvlaEuroNum !== null) {
    overallCertainty = "confirmado";
    certaintyReason = `DVLA record explicitly specifies ${dvlaEuroRaw}. Zone emission criteria applied directly.`;
    euroStandardEstimate = dvlaEuroRaw || `Euro ${dvlaEuroNum}`;
  } else if (isFromDVLA) {
    overallCertainty = "probable";
    certaintyReason = "DVLA record has no euroStatus on file (common limitation). Estimated from DVLA first registration date.";
    // Deducing from DVLA year and month
    if (fuelType === "diesel") {
      const month = regMonth ?? 6;
      if (regYear > 2015 || (regYear === 2015 && month >= 9)) {
        euroStandardEstimate = "Euro 6 (Estimated from DVLA registration date)";
      } else {
        euroStandardEstimate = "Euro 5 or older (Estimated from DVLA registration date)";
      }
    } else {
      if (regYear >= 2006) euroStandardEstimate = "Euro 4+ (Estimated from DVLA registration date)";
      else euroStandardEstimate = "Euro 3 or older (Estimated from DVLA registration date)";
    }
  } else {
    // Manual check without DVLA
    overallCertainty = "probable";
    certaintyReason = "Estimated from manual registration year / number plate pattern. Not verified with DVLA.";
    if (fuelType === "diesel") {
      if (regYear > 2015 || (regYear === 2015 && platePeriod === "late")) {
        euroStandardEstimate = "Euro 6 (Estimated from plate)";
      } else {
        euroStandardEstimate = "Euro 5 or older (Estimated from plate)";
      }
    } else {
      if (regYear >= 2006) euroStandardEstimate = "Euro 4+ (Estimated from plate)";
      else euroStandardEstimate = "Euro 3 or older (Estimated from plate)";
    }
  }

  // Core ULEZ / CAZ D standard:
  // Petrol: Euro 4+
  // Diesel: Euro 6+
  let isStandardUlezCompliant = false;

  if (isElectric) {
    isStandardUlezCompliant = true;
  } else if (dvlaEuroNum !== null) {
    // Official Euro Status check
    if (fuelType === "petrol" || fuelType === "hybrid") {
      isStandardUlezCompliant = dvlaEuroNum >= 4;
    } else if (fuelType === "diesel") {
      isStandardUlezCompliant = dvlaEuroNum >= 6;
    } else if (vehicleType === "motorcycle") {
      isStandardUlezCompliant = dvlaEuroNum >= 3;
    } else if (vehicleType === "hgv") {
      isStandardUlezCompliant = dvlaEuroNum >= 6;
    }
  } else {
    // Fallback estimation using registration date
    if (vehicleType === "motorcycle") {
      isStandardUlezCompliant = regYear >= 2007;
    } else if (vehicleType === "hgv") {
      isStandardUlezCompliant = regYear >= 2014;
    } else if (fuelType === "petrol" || fuelType === "hybrid") {
      isStandardUlezCompliant = regYear >= 2006;
    } else if (fuelType === "diesel") {
      if (regYear > 2015) {
        isStandardUlezCompliant = true;
      } else if (regYear === 2015) {
        const month = regMonth ?? (platePeriod === "late" ? 9 : 3);
        isStandardUlezCompliant = month >= 9;
      } else {
        isStandardUlezCompliant = false;
      }
    }
  }

  // Official checker URLs
  const TFL_CHECKER = "https://tfl.gov.uk/modes/driving/check-your-vehicle/";
  const GOVUK_CAZ_CHECKER = "https://www.gov.uk/clean-air-zones";
  const SCOTLAND_LEZ_CHECKER = "https://www.lowemissionzones.scot";
  const OXFORD_ZEZ_PORTAL = "https://www.oxfordshire.gov.uk/residents/roads-and-transport/oxford-zero-emission-zone-zez";

  const getCertaintyNote = (zoneCertainty: CertaintyLevel): string => {
    if (zoneCertainty === "confirmado") {
      return "Confirmado con datos oficiales de la DVLA.";
    }
    if (zoneCertainty === "probable") {
      return "Resultado probable basado en fecha de matriculación. Verifica en el comprobador oficial antes de viajar.";
    }
    return "Resultado desconocido o con exenciones no verificadas. Comprueba en el portal oficial.";
  };

  const zonesStatus: ZoneStatusResult[] = [
    {
      zoneId: "london-ulez",
      zoneName: "Greater London ULEZ",
      slug: "london-ulez",
      city: "London",
      isCompliant: isStandardUlezCompliant,
      charge: isStandardUlezCompliant ? "£0 / day" : "£12.50 / day",
      statusText: isStandardUlezCompliant ? "Compliant (No Charge)" : "Chargeable (£12.50/day)",
      details: isStandardUlezCompliant
        ? "Meets London ULEZ standards (Euro 4 petrol or Euro 6 diesel / EV). Drive freely 24/7 across all London boroughs."
        : "Vehicle does not meet Euro standards. Subject to £12.50 daily fee if driven inside Greater London. Unpaid incurs £180 PCN (£90 if paid within 14 days).",
      certainty: overallCertainty,
      certaintyNote: getCertaintyNote(overallCertainty),
      officialCheckerUrl: TFL_CHECKER,
      officialCheckerName: "TfL Official Vehicle Checker",
    },
    {
      zoneId: "london-congestion-charge",
      zoneName: "London Congestion Charge",
      slug: "london-congestion-charge",
      city: "Central London",
      isCompliant: isElectric,
      charge: isElectric ? "£0 (Registered EV)" : "£15.00 / day",
      statusText: isElectric ? "Compliant (£0 Cleaner Vehicle)" : "Subject to £15/day Charge",
      details: isElectric
        ? "Eligible for 100% Cleaner Vehicle Discount (must register with TfL). Free entry 7am-6pm Mon-Fri & 12pm-6pm Sat-Sun."
        : "Standard £15 daily charge applies to ALL combustion and hybrid vehicles entering Central London 07:00-18:00 Mon-Fri, 12:00-18:00 Sat-Sun.",
      certainty: isElectric && isFromDVLA ? "confirmado" : "probable",
      certaintyNote: isElectric ? "Requiere registro previo con TfL para aplicar el descuento del 100%." : getCertaintyNote("probable"),
      officialCheckerUrl: TFL_CHECKER,
      officialCheckerName: "TfL Congestion Charge Portal",
    },
    {
      zoneId: "birmingham-clean-air-zone",
      zoneName: "Birmingham CAZ (Class D)",
      slug: "birmingham-clean-air-zone",
      city: "Birmingham",
      isCompliant: isStandardUlezCompliant,
      charge: isStandardUlezCompliant ? "£0 / day" : (vehicleType === "hgv" ? "£50 / day" : "£8 / day"),
      statusText: isStandardUlezCompliant ? "Compliant (No Charge)" : `Chargeable (${vehicleType === "hgv" ? "£50" : "£8"}/day)`,
      details: isStandardUlezCompliant
        ? "Vehicle meets Birmingham Class D emission requirements. Free to enter inside A4540 Middleway ring road 24/7."
        : `Non-compliant private vehicle or van. Requires £${vehicleType === "hgv" ? "50" : "8"} daily payment via gov.uk central CAZ service.`,
      certainty: overallCertainty,
      certaintyNote: getCertaintyNote(overallCertainty),
      officialCheckerUrl: GOVUK_CAZ_CHECKER,
      officialCheckerName: "Gov.uk Clean Air Zones Checker",
    },
    {
      zoneId: "bristol-clean-air-zone",
      zoneName: "Bristol CAZ (Class D)",
      slug: "bristol-clean-air-zone",
      city: "Bristol",
      isCompliant: isStandardUlezCompliant,
      charge: isStandardUlezCompliant ? "£0 / day" : (vehicleType === "hgv" ? "£100 / day" : "£9 / day"),
      statusText: isStandardUlezCompliant ? "Compliant (No Charge)" : `Chargeable (${vehicleType === "hgv" ? "£100" : "£9"}/day)`,
      details: isStandardUlezCompliant
        ? "Meets Bristol Class D standards. Free to enter central Bristol and Portway 24/7."
        : `Vehicle exceeds emission limits. Daily charge is £${vehicleType === "hgv" ? "100" : "9"} per day. Unpaid incurs £120 PCN.`,
      certainty: overallCertainty,
      certaintyNote: getCertaintyNote(overallCertainty),
      officialCheckerUrl: GOVUK_CAZ_CHECKER,
      officialCheckerName: "Gov.uk Clean Air Zones Checker",
    },
    {
      zoneId: "bath-clean-air-zone",
      zoneName: "Bath CAZ (Class C)",
      slug: "bath-clean-air-zone",
      city: "Bath",
      isExemptCarNonCommercial: vehicleType === "car",
      isCompliant: vehicleType === "car" ? true : isStandardUlezCompliant,
      charge: vehicleType === "car" ? "£0 (Private Cars Exempt)" : (isStandardUlezCompliant ? "£0 / day" : (vehicleType === "hgv" ? "£100 / day" : "£9 / day")),
      statusText: vehicleType === "car" ? "Exempt (Private Cars Free)" : (isStandardUlezCompliant ? "Compliant (No Charge)" : "Chargeable (£9/day)"),
      details: vehicleType === "car"
        ? "Private passenger cars are completely EXEMPT from Bath Clean Air Zone charges regardless of fuel type or age."
        : (isStandardUlezCompliant ? "Commercial vehicle meets Euro standards." : "Non-compliant commercial van/taxi subject to £9 daily charge. HGVs pay £100."),
      certainty: vehicleType === "car" ? "confirmado" : overallCertainty,
      certaintyNote: vehicleType === "car" ? "Exención permanente para turismos privados." : getCertaintyNote(overallCertainty),
      officialCheckerUrl: GOVUK_CAZ_CHECKER,
      officialCheckerName: "Gov.uk Clean Air Zones Checker",
    },
    {
      zoneId: "sheffield-clean-air-zone",
      zoneName: "Sheffield CAZ (Class C)",
      slug: "sheffield-clean-air-zone",
      city: "Sheffield",
      isExemptCarNonCommercial: vehicleType === "car",
      isCompliant: vehicleType === "car" ? true : isStandardUlezCompliant,
      charge: vehicleType === "car" ? "£0 (Private Cars Exempt)" : (isStandardUlezCompliant ? "£0 / day" : (vehicleType === "hgv" ? "£50 / day" : "£10 / day")),
      statusText: vehicleType === "car" ? "Exempt (Private Cars Free)" : (isStandardUlezCompliant ? "Compliant (No Charge)" : "Chargeable (£10/day)"),
      details: vehicleType === "car"
        ? "Private passenger cars and motorbikes are EXEMPT in Sheffield. Only commercial vans, taxis, buses, and HGVs are charged."
        : (isStandardUlezCompliant ? "Commercial vehicle meets Euro standards." : "Non-compliant van or taxi must pay £10/day (£50 for HGVs) via gov.uk."),
      certainty: vehicleType === "car" ? "confirmado" : overallCertainty,
      certaintyNote: vehicleType === "car" ? "Exención permanente para turismos privados." : getCertaintyNote(overallCertainty),
      officialCheckerUrl: GOVUK_CAZ_CHECKER,
      officialCheckerName: "Gov.uk Clean Air Zones Checker",
    },
    {
      zoneId: "tyneside-newcastle-gateshead-caz",
      zoneName: "Newcastle & Gateshead CAZ (Class C)",
      slug: "tyneside-newcastle-gateshead-caz",
      city: "Newcastle & Gateshead",
      isExemptCarNonCommercial: vehicleType === "car",
      isCompliant: vehicleType === "car" ? true : isStandardUlezCompliant,
      charge: vehicleType === "car" ? "£0 (Private Cars Exempt)" : (isStandardUlezCompliant ? "£0 / day" : (vehicleType === "hgv" ? "£50 / day" : "£12.50 / day")),
      statusText: vehicleType === "car" ? "Exempt (Private Cars Free)" : (isStandardUlezCompliant ? "Compliant (No Charge)" : "Chargeable (£12.50/day)"),
      details: vehicleType === "car"
        ? "Private cars and motorbikes are EXEMPT from Newcastle & Gateshead CAZ charges."
        : (isStandardUlezCompliant ? "Commercial vehicle compliant." : "Non-compliant older commercial vans/taxis pay £12.50/day. HGVs pay £50/day."),
      certainty: vehicleType === "car" ? "confirmado" : overallCertainty,
      certaintyNote: vehicleType === "car" ? "Exención permanente para turismos privados." : getCertaintyNote(overallCertainty),
      officialCheckerUrl: GOVUK_CAZ_CHECKER,
      officialCheckerName: "Gov.uk Clean Air Zones Checker",
    },
    {
      zoneId: "bradford-clean-air-zone",
      zoneName: "Bradford CAZ (Class C+)",
      slug: "bradford-clean-air-zone",
      city: "Bradford",
      isExemptCarNonCommercial: vehicleType === "car",
      isCompliant: vehicleType === "car" ? true : isStandardUlezCompliant,
      charge: vehicleType === "car" ? "£0 (Private Cars Exempt)" : (isStandardUlezCompliant ? "£0 / day" : (vehicleType === "hgv" ? "£50 / day" : "£9 / day")),
      statusText: vehicleType === "car" ? "Exempt (Private Cars Free)" : (isStandardUlezCompliant ? "Compliant (No Charge)" : "Chargeable (£9/day)"),
      details: vehicleType === "car"
        ? "Private cars are not charged in Bradford. Only commercial vehicles, vans, minibuses, and HGVs."
        : (isStandardUlezCompliant ? "Commercial vehicle meets emission criteria." : "Non-compliant commercial vehicle pays £9/day (£50 for HGVs)."),
      certainty: vehicleType === "car" ? "confirmado" : overallCertainty,
      certaintyNote: vehicleType === "car" ? "Exención permanente para turismos privados." : getCertaintyNote(overallCertainty),
      officialCheckerUrl: GOVUK_CAZ_CHECKER,
      officialCheckerName: "Gov.uk Clean Air Zones Checker",
    },
    {
      zoneId: "portsmouth-clean-air-zone",
      zoneName: "Portsmouth CAZ (Class B)",
      slug: "portsmouth-clean-air-zone",
      city: "Portsmouth",
      isExemptCarNonCommercial: vehicleType === "car" || vehicleType === "van",
      isCompliant: vehicleType === "car" || vehicleType === "van" ? true : isStandardUlezCompliant,
      charge: vehicleType === "car" || vehicleType === "van" ? "£0 (Cars & Vans Exempt)" : (isStandardUlezCompliant ? "£0 / day" : (vehicleType === "hgv" ? "£50 / day" : "£10 / day")),
      statusText: vehicleType === "car" || vehicleType === "van" ? "Exempt (Cars & Vans Free)" : (isStandardUlezCompliant ? "Compliant (No Charge)" : "Chargeable"),
      details: "Portsmouth is Class B: Private cars and standard private vans are 100% exempt. Only non-compliant taxis, private hire, and HGVs/buses pay.",
      certainty: (vehicleType === "car" || vehicleType === "van") ? "confirmado" : overallCertainty,
      certaintyNote: (vehicleType === "car" || vehicleType === "van") ? "Exención de Clase B para turismos y furgonetas privadas." : getCertaintyNote(overallCertainty),
      officialCheckerUrl: GOVUK_CAZ_CHECKER,
      officialCheckerName: "Gov.uk Clean Air Zones Checker",
    },
    {
      zoneId: "oxford-zero-emission-zone",
      zoneName: "Oxford Zero Emission Zone (ZEZ)",
      slug: "oxford-zero-emission-zone",
      city: "Oxford",
      isCompliant: isElectric,
      charge: isElectric ? "£0 (EVs Free)" : "Daily Fee Applies (£10/day)",
      statusText: isElectric ? "Compliant (£0 Free for EVs)" : "Daily Fee Applies (£10/day)",
      details: isElectric
        ? "100% pure battery electric vehicles enter the Oxford ZEZ completely free of charge."
        : "All petrol, diesel, and non-EV hybrid vehicles must pay £10/day between 07:00 and 19:00 to drive on designated city centre streets.",
      certainty: isElectric && isFromDVLA ? "confirmado" : "probable",
      certaintyNote: isElectric ? "100% libre de emisiones verificado." : "Solo vehículos 100% eléctricos están exentos de pago en la ZEZ de Oxford.",
      officialCheckerUrl: OXFORD_ZEZ_PORTAL,
      officialCheckerName: "Oxfordshire County Council ZEZ",
    },
    {
      zoneId: "glasgow-lez",
      zoneName: "Glasgow LEZ",
      slug: "glasgow-lez",
      city: "Glasgow",
      isCompliant: isStandardUlezCompliant,
      charge: isStandardUlezCompliant ? "£0 (Compliant)" : "BANNED - £60 Fine",
      penaltyWarning: "STRICT ENFORCEMENT: Scottish LEZs have NO daily pay-to-drive option! Non-compliant vehicles receive an automatic £60 PCN.",
      statusText: isStandardUlezCompliant ? "Compliant (Permitted)" : "BANNED (Automatic £60 PCN)",
      details: isStandardUlezCompliant
        ? "Permitted in Glasgow LEZ. Compliant vehicles (Euro 4 petrol / Euro 6 diesel / EV) enter freely."
        : "CRITICAL: Scotland has NO daily charge option. Non-compliant vehicles entering the zone are issued an automatic £60 Penalty Charge Notice (doubles on repeat offenses up to £480).",
      certainty: overallCertainty,
      certaintyNote: getCertaintyNote(overallCertainty),
      officialCheckerUrl: SCOTLAND_LEZ_CHECKER,
      officialCheckerName: "Transport Scotland LEZ Checker",
    },
    {
      zoneId: "edinburgh-lez",
      zoneName: "Edinburgh LEZ",
      slug: "edinburgh-lez",
      city: "Edinburgh",
      isCompliant: isStandardUlezCompliant,
      charge: isStandardUlezCompliant ? "£0 (Compliant)" : "BANNED - £60 Fine",
      penaltyWarning: "STRICT ENFORCEMENT: Scottish LEZs have NO daily pay-to-drive option! Non-compliant vehicles receive an automatic £60 PCN.",
      statusText: isStandardUlezCompliant ? "Compliant (Permitted)" : "BANNED (Automatic £60 PCN)",
      details: isStandardUlezCompliant
        ? "Permitted in Edinburgh LEZ city centre. Meets Scottish national low emission criteria."
        : "CRITICAL: Non-compliant vehicles are banned from central Edinburgh. Automatic camera enforcement issues £60 PCN (£30 if paid in 14 days, doubling on repeat entries).",
      certainty: overallCertainty,
      certaintyNote: getCertaintyNote(overallCertainty),
      officialCheckerUrl: SCOTLAND_LEZ_CHECKER,
      officialCheckerName: "Transport Scotland LEZ Checker",
    },
    {
      zoneId: "dundee-lez",
      zoneName: "Dundee LEZ",
      slug: "dundee-lez",
      city: "Dundee",
      isCompliant: isStandardUlezCompliant,
      charge: isStandardUlezCompliant ? "£0 (Compliant)" : "BANNED - £60 Fine",
      penaltyWarning: "STRICT ENFORCEMENT: Scottish LEZs have NO daily pay-to-drive option! Non-compliant vehicles receive an automatic £60 PCN.",
      statusText: isStandardUlezCompliant ? "Compliant (Permitted)" : "BANNED (Automatic £60 PCN)",
      details: isStandardUlezCompliant
        ? "Compliant for Dundee city centre LEZ (within Marketgait ring road)."
        : "CRITICAL: Entry is prohibited for non-compliant vehicles. ANPR cameras issue a £60 statutory fine with no daily fee option.",
      certainty: overallCertainty,
      certaintyNote: getCertaintyNote(overallCertainty),
      officialCheckerUrl: SCOTLAND_LEZ_CHECKER,
      officialCheckerName: "Transport Scotland LEZ Checker",
    },
    {
      zoneId: "aberdeen-lez",
      zoneName: "Aberdeen LEZ",
      slug: "aberdeen-lez",
      city: "Aberdeen",
      isCompliant: isStandardUlezCompliant,
      charge: isStandardUlezCompliant ? "£0 (Compliant)" : "BANNED - £60 Fine",
      penaltyWarning: "STRICT ENFORCEMENT: Scottish LEZs have NO daily pay-to-drive option! Non-compliant vehicles receive an automatic £60 PCN.",
      statusText: isStandardUlezCompliant ? "Compliant (Permitted)" : "BANNED (Automatic £60 PCN)",
      details: isStandardUlezCompliant
        ? "Compliant for Aberdeen LEZ (Union Street corridor)."
        : "CRITICAL: Non-compliant vehicles cannot buy a pass. Entering incurs an automatic £60 penalty charge notice under Transport (Scotland) Act 2019.",
      certainty: overallCertainty,
      certaintyNote: getCertaintyNote(overallCertainty),
      officialCheckerUrl: SCOTLAND_LEZ_CHECKER,
      officialCheckerName: "Transport Scotland LEZ Checker",
    },
  ];

  return {
    vrm,
    regYear,
    regMonth,
    fuelType,
    vehicleType,
    isElectric,
    euroStandardEstimate,
    dataSource: isFromDVLA ? "dvla" : "manual",
    queriedAt: queriedAt || (isFromDVLA ? new Date().toISOString() : undefined),
    certainty: overallCertainty,
    certaintyReason,
    dvlaRaw: dvlaData ? {
      make: dvlaData.make,
      fuelType: dvlaData.fuelType,
      yearOfFirstRegistration: dvlaData.yearOfFirstRegistration,
      monthOfFirstRegistration: dvlaData.monthOfFirstRegistration,
      euroStatus: dvlaData.euroStatus,
      co2Emissions: dvlaData.co2Emissions,
      typeApproval: dvlaData.typeApproval,
      revenueWeight: dvlaData.revenueWeight,
    } : undefined,
    zonesStatus,
  };
}
