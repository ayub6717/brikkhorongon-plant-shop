"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Select } from "@/components/ui/Select";
import { Link, useRouter } from "@/i18n/navigation";
import { useAddAddress, useOrdersQuery, useRemoveAddress, useSessionQuery, useSignOut, useUpdateProfile } from "@/lib/api/queries";
import { usingServer } from "@/lib/api";
import { addressSchema, type AddressValues } from "@/lib/auth-schema";
import { BD_PHONE } from "@/lib/checkout-schema";
import { DISTRICTS } from "@/lib/shipping";

const inputCls = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary aria-[invalid=true]:border-accent";
const card = "rounded-card border border-border bg-surface p-5 sm:p-6";

export function AccountView() {
  const t = useTranslations("Account");
  const tc = useTranslations("Checkout");
  const tt = useTranslations("Track");
  const locale = useLocale();
  const uid = useId();
  const router = useRouter();
  const { data: user, isPending } = useSessionQuery();
  const { data: orders = [] } = useOrdersQuery();
  const signOut = useSignOut();
  const update = useUpdateProfile();
  const addAddress = useAddAddress();
  const removeAddress = useRemoveAddress();
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { label: "", area: "", address: "" },
  });

  if (isPending) return <div className="h-64" aria-hidden />;
  if (!user) {
    return (
      <div className="mx-auto max-w-lg rounded-card border border-dashed border-border bg-surface/60 p-12 text-center">
        <h2 className="font-display text-2xl font-semibold">{t("signedOutTitle")}</h2>
        <p className="mt-2 text-muted-foreground">{t("signedOutBody")}</p>
        <div className="mt-7 flex justify-center gap-3">
          <Link href="/login" className="rounded-full bg-primary px-7 py-3 font-medium text-primary-foreground">{t("loginBtn")}</Link>
          <Link href="/register" className="rounded-full border border-border px-7 py-3 font-medium hover:bg-muted">{t("registerBtn")}</Link>
        </div>
      </div>
    );
  }

  // Server orders are already this customer's; in the browser demo we match by email.
  const mine = usingServer ? orders : orders.filter((o) => o.customer.email.toLowerCase() === user.email.toLowerCase());
  const nameV = name ?? user.name;
  const phoneV = phone ?? user.phone;
  const phoneBad = !BD_PHONE.test(phoneV.trim());
  const nameBad = nameV.trim().length < 2;
  const fmt = (iso: string) => new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { dateStyle: "medium" }).format(new Date(iso));
  const money = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD");
  const err = (k: keyof AddressValues) => (errors[k]?.message ? t(`errors.${errors[k]?.message}`) : undefined);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-8">
        <section className={card} aria-labelledby={`${uid}-profile`}>
          <h2 id={`${uid}-profile`} className="font-display text-xl font-semibold">{t("profile")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          <form
            noValidate
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSaved(false);
              if (nameBad || phoneBad) return;
              update.mutate({ name: nameV.trim(), phone: phoneV.trim() }, { onSuccess: () => setSaved(true) });
            }}
          >
            <div>
              <label htmlFor={`${uid}-n`} className="mb-1.5 block text-sm font-medium">{t("name")}</label>
              <input id={`${uid}-n`} value={nameV} onChange={(e) => setName(e.target.value)} aria-invalid={nameBad || undefined} className={inputCls} />
              {nameBad && <p role="alert" className="mt-1.5 text-xs font-medium text-accent">{t("errors.name")}</p>}
            </div>
            <div>
              <label htmlFor={`${uid}-p`} className="mb-1.5 block text-sm font-medium">{t("phone")}</label>
              <input id={`${uid}-p`} value={phoneV} onChange={(e) => setPhone(e.target.value)} inputMode="tel" aria-invalid={phoneBad || undefined} className={inputCls} />
              {phoneBad && <p role="alert" className="mt-1.5 text-xs font-medium text-accent">{t("errors.phone")}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={update.isPending} className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">{t("save")}</button>
              {saved && <output className="text-sm font-medium text-primary">{t("saved")}</output>}
            </div>
          </form>
          {user.roles?.includes("Admin") && <Link href="/admin" className="mt-4 block text-sm font-medium text-primary underline-offset-4 hover:underline">{t("adminLink")}</Link>}
          <button type="button" onClick={() => signOut.mutate(undefined, { onSuccess: () => router.push("/") })} className="mt-6 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">{t("signOut")}</button>
        </section>

        <section className={card} aria-labelledby={`${uid}-orders`}>
          <h2 id={`${uid}-orders`} className="font-display text-xl font-semibold">{t("orders")}</h2>
          {mine.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("noOrders")}</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {mine.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <p className="font-medium tracking-wide">{o.id}</p>
                    <p className="text-xs text-muted-foreground">{fmt(o.createdAt)} · {tt(`steps.${o.status}`)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums">৳{money.format(o.total)}</span>
                    <Link href={`/track?id=${o.id}`} className="font-medium text-primary underline-offset-4 hover:underline">{t("track")}</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={card} aria-labelledby={`${uid}-addr`}>
        <h2 id={`${uid}-addr`} className="font-display text-xl font-semibold">{t("addresses")}</h2>
        {user.addresses.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("noAddresses")}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {user.addresses.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 rounded-xl bg-muted/60 p-3 text-sm">
                <div className="flex gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <p><strong className="font-medium">{a.label}</strong><br />{a.address}, {a.area}<br />{tc(`districts.${a.district}`)}</p>
                </div>
                <button type="button" onClick={() => removeAddress.mutate(a.id)} aria-label={t("removeAddress", { label: a.label })} className="p-1.5 text-muted-foreground transition hover:text-accent"><Trash2 className="size-4" aria-hidden /></button>
              </li>
            ))}
          </ul>
        )}

        <form noValidate className="mt-6 space-y-4 border-t border-border pt-5" onSubmit={handleSubmit((v) => addAddress.mutate(v, { onSuccess: () => reset({ label: "", area: "", address: "" }) }))}>
          <h3 className="text-sm font-semibold">{t("addAddress")}</h3>
          <div>
            <label htmlFor={`${uid}-l`} className="mb-1.5 block text-sm font-medium">{t("label")}</label>
            <input id={`${uid}-l`} placeholder={t("labelPlaceholder")} aria-invalid={errors.label ? true : undefined} className={inputCls} {...register("label")} />
            {err("label") && <p role="alert" className="mt-1.5 text-xs font-medium text-accent">{err("label")}</p>}
          </div>
          <div>
            <label htmlFor={`${uid}-d`} className="mb-1.5 block text-sm font-medium">{tc("district")}</label>
            <Controller control={control} name="district" render={({ field }) => (
              <Select variant="field" id={`${uid}-d`} value={field.value ?? ""} onChange={field.onChange} placeholder={tc("districtPlaceholder")} invalid={!!errors.district} options={DISTRICTS.map((d) => ({ value: d, label: tc(`districts.${d}`) }))} />
            )} />
            {err("district") && <p role="alert" className="mt-1.5 text-xs font-medium text-accent">{err("district")}</p>}
          </div>
          <div>
            <label htmlFor={`${uid}-a`} className="mb-1.5 block text-sm font-medium">{tc("area")}</label>
            <input id={`${uid}-a`} aria-invalid={errors.area ? true : undefined} className={inputCls} {...register("area")} />
            {err("area") && <p role="alert" className="mt-1.5 text-xs font-medium text-accent">{err("area")}</p>}
          </div>
          <div>
            <label htmlFor={`${uid}-ad`} className="mb-1.5 block text-sm font-medium">{tc("address")}</label>
            <input id={`${uid}-ad`} aria-invalid={errors.address ? true : undefined} className={inputCls} {...register("address")} />
            {err("address") && <p role="alert" className="mt-1.5 text-xs font-medium text-accent">{err("address")}</p>}
          </div>
          <button type="submit" disabled={addAddress.isPending} className="rounded-full border border-border px-6 py-3 text-sm font-medium transition hover:bg-muted disabled:opacity-60">{t("addAddressBtn")}</button>
        </form>
      </section>
    </div>
  );
}
