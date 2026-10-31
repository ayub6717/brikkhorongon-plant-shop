import { Package, ShieldCheck, Sprout } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getProductBySlug } from "@/lib/catalog";
import { Reveal } from "@/components/ui/Reveal";

export function Hero() {
  const t = useTranslations("Home.hero");
  const main = getProductBySlug("rose-painted-calathea")!;
  const second = getProductBySlug("moth-orchid")!;

  const trust = [
    { icon: ShieldCheck, label: t("trust1") },
    { icon: Package, label: t("trust2") },
    { icon: Sprout, label: t("trust3") },
  ];

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="absolute -right-24 -top-24 size-[28rem] rounded-full bg-sage/30 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-24">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">{t("eyebrow")}</p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.1] sm:text-6xl">{t("title")}</h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">{t("subtitle")}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="rounded-full bg-primary px-7 py-3.5 font-medium text-primary-foreground shadow-soft transition hover:opacity-90"
            >
              {t("ctaShop")}
            </Link>
            <Link
              href="/finder"
              className="rounded-full border border-border bg-surface px-7 py-3.5 font-medium transition hover:bg-muted"
            >
              {t("ctaFinder")}
            </Link>
          </div>
          <ul className="mt-10 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            {trust.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-primary">
                  <Icon className="size-4.5" aria-hidden />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.15} className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative mx-auto aspect-[4/5] w-[82%] overflow-hidden rounded-t-[999px] rounded-b-[2rem] border border-border bg-surface shadow-soft">
            <Image
              src={main.image.src}
              alt={main.name}
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 80vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-6 left-0 size-36 overflow-hidden rounded-full border-4 border-background shadow-soft sm:size-44">
            <Image src={second.image.src} alt={second.name} fill sizes="180px" className="object-cover" />
          </div>
          <div className="absolute right-0 top-10 rounded-2xl border border-border bg-surface/95 px-4 py-3 shadow-soft backdrop-blur">
            <p className="text-xs text-muted-foreground">{t("badgeLabel")}</p>
            <p className="font-display text-lg font-semibold text-primary">{t("badgeValue")}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
