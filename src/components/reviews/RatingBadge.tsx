"use client";

import { Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRatingSummary } from "@/lib/api/queries";

/** Small "★ 4.5 (3)" shown on product cards once a plant has reviews. */
export function RatingBadge({ slug }: Readonly<{ slug: string }>) {
  const t = useTranslations("Reviews");
  const locale = useLocale();
  const { data } = useRatingSummary(slug);
  if (!data?.count) return null;
  const { count, average } = data;
  const nf = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en", { maximumFractionDigits: 1 });
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" aria-label={t("badgeAria", { avg: nf.format(average), count })}>
      <Star className="size-3.5 fill-amber-500 text-amber-500" aria-hidden />
      <span aria-hidden>{nf.format(average)} ({nf.format(count)})</span>
    </span>
  );
}
