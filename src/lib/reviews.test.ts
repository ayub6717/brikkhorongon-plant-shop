import { describe, expect, it } from "vitest";
import { summarize } from "@/store/reviews";

describe("summarize", () => {
  it("handles no reviews", () => expect(summarize([])).toEqual({ count: 0, average: 0, distribution: [0, 0, 0, 0, 0] }));
  it("averages and counts per star", () => {
    const s = summarize([{ rating: 5 }, { rating: 4 }, { rating: 4 }, { rating: 1 }]);
    expect(s.count).toBe(4);
    expect(s.average).toBe(3.5);
    expect(s.distribution).toEqual([1, 0, 0, 2, 1]);
  });
});
