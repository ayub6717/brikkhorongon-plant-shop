"use client";

import { Tag, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { applyCoupon } from "@/lib/coupons";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/store/cart";

export function CouponBox({ subtotal }: { subtotal: number }) {
  const t = useTranslations("Coupon");
  const locale = useLocale();
  const id = useId();
  const code = useCart((s) => s.coupon);
  const setCoupon = useCart((s) => s.setCoupon);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const stored = applyCoupon(code, subtotal);
  const minWarning = stored && !stored.ok && stored.reason === "min" ? t("min", { amount: formatPrice(stored.min ?? 0, locale) }) : null;

  const submit = () => {
    const result = applyCoupon(value, subtotal);
    if (!result) return;
    if (result.ok) { setCoupon(result.coupon.code); setValue(""); setError(null); return; }
    setError(result.reason === "min" ? t("min", { amount: formatPrice(result.min ?? 0, locale) }) : t("unknown"));
  };

  if (code && stored) {
    return (
      <div>
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-primary/40 bg-primary/5 px-4 py-2.5 text-sm">
          <span className="inline-flex items-center gap-2 font-medium text-primary"><Tag className="size-4" aria-hidden />{stored.ok ? t("applied", { code }) : code}</span>
          <button type="button" onClick={() => setCoupon(null)} aria-label={t("remove")} className="grid size-7 place-items-center rounded-full hover:bg-muted"><X className="size-4" aria-hidden /></button>
        </div>
        {minWarning && <p role="alert" className="mt-1.5 text-xs font-medium text-accent">{minWarning}</p>}
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{t("label")}</label>
      <div className="flex gap-2">
        <input
          id={id}
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
          placeholder={t("placeholder")}
          autoComplete="off"
          autoCapitalize="characters"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm uppercase outline-none placeholder:normal-case focus:border-primary aria-[invalid=true]:border-accent"
        />
        <button type="button" onClick={submit} disabled={!value.trim()} className="rounded-xl border border-primary px-4 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground disabled:opacity-40">{t("apply")}</button>
      </div>
      {error && <p id={`${id}-err`} role="alert" className="mt-1.5 text-xs font-medium text-accent">{error}</p>}
    </div>
  );
}
