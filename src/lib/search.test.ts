import { describe, expect, it } from "vitest";
import { products } from "../data/products";
import { searchProducts } from "./search";

describe("searchProducts", () => {
  it("returns nothing for an empty query", () => {
    expect(searchProducts("  ", products)).toEqual([]);
  });

  it("ranks names that start with the query first", () => {
    const first = products[0].name.split(" ")[0];
    const r = searchProducts(first, products);
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].name.toLowerCase().startsWith(first.toLowerCase())).toBe(true);
  });

  it("requires every word to match", () => {
    expect(searchProducts("orchid zzzzqqq", products)).toEqual([]);
  });

  it("matches the category and respects the limit", () => {
    const r = searchProducts("bonsai", products, undefined, 3);
    expect(r.length).toBeLessThanOrEqual(3);
    expect(r.length).toBeGreaterThan(0);
  });
});
