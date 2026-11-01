import { create } from "zustand";

/** Transient UI state shared across the header, drawer and palette (not persisted). */
type UiState = {
  paletteOpen: boolean;
  cartOpen: boolean;
  setPalette: (open: boolean) => void;
  setCart: (open: boolean) => void;
};

export const useUi = create<UiState>()((set) => ({
  paletteOpen: false,
  cartOpen: false,
  setPalette: (paletteOpen) => set({ paletteOpen, ...(paletteOpen ? { cartOpen: false } : {}) }),
  setCart: (cartOpen) => set({ cartOpen, ...(cartOpen ? { paletteOpen: false } : {}) }),
}));
