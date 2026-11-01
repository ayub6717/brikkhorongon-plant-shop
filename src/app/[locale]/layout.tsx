import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CompareBar } from "@/components/compare/CompareBar";
import { CommandPalette } from "@/components/palette/CommandPalette";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PwaRegister } from "@/components/pwa/PwaRegister";
import { Providers } from "@/components/providers/Providers";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "@fontsource/hind-siliguri/bengali-400.css";
import "@fontsource/hind-siliguri/bengali-500.css";
import "@fontsource/hind-siliguri/bengali-600.css";
import "@fontsource/hind-siliguri/bengali-700.css";
import "../globals.css";
import "../fields.css";

export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#faf7f0" }, { media: "(prefers-color-scheme: dark)", color: "#0f1712" }] };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Brand" });
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${t("name")} — ${t("tagline")}`, template: `%s | ${t("name")}` },
    description: t("tagline"),
    icons: { apple: "/icons/apple-touch-icon.png" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale });

  return (
    <html
      lang={locale}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col" suppressHydrationWarning>
        <NextIntlClientProvider>
          <Providers>
            <a href="#main" className="sr-only z-50 rounded-full bg-primary px-5 py-2.5 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
              {t("Nav.skip")}
            </a>
            <Header />
            <main id="main" tabIndex={-1} className="flex-1 outline-none">{children}</main>
            <Footer />
            <CommandPalette />
            <CartDrawer />
            <CompareBar />
            <PwaRegister />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
