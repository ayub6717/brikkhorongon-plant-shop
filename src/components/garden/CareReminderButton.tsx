"use client";

import { CalendarPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { buildCareIcs, downloadText, type CareReminder } from "@/lib/ics";

/** Downloads a calendar file with repeating watering reminders. */
export function CareReminderButton({ reminders, label, className }: { reminders: CareReminder[]; label?: string; className?: string }) {
  const t = useTranslations("Reminders");
  if (reminders.length === 0) return null;

  const onClick = () => {
    const ics = buildCareIcs(reminders, {
      calendarName: t("calendar"),
      title: (name) => t("title", { name }),
      description: (name, days) => t("description", { name, days }),
    });
    downloadText("brikkhorongon-plant-care.ics", ics, "text/calendar");
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={className ?? "inline-flex items-center gap-2 rounded-full border border-primary px-6 py-3 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"}
    >
      <CalendarPlus className="size-4" aria-hidden />
      {label ?? t("button")}
    </button>
  );
}
