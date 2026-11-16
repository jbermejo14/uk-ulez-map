import { ComplianceResult } from "@/types/zone";

export interface DecodedPlate {
  isValid: boolean;
  rawPlate: string;
  formattedPlate: string;
  year?: number;
  period?: "early" | "late";
  description?: string;
}

/**
 * Decodes a UK Registration plate string into an estimated year and registration period.
 * Supports modern 2001-2026 format (e.g., AB15 CDE, YK64 XYZ, LD23 WXY, EO65 ABC).
 */
export function decodeUKPlate(plate: string): DecodedPlate {
  const clean = plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (!clean || clean.length < 5 || clean.length > 8) {
    return { isValid: false, rawPlate: plate, formattedPlate: clean };
  }

  // Modern UK format: 2 letters, 2 digits, 3 letters (e.g., AB15CDE)
  const modernRegex = /^([A-Z]{2})([0-9]{2})([A-Z]{3})$/;
  const modernMatch = clean.match(modernRegex);

  if (modernMatch) {
    const ageDigits = parseInt(modernMatch[2], 10);
    const prefix = modernMatch[1];
    const suffix = modernMatch[3];
    const formatted = `${prefix}${modernMatch[2]} ${suffix}`;

    // 51 = Sep 2001 - Feb 2002
    // 02 = Mar 2002 - Aug 2002
    // ...
    // 65 = Sep 2015 - Feb 2016 (Euro 6 diesel mandate!)
    // 74 = Sep 2024 - Feb 2025
    // 25 = Mar 2025 - Aug 2025
    // 75 = Sep 2025 - Feb 2026
    // 26 = Mar 2026 - Aug 2026
    // 76 = Sep 2026 - Feb 2027
    if (ageDigits >= 51 && ageDigits <= 99) {
      const year = 2000 + (ageDigits - 50);
      return {
        isValid: true,
        rawPlate: plate,
        formattedPlate: formatted,
        year,
        period: "late",
        description: `Registered late ${year} (September ${year} – February ${year + 1}) [${ageDigits} Plate]`,
      };
    } else if (ageDigits >= 2 && ageDigits <= 49) {
      const year = 2000 + ageDigits;
      return {
        isValid: true,
        rawPlate: plate,
        formattedPlate: formatted,
        year,
        period: "early",
        description: `Registered early ${year} (March ${year} – August ${year}) [${ageDigits < 10 ? "0" + ageDigits : ageDigits} Plate]`,
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
  fuelType: "petrol" | "diesel" | "hybrid" | "electric";
  vehicleType: "car" | "van" | "motorcycle" | "hgv";
  platePeriod?: "early" | "late";
}

/**
 * Calculates emission compliance for all major UK Clean Air Zones, ULEZ, and Scottish LEZs.
 */
export function checkVehicleCompliance(opts: CheckOptions): ComplianceResult {
  const { vrm, regYear, fuelType, vehicleType, platePeriod } = opts;
  const isElectric = fuelType === "electric";

  // Determine Euro standard estimate
  let euroStandardEstimate = "Euro 6";
  if (isElectric) {
    euroStandardEstimate = "Zero Emission (EV)";
  } else if (fuelType === "petrol") {
    if (regYear >= 2015) euroStandardEstimate = "Euro 6 (Compliant)";
    else if (regYear >= 2011) euroStandardEstimate = "Euro 5 (Compliant)";
    else if (regYear >= 2006) euroStandardEstimate = "Euro 4 (Compliant)";
    else if (regYear >= 2001) euroStandardEstimate = "Euro 3 (Non-Compliant)";
    else euroStandardEstimate = "Euro 1 / 2 (Non-Compliant)";
  } else if (fuelType === "diesel") {
    // September 2015 (65 plate) became mandatory Euro 6
    if (regYear > 2015 || (regYear === 2015 && platePeriod === "late")) {
      euroStandardEstimate = "Euro 6 (Compliant)";
    } else if (regYear === 2015 && platePeriod === "early") {
      euroStandardEstimate = "Euro 5b (Early 2015, likely Non-Compliant)";
    } else if (regYear >= 2011) {
      euroStandardEstimate = "Euro 5 (Non-Compliant)";
    } else if (regYear >= 2006) {
      euroStandardEstimate = "Euro 4 (Non-Compliant)";
    } else {
      euroStandardEstimate = "Euro 1-3 (Non-Compliant)";
    }
  } else if (fuelType === "hybrid") {
    // Most hybrids are petrol-hybrid (Euro 4+ required)
    if (regYear >= 2006) euroStandardEstimate = "Euro 4+ Hybrid (Compliant)";
    else euroStandardEstimate = "Pre-2006 Hybrid (Check V5C)";
  }

  // Core ULEZ/CAZ Standard compliance evaluation:
  // Petrol: Euro 4 (generally 2006+)
  // Diesel: Euro 6 (September 2015+ / 65 plate)
  // Electric: 100% compliant
  let isStandardUlezCompliant = false;

  if (isElectric) {
    isStandardUlezCompliant = true;
  } else if (vehicleType === "motorcycle") {
    // Motorcycles: Euro 3 (July 2007+)
    isStandardUlezCompliant = regYear >= 2007;
  } else if (vehicleType === "hgv") {
    // HGVs: Euro VI (2014+)
    isStandardUlezCompliant = regYear >= 2014;
  } else if (fuelType === "petrol" || fuelType === "hybrid") {
    isStandardUlezCompliant = regYear >= 2006;
  } else if (fuelType === "diesel") {
    if (regYear > 2015) {
      isStandardUlezCompliant = true;
    } else if (regYear === 2015) {
      // 65 plate (late 2015) is Euro 6 compliant
      isStandardUlezCompliant = platePeriod === "late";
    } else {
      isStandardUlezCompliant = false;
    }
  }

  // Define status for each zone
  const zonesStatus = [
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
    },
    {
      zoneId: "oxford-zero-emission-zone",
      zoneName: "Oxford Zero Emission Zone (ZEZ)",
      slug: "oxford-zero-emission-zone",
      city: "Oxford",
      isCompliant: isElectric,
      charge: isElectric ? "£0 (EVs Free)" : (isStandardUlezCompliant ? "£10.00 / day" : "£10.00 / day"),
      statusText: isElectric ? "Compliant (£0 Free for EVs)" : "Daily Fee Applies (£10/day)",
      details: isElectric
        ? "100% pure battery electric vehicles enter the Oxford ZEZ completely free of charge."
        : "All petrol, diesel, and non-EV hybrid vehicles must pay £10/day between 07:00 and 19:00 to drive on designated city centre streets.",
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
    },
  ];

  return {
    vrm,
    regYear,
    fuelType,
    vehicleType,
    isElectric,
    euroStandardEstimate,
    zonesStatus,
  };
}
