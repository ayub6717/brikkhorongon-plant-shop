import { WifiOff } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function OfflinePage() {
  const t = await getTranslations("Pwa");
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <WifiOff className="mx-auto size-12 text-primary" aria-hidden />
      <h1 className="mt-5 font-display text-4xl font-semibold">{t("offlineTitle")}</h1>
      <p className="mt-3 text-muted-foreground">{t("offlineBody")}</p>
      <Link href="/learn" className="mt-8 inline-block rounded-full bg-primary px-7 py-3.5 font-medium text-primary-foreground">{t("retry")}</Link>
    </div>
  );
}
