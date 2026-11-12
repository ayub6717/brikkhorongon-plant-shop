"use client";

import { Bell } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usingServer } from "@/lib/api";
import { useNotifications } from "@/lib/api/notifications";
import { useSessionQuery } from "@/lib/api/queries";
import { NotificationList } from "./NotificationList";

/** A bell with an unread count. Shown only to signed-in customers when the live API is on. */
export function NotificationBell() {
  const t = useTranslations("Notifications");
  const { data: user } = useSessionQuery();
  const { data } = useNotifications(usingServer && Boolean(user));
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  if (!usingServer || !user) return null;
  const unread = data?.unread ?? 0;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={unread > 0 ? t("openUnread", { count: unread }) : t("open")}
        className="relative grid size-9 place-items-center rounded-full text-foreground/80 transition hover:bg-muted sm:size-10"
      >
        <Bell className="size-5" aria-hidden />
        {unread > 0 && (
          <span className="absolute end-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground" aria-hidden>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div id={panelId} className="absolute end-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
          <div className="border-b border-border px-4 py-3 font-display text-base font-semibold">{t("title")}</div>
          <div className="max-h-96 overflow-y-auto">
            <NotificationList items={data?.items ?? []} unread={unread} onNavigate={() => setOpen(false)} />
          </div>
          <Link href="/account" onClick={() => setOpen(false)} className="block border-t border-border px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-muted">
            {t("viewAll")}
          </Link>
        </div>
      )}
    </div>
  );
}
