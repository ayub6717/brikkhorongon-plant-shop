"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { OrderLines } from "@/components/checkout/OrderLines";
import { Link, useRouter } from "@/i18n/navigation";
import { formatDateKey } from "@/lib/shipping";
import { usingServer } from "@/lib/api";
import { useOrderQuery, useOrdersQuery, useSessionQuery } from "@/lib/api/queries";
import { DeliveryScene } from "./DeliveryScene";
import { DemoControls } from "./DemoControls";
import { ModifyRequests } from "./ModifyRequests";
import { Timeline } from "./Timeline";

const normalize = (v: string) => v.trim().toUpperCase();

export function TrackView() {
  const t = useTranslations("Track");
  const tc = useTranslations("Checkout");
  const locale = useLocale();
  const uid = useId();
  const router = useRouter();
  const params = useSearchParams();
  const { data: orders = [] } = useOrdersQuery(); // only for the "recent orders" chips
  const { data: user } = useSessionQuery();
  // With a real server only the shop team (Admin role) may move orders along; the demo site lets everyone.
  const showDemoControls = !usingServer || user?.roles?.includes("Admin");

  const queryId = normalize(params.get("id") ?? "");
  const [value, setValue] = useState(queryId);
  // Look the order up by its number (not in my own list), so the shop team can open any customer's order.
  const { data: order, isPending: orderPending } = useOrderQuery(queryId || undefined);
  const isPending = Boolean(queryId) && orderPending;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const id = normalize(value);
    router.replace(id ? `/track?id=${encodeURIComponent(id)}` : "/track");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">{t("title")}</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t("subtitle")}</p>
      </div>

      <form onSubmit={onSubmit} role="search" className="mx-auto mt-8 flex max-w-xl gap-2">
        <label htmlFor={`${uid}-id`} className="sr-only">{t("lookupLabel")}</label>
        <input
          id={`${uid}-id`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("lookupPlaceholder")}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-full border border-border bg-surface px-5 py-3 text-sm uppercase outline-none transition placeholder:normal-case placeholder:text-muted-foreground focus:border-primary"
        />
        <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft">
          <Search className="size-4" aria-hidden />{t("lookupBtn")}
        </button>
      </form>

      {isPending ? (
        <div className="h-64" aria-hidden />
      ) : order ? (
        <div className="mt-10 space-y-6">
          <section className="rounded-card border border-border bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-semibold">{t("orderNo")} <span className="tracking-wide">{order.id}</span></h2>
              <Link href={`/order/${order.id}`} className="text-sm font-medium text-primary underline-offset-4 hover:underline">{t("viewOrder")}</Link>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("eta")}: <strong className="font-medium text-foreground">{formatDateKey(order.delivery.date, locale)}, {tc(`slots.${order.delivery.slot}`)}</strong>
            </p>
            {order.status !== "cancelled" && <div className="mt-5"><DeliveryScene status={order.status} /></div>}
            <div className="mt-6"><Timeline order={order} /></div>
          </section>

          <ModifyRequests order={order} />

          <section className="rounded-card border border-border bg-surface p-5 sm:p-6">
            <h2 className="mb-2 font-display text-xl font-semibold">{t("items")}</h2>
            <OrderLines lines={order.lines} subtotal={order.subtotal} shipping={order.shipping} total={order.total} discount={order.discount} couponCode={order.coupon} />
          </section>

          {showDemoControls && <DemoControls order={order} />}
        </div>
      ) : (
        <div className="mt-10">
          {queryId && (
            <div className="rounded-card border border-dashed border-border bg-surface/60 p-8 text-center">
              <h2 className="font-display text-xl font-semibold">{t("notFoundTitle")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("notFoundBody", { id: queryId })}</p>
            </div>
          )}
          <div className="mt-8"><DeliveryScene /></div>
          {orders.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("recent")}</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {orders.slice(0, 5).map((o) => (
                  <li key={o.id}>
                    <Link href={`/track?id=${o.id}`} className="inline-block rounded-full border border-border px-4 py-2 text-sm font-medium tracking-wide hover:border-primary/60 hover:bg-muted">{o.id}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-6 text-center text-xs text-muted-foreground">{t("deviceNote")}</p>
        </div>
      )}
    </div>
  );
}
