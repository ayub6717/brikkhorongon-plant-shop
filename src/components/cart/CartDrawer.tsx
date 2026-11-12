"use client";

import { Minus, Plus, ShoppingBag, Trash2, Truck, X } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Modal } from "@/components/ui/Modal";
import { Link, usePathname } from "@/i18n/navigation";
import { resolveLines, subtotalOf } from "@/lib/cart-math";
import { formatPrice } from "@/lib/format";
import { shippingConfig } from "@/lib/shipping";
import { useMounted } from "@/lib/useMounted";
import { useCart } from "@/store/cart";
import { useUi } from "@/store/ui";

/** Slide-over cart, opened from the header or after adding a plant. */
export function CartDrawer() {
  const open = useUi((s) => s.cartOpen);
  const setCart = useUi((s) => s.setCart);
  const t = useTranslations("Cart");
  const td = useTranslations("Drawer");
  const tc = useTranslations("Categories");
  const locale = useLocale();
  const pathname = usePathname();
  const mounted = useMounted();
  const lines = useCart((s) => s.lines);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);

  useEffect(() => { setCart(false); }, [pathname, setCart]);

  const close = () => setCart(false);
  const resolved = mounted ? resolveLines(lines, locale) : [];
  const subtotal = subtotalOf(resolved);
  const count = resolved.reduce((n, l) => n + l.qty, 0);
  const remaining = Math.max(shippingConfig.threshold - subtotal, 0);
  const progress = Math.min((subtotal / shippingConfig.threshold) * 100, 100);

  return (
    <Modal open={open} onClose={close} side label={td("title")}>
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="font-display text-xl font-semibold">{td("title")} {count > 0 && <span className="text-base font-normal text-muted-foreground">({td("items", { count })})</span>}</h2>
        <button type="button" onClick={close} aria-label={td("close")} className="grid size-9 place-items-center rounded-full hover:bg-muted"><X className="size-5" aria-hidden /></button>
      </div>

      {resolved.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <ShoppingBag className="size-10 text-primary" aria-hidden />
          <p className="mt-4 font-display text-xl font-semibold">{t("emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("emptyBody")}</p>
          <Link href="/shop" className="mt-6 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground">{t("continue")}</Link>
        </div>
      ) : (
        <>
          <ul className="flex-1 divide-y divide-border overflow-y-auto px-5">
            {resolved.map(({ product, qty }) => (
              <li key={product.slug} className="flex gap-3 py-4">
                <Link href={`/shop/${product.slug}`} className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted"><Image src={product.image.src} alt="" fill sizes="80px" className="object-cover" /></Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/shop/${product.slug}`} className="block truncate font-medium hover:text-primary">{product.name}</Link>
                      <p className="text-xs text-muted-foreground">{tc(`${product.category}.name`)}</p>
                    </div>
                    <p className="text-sm font-semibold text-primary">{formatPrice(product.price * qty, locale)}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <fieldset className="flex items-center rounded-full border border-border min-w-0" aria-label={t("quantity", { name: product.name })}>
                      <button type="button" aria-label={t("decrease")} disabled={qty <= 1} onClick={() => setQty(product.slug, qty - 1)} className="grid size-8 place-items-center rounded-full disabled:opacity-40"><Minus className="size-3.5" aria-hidden /></button>
                      <span className="w-6 text-center text-sm font-medium tabular-nums">{qty}</span>
                      <button type="button" aria-label={t("increase")} disabled={qty >= 20} onClick={() => setQty(product.slug, qty + 1)} className="grid size-8 place-items-center rounded-full disabled:opacity-40"><Plus className="size-3.5" aria-hidden /></button>
                    </fieldset>
                    <button type="button" onClick={() => remove(product.slug)} aria-label={t("removeAria", { name: product.name })} className="p-1.5 text-muted-foreground transition hover:text-accent"><Trash2 className="size-4" aria-hidden /></button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="space-y-4 border-t border-border bg-surface/60 px-5 py-4">
            <div className="text-sm">
              <p className="flex items-center gap-2 font-medium"><Truck className="size-4 text-primary" aria-hidden />{remaining > 0 ? t("freeAway", { amount: formatPrice(remaining, locale) }) : t("freeUnlocked")}</p>
              <ProgressBar className="mt-2" value={Math.round(progress)} label={t("freeProgress")} />
            </div>
            <p className="flex justify-between text-base font-semibold"><span>{t("subtotal")}</span><span className="text-primary">{formatPrice(subtotal, locale)}</span></p>
            <div className="grid gap-2">
              <Link href="/checkout" className="rounded-full bg-primary px-6 py-3.5 text-center font-medium text-primary-foreground shadow-soft transition hover:opacity-90">{t("checkout")}</Link>
              <Link href="/cart" className="rounded-full border border-border px-6 py-3 text-center text-sm font-medium transition hover:bg-muted">{td("viewCart")}</Link>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
