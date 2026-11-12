import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ForgotPasswordForm } from "@/components/account/ForgotPasswordForm";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Recovery" });
  return { title: t("forgotTitle"), robots: { index: false } };
}

export default function Page() {
  return <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><ForgotPasswordForm /></div>;
}
