"use client";

import { useSyncExternalStore } from "react";
import { selectCount, useCart } from "@/store/cart";

const subscribeNoop = () => () => {};

/** Small count bubble; renders nothing until hydrated so server and client HTML match. */
export function CartCount() {
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const count = useCart(selectCount);
  if (!mounted || count === 0) return null;

  return (
    <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold leading-5 text-accent-foreground">
      {count}
    </span>
  );
}
