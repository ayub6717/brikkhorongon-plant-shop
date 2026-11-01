import { describe, expect, it } from "vitest";
import { seasonOf, wateringInterval } from "./season";

describe("seasonOf", () => {
  it.each([
    ["2026-01-10", "winter"], ["2026-02-14", "winter"], ["2026-02-15", "spring"], ["2026-04-14", "spring"],
    ["2026-04-15", "summer"], ["2026-06-14", "summer"], ["2026-06-15", "monsoon"], ["2026-08-15", "autumn"],
    ["2026-10-15", "lateAutumn"], ["2026-12-14", "lateAutumn"], ["2026-12-15", "winter"],
  ])("%s is %s", (key, season) => expect(seasonOf(key)).toBe(season));
});

describe("wateringInterval", () => {
  it("waters more often in summer and less in winter", () => {
    expect(wateringInterval("moderate", "2026-05-01")).toBe(5);
    expect(wateringInterval("moderate", "2026-09-01")).toBe(7);
    expect(wateringInterval("moderate", "2026-01-01")).toBe(11);
  });
  it("never goes below two days", () => expect(wateringInterval("high", "2026-05-01")).toBeGreaterThanOrEqual(2));
});
