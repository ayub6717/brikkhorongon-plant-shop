import { Droplets, Gauge, PackageCheck, ShieldCheck, Sun } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { AddToCart } from "@/components/cart/AddToCart";
import { ProductCard } from "@/components/product/ProductCard";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getAllProducts, getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { absoluteUrl, SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => getAllProducts().map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description,
    openGraph: { title: product.name, description: product.description, images: [{ url: product.image.src, width: product.image.width, height: product.image.height }] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const t = await getTranslations();
  await getFormatter(); // keeps number/date formatting in sync with the locale
  const related = getRelatedProducts(product);

  const careRows = [
    { icon: Sun, label: t("Product.light"), value: t(`Care.light.${product.care.light}`), hint: t(`Product.lightHint.${product.care.light}`) },
    { icon: Droplets, label: t("Product.water"), value: t(`Care.water.${product.care.water}`), hint: t(`Product.waterHint.${product.care.water}`) },
    { icon: Gauge, label: t("Product.level"), value: t(`Care.difficulty.${product.care.difficulty}`), hint: t(`Product.levelHint.${product.care.difficulty}`) },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: absoluteUrl(product.image.src),
    category: product.category,
    offers: { "@type": "Offer", price: product.price, priceCurrency: "BDT", url: `${SITE_URL}/shop/${product.slug}` },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-primary">{t("Product.home")}</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/shop" className="hover:text-primary">{t("Nav.shop")}</Link></li>
          <li aria-hidden>/</li>
          <li><Link href={`/shop?category=${product.category}`} className="hover:text-primary">{t(`Categories.${product.category}.name`)}</Link></li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-foreground">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden rounded-card border border-border bg-muted shadow-soft">
          <Image src={product.image.src} alt={product.name} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">{t(`Categories.${product.category}.name`)}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight sm:text-5xl">{product.name}</h1>
          <p className="mt-4 text-3xl font-semibold text-primary">{formatPrice(product.price, locale)}</p>
          <p className="mt-6 max-w-prose text-lg leading-relaxed text-muted-foreground">{product.description}</p>

          <div className="mt-8">
            <AddToCart slug={product.slug} />
          </div>

          <ul className="mt-8 space-y-3 rounded-card border border-border bg-surface/60 p-5 text-sm">
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <span>{t("Product.guarantee")}</span>
            </li>
            <li className="flex items-start gap-3">
              <PackageCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <span>{t("Product.packed")}</span>
            </li>
          </ul>

          {product.bonsai && (
            <section aria-labelledby="bonsai-heading" className="mt-10">
              <h2 id="bonsai-heading" className="font-display text-2xl font-semibold">{t("Bonsai.details.title")}</h2>
              <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-border bg-border text-sm">
                {[
                  [t("Bonsai.details.style"), t(`Bonsai.styles.${product.bonsai.style}.name`)],
                  [t("Bonsai.details.age"), t("Bonsai.details.years", { count: product.bonsai.ageYears })],
                  [t("Bonsai.details.height"), t("Bonsai.details.cm", { count: product.bonsai.heightCm })],
                  [t("Bonsai.details.placement"), t(`Bonsai.placement.${product.bonsai.placement}`)],
                ].map(([label, value]) => (
                  <div key={label} className="bg-surface p-4">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="mt-0.5 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section aria-labelledby="care-heading" className="mt-10">
            <h2 id="care-heading" className="font-display text-2xl font-semibold">{t("Product.careTitle")}</h2>
            <dl className="mt-4 divide-y divide-border rounded-card border border-border bg-surface">
              {careRows.map(({ icon: Icon, label, value, hint }) => (
                <div key={label} className="flex items-start gap-4 p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-muted text-primary"><Icon className="size-5" aria-hidden /></span>
                  <div>
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                    <dd className="mt-0.5 text-sm text-muted-foreground">{hint}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-20">
          <h2 id="related-heading" className="font-display text-3xl font-semibold">{t("Product.related")}</h2>
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
