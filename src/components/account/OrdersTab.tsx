"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { getProductBySlug } from "@/lib/catalog";
import { isOutOfStock } from "@/lib/catalog-state";
import { useCart } from "@/store/cart";
import type { Order } from "@/store/orders";
import { card, dayLabel, isActive } from "./shared";

const FILTERS = ["all", "active", "delivered", "cancelled"] as const;
type Filter = (typeof FILTERS)[number];

const badge = (status: string) =>
  status === "delivered" ? "bg-primary/10 text-primary" : status === "cancelled" ? "bg-accent/10 text-accent" : "bg-muted text-foreground";

export function OrdersTab({ orders }: Readonly<{ orders: Order[] }>) {
  const t = useTranslations("Dashboard");
  const tt = useTranslations("Track");
  const tc = useTranslations("Checkout");
  const locale = useLocale();
  const router = useRouter();
  const addToCart = useCart((s) => s.add);
  const [filter, setFilter] = useState<Filter>("all");
  const [note, setNote] = useState<{ id: string; added: number; skipped: number } | null>(null);
  const money = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD");
  const when = (iso: string) => new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { dateStyle: "medium" }).format(new Date(iso));

  const shown = orders.filter((o) => (filter === "all" ? true : filter === "active" ? isActive(o.status) : o.status === filter));

  // Put the same plants back in the cart, skipping any that are gone or sold out.
  function reorder(o: Order) {
    let added = 0;
    let skipped = 0;
    for (const l of o.lines) {
      if (!getProductBySlug(l.slug) || isOutOfStock(l.slug)) { skipped++; continue; }
      addToCart(l.slug, l.qty);
      added++;
    }
    if (skipped === 0 && added > 0) { router.push("/cart"); return; }
    setNote({ id: o.id, added, skipped });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold">{t("ordersTitle")}</h2>
        <div role="group" aria-label={t("filter")} className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
            >
              {t(`filters.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className={`${card} text-center text-sm text-muted-foreground`}>
          {orders.length === 0 ? t("noOrders") : t("noMatch")}{" "}
          {orders.length === 0 && <Link href="/shop" className="font-medium text-primary underline-offset-4 hover:underline">{t("shopNow")}</Link>}
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((o) => (
            <li key={o.id} className={card}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium tracking-wide">{o.id}</p>
                  <p className="text-xs text-muted-foreground">{when(o.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge(o.status)}`}>{tt(`steps.${o.status}`)}</span>
                  {o.paymentStatus && <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{t(`pay.${o.paymentStatus}`)}</span>}
                  <span className="font-medium tabular-nums">৳{money.format(o.total)}</span>
                </div>
              </div>

              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {o.lines.map((l) => <li key={l.slug}>{l.name} × {l.qty}</li>)}
              </ul>

              {o.status === "cancelled" && o.cancelReason && <p className="mt-2 text-xs text-muted-foreground">{t("cancelReason", { reason: o.cancelReason })}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link href={`/track?id=${o.id}`} className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">{t("trackOrder")}</Link>
                <button type="button" onClick={() => reorder(o)} className="rounded-full border border-border px-4 py-2 text-xs font-medium transition hover:bg-muted">{t("reorder")}</button>
              </div>

              {note?.id === o.id && (
                <p role="status" className="mt-3 text-xs text-muted-foreground">
                  {note.added > 0 ? t("reorderPartial", { added: note.added, skipped: note.skipped }) : t("reorderNone")}{" "}
                  {note.added > 0 && <Link href="/cart" className="font-medium text-primary underline-offset-4 hover:underline">{t("openCart")}</Link>}
                </p>
              )}

              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-xs font-medium text-primary">{t("details")}</summary>
                <dl className="mt-3 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
                  <div><dt className="text-muted-foreground">{t("deliveryOn")}</dt><dd>{dayLabel(o.delivery.date, locale)} · {tc(`slots.${o.delivery.slot}`)}</dd></div>
                  <div><dt className="text-muted-foreground">{t("deliverTo")}</dt><dd>{o.customer.address}, {o.customer.area}, {tc(`districts.${o.customer.district}`)}</dd></div>
                  <div><dt className="text-muted-foreground">{t("paymentMethod")}</dt><dd>{tc(`payments.${o.payment}`)}</dd></div>
                  <div><dt className="text-muted-foreground">{t("totals")}</dt><dd className="tabular-nums">
                    ৳{money.format(o.subtotal)}{o.discount ? ` − ৳${money.format(o.discount)}` : ""} + ৳{money.format(o.shipping)} = <strong>৳{money.format(o.total)}</strong>
                  </dd></div>
                </dl>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
