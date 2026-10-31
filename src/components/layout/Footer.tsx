import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="mt-24 border-t border-border bg-muted/50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-xl font-semibold text-primary">{t("Brand.name")}</p>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{t("Footer.about")}</p>
        </div>
        <div>
          <p className="text-sm font-semibold">{t("Footer.shop")}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/shop" className="hover:text-primary">{t("Nav.shop")}</Link></li>
            <li><Link href="/bonsai" className="hover:text-primary">{t("Nav.bonsai")}</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">{t("Footer.help")}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>{t("Footer.guarantee")}</li>
            <li><Link href="/track" className="hover:text-primary">{t("Nav.track")}</Link></li>
          </ul>
        </div>
      </div>
      <p className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {t("Brand.name")}. {t("Footer.rights")}
      </p>
    </footer>
  );
}
