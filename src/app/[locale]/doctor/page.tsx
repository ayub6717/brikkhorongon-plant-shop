import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DoctorView } from "@/components/doctor/DoctorView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Doctor" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function DoctorPage() {
  const t = await getTranslations("Doctor");
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">{t("title")}</h1>
      <p className="mb-10 mt-3 max-w-xl text-muted-foreground">{t("subtitle")}</p>
      <DoctorView />
    </div>
  );
}
