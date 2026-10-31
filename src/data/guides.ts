export type GuideIcon = "droplets" | "sun" | "sprout" | "wind" | "flower" | "tree" | "stethoscope";

/** Text for each guide lives in messages (Learn.guides.<slug>) so it can be translated. */
export const guides: { slug: string; icon: GuideIcon; minutes: number; related: string[] }[] = [
  { slug: "watering", icon: "droplets", minutes: 4, related: ["spider-plant", "rubber-plant", "corn-plant", "moth-orchid"] },
  { slug: "light", icon: "sun", minutes: 4, related: ["dragon-tree", "chinese-money-plant", "fiddle-leaf-fig", "radiator-plant"] },
  { slug: "repotting", icon: "sprout", minutes: 5, related: ["succulent-plant", "ficus-island", "hoya-plant", "dracaena-reflexa"] },
  { slug: "calathea", icon: "wind", minutes: 4, related: ["rose-painted-calathea", "peacock-plant", "rattlesnake-plant", "pin-stripe-calathea"] },
  { slug: "orchids", icon: "flower", minutes: 5, related: ["moth-orchid", "slipper-orchid", "lycaste-orchid", "corsage-orchid"] },
  { slug: "bonsai", icon: "tree", minutes: 6, related: ["ficus-bonsai", "juniper-bonsai", "bougainvillea-bonsai", "chinese-elm-bonsai"] },
  { slug: "troubleshooting", icon: "stethoscope", minutes: 5, related: ["spider-plant", "corn-plant", "succulent-collection", "rubber-plant"] },
];

export const getGuide = (slug: string) => guides.find((g) => g.slug === slug);
