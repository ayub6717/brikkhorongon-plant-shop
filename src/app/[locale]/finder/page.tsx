import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { FinderView } from "@/components/finder/FinderView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Finder" });
  return { title: t("title"), description: t("subtitle") };
}

export default function FinderPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <Suspense fallback={<div className="h-96" aria-hidden />}>
        <FinderView />
      </Suspense>
    </div>
  );
}
