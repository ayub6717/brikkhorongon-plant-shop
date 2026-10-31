import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { OrderConfirmation } from "@/components/order/OrderConfirmation";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Order" });
  return { title: t("title"), robots: { index: false } };
}

export default async function OrderPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <OrderConfirmation id={decodeURIComponent(id)} />
    </div>
  );
}
