import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { Link } from "@/i18n/navigation";
import { filterProducts, parseFilters } from "@/lib/catalog";
import { ensureCatalog } from "@/lib/server/catalog";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Shop" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function ShopPage({ searchParams }: Props) {
  await ensureCatalog();
  const t = await getTranslations("Shop");
  const items = filterProducts(parseFilters(await searchParams));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">{t("title")}</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">{t("subtitle")}</p>
      </header>

      <Suspense>
        <ShopFilters resultCount={items.length} />
      </Suspense>

      {items.length > 0 ? (
        <>
        <h2 className="sr-only">{t("resultsTitle")}</h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p, i) => (
            <li key={p.id} className="flex">
              <div className="w-full">
                <ProductCard product={p} priority={i < 4} />
              </div>
            </li>
          ))}
        </ul>
        </>
      ) : (
        <div className="mt-12 rounded-card border border-dashed border-border bg-surface/60 p-10 text-center">
          <h2 className="font-display text-2xl font-semibold">{t("emptyTitle")}</h2>
          <p className="mt-2 text-muted-foreground">{t("emptyBody")}</p>
          <Link href="/shop" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground">
            {t("clear")}
          </Link>
        </div>
      )}
    </div>
  );
}
