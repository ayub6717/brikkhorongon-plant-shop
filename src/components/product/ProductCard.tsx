import { Droplets, Sun } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { CompareButton } from "@/components/compare/CompareButton";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { Link } from "@/i18n/navigation";
import { localizeProduct } from "@/lib/localize";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/data/types";

export function ProductCard({ product: raw, priority = false }: { product: Product; priority?: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const product = localizeProduct(raw, locale);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-soft transition duration-300 hover:-translate-y-1">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <Image
          src={product.image.src}
          alt={product.name}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
          <WishlistButton slug={product.slug} name={product.name} />
          <CompareButton slug={product.slug} name={product.name} />
        </div>
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
          {t(`Categories.${product.category}.name`)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="font-display text-lg font-semibold leading-snug">
          <Link href={`/shop/${product.slug}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <Sun className="size-3.5" aria-hidden />
            {t(`Care.light.${product.care.light}`)}
          </li>
          <li className="flex items-center gap-1.5">
            <Droplets className="size-3.5" aria-hidden />
            {t(`Care.water.${product.care.water}`)}
          </li>
        </ul>
        <div className="mt-auto flex items-center justify-between pt-1">
          <p className="text-lg font-semibold text-primary">{formatPrice(product.price, locale)}</p>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            {t(`Care.difficulty.${product.care.difficulty}`)}
          </span>
        </div>
      </div>
    </article>
  );
}
