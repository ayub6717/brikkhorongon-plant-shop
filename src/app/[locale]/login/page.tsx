import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthForm } from "@/components/account/AuthForm";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return { title: t("loginTitle") };
}

export default async function Page() {
  return <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><AuthForm mode="login" /></div>;
}
