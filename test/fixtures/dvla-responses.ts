import { DVLAVehicleResponse, DVLAErrorResponse } from "../../types/dvla";

export const fixtureEuro6Diesel: DVLAVehicleResponse = {
  registrationNumber: "EO65ABC",
  taxStatus: "Taxed",
  taxDueDate: "2027-01-01",
  motStatus: "Valid",
  make: "VOLKSWAGEN",
  yearOfManufacture: 2015,
  engineCapacity: 1968,
  co2Emissions: 119,
  fuelType: "DIESEL",
  colour: "Grey",
  typeApproval: "M1",
  yearOfFirstRegistration: 2015,
  monthOfFirstRegistration: 10,
  euroStatus: "Euro 6",
  markedAsScrapped: false,
  markedForExport: false,
};

export const fixtureEuro4Petrol: DVLAVehicleResponse = {
  registrationNumber: "AB07CDE",
  taxStatus: "Taxed",
  motStatus: "Valid",
  make: "FORD",
  yearOfManufacture: 2007,
  engineCapacity: 1596,
  co2Emissions: 160,
  fuelType: "PETROL",
  colour: "Blue",
  typeApproval: "M1",
  yearOfFirstRegistration: 2007,
  monthOfFirstRegistration: 5,
  euroStatus: "Euro 4",
  markedAsScrapped: false,
  markedForExport: false,
};

export const fixtureEuro5Diesel: DVLAVehicleResponse = {
  registrationNumber: "YK64XYZ",
  taxStatus: "Taxed",
  motStatus: "Valid",
  make: "BMW",
  yearOfManufacture: 2014,
  engineCapacity: 1995,
  co2Emissions: 135,
  fuelType: "DIESEL",
  colour: "Black",
  typeApproval: "M1",
  yearOfFirstRegistration: 2014,
  monthOfFirstRegistration: 11,
  euroStatus: "Euro 5",
  markedAsScrapped: false,
  markedForExport: false,
};

export const fixtureEmptyEuroStatusPost2015Diesel: DVLAVehicleResponse = {
  registrationNumber: "LD18WXY",
  taxStatus: "Taxed",
  motStatus: "Valid",
  make: "MERCEDES-BENZ",
  yearOfManufacture: 2018,
  engineCapacity: 2143,
  co2Emissions: 128,
  fuelType: "DIESEL",
  colour: "Silver",
  typeApproval: "M1",
  yearOfFirstRegistration: 2018,
  monthOfFirstRegistration: 6,
  // euroStatus omitted (typical real-world DVLA VES API response!)
  euroStatus: undefined,
  markedAsScrapped: false,
  markedForExport: false,
};

export const fixtureEmptyEuroStatusPre2015Diesel: DVLAVehicleResponse = {
  registrationNumber: "BJ12KLR",
  taxStatus: "Taxed",
  motStatus: "Valid",
  make: "VAUXHALL",
  yearOfManufacture: 2012,
  engineCapacity: 1686,
  co2Emissions: 139,
  fuelType: "DIESEL",
  colour: "White",
  typeApproval: "M1",
  yearOfFirstRegistration: 2012,
  monthOfFirstRegistration: 3,
  euroStatus: undefined,
  markedAsScrapped: false,
  markedForExport: false,
};

export const fixtureElectricEV: DVLAVehicleResponse = {
  registrationNumber: "EV74GRN",
  taxStatus: "Taxed",
  motStatus: "Valid",
  make: "TESLA",
  yearOfManufacture: 2024,
  engineCapacity: 0,
  co2Emissions: 0,
  fuelType: "ELECTRICITY",
  colour: "White",
  typeApproval: "M1",
  yearOfFirstRegistration: 2024,
  monthOfFirstRegistration: 9,
  euroStatus: undefined,
  markedAsScrapped: false,
  markedForExport: false,
};

export const fixtureNotFound404: DVLAErrorResponse = {
  errors: [
    {
      status: "404",
      code: "102",
      title: "Vehicle Not Found",
      detail: "Record for registration number not found",
    },
  ],
};

export const fixtureRateLimit429: DVLAErrorResponse = {
  errors: [
    {
      status: "429",
      code: "109",
      title: "Too Many Requests",
      detail: "Client has exceeded rate limit",
    },
  ],
};
