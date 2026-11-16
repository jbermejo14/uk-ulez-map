import { test, describe } from "node:test";
import assert from "node:assert";
import { normalizeVRM } from "../lib/compliance";
import { fixtureNotFound404, fixtureRateLimit429 } from "./fixtures/dvla-responses";

describe("app/api/vehicle/route.ts offline validation & error structures", () => {
  test("normalizeVRM() correctly normalizes and cleans registration plates", () => {
    assert.strictEqual(normalizeVRM("ab15 cde"), "AB15CDE");
    assert.strictEqual(normalizeVRM(" yk64-xyz  "), "YK64XYZ");
    assert.strictEqual(normalizeVRM("W1"), "W1");
    assert.strictEqual(normalizeVRM(""), null);
    assert.strictEqual(normalizeVRM("A"), null); // Too short
    assert.strictEqual(normalizeVRM("TOOLONGNUMBERPLATE"), null); // Too long
    assert.strictEqual(normalizeVRM(null as any), null);
  });

  test("DVLA error structures conform to official ErrorResponse schema", () => {
    assert.strictEqual(fixtureNotFound404.errors?.[0].status, "404");
    assert.strictEqual(fixtureNotFound404.errors?.[0].title, "Vehicle Not Found");

    assert.strictEqual(fixtureRateLimit429.errors?.[0].status, "429");
    assert.strictEqual(fixtureRateLimit429.errors?.[0].title, "Too Many Requests");
  });
});
