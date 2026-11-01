"use client";

import { Scale, X } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { getProductBySlug } from "@/lib/catalog";
import { localizeProduct } from "@/lib/localize";
import { useMounted } from "@/lib/useMounted";
import { useCompare } from "@/store/compare";
import "@/components/product/product-actions.css";

/** Floating bar shown while plants are selected for comparison. */
export function CompareBar() {
  const t = useTranslations("Compare");
  const locale = useLocale();
  const mounted = useMounted();
  const pathname = usePathname();
  const slugs = useCompare((s) => s.slugs);
  const clear = useCompare((s) => s.clear);
  const remove = useCompare((s) => s.remove);
  const items = slugs.flatMap((s) => { const p = getProductBySlug(s); return p ? [localizeProduct(p, locale)] : []; });

  if (!mounted || items.length === 0 || pathname === "/compare" || pathname === "/checkout") return null;

  return (
    <>
    <div aria-hidden className="h-20" />
    <div role="region" aria-label={t("bar")} className="pa-tip fixed inset-x-3 bottom-4 z-30 mx-auto flex max-w-md items-center gap-3 rounded-full border border-border bg-background/95 py-2 pe-2 ps-3 shadow-2xl backdrop-blur">
      <Scale className="size-5 shrink-0 text-primary" aria-hidden />
      <ul className="flex -space-x-2">
        {items.map((p) => (
          <li key={p.slug} className="group relative">
            <span className="relative block size-9 overflow-hidden rounded-full border-2 border-background bg-muted"><Image src={p.image.src} alt={p.name} fill sizes="36px" className="object-cover" /></span>
            <button type="button" onClick={() => remove(p.slug)} aria-label={t("remove", { name: p.name })} className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-foreground text-background opacity-0 transition focus:opacity-100 group-hover:opacity-100"><X className="size-3" aria-hidden /></button>
          </li>
        ))}
      </ul>
      <span className="min-w-0 flex-1 truncate text-sm">{t("count", { count: items.length })}</span>
      <button type="button" onClick={clear} className="px-1 text-xs text-muted-foreground hover:text-foreground">{t("clear")}</button>
      <Link href="/compare" aria-disabled={items.length < 2} className={items.length < 2 ? "pointer-events-none rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground" : "rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"}>{t("open")}</Link>
    </div>
    </>
  );
}
