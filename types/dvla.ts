/**
 * Official DVLA Vehicle Enquiry Service (VES) API Types
 * Based on OpenAPI v1.2.0 specification:
 * https://developer-portal.driver-vehicle-licensing.api.gov.uk/apis/vehicle-enquiry-service/v1.2.0-vehicle-enquiry-service.html
 */

export interface DVLAVehicleRequest {
  registrationNumber: string;
}

export interface DVLAVehicleResponse {
  registrationNumber: string;
  taxStatus?: "Not Taxed for on Road Use" | "SORN" | "Untaxed" | "Taxed" | string;
  taxDueDate?: string;
  artEndDate?: string;
  motStatus?: "No details held by DVLA" | "No results returned" | "Valid" | "Not valid" | string;
  motExpiry?: string;
  make?: string;
  yearOfManufacture?: number;
  engineCapacity?: number;
  co2Emissions?: number;
  fuelType?: string; // "PETROL" | "DIESEL" | "ELECTRICITY" | "HYBRID ELECTRIC" | string
  markedForExport?: boolean;
  markedAsScrapped?: boolean;
  colour?: string;
  typeApproval?: string; // "M1" (cars), "N1" (vans), "L3e" (motorcycles), "N2"/"N3" (HGVs)
  revenueWeight?: number;
  dateOfLastV5CIssued?: string;
  wheelPlan?: string;
  monthOfFirstRegistration?: number;
  yearOfFirstRegistration?: number;
  monthOfFirstRegistrationWithDVLA?: number;
  yearOfFirstRegistrationWithDVLA?: number;
  euroStatus?: string; // "Euro 4" | "Euro 5" | "Euro 6" | "Euro 6d" | etc. (frequently empty from DVLA)
  realDrivingEmissions?: string;
  dateOfFirstRegistration?: string;
  euroStatusEstimated?: boolean;
}

export interface DVLAErrorItem {
  status?: string;
  code?: string;
  title: string;
  detail?: string;
}

export interface DVLAErrorResponse {
  errors?: DVLAErrorItem[];
  message?: string;
}

export interface VehicleLookupSuccess {
  success: true;
  source: "dvla";
  queriedAt: string; // ISO string
  data: DVLAVehicleResponse;
  cached?: boolean;
}

export interface VehicleLookupError {
  success: false;
  source: "dvla" | "system";
  errorCode: "KEY_MISSING" | "INVALID_VRM" | "NOT_FOUND" | "RATE_LIMITED" | "DVLA_UNAVAILABLE" | "NETWORK_ERROR";
  message: string;
  detail?: string;
  fallbackToManual: boolean;
}

export type VehicleLookupResult = VehicleLookupSuccess | VehicleLookupError;
