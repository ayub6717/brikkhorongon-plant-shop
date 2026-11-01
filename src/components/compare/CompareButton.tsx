"use client";

import { Check, Scale } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useMounted } from "@/lib/useMounted";
import { cn } from "@/lib/utils";
import { MAX_COMPARE, useCompare } from "@/store/compare";
import "@/components/product/product-actions.css";

export function CompareButton({ slug, name, className }: { slug: string; name: string; className?: string }) {
  const t = useTranslations("Compare");
  const mounted = useMounted();
  const selected = useCompare((s) => s.slugs.includes(slug));
  const toggle = useCompare((s) => s.toggle);
  const [full, setFull] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const on = mounted && selected;

  return (
    <span className="relative">
      <button
        type="button"
        aria-pressed={on}
        aria-label={on ? t("remove", { name }) : t("add", { name })}
        onClick={() => {
          if (!toggle(slug)) {
            setFull(true);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => setFull(false), 2500);
          }
        }}
        className={cn("grid size-9 place-items-center rounded-full border bg-background/90 backdrop-blur transition hover:scale-105", on ? "border-primary text-primary" : "border-border text-foreground/70 hover:border-primary/60", className)}
      >
        {on ? <Check key="on" className="pa-pop size-[18px]" aria-hidden /> : <Scale className="size-[18px]" aria-hidden />}
      </button>
      {full && (
        <span role="status" className="pa-tip absolute end-0 top-11 z-20 w-44 rounded-xl border border-border bg-background px-3 py-2 text-xs shadow-soft">
          {t("full", { max: MAX_COMPARE })}
        </span>
      )}
    </span>
  );
}
