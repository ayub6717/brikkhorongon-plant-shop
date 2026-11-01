"use client";

import { Star, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { useMounted } from "@/lib/useMounted";
import { cn } from "@/lib/utils";
import { summarize, useReviews } from "@/store/reviews";
import { Stars } from "./Stars";

const inputCls = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary aria-[invalid=true]:border-accent";

export function Reviews({ slug, name }: { slug: string; name: string }) {
  const t = useTranslations("Reviews");
  const locale = useLocale();
  const uid = useId();
  const mounted = useMounted();
  const all = useReviews((s) => s.reviews);
  const add = useReviews((s) => s.add);
  const remove = useReviews((s) => s.remove);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<{ rating?: boolean; author?: boolean; text?: boolean }>({});
  const [thanks, setThanks] = useState(false);

  const nf = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en", { maximumFractionDigits: 1 });
  const date = (iso: string) => new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { dateStyle: "medium" }).format(new Date(iso));
  const reviews = mounted ? all.filter((r) => r.slug === slug) : [];
  const { count, average, distribution } = summarize(reviews);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = { rating: rating < 1, author: author.trim().length < 2, text: text.trim().length < 10 };
    setErrors(next);
    if (next.rating || next.author || next.text) return;
    add({ slug, name: author.trim(), rating, title: title.trim(), text: text.trim() });
    setRating(0); setTitle(""); setText(""); setThanks(true);
  };

  return (
    <section aria-labelledby="reviews-heading" className="mt-20">
      <h2 id="reviews-heading" className="font-display text-3xl font-semibold">{t("title")}</h2>

      <div className="mt-8 grid gap-10 lg:grid-cols-[18rem_1fr]">
        <div>
          {count > 0 ? (
            <div className="rounded-card border border-border bg-surface p-5">
              <p className="flex items-end gap-2"><span className="font-display text-5xl font-semibold">{nf.format(average)}</span><span className="pb-1.5 text-sm text-muted-foreground">/ {nf.format(5)}</span></p>
              <Stars value={average} label={t("outOf", { value: nf.format(average) })} className="mt-1" />
              <p className="mt-1 text-sm text-muted-foreground">{t("count", { count })}</p>
              <ul className="mt-4 space-y-1.5 text-xs" aria-label={t("distribution")}>
                {[5, 4, 3, 2, 1].map((s) => (
                  <li key={s} className="flex items-center gap-2">
                    <span className="w-8 shrink-0 tabular-nums">{nf.format(s)}★</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-border"><span className="block h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${(distribution[s - 1] / count) * 100}%` }} /></span>
                    <span className="w-5 text-end tabular-nums text-muted-foreground">{nf.format(distribution[s - 1])}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-card border border-dashed border-border bg-surface/60 p-5 text-sm text-muted-foreground">{t("none")}</div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">{t("localNote")}</p>
        </div>

        <div className="space-y-8">
          <form onSubmit={submit} noValidate className="space-y-4 rounded-card border border-border bg-surface p-5 sm:p-6">
            <h3 className="font-display text-xl font-semibold">{t("write", { name })}</h3>
            <div role="radiogroup" aria-label={t("yourRating")} aria-invalid={errors.rating ? true : undefined} onMouseLeave={() => setHover(0)}>
              <p className="mb-1.5 text-sm font-medium">{t("yourRating")}</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <label key={s} className="cursor-pointer rounded-md p-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary" onMouseEnter={() => setHover(s)}>
                    <input type="radio" name={`${uid}-rating`} value={s} checked={rating === s} onChange={() => { setRating(s); setThanks(false); }} className="sr-only" />
                    <span className="sr-only">{t("starsOption", { count: s })}</span>
                    <Star className={cn("size-7 transition-transform hover:scale-110", (hover || rating) >= s ? "fill-amber-500 text-amber-500" : "text-border")} aria-hidden />
                  </label>
                ))}
              </div>
              {errors.rating && <p role="alert" className="mt-1.5 text-xs font-medium text-accent">{t("errRating")}</p>}
            </div>
            <div>
              <label htmlFor={`${uid}-name`} className="mb-1.5 block text-sm font-medium">{t("yourName")}</label>
              <input id={`${uid}-name`} value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={40} autoComplete="name" aria-invalid={errors.author ? true : undefined} className={inputCls} />
              {errors.author && <p role="alert" className="mt-1.5 text-xs font-medium text-accent">{t("errName")}</p>}
            </div>
            <div>
              <label htmlFor={`${uid}-title`} className="mb-1.5 block text-sm font-medium">{t("reviewTitle")}</label>
              <input id={`${uid}-title`} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className={inputCls} />
            </div>
            <div>
              <label htmlFor={`${uid}-text`} className="mb-1.5 block text-sm font-medium">{t("yourReview")}</label>
              <textarea id={`${uid}-text`} rows={4} value={text} onChange={(e) => setText(e.target.value)} maxLength={600} aria-invalid={errors.text ? true : undefined} className={inputCls} />
              <p className="mt-1 text-xs text-muted-foreground">{nf.format(text.length)}/600</p>
              {errors.text && <p role="alert" className="mt-1 text-xs font-medium text-accent">{t("errText")}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90">{t("submit")}</button>
              {thanks && <p role="status" className="text-sm font-medium text-primary">{t("thanks")}</p>}
            </div>
          </form>

          {reviews.length > 0 && (
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-card border border-border bg-surface p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Stars value={r.rating} label={t("outOf", { value: nf.format(r.rating) })} />
                      {r.title && <p className="mt-1 font-medium">{r.title}</p>}
                    </div>
                    <button type="button" onClick={() => remove(r.id)} aria-label={t("delete")} className="p-1.5 text-muted-foreground transition hover:text-accent"><Trash2 className="size-4" aria-hidden /></button>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">{r.text}</p>
                  <p className="mt-3 text-xs text-muted-foreground">{r.name} · {date(r.at)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
