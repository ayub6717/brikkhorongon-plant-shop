"use client";

import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { getProductBySlug } from "@/lib/catalog";
import { getStock } from "@/lib/catalog-state";
import { flyToCart } from "@/lib/fly";
import { useCart } from "@/store/cart";
import { useUi } from "@/store/ui";

export function AddToCart({ slug }: Readonly<{ slug: string }>) {
  const t = useTranslations("Product");
  const add = useCart((s) => s.add);
  const setCart = useUi((s) => s.setCart);
  const stock = getStock(slug);
  const soldOut = stock !== null && stock <= 0;
  const max = Math.min(10, stock ?? 10);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    add(slug, qty);
    const src = getProductBySlug(slug)?.image.src;
    if (src) void flyToCart(e.currentTarget.getBoundingClientRect(), src).then(() => setCart(true));
    else setCart(true);
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <fieldset className="flex items-center rounded-full border border-border bg-surface min-w-0" aria-label={t("quantity")}>
        <button type="button" aria-label={t("decrease")} disabled={qty <= 1} onClick={() => setQty((q) => q - 1)} className="grid size-11 place-items-center rounded-full disabled:opacity-40">
          <Minus className="size-4" aria-hidden />
        </button>
        <span className="w-8 text-center font-medium tabular-nums" aria-live="polite">{qty}</span>
        <button type="button" aria-label={t("increase")} disabled={qty >= max || soldOut} onClick={() => setQty((q) => q + 1)} className="grid size-11 place-items-center rounded-full disabled:opacity-40">
          <Plus className="size-4" aria-hidden />
        </button>
      </fieldset>
      <button
        type="button"
        onClick={onAdd}
        disabled={soldOut}
        className="inline-flex min-w-48 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 font-medium text-primary-foreground shadow-soft transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
      >
        {added ? <Check className="size-5" aria-hidden /> : <ShoppingBag className="size-5" aria-hidden />}
        <span aria-live="polite">{soldOut ? t("outOfStock") : added ? t("added") : t("addToCart")}</span>
      </button>
      {stock !== null && stock > 0 && stock <= 5 && <p className="w-full text-sm font-medium text-accent">{t("onlyLeft", { count: stock })}</p>}
    </div>
  );
}
