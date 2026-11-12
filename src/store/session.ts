import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { District } from "@/lib/shipping";

export type SavedAddress = { id: string; label: string; district: District; area: string; address: string };
export type User = { id: string; name: string; email: string; phone: string; addresses: SavedAddress[]; createdAt: string; roles?: string[] };

/**
 * DEMO session kept in this browser. There are no passwords and no server: the real API
 * (ASP.NET Core Identity + JWT) replaces this, and the UI talks to it through `lib/api`.
 */
type State = { user: User | null; set: (user: User | null) => void };

export const useSession = create<State>()(
  persist((set) => ({ user: null, set: (user) => set({ user }) }), { name: "brikkhorongon-session", version: 1 }),
);
