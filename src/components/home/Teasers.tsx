import { ArrowRight, Compass } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { getProductImage } from "@/lib/catalog";

export function Teasers() {
  const t = useTranslations("Home");
  const bonsai = getProductImage("juniper-bonsai")!;

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
        <div className="relative isolate flex h-full min-h-72 flex-col items-start overflow-hidden rounded-card p-8 text-white sm:p-10">
          <Image src={bonsai.src} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="-z-10 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">{t("bonsai.badge")}</span>
          <h2 className="mt-5 font-display text-3xl font-semibold">{t("bonsai.title")}</h2>
          <p className="mt-3 max-w-md text-white/85">{t("bonsai.body")}</p>
          <Link
            href="/bonsai"
            className="mt-auto inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-neutral-900 transition hover:opacity-90"
          >
            {t("bonsai.cta")} <ArrowRight className="mt-0 size-4 rtl:rotate-180" aria-hidden />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
