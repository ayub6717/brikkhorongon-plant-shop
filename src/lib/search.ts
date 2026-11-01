import { productsBn } from "@/data/products.bn";
import type { Product } from "@/data/types";

/** Lower-cases and strips diacritics so "Calathéa" matches "calathea". */
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/**
 * Ranks products for a free-text query. Every word must match somewhere (name, category label or
 * description); name matches rank first, and names that start with the query rank highest.
 */
export function searchProducts(
  query: string,
  items: Product[],
  categoryLabel: (p: Product) => string = (p) => p.category,
  limit = 6,
): Product[] {
  const q = norm(query).trim();
  if (!q) return [];
  const words = q.split(/\s+/);

  return items
    .map((p) => {
      const bn = productsBn[p.slug];
      const name = norm(`${p.name} ${bn?.name ?? ""}`);
      const cat = norm(`${categoryLabel(p)} ${p.category}`);
      const desc = norm(`${p.description} ${bn?.description ?? ""}`);
      let score = 0;
      for (const w of words) {
        if (name.startsWith(w)) score += 100;
        else if (name.split(/\s+/).some((n) => n.startsWith(w))) score += 80;
        else if (name.includes(w)) score += 60;
        else if (cat.includes(w)) score += 40;
        else if (desc.includes(w)) score += 20;
        else return { p, score: 0 };
      }
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.p.price - b.p.price)
    .slice(0, limit)
    .map((x) => x.p);
}
