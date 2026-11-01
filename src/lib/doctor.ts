/** Plant Doctor: each symptom has a clarifying question whose answers map to a likely cause. Text lives in messages (Doctor.symptoms.*). */
export const SYMPTOMS = {
  yellowLeaves: ["lowerWet", "dryPale", "oldFew"],
  brownTips: ["dryAir", "tapWater", "sunScorch"],
  droopy: ["dry", "soggy", "moved"],
  leafDrop: ["moved", "draught", "rhythm"],
  spots: ["wetRing", "sunPatch", "sticky"],
  pests: ["webbing", "cottony", "gnats"],
  leggy: ["lowLight", "neverTurned"],
  noBlooms: ["lowLight", "noRest", "overfed"],
  soilMold: ["whiteFuzz", "smelly"],
} as const;

export type Symptom = keyof typeof SYMPTOMS;
export const SYMPTOM_KEYS = Object.keys(SYMPTOMS) as Symptom[];
