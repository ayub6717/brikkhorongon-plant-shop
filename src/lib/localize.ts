import { catalogState } from "@/lib/catalog-state";
import type { Product } from "@/data/types";

/** Returns the product with Bangla name and description when the locale is "bn" and a translation exists. */
export function localizeProduct<T extends Pick<Product, "slug" | "name" | "description">>(p: T, locale: string): T {
  const t = locale === "bn" ? catalogState.bn[p.slug] : undefined;
  return t ? { ...p, name: t.name, description: t.description } : p;
}

/** Name used for search so both languages match, whichever is displayed. */
export const searchableName = (p: Pick<Product, "slug" | "name">): string => `${p.name} ${catalogState.bn[p.slug]?.name ?? ""}`;
