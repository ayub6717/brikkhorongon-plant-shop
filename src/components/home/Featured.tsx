import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getFeaturedProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/Reveal";

export function Featured() {
  const t = useTranslations("Home.featured");
  const items = getFeaturedProducts(8);

  return (
    <section className="bg-muted/60 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t("title")}</h2>
            <p className="mt-3 max-w-xl text-muted-foreground">{t("subtitle")}</p>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-2 font-medium text-primary hover:underline">
            {t("viewAll")} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
          </Link>
        </Reveal>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => (
            <li key={p.id} className="flex">
              <div className="w-full">
                <ProductCard product={p} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
