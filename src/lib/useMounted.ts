import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False on the server and during hydration, true afterwards. Avoids hydration mismatches for client-only data. */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

/** Today's date in the browser's timezone as YYYY-MM-DD (null on the server). */
export function useTodayKey(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    },
    () => null,
  );
}
