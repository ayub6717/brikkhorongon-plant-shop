"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/product/ProductCard";
import { products } from "@/data/products";
import { Link } from "@/i18n/navigation";
import { rankProducts } from "@/lib/finder";
import { useMounted } from "@/lib/useMounted";
import { usePrefs } from "@/store/prefs";

/** Home page strip based on the person's plant-finder answers. Renders nothing until they have taken the quiz. */
export function ForYou() {
  const t = useTranslations("ForYou");
  const tf = useTranslations("Nav");
  const mounted = useMounted();
  const answers = usePrefs((s) => s.finder);
  if (!mounted || !answers) return null;
  const picks = rankProducts(products, answers, 4);
  if (picks.length === 0) return null;

  return (
    <section aria-labelledby="foryou-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="foryou-heading" className="font-display text-3xl font-semibold sm:text-4xl">{t("title")}</h2>
          <p className="mt-2 text-muted-foreground">{t("body")}</p>
        </div>
        <Link href="/finder" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">{tf("finder")}<ArrowRight className="size-4" aria-hidden /></Link>
      </div>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {picks.map(({ product }) => (
          <li key={product.id} className="flex"><div className="w-full"><ProductCard product={product} /></div></li>
        ))}
      </ul>
    </section>
  );
}
