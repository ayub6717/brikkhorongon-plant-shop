"use client";

import { Droplets, Sprout, Truck } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getProductBySlug } from "@/lib/catalog";
import { dueState, nextWatering, WATER_INTERVAL_DAYS } from "@/lib/care";
import { formatDateKey } from "@/lib/shipping";
import { useMounted, useTodayKey } from "@/lib/useMounted";
import type { CareReminder } from "@/lib/ics";
import { cn } from "@/lib/utils";
import { useGarden } from "@/store/garden";
import { useOrders } from "@/store/orders";
import { CareReminderButton } from "./CareReminderButton";

export function GardenView() {
  const t = useTranslations("Garden");
  const locale = useLocale();
  const mounted = useMounted();
  const today = useTodayKey();
  const orders = useOrders((s) => s.orders);
  const watered = useGarden((s) => s.watered);
  const markWatered = useGarden((s) => s.markWatered);

  if (!mounted || !today) return <div className="h-64" aria-hidden />;

  // One entry per plant: the most recent delivery, with its total quantity.
  const arrived = new Map<string, { arrivedKey: string; qty: number }>();
  let onTheWay = 0;
  for (const o of orders) {
    for (const l of o.lines) {
      if (o.status === "delivered") {
        const cur = arrived.get(l.slug);
        arrived.set(l.slug, { arrivedKey: cur && cur.arrivedKey > o.delivery.date ? cur.arrivedKey : o.delivery.date, qty: (cur?.qty ?? 0) + l.qty });
      } else {
        onTheWay += l.qty;
      }
    }
  }

  const plants = [...arrived.entries()].flatMap(([slug, a]) => {
    const product = getProductBySlug(slug);
    if (!product) return [];
    const next = nextWatering(a.arrivedKey, product.care.water, watered[slug]);
    return [{ product, qty: a.qty, base: watered[slug] ?? a.arrivedKey, next, due: dueState(today, next) }];
  }).sort((a, b) => a.next.localeCompare(b.next));

  const reminders: CareReminder[] = plants.map((p) => ({ slug: p.product.slug, name: p.product.name, water: p.product.care.water, startKey: p.base }));

  const dueLabel = (d: (typeof plants)[number]["due"]) =>
    d.kind === "overdue" ? t("overdue", { days: Math.abs(d.days) }) : d.kind === "today" ? t("today") : d.kind === "soon" ? t("soon", { days: d.days }) : t("later", { days: d.days });

  if (plants.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-card border border-border bg-surface px-8 py-14 text-center">
        <Sprout className="mx-auto size-10 text-primary" aria-hidden />
        <p className="mt-4 font-display text-2xl font-semibold">{t("emptyTitle")}</p>
        <p className="mt-2 text-muted-foreground">{t("emptyBody")}</p>
        {onTheWay > 0 && <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm"><Truck className="size-4 text-primary" aria-hidden />{t("onTheWay", { count: onTheWay })}</p>}
        <div className="mt-6"><Link href="/shop" className="inline-block rounded-full bg-primary px-7 py-3 font-medium text-primary-foreground">{t("browse")}</Link></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        {onTheWay > 0 ? <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm"><Truck className="size-4 text-primary" aria-hidden />{t("onTheWay", { count: onTheWay })}</p> : <span />}
        <CareReminderButton reminders={reminders} label={t("remindAll")} />
      </div>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {plants.map(({ product, qty, next, due }) => (
          <li key={product.slug} className="flex gap-4 rounded-card border border-border bg-surface p-4 shadow-soft">
            <Link href={`/shop/${product.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-muted">
              <Image src={product.image.src} alt="" fill sizes="96px" className="object-cover" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <Link href={`/shop/${product.slug}`} className="truncate font-display text-lg font-semibold hover:text-primary">{product.name}{qty > 1 ? ` × ${qty}` : ""}</Link>
              <p className="text-xs text-muted-foreground">{t("every", { days: WATER_INTERVAL_DAYS[product.care.water] })}</p>
              <p className={cn("mt-2 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", due.kind === "overdue" ? "bg-accent/15 text-accent" : due.kind === "today" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                <Droplets className="size-3.5" aria-hidden />{dueLabel(due)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t("next")}: {formatDateKey(next, locale)}</p>
              <button type="button" onClick={() => markWatered(product.slug, today)} className="mt-auto pt-3 text-start text-sm font-medium text-primary hover:underline">{t("waterNow")}</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
