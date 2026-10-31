import type { Light, Product } from "../data/types";

export const WATER_HABITS = ["forgetful", "regular", "keen"] as const;
export const CARE_LEVELS = ["easy", "any"] as const;
export const STYLES = ["leafy", "flowering", "sculptural", "bonsai", "any"] as const;
export const BUDGETS = ["under500", "upTo1500", "any"] as const;
export const FINDER_LIGHTS = ["low", "medium", "bright"] as const;

export type Answers = {
  light: Light;
  water: (typeof WATER_HABITS)[number];
  care: (typeof CARE_LEVELS)[number];
  style: (typeof STYLES)[number];
  budget: (typeof BUDGETS)[number];
};

export type Reason = "light" | "water" | "easy" | "style" | "budget";
export type Match = { product: Product; score: number; reasons: Reason[] };

const LIGHT_RANK: Record<Light, number> = { low: 0, medium: 1, bright: 2 };
const WATER_RANK = { low: 0, moderate: 1, high: 2 } as const;
const HABIT_RANK = { forgetful: 0, regular: 1, keen: 2 } as const;

const STYLE_CATEGORIES: Record<Answers["style"], string[] | null> = {
  leafy: ["indoor", "calathea"],
  flowering: ["orchids"],
  sculptural: ["dracaena", "ficus"],
  bonsai: ["bonsai"],
  any: null,
};

const within = (price: number, budget: Answers["budget"]) =>
  budget === "any" || (budget === "under500" ? price < 500 : price <= 1500);

export function scoreProduct(p: Product, a: Answers): Match {
  let score = 0;
  const reasons: Reason[] = [];

  // Light: a plant that needs more light than the spot offers is a poor match.
  const lightGap = LIGHT_RANK[p.care.light] - LIGHT_RANK[a.light];
  if (lightGap === 0) { score += 3; reasons.push("light"); }
  else if (lightGap < 0) score += 1;
  else score -= 3 * lightGap;

  // Water: needing more than the person will give is the risky direction.
  const waterGap = WATER_RANK[p.care.water] - HABIT_RANK[a.water];
  if (waterGap === 0) { score += 3; reasons.push("water"); }
  else if (waterGap > 0) score -= 2 * waterGap;
  else score -= 1;

  if (a.care === "easy") {
    if (p.care.difficulty === "easy") { score += 2; reasons.push("easy"); }
    else score -= 3;
  } else if (p.care.difficulty === "easy") score += 1;

  const cats = STYLE_CATEGORIES[a.style];
  if (cats) {
    if (cats.includes(p.category)) { score += 4; reasons.push("style"); }
    else score -= 2;
  }

  if (within(p.price, a.budget)) { if (a.budget !== "any") reasons.push("budget"); score += 3; }
  else score -= 4;

  return { product: p, score, reasons };
}

/** Ranks the catalog for the given answers. Outdoor-only bonsai are left out unless bonsai was asked for. */
export function rankProducts(products: Product[], a: Answers, limit = 6): Match[] {
  return products
    .filter((p) => !p.needsReview)
    .filter((p) => a.style === "bonsai" || p.bonsai?.placement !== "outdoor")
    .map((p) => scoreProduct(p, a))
    .sort((x, y) => y.score - x.score || x.product.price - y.product.price || x.product.id - y.product.id)
    .slice(0, limit);
}

const pick = <T extends string>(v: string | null | undefined, allowed: readonly T[]): T | undefined =>
  allowed.includes(v as T) ? (v as T) : undefined;

/** Parses untrusted URL params. Returns null unless every answer is valid. */
export function parseAnswers(get: (key: string) => string | null | undefined): Answers | null {
  const light = pick(get("light"), FINDER_LIGHTS);
  const water = pick(get("water"), WATER_HABITS);
  const care = pick(get("care"), CARE_LEVELS);
  const style = pick(get("style"), STYLES);
  const budget = pick(get("budget"), BUDGETS);
  return light && water && care && style && budget ? { light, water, care, style, budget } : null;
}
