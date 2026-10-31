import { Sprout } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
      <Sprout className="size-12 text-primary" aria-hidden />
      <h1 className="mt-6 font-display text-4xl font-semibold">{t("title")}</h1>
      <p className="mt-3 text-muted-foreground">{t("body")}</p>
      <Link href="/shop" className="mt-8 rounded-full bg-primary px-7 py-3.5 font-medium text-primary-foreground">{t("cta")}</Link>
    </section>
  );
}
