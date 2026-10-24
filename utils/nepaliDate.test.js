import assert from "node:assert/strict";
import test from "node:test";
import { getFormattedNepaliTime, getFormattedBikramSambatDate } from "./nepaliDate.js";

test("Nepal clock and BS date roll over together at Nepal midnight", () => {
  const before = new Date("2025-04-13T18:14:59Z");
  const after = new Date("2025-04-13T18:15:00Z");

  assert.equal(getFormattedNepaliTime(before), "११ : ५९ : ५९ राति");
  assert.equal(getFormattedNepaliTime(after), "१२ : ०० : ०० राति");
  assert.equal(getFormattedBikramSambatDate(before), "वि सं २०८१ चैत ३१ आइतबार");
  assert.equal(getFormattedBikramSambatDate(after), "वि सं २०८२ वैशाख १ सोमबार");
});

test("Nepal time uses its 45-minute offset and correct day period", () => {
  assert.equal(getFormattedNepaliTime(new Date("2026-10-24T00:00:00Z")), "०५ : ४५ : ०० बिहान");
  assert.equal(getFormattedNepaliTime(new Date("2026-10-24T06:15:00Z")), "१२ : ०० : ०० दिउँसो");
  assert.equal(getFormattedNepaliTime(new Date("2026-10-24T10:15:00Z")), "०४ : ०० : ०० साँझ");
});

test("visitor timezone does not affect Nepal's time or BS date", () => {
  const originalTimezone = process.env.TZ;
  try {
    for (const timezone of ["UTC", "America/Los_Angeles", "Asia/Kathmandu", "Pacific/Auckland"]) {
      process.env.TZ = timezone;
      const instant = new Date("2025-04-13T18:15:00Z");
      assert.equal(getFormattedNepaliTime(instant), "१२ : ०० : ०० राति", timezone);
      assert.equal(getFormattedBikramSambatDate(instant), "वि सं २०८२ वैशाख १ सोमबार", timezone);
    }
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
});
