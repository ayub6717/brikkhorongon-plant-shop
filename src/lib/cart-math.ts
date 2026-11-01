import type { Product } from "@/data/types";
import { getProductBySlug } from "@/lib/catalog";
import { localizeProduct } from "@/lib/localize";
import type { CartLine } from "@/store/cart";

export type ResolvedLine = { product: Product; qty: number };

/** Joins cart lines with catalog products, dropping any that no longer exist. */
export function resolveLines(lines: CartLine[], locale = "en"): ResolvedLine[] {
  return lines.flatMap((l) => {
    const product = getProductBySlug(l.slug);
    return product ? [{ product: localizeProduct(product, locale), qty: l.qty }] : [];
  });
}

export const subtotalOf = (lines: ResolvedLine[]): number =>
  lines.reduce((n, l) => n + l.product.price * l.qty, 0);
