import { Droplets, Flower2, Sprout, Stethoscope, Sun, TreeDeciduous, Wind, type LucideIcon } from "lucide-react";
import type { GuideIcon as Name } from "@/data/guides";

const MAP: Record<Name, LucideIcon> = {
  droplets: Droplets,
  sun: Sun,
  sprout: Sprout,
  wind: Wind,
  flower: Flower2,
  tree: TreeDeciduous,
  stethoscope: Stethoscope,
};

export function GuideIcon({ name, className }: { name: Name; className?: string }) {
  const Icon = MAP[name];
  return <Icon className={className} aria-hidden />;
}
