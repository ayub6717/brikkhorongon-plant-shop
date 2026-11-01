"use client";

import { BookOpen, Compass, Heart, Languages, Leaf, Moon, PackageSearch, Scale, Search, ShoppingBag, Sprout, Stethoscope, Store, TreePine, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { getAllProducts, getFeaturedProducts } from "@/lib/catalog";
import { localizeProduct } from "@/lib/localize";
import { formatPrice } from "@/lib/format";
import { searchProducts } from "@/lib/search";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useUi } from "@/store/ui";

type Item = { id: string; group: "plants" | "pages" | "actions"; label: string; hint?: string; icon?: LucideIcon; image?: string; run: () => void };

const PAGES: { href: string; key: string; icon: LucideIcon }[] = [
  { href: "/shop", key: "shop", icon: Store },
  { href: "/bonsai", key: "bonsai", icon: TreePine },
  { href: "/learn", key: "learn", icon: BookOpen },
  { href: "/finder", key: "finder", icon: Compass },
  { href: "/doctor", key: "doctor", icon: Stethoscope },
  { href: "/track", key: "track", icon: PackageSearch },
  { href: "/garden", key: "garden", icon: Sprout },
  { href: "/wishlist", key: "wishlist", icon: Heart },
  { href: "/compare", key: "compare", icon: Scale },
  { href: "/cart", key: "cart", icon: ShoppingBag },
];

const ORDER_ID = /^brk-[a-z0-9]{3,8}$/i;

/** Global Ctrl/⌘ + K palette: find plants, jump to pages, run quick actions. */
export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen);
  const setOpen = useUi((s) => s.setPalette);
  const t = useTranslations("Palette");
  const tn = useTranslations("Nav");
  const tcat = useTranslations("Categories");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  // Open with Ctrl/⌘ + K, or "/" when not typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.("input, textarea, select, [contenteditable='true']");
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useUi.getState().setPalette(!useUi.getState().paletteOpen);
      } else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        useUi.getState().setPalette(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const close = () => { setOpen(false); setQuery(""); setActive(0); };
  const go = (href: string) => { close(); router.push(href); };

  const items = useMemo<Item[]>(() => {
    const q = query.trim();
    const other = routing.locales.find((l) => l !== locale) ?? locale;
    const pageItems: Item[] = PAGES.map((p) => ({ id: `page-${p.key}`, group: "pages", label: tn(p.key), icon: p.icon, run: () => go(p.href) }));
    const actions: Item[] = [
      { id: "act-theme", group: "actions", label: tn("toggleTheme"), icon: Moon, run: () => { setTheme(resolvedTheme === "dark" ? "light" : "dark"); close(); } },
      { id: "act-lang", group: "actions", label: t("switchLang", { lang: other === "bn" ? "বাংলা" : "English" }), icon: Languages, run: () => { close(); router.replace(pathname, { locale: other }); } },
    ];
    const plant = (p: ReturnType<typeof getAllProducts>[number]): Item => ({
      id: `plant-${p.slug}`, group: "plants", label: localizeProduct(p, locale).name, hint: `${tcat(`${p.category}.name`)} · ${formatPrice(p.price, locale)}`, image: p.image.src, run: () => go(`/shop/${p.slug}`),
    });

    if (!q) return [...getFeaturedProducts(4).map(plant), ...pageItems, ...actions];

    const found = searchProducts(q, getAllProducts(), (p) => tcat(`${p.category}.name`), 6).map(plant);
    const lower = q.toLowerCase();
    const extra: Item[] = [...pageItems, ...actions].filter((i) => i.label.toLowerCase().includes(lower));
    const track: Item[] = ORDER_ID.test(q) ? [{ id: "track-order", group: "pages", label: t("trackOrder", { id: q.toUpperCase() }), icon: PackageSearch, run: () => go(`/track?id=${encodeURIComponent(q.toUpperCase())}`) }] : [];
    return [...track, ...found, ...extra];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, locale, resolvedTheme, pathname]);

  const index = Math.min(active, Math.max(items.length - 1, 0));
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest" });
  }, [index]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((index + 1) % Math.max(items.length, 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((index - 1 + items.length) % Math.max(items.length, 1)); }
    else if (e.key === "Enter") { e.preventDefault(); items[index]?.run(); }
  };

  const heading = (g: Item["group"], first: boolean) => (first ? (query.trim() ? t(`groups.${g}`) : g === "plants" ? t("groups.popular") : t(`groups.${g === "pages" ? "goto" : g}`)) : null);

  return (
    <Modal open={open} onClose={close} label={t("title")}>
      <div className="flex items-center gap-3 border-b border-border px-4">
        <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <input
          data-autofocus
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={items[index] ? `${listId}-${index}` : undefined}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(0); }}
          onKeyDown={onKeyDown}
          placeholder={t("placeholder")}
          autoComplete="off"
          spellCheck={false}
          // The global :focus-visible ring is unlayered and would beat the utility class, so opt out inline.
          style={{ outline: "none" }}
          className="h-14 w-full bg-transparent text-base placeholder:text-muted-foreground"
        />
        <kbd className="hidden shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground sm:block">Esc</kbd>
      </div>

      <div className="overflow-y-auto p-2">
        {items.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-muted-foreground">{t("noResults", { q: query.trim() })}</p>
        ) : (
          <ul ref={listRef} id={listId} role="listbox" aria-label={t("title")}>
            {items.map((item, i) => {
              const Icon = item.icon ?? Leaf;
              const h = heading(item.group, i === 0 || items[i - 1].group !== item.group);
              return (
                <li key={item.id} role="presentation">
                  {h && <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</p>}
                  <div
                    id={`${listId}-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={i === index}
                    onMouseMove={() => setActive(i)}
                    onClick={item.run}
                    className={cn("flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5", i === index ? "bg-muted text-primary" : "")}
                  >
                    {item.image ? (
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted"><Image src={item.image} alt="" fill sizes="40px" className="object-cover" /></span>
                    ) : (
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted/80 text-primary"><Icon className="size-5" aria-hidden /></span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.label}</span>
                      {item.hint && <span className="block truncate text-xs text-muted-foreground">{item.hint}</span>}
                    </span>
                    {i === index && <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground sm:block">↵</kbd>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div aria-live="polite" className="sr-only">{query.trim() ? t("resultCount", { count: items.length }) : ""}</div>
      <p className="hidden border-t border-border px-4 py-2 text-xs text-muted-foreground sm:block">
        <kbd className="rounded border border-border px-1">↑</kbd> <kbd className="rounded border border-border px-1">↓</kbd> {t("hintNav")} · <kbd className="rounded border border-border px-1">↵</kbd> {t("hintSelect")}
      </p>
    </Modal>
  );
}
