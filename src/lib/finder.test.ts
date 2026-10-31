import { describe, expect, it } from "vitest";
import { products } from "../data/products";
import { parseAnswers, rankProducts, type Answers } from "./finder";

const base: Answers = { light: "bright", water: "regular", care: "any", style: "any", budget: "any" };

describe("rankProducts", () => {
  it("returns at most the requested number of matches, best first", () => {
    const m = rankProducts(products, base, 4);
    expect(m).toHaveLength(4);
    expect(m[0].score).toBeGreaterThanOrEqual(m[3].score);
  });

  it("respects the style preference", () => {
    const m = rankProducts(products, { ...base, style: "flowering" });
    expect(m[0].product.category).toBe("orchids");
  });

  it("keeps expensive plants out of a low budget", () => {
    const m = rankProducts(products, { ...base, budget: "under500" });
    expect(m.slice(0, 3).every((x) => x.product.price < 500)).toBe(true);
  });

  it("hides outdoor bonsai unless bonsai was asked for", () => {
    expect(rankProducts(products, base, 40).some((x) => x.product.bonsai?.placement === "outdoor")).toBe(false);
    expect(rankProducts(products, { ...base, style: "bonsai" })[0].product.category).toBe("bonsai");
  });

  it("never recommends products flagged for review", () => {
    expect(rankProducts(products, base, 40).some((x) => x.product.needsReview)).toBe(false);
  });
});

describe("parseAnswers", () => {
  const from = (o: Record<string, string>) => parseAnswers((k) => o[k]);
  it("accepts a complete valid set", () => {
    expect(from({ light: "low", water: "keen", care: "easy", style: "leafy", budget: "any" })).not.toBeNull();
  });
  it("rejects missing or invalid values", () => {
    expect(from({ light: "low" })).toBeNull();
    expect(from({ light: "x", water: "keen", care: "easy", style: "leafy", budget: "any" })).toBeNull();
  });
});
