import { applyCoupon, type CouponResult } from "./coupons";
import { calcShipping, type District } from "./shipping";

export type Totals = {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode: string | null;
  /** null when no code was entered */
  coupon: CouponResult | null;
};

/** One place for the money maths so the cart, checkout and tests agree. */
export function computeTotals(input: { subtotal: number; coupon?: string | null; district?: District | ""; area?: string }): Totals {
  const coupon = applyCoupon(input.coupon, input.subtotal);
  const ok = coupon?.ok ? coupon : null;
  const discount = ok?.discount ?? 0;
  const shipping = ok?.freeShip ? 0 : calcShipping(input.subtotal - discount, input.district, input.area);
  return {
    subtotal: input.subtotal,
    discount,
    shipping,
    total: input.subtotal - discount + shipping,
    couponCode: ok ? ok.coupon.code : null,
    coupon,
  };
}
