import { Flower2, Leaf, Sun } from "lucide-react";
import type { GiftCard } from "@/lib/gift";
import "./gift.css";

const DECO = { leaf: Leaf, bloom: Flower2, sunrise: Sun } as const;

/** A small animated greeting card showing the message that will ship with the order. */
export function GiftCardPreview({ design, note, from, label }: { design: Exclude<GiftCard, "none">; note: string; from?: string; label: string }) {
  const Deco = DECO[design];
  return (
    <figure className={`gc gc-${design} mx-auto max-w-sm`} aria-label={label}>
      <div className="gc-card relative overflow-hidden rounded-2xl p-6 text-white shadow-soft">
        <span className="gc-deco absolute -right-3 -top-3 text-white/25" aria-hidden><Deco className="size-24" /></span>
        <span className="gc-deco absolute -bottom-4 left-4 text-white/20" aria-hidden><Deco className="size-14" /></span>
        <span className="gc-deco absolute bottom-6 right-10 text-white/20" aria-hidden><Deco className="size-8" /></span>
        <p className="relative min-h-[3.5rem] whitespace-pre-wrap break-words font-display text-xl leading-snug">{note}</p>
        {from && <p className="relative mt-4 text-sm text-white/85">— {from}</p>}
      </div>
    </figure>
  );
}
