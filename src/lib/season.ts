import type { Water } from "@/data/types";
import { WATER_INTERVAL_DAYS } from "./care";

/** Bangladesh's six traditional seasons, approximated by the Gregorian calendar (each starts around the 15th). */
export const SEASONS = ["summer", "monsoon", "autumn", "lateAutumn", "winter", "spring"] as const;
export type Season = (typeof SEASONS)[number];

/** Season for a YYYY-MM-DD key. */
export function seasonOf(dateKey: string): Season {
  const [, m, d] = dateKey.split("-").map(Number);
  const x = m * 100 + d; // e.g. 415
  if (x >= 1215 || x < 215) return "winter";
  if (x < 415) return "spring";
  if (x < 615) return "summer";
  if (x < 815) return "monsoon";
  if (x < 1015) return "autumn";
  return "lateAutumn";
}

/** Multiplier on the watering interval: >1 means water less often. Hot, dry spells dry pots faster; cool or humid ones slower. */
export const SEASON_FACTOR: Record<Season, number> = { summer: 0.75, monsoon: 1.25, autumn: 1, lateAutumn: 1.25, winter: 1.5, spring: 1 };

export function wateringInterval(water: Water, dateKey: string): number {
  return Math.max(2, Math.round(WATER_INTERVAL_DAYS[water] * SEASON_FACTOR[seasonOf(dateKey)]));
}
