export interface ZoneVehicleCharge {
  vehicleType: string;
  isCharged: boolean;
  dailyRate: string;
  notes: string;
}

export interface ZoneData {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  type: "ULEZ" | "CAZ_D" | "CAZ_C" | "CAZ_B" | "LEZ_SCOTLAND" | "ZEZ" | "CONGESTION";
  typeLabel: string;
  city: string;
  region: "England" | "Scotland";
  status: "Active" | "Planned";
  operatingHours: string;
  enforcementMethod: string;
  dailyChargeCar: string;
  dailyChargeVan: string;
  dailyChargeHGV: string;
  dailyChargeMotorcycle: string;
  pcnAmount: string;
  pcnDiscounted: string;
  pcnRule: string;
  sourceUrl: string; // Official operator portal page
  lastVerified: string; // ISO date string (YYYY-MM-DD)
  unverifiedFields?: string[]; // Specific fields that could not be officially verified
  officialCheckerUrl: string; // Direct link to official compliance checker
  coordinates: {
    lat: number;
    lng: number;
    zoom: number;
  };
  standards: {
    petrol: string;
    diesel: string;
    electric: string;
    hybrid: string;
    motorcycle: string;
  };
  summary: string;
  description: string;
  exemptions: string[];
  vehicleCharges: ZoneVehicleCharge[];
  paymentUrl: string;
  paymentWindow: string;
  polygon: [number, number][]; // [lat, lng] array for Leaflet polygon
  faqs: {
    question: string;
    answer: string;
  }[];
}

export type CertaintyLevel = "confirmado" | "probable" | "desconocido";

export interface ZoneStatusResult {
  zoneId: string;
  zoneName: string;
  slug: string;
  city: string;
  isExemptCarNonCommercial?: boolean;
  isCompliant: boolean | "unknown";
  charge: string;
  penaltyWarning?: string;
  statusText: string;
  details: string;
  certainty: CertaintyLevel;
  certaintyNote: string;
  officialCheckerUrl: string;
  officialCheckerName: string;
}

export interface ComplianceResult {
  vrm?: string;
  regYear: number;
  regMonth?: number;
  fuelType: "petrol" | "diesel" | "hybrid" | "electric";
  vehicleType: "car" | "van" | "motorcycle" | "hgv";
  isElectric: boolean;
  euroStandardEstimate: string;
  dataSource: "dvla" | "manual";
  queriedAt?: string;
  certainty: CertaintyLevel;
  certaintyReason: string;
  dvlaRaw?: {
    make?: string;
    fuelType?: string;
    yearOfFirstRegistration?: number;
    monthOfFirstRegistration?: number;
    euroStatus?: string;
    co2Emissions?: number;
    typeApproval?: string;
    revenueWeight?: number;
  };
  zonesStatus: ZoneStatusResult[];
}
