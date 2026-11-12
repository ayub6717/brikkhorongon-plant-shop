import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AccountView } from "@/components/account/AccountView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return { title: t("title") };
}

export default async function Page() {
  const t = await getTranslations("Account");
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 font-display text-4xl font-semibold sm:text-5xl">{t("title")}</h1>
      <Suspense fallback={<div className="h-64" aria-hidden />}>
        <AccountView />
      </Suspense>
    </div>
  );
}
