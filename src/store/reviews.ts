import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Review = {
  id: string;
  slug: string;
  name: string;
  rating: number;
  title: string;
  text: string;
  at: string;
  /** Server only: the author has a delivered order with this plant. */
  verified?: boolean;
  /** Server only: whether the current visitor may delete it (author or shop team). */
  canDelete?: boolean;
};

/**
 * Reviews written in this browser. There is no backend yet, so reviews are local to the device
 * and no sample reviews are seeded: every review shown is one a real visitor typed.
 */
type State = {
  reviews: Review[];
  add: (r: Omit<Review, "id" | "at">) => void;
  remove: (id: string) => void;
};

export const useReviews = create<State>()(
  persist(
    (set) => ({
      reviews: [],
      add: (r) => set((s) => ({ reviews: [{ ...r, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString() }, ...s.reviews] })),
      remove: (id) => set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) })),
    }),
    { name: "brikkhorongon-reviews", version: 1 },
  ),
);

export type RatingSummary = { count: number; average: number; distribution: [number, number, number, number, number] };

/** Average and 1–5 star distribution (index 0 = 1 star). */
export function summarize(reviews: Pick<Review, "rating">[]): RatingSummary {
  const distribution: RatingSummary["distribution"] = [0, 0, 0, 0, 0];
  for (const r of reviews) distribution[Math.min(5, Math.max(1, r.rating)) - 1]++;
  const count = reviews.length;
  const average = count ? reviews.reduce((n, r) => n + r.rating, 0) / count : 0;
  return { count, average, distribution };
}
