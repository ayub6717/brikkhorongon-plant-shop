"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Landmark, Smartphone, CreditCard } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Link, useRouter } from "@/i18n/navigation";
import { resolveLines, subtotalOf } from "@/lib/cart-math";
import { checkoutSchema, type CheckoutValues } from "@/lib/checkout-schema";
import { computeTotals } from "@/lib/totals";
import { DISTRICTS, INNER_DHAKA_AREAS, formatDateKey, getDeliveryDates, PAYMENTS, shippingConfig, SLOTS } from "@/lib/shipping";
import { useMounted, useTodayKey } from "@/lib/useMounted";
import { cn } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useCreateOrder } from "@/lib/api/queries";
import { GiftCardPreview } from "@/components/gift/GiftCardPreview";
import { GIFT_CARDS } from "@/lib/gift";
import { Select } from "@/components/ui/Select";
import { CouponBox } from "@/components/cart/CouponBox";
import { OrderLines } from "./OrderLines";

const inputCls =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary aria-[invalid=true]:border-accent";

function Field({ label, error, hint, children, id }: Readonly<{ label: string; error?: string; hint?: string; children: ReactNode; id: string }>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-accent">{error}</p>}
    </div>
  );
}

function Section({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="space-y-4 rounded-card border border-border bg-surface p-5 sm:p-6">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

const PAYMENT_ICONS = { cod: Landmark, bkash: Smartphone, card: CreditCard } as const;

export function CheckoutForm() {
  const t = useTranslations("Checkout");
  const tc = useTranslations("Cart");
  const locale = useLocale();
  const router = useRouter();
  const uid = useId();
  const mounted = useMounted();
  const todayKey = useTodayKey();

  const lines = useCart((s) => s.lines);
  const clearCart = useCart((s) => s.clear);
  const coupon = useCart((s) => s.coupon);
  const createOrder = useCreateOrder();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { name: "", phone: "", email: "", district: undefined, area: "", address: "", date: "", slot: undefined, payment: "cod", giftCard: "none", giftNote: "", note: "" },
  });

  const district = useWatch({ control, name: "district" });
  const area = useWatch({ control, name: "area" });
  const giftCard = useWatch({ control, name: "giftCard" });
  const giftNote = useWatch({ control, name: "giftNote" });
  const giftName = useWatch({ control, name: "name" });

  if (!mounted) return <div className="h-64" aria-hidden />;

  const resolved = resolveLines(lines, locale);
  if (resolved.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-card border border-dashed border-border bg-surface/60 p-12 text-center">
        <h2 className="font-display text-2xl font-semibold">{tc("emptyTitle")}</h2>
        <p className="mt-2 text-muted-foreground">{tc("emptyBody")}</p>
        <Link href="/shop" className="mt-7 inline-block rounded-full bg-primary px-7 py-3.5 font-medium text-primary-foreground">{tc("continue")}</Link>
      </div>
    );
  }

  const subtotal = subtotalOf(resolved);
  const { discount, shipping, total, couponCode } = computeTotals({ subtotal, coupon, district, area });
  const orderLines = resolved.map(({ product, qty }) => ({ slug: product.slug, name: product.name, image: product.image.src, price: product.price, qty }));
  const dates = todayKey ? getDeliveryDates(todayKey) : [];
  const err = (key: keyof CheckoutValues) => (errors[key]?.message ? t(`errors.${errors[key]?.message}`) : undefined);
  const aria = (key: keyof CheckoutValues, id: string) => ({
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${id}-error` : undefined,
  });

  const onSubmit = (v: CheckoutValues) => {
    // Only what the customer chose goes out. Prices, discount and delivery fee are worked out by whoever stores the order.
    createOrder.mutate(
      {
        lines: resolved.map(({ product, qty }) => ({ slug: product.slug, qty })),
        coupon: couponCode,
        customer: { name: v.name, phone: v.phone, email: v.email, district: v.district, area: v.area, address: v.address },
        delivery: { date: v.date, slot: v.slot },
        payment: v.payment,
        giftCard: v.giftCard,
        giftNote: v.giftNote,
        note: v.note,
      },
      {
        onSuccess: (order) => {
          clearCart();
          router.push(`/order/${order.id}`);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-10 lg:grid-cols-[1fr_24rem]">
      <div className="space-y-6">
        <Section title={t("contact")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`${uid}-name`} label={t("name")} error={err("name")}>
              <input id={`${uid}-name`} autoComplete="name" className={inputCls} {...aria("name", `${uid}-name`)} {...register("name")} />
            </Field>
            <Field id={`${uid}-phone`} label={t("phone")} hint={t("phoneHint")} error={err("phone")}>
              <input id={`${uid}-phone`} type="tel" inputMode="tel" autoComplete="tel" placeholder="01712345678" className={inputCls} {...aria("phone", `${uid}-phone`)} {...register("phone")} />
            </Field>
          </div>
          <Field id={`${uid}-email`} label={t("email")} error={err("email")}>
            <input id={`${uid}-email`} type="email" autoComplete="email" className={inputCls} {...aria("email", `${uid}-email`)} {...register("email")} />
          </Field>
        </Section>

        <Section title={t("addressTitle")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`${uid}-district`} label={t("district")} error={err("district")}>
              <Controller control={control} name="district" render={({ field }) => (
                <Select variant="field" id={`${uid}-district`} value={field.value ?? ""} onChange={field.onChange} placeholder={t("districtPlaceholder")} invalid={!!errors.district} describedBy={errors.district ? `${uid}-district-error` : undefined} options={DISTRICTS.map((d) => ({ value: d, label: t(`districts.${d}`) }))} />
              )} />
            </Field>
            <Field id={`${uid}-area`} label={t("area")} error={err("area")}>
              <input id={`${uid}-area`} list={`${uid}-areas`} autoComplete="address-level2" className={inputCls} {...aria("area", `${uid}-area`)} {...register("area")} />
              <datalist id={`${uid}-areas`}>{INNER_DHAKA_AREAS.filter((a) => /^[a-z]/i.test(a)).map((a) => <option key={a} value={a.replace(/^./, (c) => c.toUpperCase())} />)}</datalist>
            </Field>
          </div>
          <Field id={`${uid}-address`} label={t("address")} hint={t("addressHint")} error={err("address")}>
            <textarea id={`${uid}-address`} rows={3} autoComplete="street-address" className={inputCls} {...aria("address", `${uid}-address`)} {...register("address")} />
          </Field>
        </Section>

        <Section title={t("scheduleTitle")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`${uid}-date`} label={t("date")} error={err("date")}>
              <Controller control={control} name="date" render={({ field }) => (
                <Select variant="field" id={`${uid}-date`} value={field.value ?? ""} onChange={field.onChange} placeholder={t("datePlaceholder")} invalid={!!errors.date} describedBy={errors.date ? `${uid}-date-error` : undefined} options={dates.map((d) => ({ value: d, label: formatDateKey(d, locale) }))} />
              )} />
            </Field>
            <Field id={`${uid}-slot`} label={t("slot")} error={err("slot")}>
              <Controller control={control} name="slot" render={({ field }) => (
                <Select variant="field" id={`${uid}-slot`} value={field.value ?? ""} onChange={field.onChange} placeholder={t("slotPlaceholder")} invalid={!!errors.slot} describedBy={errors.slot ? `${uid}-slot-error` : undefined} options={SLOTS.filter((x) => shippingConfig.slots.includes(x)).map((x) => ({ value: x, label: t(`slots.${x}`) }))} />
              )} />
            </Field>
          </div>
        </Section>

        <Section title={t("paymentTitle")}>
          <Controller
            control={control}
            name="payment"
            render={({ field }) => (
              <div role="radiogroup" aria-label={t("paymentTitle")} className="grid gap-3">
                {PAYMENTS.map((p) => {
                  const Icon = PAYMENT_ICONS[p];
                  const active = field.value === p;
                  return (
                    <label key={p} className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition", active ? "border-primary bg-muted/70" : "border-border hover:border-primary/50")}>
                      <input type="radio" name={field.name} value={p} checked={active} onChange={() => field.onChange(p)} className="mt-1 accent-[var(--primary)]" />
                      <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                      <span>
                        <span className="block font-medium">{t(`payments.${p}`)}</span>
                        <span className="block text-sm text-muted-foreground">{p === "cod" ? t("codHint") : t("onlineHint")}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          />
        </Section>

        <Section title={t("extrasTitle")}>
          <fieldset className="min-w-0">
            <legend className="mb-1.5 text-sm font-medium">{t("giftDesign")}</legend>
            <Controller control={control} name="giftCard" render={({ field }) => (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {GIFT_CARDS.map((g) => (
                  <label key={g} className={cn("cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm transition has-[:focus-visible]:border-primary", field.value === g ? "border-primary bg-muted/70 font-medium" : "border-border hover:border-primary/50")}>
                    <input type="radio" name={field.name} value={g} checked={field.value === g} onChange={() => field.onChange(g)} className="sr-only" />
                    {t(`giftDesigns.${g}`)}
                  </label>
                ))}
              </div>
            )} />
          </fieldset>
          {giftCard !== "none" && (
            <GiftCardPreview design={giftCard} note={giftNote.trim() || t("giftSample")} from={giftName.trim().split(" ")[0] || undefined} label={t("giftPreview")} />
          )}
          <Field id={`${uid}-gift`} label={t("giftNote")} hint={t("giftHint")} error={err("giftNote")}>
            <textarea id={`${uid}-gift`} rows={2} className={inputCls} {...aria("giftNote", `${uid}-gift`)} {...register("giftNote")} />
          </Field>
          <Field id={`${uid}-note`} label={t("note")} error={err("note")}>
            <textarea id={`${uid}-note`} rows={2} className={inputCls} {...aria("note", `${uid}-note`)} {...register("note")} />
          </Field>
        </Section>
      </div>

      <aside className="h-fit space-y-5 rounded-card border border-border bg-surface p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-2xl font-semibold">{t("summary")}</h2>
        <CouponBox subtotal={subtotal} />
        <OrderLines lines={orderLines} subtotal={subtotal} shipping={shipping} total={total} discount={discount} couponCode={couponCode} />
        <button type="submit" disabled={isSubmitting || createOrder.isPending} className="w-full rounded-full bg-primary px-6 py-3.5 font-medium text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-60">
          {isSubmitting ? t("placing") : t("placeOrder")}
        </button>
        {createOrder.isError && <p role="alert" className="text-sm font-medium text-accent">{createOrder.error.message === "OUT_OF_STOCK" ? t("soldOut") : t("submitFailed")}</p>}
        <Link href="/cart" className="block text-center text-sm font-medium text-primary hover:underline">{t("backToCart")}</Link>
      </aside>
    </form>
  );
}
