"use client";

import { ArrowLeft, Bug, CircleDot, Droplets, Flower2, Leaf, RotateCcw, Ruler, Sprout, Sun, Wind } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, type ComponentType } from "react";
import { Link } from "@/i18n/navigation";
import { SYMPTOMS, SYMPTOM_KEYS, type Symptom } from "@/lib/doctor";
import "./doctor.css";

const ICONS: Record<Symptom, ComponentType<{ className?: string }>> = {
  yellowLeaves: Leaf, brownTips: Sun, droopy: Droplets, leafDrop: Wind, spots: CircleDot, pests: Bug, leggy: Ruler, noBlooms: Flower2, soilMold: Sprout,
};

export function DoctorView() {
  const t = useTranslations("Doctor");
  const [symptom, setSymptom] = useState<Symptom | null>(null);
  const [option, setOption] = useState<string | null>(null);
  const top = useRef<HTMLDivElement>(null);

  const go = (s: Symptom | null, o: string | null) => {
    setSymptom(s);
    setOption(o);
    top.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    top.current?.focus({ preventScroll: true });
  };

  const step = !symptom ? 1 : !option ? 2 : 3;

  return (
    <div ref={top} tabIndex={-1} style={{ outline: "none" }}>
      {step === 1 && (
        <section key="s1" className="dr-in" aria-labelledby="dr-pick">
          <h2 id="dr-pick" className="font-display text-2xl font-semibold">{t("pick")}</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SYMPTOM_KEYS.map((k, i) => {
              const Icon = ICONS[k];
              return (
                <li key={k} className="dr-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <button type="button" onClick={() => go(k, null)} className="flex w-full items-center gap-4 rounded-card border border-border bg-surface p-4 text-start transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-muted/50">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-muted text-primary"><Icon className="size-5" /></span>
                    <span className="font-medium">{t(`symptoms.${k}.name`)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {step === 2 && symptom && (
        <section key="s2" className="dr-in" aria-labelledby="dr-q">
          <p className="text-sm font-medium text-muted-foreground">{t("step", { n: 1 })} · {t(`symptoms.${symptom}.name`)}</p>
          <h2 id="dr-q" className="mt-1 font-display text-2xl font-semibold">{t(`symptoms.${symptom}.q`)}</h2>
          <ul className="mt-6 grid gap-3">
            {SYMPTOMS[symptom].map((o, i) => (
              <li key={o} className="dr-in" style={{ animationDelay: `${i * 60}ms` }}>
                <button type="button" onClick={() => go(symptom, o)} className="w-full rounded-card border border-border bg-surface p-4 text-start transition hover:border-primary/60 hover:bg-muted/50">
                  {t(`symptoms.${symptom}.options.${o}.label`)}
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => go(null, null)} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><ArrowLeft className="size-4" aria-hidden />{t("back")}</button>
        </section>
      )}

      {step === 3 && symptom && option && (
        <section key="s3" className="dr-in" aria-labelledby="dr-result">
          <p className="text-sm font-medium text-muted-foreground">{t(`symptoms.${symptom}.name`)} · {t(`symptoms.${symptom}.options.${option}.label`)}</p>
          <div className="mt-4 rounded-card border border-primary/40 bg-primary/5 p-6">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary"><span className="dr-pulse grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"><Sprout className="size-4" aria-hidden /></span>{t("cause")}</p>
            <h2 id="dr-result" className="mt-3 font-display text-2xl font-semibold leading-snug">{t(`symptoms.${symptom}.options.${option}.cause`)}</h2>
          </div>
          <div className="mt-6 rounded-card border border-border bg-surface p-6">
            <h3 className="font-display text-xl font-semibold">{t("doThis")}</h3>
            <ol className="mt-4 space-y-3">
              {(t.raw(`symptoms.${symptom}.options.${option}.fix`) as string[]).map((f, i) => (
                <li key={i} className="dr-in flex gap-3" style={{ animationDelay: `${150 + i * 120}ms` }}>
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{i + 1}</span>
                  <span>{f}</span>
                </li>
              ))}
            </ol>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{t("note")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => go(null, null)} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"><RotateCcw className="size-4" aria-hidden />{t("again")}</button>
            <Link href="/learn" className="rounded-full border border-border px-6 py-3 text-sm font-medium hover:bg-muted">{t("guides")}</Link>
            <Link href="/shop" className="rounded-full border border-border px-6 py-3 text-sm font-medium hover:bg-muted">{t("shop")}</Link>
          </div>
        </section>
      )}
    </div>
  );
}
