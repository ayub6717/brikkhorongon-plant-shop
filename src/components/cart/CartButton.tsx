"use client";

import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useUi } from "@/store/ui";
import { CartCount } from "./CartCount";

/** Header cart icon: opens the slide-over cart, except on the cart/checkout pages where it just links. */
export function CartButton() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const setCart = useUi((s) => s.setCart);
  const onCartPage = pathname === "/cart" || pathname === "/checkout";

  return (
    <Link
      href="/cart"
      aria-label={t("cart")}
      aria-haspopup={onCartPage ? undefined : "dialog"}
      onClick={(e) => {
        if (onCartPage || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        setCart(true);
      }}
      className="relative grid size-9 place-items-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 sm:size-10"
    >
      <ShoppingBag className="size-5" aria-hidden />
      <CartCount />
    </Link>
  );
}
