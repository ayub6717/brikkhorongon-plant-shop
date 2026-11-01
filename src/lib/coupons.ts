/**
 * DEMO coupon codes. Replace with real campaigns (and server-side validation) before launch.
 * kind: percent → value is a percentage; fixed → value is BDT off; freeShip → delivery is free.
 */
export type Coupon = { code: string; kind: "percent" | "fixed" | "freeShip"; value: number; minSubtotal: number };

export const COUPONS: Coupon[] = [
  { code: "WELCOME10", kind: "percent", value: 10, minSubtotal: 500 },
  { code: "PLANT100", kind: "fixed", value: 100, minSubtotal: 1500 },
  { code: "FREESHIP", kind: "freeShip", value: 0, minSubtotal: 1000 },
];

export type CouponResult =
  | { ok: true; coupon: Coupon; discount: number; freeShip: boolean }
  | { ok: false; reason: "unknown" | "min"; min?: number };

export function applyCoupon(code: string | null | undefined, subtotal: number): CouponResult | null {
  const wanted = code?.trim().toUpperCase();
  if (!wanted) return null;
  const coupon = COUPONS.find((c) => c.code === wanted);
  if (!coupon) return { ok: false, reason: "unknown" };
  if (subtotal < coupon.minSubtotal) return { ok: false, reason: "min", min: coupon.minSubtotal };
  const raw = coupon.kind === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.kind === "fixed" ? coupon.value : 0;
  return { ok: true, coupon, discount: Math.min(raw, subtotal), freeShip: coupon.kind === "freeShip" };
}
