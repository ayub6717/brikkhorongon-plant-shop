import { products } from "@/data/products";
import type { CategorySlug, Difficulty, Light, Product } from "@/data/types";

export const CATEGORY_SLUGS: CategorySlug[] = ["indoor", "calathea", "dracaena", "ficus", "orchids"];
export const LIGHTS: Light[] = ["low", "medium", "bright"];
export const LEVELS: Difficulty[] = ["easy", "moderate"];
export const PRICE_BUCKETS = ["under500", "500-1500", "over1500"] as const;
export const SORTS = ["featured", "priceAsc", "priceDesc", "nameAsc"] as const;

export type PriceBucket = (typeof PRICE_BUCKETS)[number];
export type Sort = (typeof SORTS)[number];

export type ShopFilters = {
  category?: CategorySlug;
  light?: Light;
  level?: Difficulty;
  price?: PriceBucket;
  q?: string;
  sort: Sort;
};

export const getAllProducts = (): Product[] => products;

export const getFeaturedProducts = (limit = 8): Product[] =>
  products.filter((p) => p.featured && !p.needsReview).slice(0, limit);

export const getProductBySlug = (slug: string): Product | undefined =>
  products.find((p) => p.slug === slug);

export const countByCategory = (category: CategorySlug): number =>
  products.filter((p) => p.category === category).length;

export const getProductImage = (slug: string) => getProductBySlug(slug)?.image;

export const getRelatedProducts = (product: Product, limit = 4): Product[] =>
  products
    .filter((p) => p.category === product.category && p.id !== product.id && !p.needsReview)
    .slice(0, limit);

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const pick = <T extends string>(v: string | undefined, allowed: readonly T[]): T | undefined =>
  allowed.includes(v as T) ? (v as T) : undefined;

/** Turns untrusted URL params into a safe filter object. */
export function parseFilters(raw: RawParams): ShopFilters {
  return {
    category: pick(first(raw.category), CATEGORY_SLUGS),
    light: pick(first(raw.light), LIGHTS),
    level: pick(first(raw.level), LEVELS),
    price: pick(first(raw.price), PRICE_BUCKETS),
    q: first(raw.q)?.trim().slice(0, 60) || undefined,
    sort: pick(first(raw.sort), SORTS) ?? "featured",
  };
}

const inBucket = (price: number, bucket: PriceBucket) =>
  bucket === "under500" ? price < 500 : bucket === "500-1500" ? price >= 500 && price <= 1500 : price > 1500;

export function filterProducts(f: ShopFilters): Product[] {
  const q = f.q?.toLowerCase();
  const list = products.filter(
    (p) =>
      (!f.category || p.category === f.category) &&
      (!f.light || p.care.light === f.light) &&
      (!f.level || p.care.difficulty === f.level) &&
      (!f.price || inBucket(p.price, f.price)) &&
      (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)),
  );

  switch (f.sort) {
    case "priceAsc":
      return list.sort((a, b) => a.price - b.price);
    case "priceDesc":
      return list.sort((a, b) => b.price - a.price);
    case "nameAsc":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return list.sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || a.id - b.id);
  }
}
