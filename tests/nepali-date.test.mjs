import test from "node:test";
import assert from "node:assert/strict";
import { getFormattedNepaliTime, getFormattedBikramSambatDate } from "../utils/nepaliDate.js";

// Run in different visitor timezones to catch accidental use of local fields.
for (const timezone of ["UTC", "Asia/Kathmandu", "America/New_York", "Pacific/Auckland"]) {
  test(`Nepal clock and calendar are independent of device timezone (${timezone})`, () => {
    const originalTimezone = process.env.TZ;
    process.env.TZ = timezone;
    try {
      assert.equal(getFormattedNepaliTime(new Date("2026-10-24T00:00:00Z")), "०५ : ४५ : ०० बिहान");
      assert.equal(getFormattedNepaliTime(new Date("2026-10-24T06:15:00Z")), "१२ : ०० : ०० दिउँसो");
      assert.equal(getFormattedNepaliTime(new Date("2026-10-24T10:15:00Z")), "०४ : ०० : ०० साँझ");
      assert.equal(getFormattedNepaliTime(new Date("2026-10-24T14:15:00Z")), "०८ : ०० : ०० राति");
      // BS 2083 begins April 14, 2026, at midnight in Nepal (18:15 UTC).
      const beforeMidnight = new Date("2026-04-13T18:14:59Z");
      const afterMidnight = new Date("2026-04-13T18:15:00Z");
      assert.equal(getFormattedNepaliTime(beforeMidnight), "११ : ५९ : ५९ राति");
      assert.equal(getFormattedNepaliTime(afterMidnight), "१२ : ०० : ०० राति");
      assert.equal(getFormattedBikramSambatDate(beforeMidnight), "वि सं २०८२ चैत ३० सोमबार");
      assert.equal(getFormattedBikramSambatDate(afterMidnight), "वि सं २०८३ वैशाख १ मङ्गलबार");
      assert.equal(getFormattedBikramSambatDate(new Date("2025-04-14T06:15:00Z")), "वि सं २०८२ वैशाख १ सोमबार");
    } finally {
      if (originalTimezone === undefined) delete process.env.TZ;
      else process.env.TZ = originalTimezone;
    }
  });
}
