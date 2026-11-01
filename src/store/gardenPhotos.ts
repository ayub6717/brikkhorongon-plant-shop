import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GardenPhoto = { id: string; dataUrl: string; at: string };
export const MAX_PHOTOS_PER_PLANT = 4;

/** Growth photos per plant slug, stored only in this browser as small JPEG data URLs. */
type State = {
  photos: Record<string, GardenPhoto[]>;
  add: (slug: string, photo: GardenPhoto) => void;
  remove: (slug: string, id: string) => void;
};

export const useGardenPhotos = create<State>()(
  persist(
    (set) => ({
      photos: {},
      add: (slug, photo) =>
        set((s) => ({ photos: { ...s.photos, [slug]: [photo, ...(s.photos[slug] ?? [])].slice(0, MAX_PHOTOS_PER_PLANT) } })),
      remove: (slug, id) => set((s) => ({ photos: { ...s.photos, [slug]: (s.photos[slug] ?? []).filter((p) => p.id !== id) } })),
    }),
    { name: "brikkhorongon-garden-photos", version: 1 },
  ),
);
