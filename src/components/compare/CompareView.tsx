"use client";

import { Scale, X } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { AddToCart } from "@/components/cart/AddToCart";
import { Link } from "@/i18n/navigation";
import { getProductBySlug } from "@/lib/catalog";
import { localizeProduct } from "@/lib/localize";
import { formatPrice } from "@/lib/format";
import { useMounted } from "@/lib/useMounted";
import { useCompare } from "@/store/compare";

export function CompareView() {
  const t = useTranslations();
  const locale = useLocale();
  const mounted = useMounted();
  const slugs = useCompare((s) => s.slugs);
  const remove = useCompare((s) => s.remove);
  const items = slugs.flatMap((s) => { const p = getProductBySlug(s); return p ? [localizeProduct(p, locale)] : []; });

  if (!mounted) return <div className="h-64" aria-hidden />;

  if (items.length < 2) {
    return (
      <div className="mx-auto max-w-md rounded-card border border-border bg-surface px-8 py-14 text-center">
        <Scale className="mx-auto size-10 text-primary" aria-hidden />
        <p className="mt-4 font-display text-2xl font-semibold">{t("Compare.need2")}</p>
        <p className="mt-2 text-muted-foreground">{t("Compare.emptyBody")}</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-primary px-7 py-3 font-medium text-primary-foreground">{t("Compare.browse")}</Link>
      </div>
    );
  }

  const lowest = Math.min(...items.map((p) => p.price));
  const hasBonsai = items.some((p) => p.bonsai);
  const dash = "—";

  const rows: { label: string; cells: { text: string; best?: boolean }[] }[] = [
    { label: t("Compare.price"), cells: items.map((p) => ({ text: formatPrice(p.price, locale), best: p.price === lowest })) },
    { label: t("Compare.category"), cells: items.map((p) => ({ text: t(`Categories.${p.category}.name`) })) },
    { label: t("Compare.light"), cells: items.map((p) => ({ text: t(`Care.light.${p.care.light}`) })) },
    { label: t("Compare.water"), cells: items.map((p) => ({ text: t(`Care.water.${p.care.water}`) })) },
    { label: t("Compare.difficulty"), cells: items.map((p) => ({ text: t(`Care.difficulty.${p.care.difficulty}`) })) },
    ...(hasBonsai
      ? [
          { label: t("Bonsai.details.style"), cells: items.map((p) => ({ text: p.bonsai ? t(`Bonsai.styles.${p.bonsai.style}.name`) : dash })) },
          { label: t("Bonsai.details.age"), cells: items.map((p) => ({ text: p.bonsai ? t("Bonsai.details.years", { count: p.bonsai.ageYears }) : dash })) },
          { label: t("Bonsai.details.height"), cells: items.map((p) => ({ text: p.bonsai ? t("Bonsai.details.cm", { count: p.bonsai.heightCm }) : dash })) },
          { label: t("Bonsai.details.placement"), cells: items.map((p) => ({ text: p.bonsai ? t(`Bonsai.placement.${p.bonsai.placement}`) : dash })) },
        ]
      : []),
  ];

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-soft">
      <table className="w-full min-w-136 border-collapse text-sm">
        <caption className="sr-only">{t("Compare.title")}</caption>
        <thead>
          <tr>
            <th scope="col" className="w-32 p-4 text-start text-muted-foreground"><span className="sr-only">{t("Compare.feature")}</span></th>
            {items.map((p) => (
              <th key={p.slug} scope="col" className="p-4 text-start align-top font-normal">
                <div className="relative">
                  <button type="button" onClick={() => remove(p.slug)} aria-label={t("Compare.remove", { name: p.name })} className="absolute inset-e-0 top-0 z-10 grid size-7 place-items-center rounded-full bg-background/90 shadow-soft hover:bg-muted"><X className="size-4" aria-hidden /></button>
                  <Link href={`/shop/${p.slug}`} className="relative block aspect-4/5 overflow-hidden rounded-2xl bg-muted"><Image src={p.image.src} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" /></Link>
                  <Link href={`/shop/${p.slug}`} className="mt-3 block font-display text-lg font-semibold hover:text-primary">{p.name}</Link>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-border">
              <th scope="row" className="p-4 text-start font-medium text-muted-foreground">{r.label}</th>
              {r.cells.map((c, i) => (
                <td key={items[i].slug} className={c.best ? "p-4 font-semibold text-primary" : "p-4"}>
                  {c.text}
                  {c.best && <span className="ms-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium">{t("Compare.lowest")}</span>}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t border-border">
            <td />
            {items.map((p) => (<td key={p.slug} className="p-4"><AddToCart slug={p.slug} /></td>))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
