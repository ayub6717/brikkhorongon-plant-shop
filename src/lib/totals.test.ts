import { describe, expect, it } from "vitest";
import { applyCoupon } from "./coupons";
import { calcShipping, FREE_SHIPPING_THRESHOLD } from "./shipping";
import { computeTotals } from "./totals";

describe("calcShipping", () => {
  it("is free at or above the threshold and for an empty cart", () => {
    expect(calcShipping(FREE_SHIPPING_THRESHOLD, "dhaka")).toBe(0);
    expect(calcShipping(0, "dhaka")).toBe(0);
  });
  it("charges by area inside Dhaka", () => {
    expect(calcShipping(1000, "dhaka", "Mirpur 10")).toBe(60);
    expect(calcShipping(1000, "dhaka", "মিরপুর")).toBe(60);
    expect(calcShipping(1000, "dhaka", "Savar")).toBe(100);
    expect(calcShipping(1000, "dhaka", "")).toBe(60);
  });
  it("charges a flat fee per other district", () => {
    expect(calcShipping(1000, "sylhet")).toBe(130);
    expect(calcShipping(1000, "other")).toBe(150);
  });
});

describe("applyCoupon", () => {
  it("ignores empty codes and rejects unknown ones", () => {
    expect(applyCoupon("", 1000)).toBeNull();
    expect(applyCoupon("NOPE", 1000)).toEqual({ ok: false, reason: "unknown" });
  });
  it("is case-insensitive and enforces the minimum", () => {
    expect(applyCoupon("welcome10", 1000)).toMatchObject({ ok: true, discount: 100 });
    expect(applyCoupon("WELCOME10", 100)).toEqual({ ok: false, reason: "min", min: 500 });
  });
  it("never discounts more than the subtotal", () => {
    expect(applyCoupon("PLANT100", 1500)).toMatchObject({ ok: true, discount: 100 });
  });
});

describe("computeTotals", () => {
  it("applies a percent coupon before delivery", () => {
    const t = computeTotals({ subtotal: 1000, coupon: "WELCOME10", district: "dhaka", area: "Gulshan" });
    expect(t).toMatchObject({ discount: 100, shipping: 60, total: 960, couponCode: "WELCOME10" });
  });
  it("makes delivery free with FREESHIP", () => {
    expect(computeTotals({ subtotal: 1200, coupon: "FREESHIP", district: "sylhet" })).toMatchObject({ shipping: 0, total: 1200 });
  });
  it("can unlock free delivery by crossing the threshold only before discount rules", () => {
    expect(computeTotals({ subtotal: 3200, district: "other" }).shipping).toBe(0);
  });
  it("keeps invalid coupons from changing the total", () => {
    expect(computeTotals({ subtotal: 1000, coupon: "BAD", district: "dhaka" }).total).toBe(1060);
  });
});
