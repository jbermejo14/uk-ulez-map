import { test } from "node:test";
import assert from "node:assert";
import zones from "../data/zones.json";

const MAX_AGE_DAYS = 180;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

test("All UK Clean Air & Low Emission Zones have official sources and fresh verification", () => {
  assert.ok(Array.isArray(zones), "zones.json must be an array");
  assert.strictEqual(zones.length, 14, "There must be exactly 14 active UK zones in data/zones.json");

  const now = new Date("2026-11-16T12:00:00Z").getTime(); // Reference current test time

  for (const zone of zones) {
    // 1. sourceUrl must be present and valid
    assert.ok(
      zone.sourceUrl && typeof zone.sourceUrl === "string",
      `Zone "${zone.name}" (${zone.id}) is missing a sourceUrl`
    );
    assert.match(
      zone.sourceUrl,
      /^https?:\/\//,
      `Zone "${zone.name}" sourceUrl must be a valid HTTP/HTTPS URL`
    );

    // 2. officialCheckerUrl must be present
    assert.ok(
      zone.officialCheckerUrl && typeof zone.officialCheckerUrl === "string",
      `Zone "${zone.name}" (${zone.id}) is missing an officialCheckerUrl`
    );

    // 3. lastVerified must be present in ISO YYYY-MM-DD format
    assert.ok(
      zone.lastVerified && typeof zone.lastVerified === "string",
      `Zone "${zone.name}" (${zone.id}) is missing lastVerified`
    );
    assert.match(
      zone.lastVerified,
      /^\d{4}-\d{2}-\d{2}$/,
      `Zone "${zone.name}" lastVerified must be in YYYY-MM-DD format, got: ${zone.lastVerified}`
    );

    // 4. Verification must NOT be older than 180 days
    const verifiedDate = new Date(zone.lastVerified).getTime();
    assert.ok(!isNaN(verifiedDate), `Invalid date for zone ${zone.name}: ${zone.lastVerified}`);

    const ageInDays = Math.floor((now - verifiedDate) / MS_PER_DAY);
    assert.ok(
      ageInDays <= MAX_AGE_DAYS,
      `Zone "${zone.name}" lastVerified is ${ageInDays} days old, exceeding the 180-day freshness limit!`
    );

    // 5. Check other critical fields
    assert.ok(zone.dailyChargeCar, `Zone "${zone.name}" missing dailyChargeCar`);
    assert.ok(zone.pcnAmount, `Zone "${zone.name}" missing pcnAmount`);
    assert.ok(zone.operatingHours, `Zone "${zone.name}" missing operatingHours`);
    assert.ok(Array.isArray(zone.polygon) && zone.polygon.length >= 3, `Zone "${zone.name}" must have valid polygon`);
  }
});
