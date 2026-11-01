import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WishlistView } from "@/components/wishlist/WishlistView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Wishlist" });
  return { title: t("title") };
}

export default async function WishlistPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Wishlist");
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 font-display text-4xl font-semibold sm:text-5xl">{t("title")}</h1>
      <WishlistView />
    </div>
  );
}
