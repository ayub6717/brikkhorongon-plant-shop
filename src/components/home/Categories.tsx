import Image from "next/image";
import { useTranslations } from "next-intl";
import { categories } from "@/data/categories";
import { countByCategory, getProductImage } from "@/lib/catalog";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";

export function Categories() {
  const t = useTranslations();

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Reveal>
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t("Home.categories.title")}</h2>
        <p className="mt-3 max-w-xl text-muted-foreground">{t("Home.categories.subtitle")}</p>
      </Reveal>
      <ul className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-5">
        {categories.map(({ slug, cover }, i) => {
          const img = getProductImage(cover)!;
          return (
            <li key={slug} className="last:col-span-2 lg:last:col-span-1">
              <Reveal delay={i * 0.06}>
                <Link
                  href={`/shop?category=${slug}`}
                  className={`group relative block overflow-hidden rounded-card border border-border ${
                    i === categories.length - 1 ? "aspect-[3/4] max-lg:aspect-[16/9]" : "aspect-[3/4]"
                  }`}
                >
                  <Image
                    src={img.src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 20vw, 50vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <p className="font-display text-xl font-semibold">{t(`Categories.${slug}.name`)}</p>
                    <p className="mt-0.5 text-xs text-white/80">
                      {t("Home.categories.count", { count: countByCategory(slug) })}
                    </p>
                  </div>
                </Link>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
