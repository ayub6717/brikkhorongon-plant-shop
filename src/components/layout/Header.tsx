import { Leaf, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CartCount } from "@/components/cart/CartCount";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileNav } from "./MobileNav";
import { DesktopNavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-6 sm:px-6">
        <Link href="/" className="flex items-center gap-1.5 font-display text-base font-semibold text-primary sm:gap-2 sm:text-xl">
          <Leaf className="size-5 sm:size-6" aria-hidden />
          {t("Brand.name")}
        </Link>

        <DesktopNavLinks />

        <div className="ml-auto flex items-center gap-0.5 sm:gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          <Link
            href="/cart"
            aria-label={t("Nav.cart")}
            className="grid size-9 place-items-center sm:size-10 relative rounded-full bg-primary text-primary-foreground transition hover:opacity-90"
          >
            <ShoppingBag className="size-5" aria-hidden />
            <CartCount />
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
