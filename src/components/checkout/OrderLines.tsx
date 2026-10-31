"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { formatPrice } from "@/lib/format";
import type { OrderLine } from "@/store/orders";

export function OrderLines({
  lines,
  subtotal,
  shipping,
  total,
}: {
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
}) {
  const t = useTranslations("Cart");
  const locale = useLocale();

  return (
    <div>
      <ul className="divide-y divide-border">
        {lines.map((l) => (
          <li key={l.slug} className="flex items-center gap-3 py-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
              <Image src={l.image} alt="" fill sizes="56px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{l.name}</p>
              <p className="text-xs text-muted-foreground">× {l.qty}</p>
            </div>
            <p className="text-sm font-medium">{formatPrice(l.price * l.qty, locale)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-3 space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-muted-foreground">{t("subtotal")}</dt><dd>{formatPrice(subtotal, locale)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">{t("delivery")}</dt><dd>{shipping === 0 ? t("free") : formatPrice(shipping, locale)}</dd></div>
        <div className="flex justify-between pt-2 text-base font-semibold"><dt>{t("total")}</dt><dd className="text-primary">{formatPrice(total, locale)}</dd></div>
      </dl>
    </div>
  );
}
