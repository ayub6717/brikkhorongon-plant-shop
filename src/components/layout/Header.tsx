import { Heart, Leaf, Sprout } from "lucide-react";
import { AccountLink } from "./AccountLink";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CartButton } from "@/components/cart/CartButton";
import { PaletteTrigger } from "@/components/palette/PaletteTrigger";
import { WishlistCount } from "@/components/wishlist/WishlistCount";
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
          <PaletteTrigger />
          <LocaleSwitcher />
          <ThemeToggle />
          <Link
            href="/garden"
            aria-label={t("Nav.garden")}
            className="hidden size-9 place-items-center rounded-full text-foreground/80 transition hover:bg-muted sm:grid sm:size-10"
          >
            <Sprout className="size-5" aria-hidden />
          </Link>
          <Link
            href="/wishlist"
            aria-label={t("Nav.wishlist")}
            className="relative hidden size-9 place-items-center rounded-full text-foreground/80 transition hover:bg-muted sm:grid sm:size-10"
          >
            <Heart className="size-5" aria-hidden />
            <WishlistCount />
          </Link>
          <AccountLink />
          <CartButton />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
