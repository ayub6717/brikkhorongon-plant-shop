"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { products } from "@/data/products";
import { Link, useRouter } from "@/i18n/navigation";
import { BUDGETS, CARE_LEVELS, FINDER_LIGHTS, parseAnswers, rankProducts, STYLES, WATER_HABITS, type Answers } from "@/lib/finder";
import { cn } from "@/lib/utils";

const QUESTIONS = [
  { key: "light", options: FINDER_LIGHTS },
  { key: "water", options: WATER_HABITS },
  { key: "care", options: CARE_LEVELS },
  { key: "style", options: STYLES },
  { key: "budget", options: BUDGETS },
] as const;

export function FinderView() {
  const t = useTranslations("Finder");
  const router = useRouter();
  const params = useSearchParams();
  const fromUrl = parseAnswers((k) => params.get(k));

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Partial<Answers>>({});

  function choose(key: (typeof QUESTIONS)[number]["key"], value: string) {
    const next = { ...draft, [key]: value } as Partial<Answers>;
    setDraft(next);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      router.push(`/finder?${new URLSearchParams(next as Record<string, string>).toString()}`);
    }
  }

  function restart() {
    setDraft({});
    setStep(0);
    router.push("/finder");
  }

  if (fromUrl) return <Results answers={fromUrl} onRestart={restart} />;

  const q = QUESTIONS[step];
  const selected = draft[q.key];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">{t("title")}</h1>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("step", { current: step + 1, total: QUESTIONS.length })}</span>
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1.5 hover:text-primary">
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />{t("back")}
            </button>
          )}
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={1} aria-valuemax={QUESTIONS.length} aria-valuenow={step + 1}>
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} />
        </div>

        <fieldset className="mt-8" key={q.key}>
          <legend className="font-display text-2xl font-semibold sm:text-3xl">{t(`q.${q.key}.title`)}</legend>
          <div role="radiogroup" className="mt-6 grid gap-3">
            {q.options.map((o) => {
              const active = selected === o;
              return (
                <button
                  key={o}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => choose(q.key, o)}
                  className={cn("rounded-2xl border p-5 text-start transition", active ? "border-primary bg-muted/70" : "border-border bg-surface hover:border-primary/50")}
                >
                  <span className="block font-medium">{t(`q.${q.key}.options.${o}.label`)}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{t(`q.${q.key}.options.${o}.hint`)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>
    </div>
  );
}

function Results({ answers, onRestart }: { answers: Answers; onRestart: () => void }) {
  const t = useTranslations("Finder");
  const matches = rankProducts(products, answers);
  const lightShortfall = answers.light === "low" && !matches[0]?.reasons.includes("light");

  return (
    <div>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">{t("resultsTitle")}</h1>
        <p className="mt-3 text-muted-foreground">{t("resultsSubtitle")}</p>
        <ul className="mt-5 flex flex-wrap justify-center gap-2 text-sm">
          {QUESTIONS.map(({ key }) => (
            <li key={key} className="rounded-full bg-muted px-3.5 py-1.5">{t(`q.${key}.options.${answers[key]}.label`)}</li>
          ))}
        </ul>
        {lightShortfall && <p className="mx-auto mt-5 max-w-xl rounded-2xl bg-accent/10 p-4 text-sm">{t("lowLightNote")}</p>}
      </div>

      <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map(({ product, reasons }, i) => (
          <li key={product.id} className="flex flex-col gap-3">
            <div className="relative">
              {i === 0 && <span className="absolute -top-3 start-4 z-10 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground shadow-soft">{t("best")}</span>}
              <ProductCard product={product} />
            </div>
            {reasons.length > 0 && (
              <ul className="flex flex-wrap gap-1.5 px-1">
                {reasons.map((r) => (
                  <li key={r} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">✓ {t(`reasons.${r}`)}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onRestart} className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 font-medium hover:bg-muted">
          <RotateCcw className="size-4" aria-hidden />{t("retake")}
        </button>
        <Link href="/shop" className="rounded-full bg-primary px-7 py-3.5 font-medium text-primary-foreground shadow-soft">{t("browse")}</Link>
      </div>
    </div>
  );
}
