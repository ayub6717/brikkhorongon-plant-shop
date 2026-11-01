import { describe, expect, it } from "vitest";
import bn from "@/messages/bn.json";
import en from "@/messages/en.json";
import { SYMPTOMS } from "./doctor";

describe.each([["en", en], ["bn", bn]])("Plant Doctor messages (%s)", (_l, messages) => {
  const doctor = (messages as typeof en).Doctor.symptoms as Record<string, { name: string; q: string; options: Record<string, { label: string; cause: string; fix: string[] }> }>;
  it.each(Object.entries(SYMPTOMS))("%s has text for every option", (symptom, options) => {
    const s = doctor[symptom];
    expect(s.name).toBeTruthy();
    expect(s.q).toBeTruthy();
    for (const o of options) {
      expect(s.options[o].label).toBeTruthy();
      expect(s.options[o].cause).toBeTruthy();
      expect(s.options[o].fix.length).toBeGreaterThan(0);
    }
  });
});
