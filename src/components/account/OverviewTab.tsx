"use client";

import { Bell, Heart, Package, Sprout } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { NotificationList } from "@/components/layout/NotificationList";
import { usingServer } from "@/lib/api";
import { useNotifications } from "@/lib/api/notifications";
import { ORDER_STEPS, stepIndex, type Order } from "@/store/orders";
import { useGarden } from "@/store/garden";
import { useWishlist } from "@/store/wishlist";
import { card, dayLabel, isActive } from "./shared";

export function OverviewTab({ orders, name }: Readonly<{ orders: Order[]; name: string }>) {
  const t = useTranslations("Dashboard");
  const tt = useTranslations("Track");
  const tc = useTranslations("Checkout");
  const locale = useLocale();
  const wishes = useWishlist((s) => s.slugs.length);
  const gardenCount = useGarden((s) => Object.keys(s.watered).length);
  const { data: notes } = useNotifications(usingServer);
  const money = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD");
  const num = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en");

  const live = orders.filter((o) => o.status !== "cancelled");
  const spent = live.reduce((n, o) => n + o.total, 0);
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const active = orders.filter((o) => isActive(o.status)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const next = active[0];
  const recent = orders.slice(0, 3);

  const stats = [
    { label: t("statOrders"), value: num.format(orders.length) },
    { label: t("statActive"), value: num.format(active.length) },
    { label: t("statDelivered"), value: num.format(delivered) },
    { label: t("statSpent"), value: `৳${money.format(spent)}` },
  ];
  const first = name.trim().split(/\s+/)[0] ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">{t("hello", { name: first })}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{orders.length === 0 ? t("helloEmpty") : t("helloBody")}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-card border border-border bg-surface p-4">
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className="mt-1 font-display text-2xl font-semibold tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      {next ? (
        <section className={card} aria-labelledby="dash-active">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 id="dash-active" className="font-display text-xl font-semibold">{t("onTheWay")}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {next.id} · {t("arrives", { date: dayLabel(next.delivery.date, locale), slot: tc(`slots.${next.delivery.slot}`) })}
              </p>
            </div>
            <Link href={`/track?id=${next.id}`} className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">{t("trackOrder")}</Link>
          </div>
          <ol className="mt-5 grid grid-cols-5 gap-1.5" aria-label={tt("timelineLabel")}>
            {ORDER_STEPS.map((step, i) => {
              const done = i <= stepIndex(next.status);
              return (
                <li key={step} className="min-w-0">
                  <div className={`h-1.5 rounded-full ${done ? "bg-primary" : "bg-muted"}`} aria-hidden />
                  <p className={`mt-1.5 truncate text-[11px] sm:text-xs ${i === stepIndex(next.status) ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{tt(`steps.${step}`)}</p>
                </li>
              );
            })}
          </ol>
          {active.length > 1 && <p className="mt-4 text-xs text-muted-foreground">{t("moreActive", { count: active.length - 1 })}</p>}
        </section>
      ) : (
        orders.length > 0 && (
          <section className={`${card} text-sm text-muted-foreground`}>
            {t("nothingActive")} <Link href="/shop" className="font-medium text-primary underline-offset-4 hover:underline">{t("shopNow")}</Link>
          </section>
        )
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/wishlist" className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 transition hover:bg-muted">
          <Heart className="size-5 text-primary" aria-hidden />
          <span className="text-sm"><strong className="block font-medium">{t("wishlist")}</strong><span className="text-muted-foreground">{t("plantsCount", { count: wishes })}</span></span>
        </Link>
        <Link href="/garden" className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 transition hover:bg-muted">
          <Sprout className="size-5 text-primary" aria-hidden />
          <span className="text-sm"><strong className="block font-medium">{t("garden")}</strong><span className="text-muted-foreground">{t("plantsCount", { count: gardenCount })}</span></span>
        </Link>
        <Link href="/shop" className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 transition hover:bg-muted">
          <Package className="size-5 text-primary" aria-hidden />
          <span className="text-sm"><strong className="block font-medium">{t("shop")}</strong><span className="text-muted-foreground">{t("shopHint")}</span></span>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card} aria-labelledby="dash-recent">
          <div className="flex items-center justify-between">
            <h3 id="dash-recent" className="font-display text-lg font-semibold">{t("recentOrders")}</h3>
            {orders.length > 0 && <Link href="/account?tab=orders" className="text-xs font-medium text-primary underline-offset-4 hover:underline">{t("seeAll")}</Link>}
          </div>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("noOrders")}</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {recent.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium tracking-wide">{o.id}</p>
                    <p className="text-xs text-muted-foreground">{tt(`steps.${o.status}`)}</p>
                  </div>
                  <span className="tabular-nums">৳{money.format(o.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {usingServer && (
          <section className={`${card} px-0 sm:px-0`} aria-labelledby="dash-news">
            <div className="flex items-center justify-between px-5 sm:px-6">
              <h3 id="dash-news" className="flex items-center gap-2 font-display text-lg font-semibold"><Bell className="size-4 text-primary" aria-hidden />{t("latestNews")}</h3>
              <Link href="/account?tab=notifications" className="text-xs font-medium text-primary underline-offset-4 hover:underline">{t("seeAll")}</Link>
            </div>
            <NotificationList items={(notes?.items ?? []).slice(0, 3)} unread={notes?.unread ?? 0} />
          </section>
        )}
      </div>
    </div>
  );
}
