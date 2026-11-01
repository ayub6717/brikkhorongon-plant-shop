import { addDays, WATER_INTERVAL_DAYS } from "./care";
import type { Water } from "@/data/types";

export type CareReminder = { slug: string; name: string; water: Water; startKey: string; orderId?: string;
  /** Days between waterings; defaults to the plant's general rhythm. */
  intervalDays?: number };

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const compact = (key: string) => key.replace(/-/g, "");

/** Folds a content line to 75 octets (RFC 5545), splitting on character boundaries. */
export function fold(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join("\r\n ");
}

/**
 * Builds an iCalendar file with a repeating all-day "water" reminder per plant (about six months).
 * `title` / `description` are passed in so the caller can localise them.
 */
export function buildCareIcs(
  reminders: CareReminder[],
  opts: { calendarName: string; title: (name: string) => string; description: (name: string, days: number) => string; now?: Date },
): string {
  const stamp = (opts.now ?? new Date()).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Brikkhorongon//Plant care//EN", "CALSCALE:GREGORIAN", `X-WR-CALNAME:${esc(opts.calendarName)}`];

  for (const r of reminders) {
    const interval = r.intervalDays ?? WATER_INTERVAL_DAYS[r.water];
    const first = addDays(r.startKey, interval);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${r.orderId ?? "garden"}-${r.slug}@brikkhorongon`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(first)}`,
      `DTEND;VALUE=DATE:${compact(addDays(first, 1))}`,
      `RRULE:FREQ=DAILY;INTERVAL=${interval};COUNT=${Math.ceil(180 / interval)}`,
      `SUMMARY:${esc(opts.title(r.name))}`,
      `DESCRIPTION:${esc(opts.description(r.name, interval))}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc(opts.title(r.name))}`,
      "TRIGGER:PT9H",
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** Triggers a browser download of text content. */
export function downloadText(filename: string, content: string, type = "text/calendar;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
