import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { TrackView } from "@/components/track/TrackView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Track" });
  return { title: t("title"), description: t("subtitle"), robots: { index: false } };
}

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <Suspense fallback={<div className="h-64" aria-hidden />}>
        <TrackView />
      </Suspense>
    </div>
  );
}
