import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Last watering date (YYYY-MM-DD) per plant slug. */
type GardenState = {
  watered: Record<string, string>;
  markWatered: (slug: string, dateKey: string) => void;
};

export const useGarden = create<GardenState>()(
  persist(
    (set) => ({
      watered: {},
      markWatered: (slug, dateKey) => set((s) => ({ watered: { ...s.watered, [slug]: dateKey } })),
    }),
    { name: "brikkhorongon-garden", version: 1 },
  ),
);
