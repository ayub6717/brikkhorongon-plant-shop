"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMounted } from "@/lib/useMounted";
import { useUi } from "@/store/ui";

const isMac = () => /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);

export function PaletteTrigger() {
  const t = useTranslations("Palette");
  const mounted = useMounted();
  const setOpen = useUi((s) => s.setPalette);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("open")}
        aria-keyshortcuts="Control+K Meta+K"
        className="hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-foreground xl:flex"
      >
        <Search className="size-4" aria-hidden />
        <span>{t("trigger")}</span>
        <kbd className="rounded-md border border-border px-1.5 text-[11px]">{mounted && isMac() ? "⌘ K" : "Ctrl K"}</kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("open")}
        className="grid size-9 place-items-center rounded-full text-foreground/80 transition hover:bg-muted sm:size-10 xl:hidden"
      >
        <Search className="size-5" aria-hidden />
      </button>
    </>
  );
}
