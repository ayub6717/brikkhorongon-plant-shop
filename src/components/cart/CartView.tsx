"use client";

import { Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { resolveLines, subtotalOf } from "@/lib/cart-math";
import { formatPrice } from "@/lib/format";
import { computeTotals } from "@/lib/totals";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import { useMounted } from "@/lib/useMounted";
import { useCart } from "@/store/cart";
import { CouponBox } from "./CouponBox";

export function CartView() {
  const t = useTranslations("Cart");
  const tc = useTranslations("Categories");
  const tcp = useTranslations("Coupon");
  const tco = useTranslations("Checkout");
  const locale = useLocale();
  const mounted = useMounted();
  const lines = useCart((s) => s.lines);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const coupon = useCart((s) => s.coupon);

  if (!mounted) return <div className="h-64" aria-hidden />;

  const resolved = resolveLines(lines, locale);

  if (resolved.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-card border border-dashed border-border bg-surface/60 p-12 text-center">
        <ShoppingBag className="mx-auto size-10 text-primary" aria-hidden />
        <h2 className="mt-5 font-display text-2xl font-semibold">{t("emptyTitle")}</h2>
        <p className="mt-2 text-muted-foreground">{t("emptyBody")}</p>
        <Link href="/shop" className="mt-7 inline-block rounded-full bg-primary px-7 py-3.5 font-medium text-primary-foreground">
          {t("continue")}
        </Link>
      </div>
    );
  }

  const subtotal = subtotalOf(resolved);
  const { discount, couponCode } = computeTotals({ subtotal, coupon });
  const payable = subtotal - discount;
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - payable, 0);
  const progress = Math.min((payable / FREE_SHIPPING_THRESHOLD) * 100, 100);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <ul className="divide-y divide-border rounded-card border border-border bg-surface">
        {resolved.map(({ product, qty }) => (
          <li key={product.slug} className="flex gap-4 p-4 sm:p-5">
            <Link href={`/shop/${product.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-muted sm:size-28">
              <Image src={product.image.src} alt={product.name} fill sizes="112px" className="object-cover" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold leading-snug">
                    <Link href={`/shop/${product.slug}`} className="hover:text-primary">{product.name}</Link>
                  </h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{tc(`${product.category}.name`)}</p>
                </div>
                <p className="font-semibold text-primary">{formatPrice(product.price * qty, locale)}</p>
              </div>
              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="flex items-center rounded-full border border-border" role="group" aria-label={t("quantity", { name: product.name })}>
                  <button type="button" aria-label={t("decrease")} disabled={qty <= 1} onClick={() => setQty(product.slug, qty - 1)} className="grid size-9 place-items-center rounded-full disabled:opacity-40">
                    <Minus className="size-4" aria-hidden />
                  </button>
                  <span className="w-7 text-center text-sm font-medium tabular-nums">{qty}</span>
                  <button type="button" aria-label={t("increase")} disabled={qty >= 20} onClick={() => setQty(product.slug, qty + 1)} className="grid size-9 place-items-center rounded-full disabled:opacity-40">
                    <Plus className="size-4" aria-hidden />
                  </button>
                </div>
                <button type="button" onClick={() => remove(product.slug)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-accent" aria-label={t("removeAria", { name: product.name })}>
                  <Trash2 className="size-4" aria-hidden />
                  {t("remove")}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit space-y-5 rounded-card border border-border bg-surface p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-2xl font-semibold">{t("summary")}</h2>
        <div className="rounded-2xl bg-muted/70 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <Truck className="size-4 text-primary" aria-hidden />
            {remaining > 0 ? t("freeAway", { amount: formatPrice(remaining, locale) }) : t("freeUnlocked")}
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <CouponBox subtotal={subtotal} />
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">{t("subtotal")}</dt><dd className="font-medium">{formatPrice(subtotal, locale)}</dd></div>
          {discount > 0 && <div className="flex justify-between text-primary"><dt>{tcp("discount")} ({couponCode})</dt><dd className="font-medium">−{formatPrice(discount, locale)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted-foreground">{t("delivery")}</dt><dd className="text-muted-foreground">{t("deliveryAtCheckout")}</dd></div>
        </dl>
        <Link href="/checkout" className="block rounded-full bg-primary px-6 py-3.5 text-center font-medium text-primary-foreground shadow-soft transition hover:opacity-90">
          {t("checkout")}
        </Link>
        <p className="text-center text-xs text-muted-foreground">🎁 {tco("giftTeaser")}</p>
        <Link href="/shop" className="block text-center text-sm font-medium text-primary hover:underline">{t("continue")}</Link>
      </aside>
    </div>
  );
}
