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

/** Flat fee per district outside Dhaka. */
export const DISTRICT_FEES: Record<Exclude<District, "dhaka">, number> = {
  chattogram: 120,
  mymensingh: 120,
  sylhet: 130,
  rajshahi: 130,
  khulna: 130,
  barishal: 140,
  rangpur: 140,
  other: 150,
};
const DHAKA_INNER_FEE = 60;
const DHAKA_OUTER_FEE = 100;

/**
 * The live delivery rules. They start as the placeholders above; with the server on, the shop owner's settings
 * (Admin → Settings) replace them as soon as the catalog loads (see catalog-state.ts).
 */
export const shippingConfig = {
  threshold: FREE_SHIPPING_THRESHOLD,
  inner: DHAKA_INNER_FEE,
  outer: DHAKA_OUTER_FEE,
  fees: { ...DISTRICT_FEES } as Record<string, number>,
  slots: [...SLOTS] as string[],
};

/** Areas inside the Dhaka city delivery zone (English and Bangla spellings). */
export const INNER_DHAKA_AREAS = [
  "mirpur", "dhanmondi", "gulshan", "banani", "uttara", "mohammadpur", "bashundhara", "badda", "motijheel", "khilgaon",
  "tejgaon", "farmgate", "mohakhali", "malibagh", "rampura", "shyamoli", "lalmatia", "baridhara", "niketan", "wari",
  "paltan", "shantinagar", "jatrabari", "old dhaka", "shahbag", "kalabagan", "kawran bazar", "mogbazar",
  "মিরপুর", "ধানমন্ডি", "গুলশান", "বনানী", "উত্তরা", "মোহাম্মদপুর", "বসুন্ধরা", "বাড্ডা", "মতিঝিল", "খিলগাঁও",
  "তেজগাঁও", "ফার্মগেট", "মহাখালী", "মালিবাগ", "রামপুরা", "শ্যামলী", "লালমাটিয়া", "বারিধারা", "নিকেতন", "ওয়ারী",
  "পল্টন", "শান্তিনগর", "যাত্রাবাড়ী", "শাহবাগ", "কলাবাগান",
] as const;

export const isInnerDhaka = (area?: string): boolean => {
  const a = area?.trim().toLowerCase();
  return !!a && INNER_DHAKA_AREAS.some((x) => a.includes(x));
};

/**
 * Delivery fee for an order. Free above the threshold. Inside Dhaka the fee depends on the area
 * (city zone vs. outer areas); elsewhere it is a flat per-district fee. With no district yet we
 * show the lowest fee as an estimate.
 */
export function calcShipping(subtotal: number, district?: District | "", area?: string): number {
  const c = shippingConfig;
  if (subtotal <= 0 || subtotal >= c.threshold) return 0;
  if (!district) return c.inner;
  if (district === "dhaka") return !area?.trim() || isInnerDhaka(area) ? c.inner : c.outer;
  return c.fees[district] ?? c.fees.other ?? DISTRICT_FEES.other;
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
