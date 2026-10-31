export const DISTRICTS = [
  "dhaka",
  "chattogram",
  "sylhet",
  "rajshahi",
  "khulna",
  "barishal",
  "rangpur",
  "mymensingh",
  "other",
] as const;
export const SLOTS = ["morning", "afternoon", "evening"] as const;
export const PAYMENTS = ["cod", "bkash", "card"] as const;

export type District = (typeof DISTRICTS)[number];
export type Slot = (typeof SLOTS)[number];
export type Payment = (typeof PAYMENTS)[number];

// PLACEHOLDER delivery policy (BDT). Confirm the real numbers before launch.
export const FREE_SHIPPING_THRESHOLD = 3000;
const DHAKA_FEE = 60;
const OUTSIDE_FEE = 120;

export function calcShipping(subtotal: number, district?: District | ""): number {
  if (subtotal <= 0 || subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return !district || district === "dhaka" ? DHAKA_FEE : OUTSIDE_FEE;
}

/** The next `count` delivery dates (YYYY-MM-DD), starting tomorrow. */
export function getDeliveryDates(todayKey: string, count = 7): string[] {
  const [y, m, d] = todayKey.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC(y, m - 1, d + i + 1));
    return date.toISOString().slice(0, 10);
  });
}

/** Formats a YYYY-MM-DD key for display without timezone shifts. */
export function formatDateKey(key: string, locale: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}
