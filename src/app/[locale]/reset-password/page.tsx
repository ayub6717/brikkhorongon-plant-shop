import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/account/ResetPasswordForm";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Recovery" });
  return { title: t("resetTitle"), robots: { index: false } };
}

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Suspense fallback={<div className="h-64" aria-hidden />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
