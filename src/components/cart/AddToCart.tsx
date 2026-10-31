"use client";

import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/store/cart";

export function AddToCart({ slug }: { slug: string }) {
  const t = useTranslations("Product");
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onAdd = () => {
    add(slug, qty);
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-full border border-border bg-surface" role="group" aria-label={t("quantity")}>
        <button type="button" aria-label={t("decrease")} disabled={qty <= 1} onClick={() => setQty((q) => q - 1)} className="grid size-11 place-items-center rounded-full disabled:opacity-40">
          <Minus className="size-4" aria-hidden />
        </button>
        <span className="w-8 text-center font-medium tabular-nums" aria-live="polite">{qty}</span>
        <button type="button" aria-label={t("increase")} disabled={qty >= 10} onClick={() => setQty((q) => q + 1)} className="grid size-11 place-items-center rounded-full disabled:opacity-40">
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex min-w-48 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 font-medium text-primary-foreground shadow-soft transition hover:opacity-90 sm:flex-none"
      >
        {added ? <Check className="size-5" aria-hidden /> : <ShoppingBag className="size-5" aria-hidden />}
        <span aria-live="polite">{added ? t("added") : t("addToCart")}</span>
      </button>
    </div>
  );
}
