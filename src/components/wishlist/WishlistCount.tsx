"use client";

import { useMounted } from "@/lib/useMounted";
import { useWishlist } from "@/store/wishlist";

export function WishlistCount() {
  const mounted = useMounted();
  const count = useWishlist((s) => s.slugs.length);
  if (!mounted || count === 0) return null;
  return <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-4 text-accent-foreground">{count}</span>;
}
