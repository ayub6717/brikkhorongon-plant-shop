export type CategorySlug = "indoor" | "calathea" | "dracaena" | "ficus" | "orchids" | "bonsai";

export type Light = "low" | "medium" | "bright";
export type Water = "low" | "moderate" | "high";
export type Difficulty = "easy" | "moderate";

export type BonsaiStyle = "formalUpright" | "informalUpright" | "windswept" | "semiCascade" | "literati" | "broom";
export type Placement = "indoor" | "outdoor";

export type BonsaiDetails = {
  style: BonsaiStyle;
  /** Approximate age of the tree in years */
  ageYears: number;
  heightCm: number;
  placement: Placement;
};

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
  /** Only for bonsai trees */
  bonsai?: BonsaiDetails;
  featured?: boolean;
  /** Legacy data that should be double-checked before launch */
  needsReview?: boolean;
};
