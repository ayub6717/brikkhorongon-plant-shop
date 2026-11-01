import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only stars. Supports fractional values by clipping the filled layer. */
export function Stars({ value, label, className }: { value: number; label: string; className?: string }) {
  return (
    <span role="img" aria-label={label} className={cn("relative inline-flex", className)}>
      <span className="flex text-border" aria-hidden>{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-4" />)}</span>
      <span className="absolute inset-y-0 start-0 flex overflow-hidden text-amber-500" style={{ width: `${(Math.min(5, Math.max(0, value)) / 5) * 100}%` }} aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-4 shrink-0 fill-current" />)}
      </span>
    </span>
  );
}
