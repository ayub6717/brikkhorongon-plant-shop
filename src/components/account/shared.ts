export const card = "rounded-card border border-border bg-surface p-5 sm:p-6";
export const inputCls = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary aria-[invalid=true]:border-accent";

export const isActive = (status: string) => status !== "delivered" && status !== "cancelled";

/** A calendar day (YYYY-MM-DD) shown as a date, without timezone shifts. */
export function dayLabel(day: string, locale: string) {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return day;
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { dateStyle: "medium" }).format(new Date(y, m - 1, d));
}
