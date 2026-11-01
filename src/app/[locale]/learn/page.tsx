import { Clock, Compass } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { GuideIcon } from "@/components/learn/GuideIcon";
import { Reveal } from "@/components/ui/Reveal";
import { guides } from "@/data/guides";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Learn" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function LearnPage() {
  const t = await getTranslations("Learn");

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">{t("title")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
      </div>

      <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((g, i) => (
          <li key={g.slug}>
            <Reveal delay={(i % 3) * 0.06} className="h-full">
              <article className="group relative flex h-full flex-col rounded-card border border-border bg-surface p-6 shadow-soft transition duration-300 hover:-translate-y-1">
                <span className="grid size-12 place-items-center rounded-2xl bg-muted text-primary">
                  <GuideIcon name={g.icon} className="size-6" />
                </span>
                <h2 className="mt-5 font-display text-2xl font-semibold leading-snug">
                  <Link href={`/learn/${g.slug}`} className="after:absolute after:inset-0">{t(`guides.${g.slug}.title`)}</Link>
                </h2>
                <p className="mt-2 text-muted-foreground">{t(`guides.${g.slug}.summary`)}</p>
                <p className="mt-auto flex items-center gap-1.5 pt-5 text-sm text-muted-foreground">
                  <Clock className="size-4" aria-hidden />{t("minutes", { count: g.minutes })}
                </p>
              </article>
            </Reveal>
          </li>
        ))}
      </ul>

      <div className="mt-16 flex flex-col items-start gap-5 rounded-card bg-primary p-8 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:p-10">
        <div className="flex items-start gap-4">
          <Compass className="mt-1 size-8 shrink-0 opacity-90" aria-hidden />
          <div>
            <h2 className="font-display text-2xl font-semibold">{t("quizTitle")}</h2>
            <p className="mt-1 max-w-xl opacity-90">{t("quizBody")}</p>
          </div>
        </div>
        <Link href="/finder" className="shrink-0 rounded-full bg-primary-foreground px-6 py-3 font-medium text-primary transition hover:opacity-90">{t("quizCta")}</Link>
      </div>
    </div>
  );
}
