"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { Select } from "@/components/ui/Select";
import { useAddAddress, useRemoveAddress } from "@/lib/api/queries";
import { addressSchema, type AddressValues } from "@/lib/auth-schema";
import { DISTRICTS } from "@/lib/shipping";
import type { User } from "@/store/session";
import { card, inputCls } from "./shared";

export function AddressesTab({ user }: Readonly<{ user: User }>) {
  const t = useTranslations("Account");
  const tc = useTranslations("Checkout");
  const td = useTranslations("Dashboard");
  const uid = useId();
  const addAddress = useAddAddress();
  const removeAddress = useRemoveAddress();
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { label: "", area: "", address: "" },
  });
  const err = (k: keyof AddressValues) => (errors[k]?.message ? t(`errors.${errors[k]?.message}`) : undefined);

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold">{td("addressesTitle")}</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card} aria-labelledby={`${uid}-addr`}>
          <h3 id={`${uid}-addr`} className="font-display text-lg font-semibold">{t("addresses")}</h3>
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
        </section>

        <section className={card}>
          <form noValidate className="space-y-4" onSubmit={handleSubmit((v) => addAddress.mutate(v, { onSuccess: () => reset({ label: "", area: "", address: "" }) }))}>
            <h3 className="font-display text-lg font-semibold">{t("addAddress")}</h3>
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
            {addAddress.error && <p role="alert" className="text-xs font-medium text-accent">{t(`errors.${addAddress.error.message in ({ TOO_MANY_ADDRESSES: 1, NETWORK: 1, UNAUTHORIZED: 1 } as Record<string, number>) ? addAddress.error.message : "GENERIC"}`)}</p>}
            <button type="submit" disabled={addAddress.isPending} className="rounded-full border border-border px-6 py-3 text-sm font-medium transition hover:bg-muted disabled:opacity-60">{t("addAddressBtn")}</button>
          </form>
        </section>
      </div>
    </div>
  );
}
