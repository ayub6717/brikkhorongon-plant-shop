"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/product/ProductCard";
import { Link } from "@/i18n/navigation";
import { getProductBySlug } from "@/lib/catalog";
import { useMounted } from "@/lib/useMounted";
import { useCart } from "@/store/cart";
import { useUi } from "@/store/ui";
import { useWishlist } from "@/store/wishlist";

export function WishlistView() {
  const t = useTranslations("Wishlist");
  const mounted = useMounted();
  const slugs = useWishlist((s) => s.slugs);
  const add = useCart((s) => s.add);
  const setCart = useUi((s) => s.setCart);
  const items = slugs.flatMap((s) => { const p = getProductBySlug(s); return p ? [p] : []; });

  if (!mounted) return <div className="h-64" aria-hidden />;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-card border border-border bg-surface px-8 py-14 text-center">
        <Heart className="mx-auto size-10 text-accent" aria-hidden />
        <p className="mt-4 font-display text-2xl font-semibold">{t("emptyTitle")}</p>
        <p className="mt-2 text-muted-foreground">{t("emptyBody")}</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-primary px-7 py-3 font-medium text-primary-foreground">{t("browse")}</Link>
      </div>
    );
  }

  return (
    <>
      <p className="mb-6 text-muted-foreground">{t("count", { count: items.length })}</p>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <li key={p.id} className="flex flex-col gap-3">
            <ProductCard product={p} />
            <button type="button" onClick={() => { add(p.slug, 1); setCart(true); }} className="rounded-full border border-primary px-5 py-2.5 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground">{t("moveToCart")}</button>
          </li>
        ))}
      </ul>
    </>
  );
}
