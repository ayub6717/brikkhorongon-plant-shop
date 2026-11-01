import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Checkout" });
  return { title: t("title"), robots: { index: false } };
}

export default async function CheckoutPage() {
  const t = await getTranslations("Checkout");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 font-display text-4xl font-semibold sm:text-5xl">{t("title")}</h1>
      <CheckoutForm />
    </div>
  );
}
