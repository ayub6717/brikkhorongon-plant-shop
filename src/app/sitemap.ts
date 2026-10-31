import type { MetadataRoute } from "next";
import { guides } from "@/data/guides";
import { getAllProducts } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";
import { routing } from "@/i18n/routing";

const STATIC = ["", "/shop", "/bonsai", "/learn", "/finder"];

const url = (locale: string, path: string) => `${SITE_URL}${locale === routing.defaultLocale ? "" : `/${locale}`}${path}`;

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    ...STATIC,
    ...getAllProducts().map((p) => `/shop/${p.slug}`),
    ...guides.map((g) => `/learn/${g.slug}`),
  ];

  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: url(locale, path),
      changeFrequency: path.startsWith("/shop/") || path.startsWith("/learn/") ? ("monthly" as const) : ("weekly" as const),
      priority: path === "" ? 1 : path.split("/").length > 2 ? 0.6 : 0.8,
      alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, url(l, path)])) },
    })),
  );
}
