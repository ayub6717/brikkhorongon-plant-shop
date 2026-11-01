import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Answers } from "@/lib/finder";

/** The person's latest plant-finder answers, used to personalise the home page. */
type PrefsState = {
  finder: Answers | null;
  setFinder: (a: Answers) => void;
  clearFinder: () => void;
};

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      finder: null,
      setFinder: (finder) => set({ finder }),
      clearFinder: () => set({ finder: null }),
    }),
    { name: "brikkhorongon-prefs", version: 1 },
  ),
);
