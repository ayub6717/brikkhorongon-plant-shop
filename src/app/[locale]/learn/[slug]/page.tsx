import { Clock } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProductCard } from "@/components/product/ProductCard";
import { guides, getGuide } from "@/data/guides";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getProductBySlug } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";
import { ensureCatalog } from "@/lib/server/catalog";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => guides.map((g) => ({ locale, slug: g.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!getGuide(slug)) return {};
  const t = await getTranslations({ locale, namespace: "Learn" });
  return { title: t(`guides.${slug}.title`), description: t(`guides.${slug}.summary`) };
}

export default async function GuidePage({ params }: Props) {
  await ensureCatalog();
  const { locale, slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const t = await getTranslations("Learn");
  const sections = t.raw(`guides.${slug}.sections`) as { h: string; p: string }[];
  const tips = t.raw(`guides.${slug}.tips`) as string[];
  const related = guide.related.flatMap((s) => getProductBySlug(s) ?? []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: t(`guides.${slug}.title`),
    description: t(`guides.${slug}.summary`),
    inLanguage: locale,
    mainEntityOfPage: `${SITE_URL}${locale === "en" ? "" : `/${locale}`}/learn/${slug}`,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
        <Link href="/learn" className="hover:text-primary">← {t("allGuides")}</Link>
      </nav>

      <article className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">{t(`guides.${slug}.title`)}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t(`guides.${slug}.summary`)}</p>
        <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground"><Clock className="size-4" aria-hidden />{t("minutes", { count: guide.minutes })}</p>

        <div className="mt-10 space-y-8">
          {sections.map((s, i) => (
            <section key={s.h}>
              <h2 className="font-display text-2xl font-semibold"><span className="mr-2 text-accent">{i + 1}.</span>{s.h}</h2>
              <p className="mt-2 text-lg leading-relaxed text-muted-foreground">{s.p}</p>
            </section>
          ))}
        </div>

        <section aria-labelledby="tips-heading" className="mt-12 rounded-card border border-border bg-muted/50 p-6">
          <h2 id="tips-heading" className="font-display text-xl font-semibold">{t("tipsTitle")}</h2>
          <ul className="mt-3 list-disc space-y-2 ps-5 text-muted-foreground marker:text-primary">
            {tips.map((tip) => <li key={tip}>{tip}</li>)}
          </ul>
        </section>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="try-heading" className="mt-20">
          <h2 id="try-heading" className="font-display text-3xl font-semibold">{t("related")}</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <li key={p.id} className="flex"><div className="w-full"><ProductCard product={p} /></div></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
