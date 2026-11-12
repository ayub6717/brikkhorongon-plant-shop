"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useMarkAllRead, useMarkRead, type AppNotification } from "@/lib/api/notifications";

function ago(iso: string, locale: string) {
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  const rtf = new Intl.RelativeTimeFormat(locale === "bn" ? "bn-BD" : "en", { numeric: "auto" });
  if (Math.abs(mins) < 60) return rtf.format(mins, "minute");
  if (Math.abs(mins) < 60 * 24) return rtf.format(Math.round(mins / 60), "hour");
  return rtf.format(Math.round(mins / (60 * 24)), "day");
}

/** The list itself, shared by the bell's dropdown and the account page. */
export function NotificationList({ items, unread, onNavigate }: Readonly<{ items: AppNotification[]; unread: number; onNavigate?: () => void }>) {
  const t = useTranslations("Notifications");
  const locale = useLocale();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  if (items.length === 0) return <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t("empty")}</p>;

  return (
    <div>
      {unread > 0 && (
        <div className="flex justify-end px-4 pt-2">
          <button type="button" onClick={() => markAll.mutate()} className="text-xs font-medium text-primary underline-offset-4 hover:underline">
            {t("markAll")}
          </button>
        </div>
      )}
      <ul className="divide-y divide-border">
        {items.map((n) => (
          <li key={n.id}>
            <Link
              href={n.orderId ? `/track?id=${n.orderId}` : "/account"}
              onClick={() => { if (!n.read) markRead.mutate(n.id); onNavigate?.(); }}
              className="flex items-start gap-3 px-4 py-3 text-sm transition hover:bg-muted"
            >
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-primary"}`} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className={n.read ? "text-foreground/80" : "font-medium"}>{t(`kinds.${n.kind.replace(".", "_")}`, { id: n.orderId ?? "" })}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{ago(n.createdAt, locale)}</span>
              </span>
              {!n.read && <span className="sr-only">{t("unreadLabel")}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
