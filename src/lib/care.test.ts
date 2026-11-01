import { describe, expect, it } from "vitest";
import { addDays, diffDays, dueState, nextWatering } from "./care";
import { buildCareIcs, fold } from "./ics";

describe("care dates", () => {
  it("adds and diffs days across month ends", () => {
    expect(addDays("2026-11-28", 5)).toBe("2026-12-03");
    expect(diffDays("2026-11-01", "2026-11-08")).toBe(7);
  });
  it("schedules the first watering one interval after arrival, then after each watering", () => {
    expect(nextWatering("2026-11-05", "moderate")).toBe("2026-11-12");
    expect(nextWatering("2026-11-05", "high", "2026-11-10")).toBe("2026-11-14");
  });
  it("classifies how soon watering is due", () => {
    expect(dueState("2026-11-10", "2026-11-08").kind).toBe("overdue");
    expect(dueState("2026-11-10", "2026-11-10").kind).toBe("today");
    expect(dueState("2026-11-10", "2026-11-12").kind).toBe("soon");
    expect(dueState("2026-11-10", "2026-11-20").kind).toBe("later");
  });
});

describe("buildCareIcs", () => {
  const ics = buildCareIcs([{ slug: "monstera", name: "Monstera, big", water: "moderate", startKey: "2026-11-05", orderId: "BRK-1" }], {
    calendarName: "Plants",
    title: (n) => `Water ${n}`,
    description: (n, d) => `${n} every ${d} days`,
    now: new Date("2026-11-01T00:00:00Z"),
  });
  it("is a valid-looking calendar with CRLF line endings", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
  it("repeats weekly for a moderate plant starting a week after arrival", () => {
    expect(ics).toContain("DTSTART;VALUE=DATE:20261112");
    expect(ics).toContain("RRULE:FREQ=DAILY;INTERVAL=7;COUNT=26");
  });
  it("escapes commas in text", () => {
    expect(ics).toContain("SUMMARY:Water Monstera\\, big");
  });
  it("folds long lines to 75 octets", () => {
    const folded = fold("X:" + "অ".repeat(60));
    expect(folded.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
  });
});
