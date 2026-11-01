"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Footer install option. Only appears when the browser says the app can be installed. */
export function InstallButton() {
  const t = useTranslations("Pwa");
  const [event, setEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setEvent(e as InstallEvent); };
    const onInstalled = () => setEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (!event) return null;
  return (
    <button
      type="button"
      onClick={async () => { await event.prompt(); await event.userChoice; setEvent(null); }}
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary"
    >
      <Download className="size-4" aria-hidden />
      {t("install")}
    </button>
  );
}
