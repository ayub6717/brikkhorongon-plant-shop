import { catalogState } from "@/lib/catalog-state";
import type { BonsaiStyle, CategorySlug, Difficulty, Light, Placement, Product } from "@/data/types";

export const CATEGORY_SLUGS: CategorySlug[] = ["indoor", "calathea", "dracaena", "ficus", "orchids", "bonsai"];
export const LIGHTS: Light[] = ["low", "medium", "bright"];
export const LEVELS: Difficulty[] = ["easy", "moderate"];
export const PRICE_BUCKETS = ["under500", "500-1500", "over1500"] as const;
export const BONSAI_STYLES: BonsaiStyle[] = ["formalUpright", "informalUpright", "windswept", "semiCascade", "literati", "broom"];
export const PLACEMENTS: Placement[] = ["indoor", "outdoor"];
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

const list = (): Product[] => catalogState.products;

export const getAllProducts = (): Product[] => list();

export const getFeaturedProducts = (limit = 8): Product[] =>
  list().filter((p) => p.featured && !p.needsReview).slice(0, limit);

export const getProductBySlug = (slug: string): Product | undefined =>
  list().find((p) => p.slug === slug);

export const countByCategory = (category: CategorySlug): number =>
  list().filter((p) => p.category === category).length;

export const getProductImage = (slug: string) => getProductBySlug(slug)?.image;

export const getRelatedProducts = (product: Product, limit = 4): Product[] =>
  list()
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
  const found = list().filter(
    (p) =>
      (!f.category || p.category === f.category) &&
      (!f.light || p.care.light === f.light) &&
      (!f.level || p.care.difficulty === f.level) &&
      (!f.price || inBucket(p.price, f.price)) &&
      (!q || `${p.name} ${catalogState.bn[p.slug]?.name ?? ""} ${p.description} ${catalogState.bn[p.slug]?.description ?? ""}`.toLowerCase().includes(q)),
  );

  switch (f.sort) {
    case "priceAsc":
      return found.sort((a, b) => a.price - b.price);
    case "priceDesc":
      return found.sort((a, b) => b.price - a.price);
    case "nameAsc":
      return found.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return found.sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || a.id - b.id);
  }
}

export const getBonsai = (): Product[] => list().filter((p) => p.category === "bonsai");

/** Bonsai filtered by untrusted URL params (style / placement). */
export function filterBonsai(raw: RawParams): { items: Product[]; style?: BonsaiStyle; placement?: Placement } {
  const style = pick(first(raw.style), BONSAI_STYLES);
  const placement = pick(first(raw.placement), PLACEMENTS);
  const items = getBonsai().filter((p) => (!style || p.bonsai?.style === style) && (!placement || p.bonsai?.placement === placement));
  return { items, style, placement };
}
