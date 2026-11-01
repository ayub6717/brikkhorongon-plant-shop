import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MAX_COMPARE = 3;

type CompareState = {
  slugs: string[];
  /** Adds or removes a plant. Returns false when the list is full and the plant was not added. */
  toggle: (slug: string) => boolean;
  remove: (slug: string) => void;
  clear: () => void;
};

export const useCompare = create<CompareState>()(
  persist(
    (set, get) => ({
      slugs: [],
      toggle: (slug) => {
        const { slugs } = get();
        if (slugs.includes(slug)) {
          set({ slugs: slugs.filter((x) => x !== slug) });
          return true;
        }
        if (slugs.length >= MAX_COMPARE) return false;
        set({ slugs: [...slugs, slug] });
        return true;
      },
      remove: (slug) => set((s) => ({ slugs: s.slugs.filter((x) => x !== slug) })),
      clear: () => set({ slugs: [] }),
    }),
    { name: "brikkhorongon-compare", version: 1 },
  ),
);
