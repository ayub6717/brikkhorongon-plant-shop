import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });
  // Not for search engines: this is the shop team's page.
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function AdminPage() {
  const t = await getTranslations("Admin");
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 font-display text-4xl font-semibold sm:text-5xl">{t("title")}</h1>
      <AdminDashboard />
    </div>
  );
}
