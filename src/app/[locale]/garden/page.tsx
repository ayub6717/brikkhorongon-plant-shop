import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { GardenView } from "@/components/garden/GardenView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Garden" });
  return { title: t("title") };
}

export default async function GardenPage() {
  const t = await getTranslations("Garden");
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">{t("title")}</h1>
      <p className="mb-8 mt-2 text-muted-foreground">{t("subtitle")}</p>
      <GardenView />
    </div>
  );
}
