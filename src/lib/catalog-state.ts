import { products as staticProducts } from "@/data/products";
import { productsBn as staticBn } from "@/data/products.bn";
import type { BonsaiDetails, CategorySlug, Product } from "@/data/types";
import { couponState } from "@/lib/coupons";
import { shippingConfig } from "@/lib/shipping";

/**
 * Where the storefront's catalog lives at runtime.
 *
 * Without the server (the browser-only demo) it is the static list in src/data. With the server on, the shop team
 * edits plants in the admin, and the catalog is loaded from the API (GET /api/catalog) and swapped in here, so every
 * component that calls getAllProducts() & co. sees the live data without knowing where it came from.
 */
export type CatalogProduct = {
  id: number; slug: string; nameEn: string; nameBn: string; descriptionEn: string; descriptionBn: string;
  category: CategorySlug; price: number; stock?: number | null; featured: boolean; needsReview: boolean;
  image: Product["image"]; care: Product["care"]; bonsai?: BonsaiDetails;
};

export type CatalogPayload = {
  products: CatalogProduct[];
  coupons: { code: string; kind: "percent" | "fixed" | "freeShip"; value: number; minSubtotal: number; expiresAt?: string }[];
  settings: {
    freeShippingThreshold: number; dhakaInnerFee: number; dhakaOuterFee: number; districtFees: Record<string, number>;
    slots: string[]; shopName: string; phone: string; email: string; address: string;
  };
};

export const catalogState: {
  products: Product[];
  bn: Record<string, { name: string; description: string }>;
  stock: Record<string, number | null>;
  live: boolean;
} = { products: staticProducts, bn: staticBn, stock: {}, live: false };

let applied: CatalogPayload | null = null;

/** Swaps the live catalog, coupons and delivery rules in. Safe to call repeatedly with the same payload. */
export function applyCatalog(payload: CatalogPayload | null | undefined): void {
  if (!payload || payload === applied) return;
  applied = payload;

  catalogState.products = payload.products.map((p) => ({
    id: p.id, slug: p.slug, name: p.nameEn, category: p.category, price: p.price, image: p.image, care: p.care,
    description: p.descriptionEn, ...(p.bonsai ? { bonsai: p.bonsai } : {}),
    ...(p.featured ? { featured: true } : {}), ...(p.needsReview ? { needsReview: true } : {}),
  }));
  catalogState.bn = Object.fromEntries(payload.products.map((p) => [p.slug, { name: p.nameBn, description: p.descriptionBn }]));
  catalogState.stock = Object.fromEntries(payload.products.map((p) => [p.slug, p.stock ?? null]));
  catalogState.live = true;

  couponState.list = payload.coupons;

  const s = payload.settings;
  shippingConfig.threshold = s.freeShippingThreshold;
  shippingConfig.inner = s.dhakaInnerFee;
  shippingConfig.outer = s.dhakaOuterFee;
  shippingConfig.fees = s.districtFees;
  shippingConfig.slots = s.slots;
}

/** Units left, or null when stock isn't tracked for this plant. */
export const getStock = (slug: string): number | null => catalogState.stock[slug] ?? null;
export const isOutOfStock = (slug: string): boolean => (catalogState.stock[slug] ?? 1) <= 0;
