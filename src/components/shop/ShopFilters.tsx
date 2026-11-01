"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/Select";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { CATEGORY_SLUGS, LEVELS, LIGHTS, PRICE_BUCKETS, SORTS } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type Group = { param: string; label: string; options: readonly string[]; labelFor: (v: string) => string };

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm transition",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface hover:border-primary/60",
      )}
    >
      {children}
    </button>
  );
}

export function ShopFilters({ resultCount }: { resultCount: number }) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(params.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "" || next.get(key) === value) next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Debounced search typing
  useEffect(() => () => clearTimeout(timer.current), []);
  const onSearch = (value: string) => {
    setQ(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value.trim()) next.set("q", value.trim());
      else next.delete("q");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
  };

  const groups: Group[] = [
    { param: "category", label: t("Shop.category"), options: CATEGORY_SLUGS, labelFor: (v) => t(`Categories.${v}.name`) },
    { param: "light", label: t("Shop.light"), options: LIGHTS, labelFor: (v) => t(`Care.light.${v}`) },
    { param: "level", label: t("Shop.level"), options: LEVELS, labelFor: (v) => t(`Care.difficulty.${v}`) },
    { param: "price", label: t("Shop.price"), options: PRICE_BUCKETS, labelFor: (v) => t(`Shop.priceRanges.${v}`) },
  ];

  const activeCount = groups.filter((g) => params.get(g.param)).length + (params.get("q") ? 1 : 0);

  const clearAll = () => {
    setQ("");
    const sort = params.get("sort");
    router.replace(sort ? `${pathname}?sort=${sort}` : pathname, { scroll: false });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative basis-full sm:basis-auto sm:flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t("Shop.searchPlaceholder")}
            aria-label={t("Shop.searchPlaceholder")}
            className="w-full rounded-full border border-border bg-surface py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="shop-filter-panel"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium lg:hidden"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          {t("Shop.filters")}
          {activeCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
              {activeCount}
            </span>
          )}
        </button>

        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-muted-foreground max-sm:sr-only" aria-hidden>{t("Shop.sortBy")}</span>
          <Select
            label={t("Shop.sortBy")}
            value={params.get("sort") ?? "featured"}
            onChange={(v) => update("sort", v === "featured" ? null : v)}
            options={SORTS.map((s) => ({ value: s, label: t(`Shop.sort.${s}`) }))}
          />
        </div>
      </div>

      <div id="shop-filter-panel" className={cn("space-y-4 rounded-card border border-border bg-surface/60 p-4 sm:p-5", open ? "block" : "hidden lg:block")}>
        {groups.map((g) => (
          <fieldset key={g.param} className="flex flex-wrap items-center gap-2">
            <legend className="sr-only">{g.label}</legend>
            <span aria-hidden className="mr-1 w-24 shrink-0 text-sm font-medium text-muted-foreground">
              {g.label}
            </span>
            {g.options.map((o) => (
              <Chip key={o} active={params.get(g.param) === o} onClick={() => update(g.param, o)}>
                {g.labelFor(o)}
              </Chip>
            ))}
          </fieldset>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm" aria-live="polite">
        <p className="text-muted-foreground">{t("Shop.results", { count: resultCount })}</p>
        {activeCount > 0 && (
          <button type="button" onClick={clearAll} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
            <X className="size-4" aria-hidden />
            {t("Shop.clear")}
          </button>
        )}
      </div>
    </div>
  );
}
