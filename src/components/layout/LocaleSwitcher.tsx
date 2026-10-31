"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, string> = { en: "EN", bn: "বাং" };

export function LocaleSwitcher() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div role="group" aria-label={t("language")} className="flex rounded-full border border-border p-0.5">
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={l === locale}
          onClick={() => router.replace(pathname, { locale: l })}
          className={
            "rounded-full px-2 py-1 text-xs sm:py-1.5 sm:text-sm font-medium transition sm:px-3 " +
            (l === locale ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-muted")
          }
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
