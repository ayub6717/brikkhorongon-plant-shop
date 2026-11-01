"use client";

import { useLocale, useTranslations } from "next-intl";
import { CareReminderButton } from "@/components/garden/CareReminderButton";
import { OrderLines } from "@/components/checkout/OrderLines";
import { GrowingPlant } from "@/components/order/GrowingPlant";
import { Link } from "@/i18n/navigation";
import { getProductBySlug } from "@/lib/catalog";
import { formatDateKey } from "@/lib/shipping";
import { useMounted } from "@/lib/useMounted";
import { useOrders } from "@/store/orders";

export function OrderConfirmation({ id }: { id: string }) {
  const t = useTranslations("Order");
  const tc = useTranslations("Checkout");
  const locale = useLocale();
  const mounted = useMounted();
  const order = useOrders((s) => s.orders.find((o) => o.id === id));

  if (!mounted) return <div className="h-64" aria-hidden />;

  if (!order) {
    return (
      <div className="mx-auto max-w-lg rounded-card border border-dashed border-border bg-surface/60 p-12 text-center">
        <h1 className="font-display text-2xl font-semibold">{t("notFoundTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("notFoundBody")}</p>
        <Link href="/shop" className="mt-7 inline-block rounded-full bg-primary px-7 py-3.5 font-medium text-primary-foreground">{t("continue")}</Link>
      </div>
    );
  }

  const reminders = order.lines.flatMap((l) => {
    const p = getProductBySlug(l.slug);
    return p ? [{ slug: p.slug, name: p.name, water: p.care.water, startKey: order.delivery.date, orderId: order.id }] : [];
  });
  const placed = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center">
        <GrowingPlant className="mx-auto h-56 w-auto sm:h-64" />
        <h1 className="mt-5 font-display text-4xl font-semibold">{t("thanks", { name: order.customer.name.split(" ")[0] })}</h1>
        <p className="mt-2 text-muted-foreground">{t("placedBody")}</p>
        <p className="mt-5 inline-block rounded-full bg-muted px-5 py-2 text-sm">
          {t("orderNo")}: <strong className="font-semibold tracking-wide">{order.id}</strong>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{t("keepNumber")}</p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="rounded-card border border-border bg-surface p-5">
          <h2 className="font-display text-lg font-semibold">{t("deliveryTitle")}</h2>
          <p className="mt-3 text-sm font-medium">{formatDateKey(order.delivery.date, locale)}, {tc(`slots.${order.delivery.slot}`)}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            {order.customer.name}<br />
            {order.customer.address}, {order.customer.area}<br />
            {tc(`districts.${order.customer.district}`)}<br />
            {order.customer.phone}
          </p>
        </section>
        <section className="rounded-card border border-border bg-surface p-5">
          <h2 className="font-display text-lg font-semibold">{t("paymentTitle")}</h2>
          <p className="mt-3 text-sm font-medium">{tc(`payments.${order.payment}`)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{order.payment === "cod" ? tc("codHint") : tc("onlineHint")}</p>
          <p className="mt-4 text-xs text-muted-foreground">{t("placedOn", { date: placed })}</p>
        </section>
      </div>

      <section className="mt-6 rounded-card border border-border bg-surface p-5">
        <h2 className="mb-2 font-display text-lg font-semibold">{t("items")}</h2>
        <OrderLines lines={order.lines} subtotal={order.subtotal} shipping={order.shipping} total={order.total} discount={order.discount} couponCode={order.coupon} />
      </section>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={`/track?id=${order.id}`} className="rounded-full bg-primary px-7 py-3.5 font-medium text-primary-foreground shadow-soft">{t("track")}</Link>
        <Link href="/shop" className="rounded-full border border-border px-7 py-3.5 font-medium hover:bg-muted">{t("continue")}</Link>
      </div>
      <div className="mt-6 text-center">
        <CareReminderButton reminders={reminders} />
      </div>
    </div>
  );
}
