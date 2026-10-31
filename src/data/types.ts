export type CategorySlug = "indoor" | "calathea" | "dracaena" | "ficus" | "orchids";

export type Light = "low" | "medium" | "bright";
export type Water = "low" | "moderate" | "high";
export type Difficulty = "easy" | "moderate";

export type Product = {
  id: number;
  slug: string;
  name: string;
  category: CategorySlug;
  /** Price in BDT */
  price: number;
  image: { src: string; width: number; height: number };
  care: { light: Light; water: Water; difficulty: Difficulty };
  description: string;
  featured?: boolean;
  /** Legacy data that should be double-checked before launch */
  needsReview?: boolean;
};
