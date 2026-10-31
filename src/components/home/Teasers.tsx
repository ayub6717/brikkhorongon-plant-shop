import { ArrowRight, Compass, TreeDeciduous } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";

export function Teasers() {
  const t = useTranslations("Home");

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-8 sm:px-6 lg:grid-cols-2">
      <Reveal className="h-full">
        <div className="flex h-full flex-col items-start rounded-card bg-primary p-8 text-primary-foreground sm:p-10">
          <Compass className="size-9 opacity-90" aria-hidden />
          <h2 className="mt-5 font-display text-3xl font-semibold">{t("finder.title")}</h2>
          <p className="mt-3 max-w-md opacity-90">{t("finder.body")}</p>
          <Link
            href="/finder"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary-foreground px-6 py-3 font-medium text-primary transition hover:opacity-90"
          >
            {t("finder.cta")} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
          </Link>
        </div>
      </Reveal>
      <Reveal delay={0.1} className="h-full">
        <div className="relative flex h-full flex-col items-start overflow-hidden rounded-card border border-border bg-surface p-8 sm:p-10">
          <TreeDeciduous aria-hidden className="absolute -right-6 -top-6 size-48 text-sage/30" />
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            {t("bonsai.badge")}
          </span>
          <h2 className="mt-5 font-display text-3xl font-semibold">{t("bonsai.title")}</h2>
          <p className="mt-3 max-w-md text-muted-foreground">{t("bonsai.body")}</p>
        </div>
      </Reveal>
    </section>
  );
}
