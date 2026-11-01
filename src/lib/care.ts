import type { Water } from "@/data/types";

/** General watering rhythm, in days. A starting point; each plant's guide has the detail. */
export const WATER_INTERVAL_DAYS: Record<Water, number> = { low: 14, moderate: 7, high: 4 };

const MS_DAY = 86_400_000;
const toUtc = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

export const addDays = (key: string, days: number): string => new Date(toUtc(key) + days * MS_DAY).toISOString().slice(0, 10);

/** Whole days from `fromKey` to `toKey` (negative when `toKey` is earlier). */
export const diffDays = (fromKey: string, toKey: string): number => Math.round((toUtc(toKey) - toUtc(fromKey)) / MS_DAY);

/** First watering is one interval after the plant arrives; afterwards one interval after the last watering. */
export function nextWatering(arrivedKey: string, water: Water, lastWateredKey?: string): string {
  return addDays(lastWateredKey ?? arrivedKey, WATER_INTERVAL_DAYS[water]);
}

export type DueState = { kind: "overdue" | "today" | "soon" | "later"; days: number };

export function dueState(todayKey: string, nextKey: string): DueState {
  const days = diffDays(todayKey, nextKey);
  return { kind: days < 0 ? "overdue" : days === 0 ? "today" : days <= 2 ? "soon" : "later", days };
}
