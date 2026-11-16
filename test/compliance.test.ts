import { test, describe } from "node:test";
import assert from "node:assert";
import { checkVehicleCompliance, decodeUKPlate, normalizeFuelType } from "../lib/compliance";
import {
  fixtureEuro6Diesel,
  fixtureEuro5Diesel,
  fixtureEuro4Petrol,
  fixtureEmptyEuroStatusPost2015Diesel,
  fixtureEmptyEuroStatusPre2015Diesel,
  fixtureElectricEV,
} from "./fixtures/dvla-responses";

describe("checkVehicleCompliance() with DVLA VES fixtures (Offline)", () => {
  test("1. When DVLA returns euroStatus 'Euro 6' for diesel -> Certainty is CONFIRMADO and compliant in ULEZ & Scottish LEZ", () => {
    const result = checkVehicleCompliance({
      vrm: fixtureEuro6Diesel.registrationNumber,
      regYear: fixtureEuro6Diesel.yearOfFirstRegistration!,
      regMonth: fixtureEuro6Diesel.monthOfFirstRegistration,
      fuelType: "diesel",
      vehicleType: "car",
      dvlaData: fixtureEuro6Diesel,
    });

    assert.strictEqual(result.dataSource, "dvla");
    assert.strictEqual(result.certainty, "confirmado");
    assert.match(result.certaintyReason, /DVLA record explicitly specifies Euro 6/i);
    assert.strictEqual(result.euroStandardEstimate, "Euro 6");

    // Check ULEZ
    const ulez = result.zonesStatus.find((z) => z.zoneId === "london-ulez");
    assert.ok(ulez);
    assert.strictEqual(ulez.isCompliant, true);
    assert.strictEqual(ulez.charge, "£0 / day");
    assert.strictEqual(ulez.certainty, "confirmado");

    // Check Scottish LEZ (Glasgow)
    const glasgow = result.zonesStatus.find((z) => z.zoneId === "glasgow-lez");
    assert.ok(glasgow);
    assert.strictEqual(glasgow.isCompliant, true);
    assert.strictEqual(glasgow.charge, "£0 (Compliant)");
    assert.strictEqual(glasgow.certainty, "confirmado");
  });

  test("2. When DVLA returns euroStatus 'Euro 5' for diesel -> Certainty is CONFIRMADO and chargeable/banned", () => {
    const result = checkVehicleCompliance({
      vrm: fixtureEuro5Diesel.registrationNumber,
      regYear: fixtureEuro5Diesel.yearOfFirstRegistration!,
      regMonth: fixtureEuro5Diesel.monthOfFirstRegistration,
      fuelType: "diesel",
      vehicleType: "car",
      dvlaData: fixtureEuro5Diesel,
    });

    assert.strictEqual(result.certainty, "confirmado");

    // ULEZ
    const ulez = result.zonesStatus.find((z) => z.zoneId === "london-ulez");
    assert.ok(ulez);
    assert.strictEqual(ulez.isCompliant, false);
    assert.strictEqual(ulez.charge, "£12.50 / day");

    // Scottish LEZ ban
    const edinburgh = result.zonesStatus.find((z) => z.zoneId === "edinburgh-lez");
    assert.ok(edinburgh);
    assert.strictEqual(edinburgh.isCompliant, false);
    assert.strictEqual(edinburgh.charge, "BANNED - £60 Fine");
  });

  test("3. When DVLA returns empty euroStatus for post-2015 diesel -> Certainty is PROBABLE", () => {
    const result = checkVehicleCompliance({
      vrm: fixtureEmptyEuroStatusPost2015Diesel.registrationNumber,
      regYear: fixtureEmptyEuroStatusPost2015Diesel.yearOfFirstRegistration!,
      regMonth: fixtureEmptyEuroStatusPost2015Diesel.monthOfFirstRegistration,
      fuelType: "diesel",
      vehicleType: "car",
      dvlaData: fixtureEmptyEuroStatusPost2015Diesel,
    });

    assert.strictEqual(result.dataSource, "dvla");
    assert.strictEqual(result.certainty, "probable");
    assert.match(result.certaintyReason, /no euroStatus on file/i);
    assert.match(result.euroStandardEstimate, /Euro 6/i);

    const ulez = result.zonesStatus.find((z) => z.zoneId === "london-ulez");
    assert.ok(ulez);
    assert.strictEqual(ulez.certainty, "probable");
    assert.ok(ulez.officialCheckerUrl.includes("tfl.gov.uk"));
  });

  test("4. When DVLA returns empty euroStatus for pre-2015 diesel -> Certainty is PROBABLE and non-compliant", () => {
    const result = checkVehicleCompliance({
      vrm: fixtureEmptyEuroStatusPre2015Diesel.registrationNumber,
      regYear: fixtureEmptyEuroStatusPre2015Diesel.yearOfFirstRegistration!,
      regMonth: fixtureEmptyEuroStatusPre2015Diesel.monthOfFirstRegistration,
      fuelType: "diesel",
      vehicleType: "car",
      dvlaData: fixtureEmptyEuroStatusPre2015Diesel,
    });

    assert.strictEqual(result.certainty, "probable");
    const ulez = result.zonesStatus.find((z) => z.zoneId === "london-ulez");
    assert.ok(ulez);
    assert.strictEqual(ulez.isCompliant, false);
    assert.strictEqual(ulez.certainty, "probable");
  });

  test("5. Electric Vehicle (EV) confirmed in DVLA -> Certainty is CONFIRMADO and free across all zones", () => {
    const result = checkVehicleCompliance({
      vrm: fixtureElectricEV.registrationNumber,
      regYear: fixtureElectricEV.yearOfFirstRegistration!,
      fuelType: "electric",
      vehicleType: "car",
      dvlaData: fixtureElectricEV,
    });

    assert.strictEqual(result.isElectric, true);
    assert.strictEqual(result.certainty, "confirmado");

    // All zones must be compliant / free for EV
    for (const z of result.zonesStatus) {
      assert.strictEqual(z.isCompliant, true, `Zone ${z.zoneName} should be compliant for EV`);
      assert.ok(z.charge.includes("£0"), `Zone ${z.zoneName} charge should be £0 for EV, got: ${z.charge}`);
    }
  });

  test("6. Manual mode fallback (no DVLA data) -> Certainty is NEVER 'confirmado'", () => {
    const result = checkVehicleCompliance({
      vrm: "AB15CDE",
      regYear: 2015,
      fuelType: "diesel",
      vehicleType: "car",
      platePeriod: "late",
    });

    assert.strictEqual(result.dataSource, "manual");
    assert.notStrictEqual(result.certainty, "confirmado");
    assert.strictEqual(result.certainty, "probable");
    assert.match(result.certaintyReason, /Not verified with DVLA/i);
  });

  test("7. Zone type verification: Class C & Class B zones exempt private cars", () => {
    const result = checkVehicleCompliance({
      vrm: fixtureEuro5Diesel.registrationNumber,
      regYear: 2012,
      fuelType: "diesel",
      vehicleType: "car",
      dvlaData: fixtureEuro5Diesel,
    });

    // Bath CAZ (Class C) - Private cars exempt
    const bath = result.zonesStatus.find((z) => z.zoneId === "bath-clean-air-zone");
    assert.ok(bath);
    assert.strictEqual(bath?.isCompliant, true);
    assert.strictEqual(bath?.charge, "£0 (Private Cars Exempt)");
    assert.strictEqual(bath?.certainty, "confirmado");

    // Sheffield CAZ (Class C) - Private cars exempt
    const sheffield = result.zonesStatus.find((z) => z.zoneId === "sheffield-clean-air-zone");
    assert.ok(sheffield);
    assert.strictEqual(sheffield?.isCompliant, true);
    assert.strictEqual(sheffield?.charge, "£0 (Private Cars Exempt)");

    // Portsmouth CAZ (Class B) - Private cars exempt
    const portsmouth = result.zonesStatus.find((z) => z.zoneId === "portsmouth-clean-air-zone");
    assert.ok(portsmouth);
    assert.strictEqual(portsmouth?.isCompliant, true);
    assert.strictEqual(portsmouth?.charge, "£0 (Cars & Vans Exempt)");
  });

  test("8. Oxford ZEZ pilot requires daily fee for combustion vehicles regardless of Euro standard", () => {
    const result = checkVehicleCompliance({
      vrm: fixtureEuro6Diesel.registrationNumber,
      regYear: 2018,
      fuelType: "diesel",
      vehicleType: "car",
      dvlaData: fixtureEuro6Diesel,
    });

    const oxford = result.zonesStatus.find((z) => z.zoneId === "oxford-zero-emission-zone");
    assert.ok(oxford);
    assert.strictEqual(oxford?.isCompliant, false);
    assert.strictEqual(oxford?.charge, "Daily Fee Applies (£10/day)");
  });
});
