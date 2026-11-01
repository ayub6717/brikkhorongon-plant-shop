"use client";

import { Select } from "@/components/ui/Select";
import { Clock, Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState, type FormEvent } from "react";
import { formatDateKey, getDeliveryDates } from "@/lib/shipping";
import { useTodayKey } from "@/lib/useMounted";
import { cn } from "@/lib/utils";
import { canModify, REQUEST_TYPES, useOrders, type ModRequest, type Order, type RequestType } from "@/store/orders";

export const POTS = ["terracotta", "whiteCeramic", "cement", "woven", "none"] as const;

const inputCls =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary aria-[invalid=true]:border-accent";

function useDescribe() {
  const t = useTranslations("Track");
  const locale = useLocale();
  return (r: ModRequest) => {
    switch (r.type) {
      case "pot":
        return t("describe.pot", { pot: t(`pots.${r.value}`) });
      case "giftNote":
        return t("describe.giftNote", { note: r.value ?? "" });
      case "date":
        return t("describe.date", { date: r.value ? formatDateKey(r.value, locale) : "" });
      default:
        return r.detail;
    }
  };
}

export function ModifyRequests({ order }: { order: Order }) {
  const t = useTranslations("Track");
  const locale = useLocale();
  const uid = useId();
  const addRequest = useOrders((s) => s.addRequest);
  const todayKey = useTodayKey();
  const describe = useDescribe();

  const [type, setType] = useState<RequestType>("pot");
  const [pot, setPot] = useState<string>(POTS[0]);
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const open = canModify(order);
  const dates = todayKey ? getDeliveryDates(todayKey, 7).filter((d) => d !== order.delivery.date) : [];

  function submit(e: FormEvent) {
    e.preventDefault();
    setSent(false);
    let err: string | null = null;
    if (type === "giftNote" && (note.trim().length < 1 || note.trim().length > 200)) err = note.trim() ? t("errors.tooLong") : t("errors.required");
    if (type === "date" && !date) err = t("errors.required");
    if (type === "custom" && (custom.trim().length < 5 || custom.trim().length > 300)) err = custom.trim().length > 300 ? t("errors.tooLong") : t("errors.tooShort");
    setError(err);
    if (err) return;

    if (type === "pot") addRequest(order.id, { type, detail: "", value: pot });
    if (type === "giftNote") addRequest(order.id, { type, detail: "", value: note.trim() });
    if (type === "date") addRequest(order.id, { type, detail: "", value: date });
    if (type === "custom") addRequest(order.id, { type, detail: custom.trim() });
    setNote("");
    setDate("");
    setCustom("");
    setSent(true);
  }

  const fmt = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { dateStyle: "medium", timeStyle: "short" });

  return (
    <section className="rounded-card border border-border bg-surface p-5 sm:p-6" aria-labelledby={`${uid}-h`}>
      <h2 id={`${uid}-h`} className="font-display text-xl font-semibold">{t("modTitle")}</h2>

      {open ? (
        <>
          <p className="mt-1 text-sm text-muted-foreground">{t("modIntro")}</p>
          <form onSubmit={submit} noValidate className="mt-5 space-y-4">
            <div role="radiogroup" aria-label={t("modTitle")} className="flex flex-wrap gap-2">
              {REQUEST_TYPES.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={type === r}
                  onClick={() => { setType(r); setError(null); setSent(false); }}
                  className={cn("rounded-full border px-4 py-2 text-sm transition", type === r ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50")}
                >
                  {t(`types.${r}`)}
                </button>
              ))}
            </div>

            {type === "pot" && (
              <div>
                <label htmlFor={`${uid}-pot`} className="mb-1.5 block text-sm font-medium">{t("potLabel")}</label>
                <Select variant="field" id={`${uid}-pot`} value={pot} onChange={setPot} options={POTS.map((p) => ({ value: p, label: t(`pots.${p}`) }))} />
                <p className="mt-1.5 text-xs text-muted-foreground">{t("potHint")}</p>
              </div>
            )}
            {type === "giftNote" && (
              <div>
                <label htmlFor={`${uid}-note`} className="mb-1.5 block text-sm font-medium">{t("giftLabel")}</label>
                <textarea id={`${uid}-note`} rows={3} value={note} onChange={(e) => setNote(e.target.value)} aria-invalid={!!error} aria-describedby={error ? `${uid}-err` : undefined} className={inputCls} />
                <p className="mt-1.5 text-xs text-muted-foreground">{t("giftHint", { count: note.length })}</p>
              </div>
            )}
            {type === "date" && (
              <div>
                <label htmlFor={`${uid}-date`} className="mb-1.5 block text-sm font-medium">{t("dateLabel")}</label>
                <Select variant="field" id={`${uid}-date`} value={date} onChange={setDate} placeholder={t("dateChoose")} invalid={!!error} describedBy={error ? `${uid}-err` : undefined} options={dates.map((d) => ({ value: d, label: formatDateKey(d, locale) }))} />
              </div>
            )}
            {type === "custom" && (
              <div>
                <label htmlFor={`${uid}-custom`} className="mb-1.5 block text-sm font-medium">{t("customLabel")}</label>
                <textarea id={`${uid}-custom`} rows={3} value={custom} onChange={(e) => setCustom(e.target.value)} aria-invalid={!!error} aria-describedby={error ? `${uid}-err` : undefined} placeholder={t("customPlaceholder")} className={inputCls} />
              </div>
            )}

            {error && <p id={`${uid}-err`} role="alert" className="text-xs font-medium text-accent">{error}</p>}
            {sent && !error && <p role="status" className="text-sm font-medium text-primary">{t("submitted")}</p>}

            <button type="submit" className="rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-90">{t("submit")}</button>
          </form>
        </>
      ) : (
        <p className="mt-3 flex items-start gap-2 rounded-2xl bg-muted/70 p-4 text-sm text-muted-foreground">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t("modLocked")}
        </p>
      )}

      <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("yourRequests")}</h3>
      {order.requests.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{t("noRequests")}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {order.requests.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">{t(`types.${r.type}`)}</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    r.status === "pending" && "bg-muted text-muted-foreground",
                    r.status === "approved" && "bg-primary/10 text-primary",
                    r.status === "declined" && "bg-accent/10 text-accent",
                  )}
                >
                  {r.status === "pending" && <Clock className="size-3" aria-hidden />}
                  {t(`reqStatus.${r.status}`)}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{describe(r)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{fmt.format(new Date(r.at))}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function useRequestDescriber() {
  return useDescribe();
}
