import { Droplets, Scissors, Sun } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { Link } from "@/i18n/navigation";
import { BONSAI_STYLES, filterBonsai, getProductBySlug, PLACEMENTS } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Bonsai" });
  return { title: t("title"), description: t("subtitle") };
}

const chip = (active: boolean) =>
  cn("rounded-full border px-4 py-2 text-sm transition", active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50 hover:bg-muted");

export default async function BonsaiPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Bonsai");
  const { items, style, placement } = filterBonsai(await searchParams);
  const hero = getProductBySlug("cloud-pine-bonsai")!.image;

  const href = (next: { style?: string; placement?: string }) => {
    const q = new URLSearchParams();
    const s = "style" in next ? next.style : style;
    const p = "placement" in next ? next.placement : placement;
    if (s) q.set("style", s);
    if (p) q.set("placement", p);
    const qs = q.toString();
    return `/bonsai${qs ? `?${qs}` : ""}#trees`;
  };

  const basics = [
    { icon: Sun, key: "light" },
    { icon: Droplets, key: "water" },
    { icon: Scissors, key: "prune" },
  ] as const;

  return (
    <div>
      <section className="relative isolate overflow-hidden">
        <Image src={hero.src} alt="" fill priority sizes="100vw" className="-z-10 object-cover object-[50%_35%]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
        <div className="mx-auto max-w-7xl px-4 py-24 text-white sm:px-6 sm:py-32 lg:py-40">
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">{t("badge")}</span>
          <h1 className="mt-5 max-w-2xl font-display text-5xl font-semibold leading-tight sm:text-6xl">{t("title")}</h1>
          <p className="mt-5 max-w-xl text-lg text-white/85">{t("subtitle")}</p>
          <Link href="#trees" className="mt-8 inline-block rounded-full bg-white px-7 py-3.5 font-medium text-primary shadow-soft transition hover:opacity-90">{t("cta")}</Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Reveal>
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t("stylesTitle")}</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">{t("stylesSubtitle")}</p>
        </Reveal>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BONSAI_STYLES.map((s, i) => (
            <li key={s}>
              <Reveal delay={i * 0.05} className="h-full">
                <Link href={href({ style: s })} className="block h-full rounded-card border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-primary/50">
                  <p className="font-display text-xl font-semibold">{t(`styles.${s}.name`)}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{t(`styles.${s}.desc`)}</p>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section id="trees" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t("treesTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("count", { count: items.length })}</p>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-medium">{t("placementTitle")}</span>
            <Link href={href({ placement: undefined })} className={chip(!placement)} scroll={false}>{t("all")}</Link>
            {PLACEMENTS.map((p) => (
              <Link key={p} href={href({ placement: p })} className={chip(placement === p)} scroll={false}>{t(`placement.${p}`)}</Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-medium">{t("styleTitle")}</span>
            <Link href={href({ style: undefined })} className={chip(!style)} scroll={false}>{t("all")}</Link>
            {BONSAI_STYLES.map((s) => (
              <Link key={s} href={href({ style: s })} className={chip(style === s)} scroll={false}>{t(`styles.${s}.name`)}</Link>
            ))}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-10 rounded-card border border-dashed border-border bg-surface/60 p-12 text-center">
            <p className="font-display text-xl font-semibold">{t("emptyTitle")}</p>
            <p className="mt-2 text-muted-foreground">{t("emptyBody")}</p>
            <Link href="/bonsai#trees" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground">{t("reset")}</Link>
          </div>
        ) : (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <li key={p.id} className="flex"><div className="w-full"><ProductCard product={p} /></div></li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t("basicsTitle")}</h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {basics.map(({ icon: Icon, key }) => (
              <li key={key} className="rounded-card border border-border bg-surface p-6">
                <span className="grid size-11 place-items-center rounded-2xl bg-muted text-primary"><Icon className="size-5" aria-hidden /></span>
                <p className="mt-4 font-display text-xl font-semibold">{t(`basics.${key}.title`)}</p>
                <p className="mt-2 text-sm text-muted-foreground">{t(`basics.${key}.body`)}</p>
              </li>
            ))}
          </ul>
          <Link href="/learn" className="mt-8 inline-block font-medium text-primary underline-offset-4 hover:underline">{t("learnMore")}</Link>
        </div>
      </section>
    </div>
  );
}
