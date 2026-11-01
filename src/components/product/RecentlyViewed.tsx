"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { getProductBySlug } from "@/lib/catalog";
import { useMounted } from "@/lib/useMounted";
import { useRecent } from "@/store/recent";

/** Records a product page visit in the recently-viewed list. */
export function RecordView({ slug }: { slug: string }) {
  const record = useRecent((s) => s.record);
  useEffect(() => { record(slug); }, [slug, record]);
  return null;
}

export function RecentlyViewed({ excludeSlug, limit = 4 }: { excludeSlug?: string; limit?: number }) {
  const t = useTranslations("ForYou");
  const mounted = useMounted();
  const slugs = useRecent((s) => s.slugs);
  const items = slugs
    .filter((s) => s !== excludeSlug)
    .flatMap((s) => { const p = getProductBySlug(s); return p ? [p] : []; })
    .slice(0, limit);

  if (!mounted || items.length === 0) return null;

  return (
    <section aria-labelledby="recent-heading" className="mt-20">
      <h2 id="recent-heading" className="font-display text-3xl font-semibold">{t("recent")}</h2>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <li key={p.id} className="flex"><div className="w-full"><ProductCard product={p} /></div></li>
        ))}
      </ul>
    </section>
  );
}
