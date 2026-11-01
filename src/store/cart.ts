import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = { slug: string; qty: number };

type CartState = {
  lines: CartLine[];
  /** Applied coupon code (validated against the current subtotal when totals are computed). */
  coupon: string | null;
  setCoupon: (code: string | null) => void;
  add: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const MAX_QTY = 20;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      coupon: null,
      setCoupon: (coupon) => set({ coupon }),
      add: (slug, qty = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.slug === slug);
          if (!existing) return { lines: [...s.lines, { slug, qty: Math.min(qty, MAX_QTY) }] };
          return {
            lines: s.lines.map((l) => (l.slug === slug ? { ...l, qty: Math.min(l.qty + qty, MAX_QTY) } : l)),
          };
        }),
      setQty: (slug, qty) =>
        set((s) => ({
          lines: qty <= 0 ? s.lines.filter((l) => l.slug !== slug) : s.lines.map((l) => (l.slug === slug ? { ...l, qty: Math.min(qty, MAX_QTY) } : l)),
        })),
      remove: (slug) => set((s) => ({ lines: s.lines.filter((l) => l.slug !== slug) })),
      clear: () => set({ lines: [], coupon: null }),
    }),
    {
      name: "brikkhorongon-cart",
      version: 2,
      migrate: (persisted) => ({ coupon: null, ...(persisted as object) }) as CartState,
    },
  ),
);

export const selectCount = (s: CartState) => s.lines.reduce((n, l) => n + l.qty, 0);
