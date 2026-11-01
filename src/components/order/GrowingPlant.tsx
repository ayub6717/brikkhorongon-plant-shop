import type { CSSProperties } from "react";

/**
 * Celebration illustration: a potted plant that grows stem by stem and leaf by leaf.
 * Pure SVG + CSS keyframes (see `.plant-*` in globals.css): no JS, no animation library.
 * With reduced motion the animations are removed and the finished plant is shown.
 */

// Each branch: stem path, then leaves placed along it as [x, y, rotation, size].
const BRANCHES = [
  { d: "M99 142 C86 138 72 130 58 114", delay: 1.0, leaves: [[58, 114, -55, 1], [78, 133, -75, 0.7]] },
  { d: "M100 122 C115 117 130 110 142 94", delay: 1.2, leaves: [[142, 94, 55, 1], [120, 114, 75, 0.7]] },
  { d: "M98 96 C86 90 77 80 70 64", delay: 1.4, leaves: [[70, 64, -35, 0.95], [84, 87, -70, 0.65]] },
  { d: "M101 76 C112 70 120 60 126 46", delay: 1.6, leaves: [[126, 46, 35, 0.95], [112, 69, 70, 0.65]] },
] as const;

const SPARKS = [
  { x: 40, y: 70, delay: 2.2 }, { x: 160, y: 60, delay: 2.4 }, { x: 28, y: 125, delay: 2.6 },
  { x: 172, y: 120, delay: 2.3 }, { x: 56, y: 30, delay: 2.7 }, { x: 148, y: 26, delay: 2.5 },
];

const LEAF = "M0 0 C-9 -8 -9 -22 0 -30 C9 -22 9 -8 0 0Z";
const delay = (s: number): CSSProperties => ({ ["--d" as string]: `${s}s` });

export function GrowingPlant({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 224" className={className} aria-hidden="true" focusable="false">
      {/* soft ground glow */}
      <ellipse cx="100" cy="214" rx="62" ry="7" className="plant-pop fill-primary/10" style={delay(0)} />

      {/* sway wraps the whole plant, pivoting at the pot */}
      <g className="plant-sway">
        {/* stem + branches */}
        <path d="M100 184 C100 152 92 122 100 92 S104 62 100 40" pathLength={1} className="plant-draw fill-none stroke-primary" strokeWidth="3.5" strokeLinecap="round" style={delay(0.35)} />
        {BRANCHES.map((b) => (
          <path key={b.d} d={b.d} pathLength={1} className="plant-draw plant-draw-short fill-none stroke-primary" strokeWidth="2.5" strokeLinecap="round" style={delay(b.delay)} />
        ))}

        {/* leaves */}
        {BRANCHES.flatMap((b, bi) =>
          b.leaves.map(([x, y, r, s], li) => (
            <g key={`${bi}-${li}`} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
              <path d={LEAF} className={`plant-leaf ${li === 0 ? "fill-primary" : "fill-primary/70"}`} style={delay(b.delay + 0.45 + li * 0.15)} />
            </g>
          )),
        )}
        {/* crown leaves */}
        <g transform="translate(100 40) rotate(-12) scale(1.15)">
          <path d={LEAF} className="plant-leaf fill-primary" style={delay(1.9)} />
        </g>
        <g transform="translate(100 42) rotate(28) scale(0.85)">
          <path d={LEAF} className="plant-leaf fill-primary/70" style={delay(2.05)} />
        </g>
        <g transform="translate(100 42) rotate(-45) scale(0.85)">
          <path d={LEAF} className="plant-leaf fill-primary/70" style={delay(2.15)} />
        </g>
      </g>

      {/* pot */}
      <g className="plant-pot" style={delay(0)}>
        <path d="M68 180 H132 L124 216 Q123 220 118 220 H82 Q77 220 76 216 Z" className="fill-accent" />
        <rect x="64" y="174" width="72" height="12" rx="4" className="fill-accent" />
        <rect x="64" y="174" width="72" height="4" rx="2" fill="white" opacity="0.18" />
      </g>

      {/* sparkles */}
      {SPARKS.map((s, i) => (
        <g key={i} transform={`translate(${s.x} ${s.y})`}>
          <path d="M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6Z" className="plant-spark fill-accent" style={delay(s.delay)} />
        </g>
      ))}
    </svg>
  );
}
