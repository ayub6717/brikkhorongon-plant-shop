import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_RECENT = 8;

type RecentState = {
  slugs: string[];
  record: (slug: string) => void;
};

export const useRecent = create<RecentState>()(
  persist(
    (set) => ({
      slugs: [],
      record: (slug) => set((s) => (s.slugs[0] === slug ? s : { slugs: [slug, ...s.slugs.filter((x) => x !== slug)].slice(0, MAX_RECENT) })),
    }),
    { name: "brikkhorongon-recent", version: 1 },
  ),
);
