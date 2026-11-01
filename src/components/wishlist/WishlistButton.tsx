"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMounted } from "@/lib/useMounted";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/store/wishlist";
import "@/components/product/product-actions.css";

const base = "grid size-9 place-items-center rounded-full border border-border bg-background/90 backdrop-blur transition hover:scale-105 hover:border-accent/60";

export function WishlistButton({ slug, name, className }: { slug: string; name: string; className?: string }) {
  const t = useTranslations("Wishlist");
  const mounted = useMounted();
  const saved = useWishlist((s) => s.slugs.includes(slug));
  const toggle = useWishlist((s) => s.toggle);
  const on = mounted && saved;

  return (
    <button type="button" aria-pressed={on} aria-label={on ? t("remove", { name }) : t("add", { name })} onClick={() => toggle(slug)} className={cn(base, className)}>
      <Heart key={String(on)} className={cn("size-[18px]", on ? "pa-pop fill-accent text-accent" : "text-foreground/70")} aria-hidden />
    </button>
  );
}
