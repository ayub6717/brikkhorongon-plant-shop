import type { CSSProperties, ReactNode } from "react";

/** Small looping illustrations for the finder answers. Pure SVG + CSS (see finder.css). */

const SUN = "#f2b632";
const CLOUD = "#cfd8d6";
const DROP = "#4aa3d8";
const COIN = "#e0b24a";
const COIN_DARK = "#c8962b";
const v = (o: Record<string, string>) => o as CSSProperties;

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" className="size-full" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

function Rays({ n, r1, r2, cx = 24, cy = 24 }: { n: number; r1: number; r2: number; cx?: number; cy?: number }) {
  return (
    <g stroke={SUN} strokeWidth="2.2" strokeLinecap="round">
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        // Rounded so server and browser print identical numbers (avoids a hydration mismatch).
        const pt = (r: number, f: (x: number) => number) => Math.round(r * f(a) * 100) / 100;
        return <line key={i} x1={cx + pt(r1, Math.cos)} y1={cy + pt(r1, Math.sin)} x2={cx + pt(r2, Math.cos)} y2={cy + pt(r2, Math.sin)} />;
      })}
    </g>
  );
}

function Cloud({ x = 0, y = 0, o = 1 }: { x?: number; y?: number; o?: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill={CLOUD} opacity={o}>
      <circle cx="16" cy="30" r="7" />
      <circle cx="25" cy="25" r="9" />
      <circle cx="34" cy="30" r="6" />
      <rect x="16" y="30" width="18" height="7" rx="3" />
    </g>
  );
}

const Pot = ({ soil = "#7a5a3c" }: { soil?: string }) => (
  <g>
    <path d="M14 36 H34 L32 45 H16 Z" className="fill-accent" />
    <rect x="12" y="33" width="24" height="5" rx="2" className="fill-accent" />
    <rect x="14" y="33" width="20" height="2" fill={soil} opacity="0.9" />
  </g>
);

const LEAF = "M0 0 C-5 -4 -5 -12 0 -17 C5 -12 5 -4 0 0Z";

function Sprout({ x, base = 33, h = 14, cls = "fa-sway", delay = 0 }: { x: number; base?: number; h?: number; cls?: string; delay?: number }) {
  return (
    <g className={cls} style={v({ animationDelay: `${delay}s` })}>
      <path d={`M${x} ${base} V${base - h}`} className="stroke-primary" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d={LEAF} className="fill-primary" transform={`translate(${x} ${base - h + 2}) rotate(-45) scale(0.7)`} />
      <path d={LEAF} className="fill-primary/75" transform={`translate(${x} ${base - h + 2}) rotate(45) scale(0.7)`} />
    </g>
  );
}

function Water({ n, dur, droop = false }: { n: number; dur: number; droop?: boolean }) {
  return (
    <Svg>
      <Pot soil={droop ? "#b79a73" : "#5d422a"} />
      <g className={droop ? "fa-droop" : "fa-sway"}>
        <Sprout x={24} cls="" />
      </g>
      {Array.from({ length: n }, (_, i) => (
        <g key={i} transform={`translate(${n === 1 ? 24 : 12 + (i * 24) / (n - 1)} 6)`}>
          <path
            d="M0 -4 C3 0 3 3 0 3 C-3 3 -3 0 0 -4Z"
            fill={DROP}
            className="fa-drop"
            style={v({ animationDuration: `${dur}s`, animationDelay: `${(i * dur) / n}s` })}
          />
        </g>
      ))}
    </Svg>
  );
}

function Coin({ x, y, cls = "", delay = 0 }: { x: number; y: number; cls?: string; delay?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={cls} style={v({ animationDelay: `${delay}s` })}>
        <ellipse rx="10" ry="4" fill={COIN_DARK} cy="2" />
        <ellipse rx="10" ry="4" fill={COIN} />
        <ellipse rx="6" ry="2.2" fill="none" stroke={COIN_DARK} strokeWidth="1" />
      </g>
    </g>
  );
}

const Star = ({ x, y, s, delay }: { x: number; y: number; s: number; delay: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2Z" fill={SUN} className="fa-twinkle" style={v({ animationDelay: `${delay}s` })} />
  </g>
);

const FLOWER_PETALS = [0, 125, -125];

export const OPTION_ART: Record<string, () => ReactNode> = {
  // light
  low: () => (
    <Svg>
      <circle cx="33" cy="15" r="7" fill={SUN} opacity="0.35" className="fa-pulse" />
      <g className="fa-drift"><Cloud x={-2} y={-2} /></g>
    </Svg>
  ),
  medium: () => (
    <Svg>
      <g className="fa-pulse"><Rays n={8} r1={11} r2={15} cx={22} cy={20} /></g>
      <circle cx="22" cy="20" r="8" fill={SUN} />
      <g className="fa-drift"><Cloud x={7} y={5} /></g>
    </Svg>
  ),
  bright: () => (
    <Svg>
      <circle cx="24" cy="24" r="14" fill={SUN} opacity="0.22" className="fa-pulse" />
      <g className="fa-spin"><Rays n={12} r1={14} r2={20} /></g>
      <circle cx="24" cy="24" r="10" fill={SUN} />
    </Svg>
  ),
  // water
  forgetful: () => <Water n={1} dur={3.2} droop />,
  regular: () => <Water n={3} dur={2.4} />,
  keen: () => <Water n={5} dur={1.6} />,
  // care
  easy: () => (
    <Svg>
      <Pot />
      <Sprout x={24} h={16} />
      <path d="M36 12 l3 3 l6 -6" fill="none" stroke="#3f7a4f" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  any: () => (
    <Svg>
      <Pot />
      <Sprout x={18} h={10} cls="fa-grow" delay={0} />
      <Sprout x={24} h={16} cls="fa-grow" delay={0.4} />
      <Sprout x={30} h={12} cls="fa-grow" delay={0.8} />
    </Svg>
  ),
  // style
  leafy: () => (
    <Svg>
      <Pot />
      {[-50, -22, 0, 22, 50].map((a, i) => (
        <g key={a} className="fa-sway" style={v({ animationDelay: `${i * 0.35}s` })}>
          <path d={LEAF} className={i % 2 ? "fill-primary/75" : "fill-primary"} transform={`translate(24 33) rotate(${a}) scale(${i === 2 ? 1.25 : 1})`} />
        </g>
      ))}
    </Svg>
  ),
  flowering: () => (
    <Svg>
      <path d="M24 46 C24 36 22 30 24 24" className="stroke-primary" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <g transform="translate(24 20)" className="fa-bloom">
        {FLOWER_PETALS.map((a) => (
          <g key={a} transform={`rotate(${a})`}><ellipse cy="-7" rx="4.2" ry="7" fill="#fff7fb" stroke="#e8b4cb" strokeWidth="0.8" /></g>
        ))}
        {[88, -88].map((a) => (
          <g key={a} transform={`rotate(${a})`}><ellipse cy="-7.5" rx="6.8" ry="7.2" fill="#fffafc" stroke="#e8b4cb" strokeWidth="0.8" /></g>
        ))}
        <ellipse cy="3.6" rx="2.6" ry="3.6" fill="#c43d7a" />
        <circle r="1.7" fill="#f2c14e" />
      </g>
    </Svg>
  ),
  sculptural: () => (
    <Svg>
      <Pot />
      <path d="M24 34 V20" className="stroke-primary" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      {[-60, -25, 0, 25, 60].map((a, i) => (
        <g key={a} className="fa-sway" style={v({ animationDelay: `${i * 0.3}s` })}>
          <path d="M0 0 C-2 -7 -2 -14 0 -19 C2 -14 2 -7 0 0Z" className={i % 2 ? "fill-primary/75" : "fill-primary"} transform={`translate(24 21) rotate(${a})`} />
        </g>
      ))}
    </Svg>
  ),
  bonsai: () => (
    <Svg>
      <rect x="10" y="40" width="28" height="4" rx="2" className="fill-accent" />
      <path d="M24 40 C22 34 28 32 25 26 C23 22 26 20 25 17" className="stroke-primary" strokeWidth="3" fill="none" strokeLinecap="round" />
      <g className="fa-bob" fill="#3f7a4f">
        <ellipse cx="25" cy="14" rx="10" ry="6" className="fill-primary" />
        <ellipse cx="15" cy="21" rx="7" ry="4" className="fill-primary/80" />
        <ellipse cx="34" cy="22" rx="7" ry="4" className="fill-primary/80" />
      </g>
    </Svg>
  ),
  surprise: () => (
    <Svg>
      <Star x={16} y={18} s={1.2} delay={0} />
      <Star x={33} y={14} s={0.8} delay={0.5} />
      <Star x={30} y={32} s={1.1} delay={1} />
      <Star x={13} y={36} s={0.7} delay={1.5} />
    </Svg>
  ),
  // budget
  under500: () => (
    <Svg>
      <g transform="translate(24 26)"><g className="fa-flip"><circle r="12" fill={COIN} stroke={COIN_DARK} strokeWidth="2" /><circle r="7.5" fill="none" stroke={COIN_DARK} strokeWidth="1.4" /></g></g>
    </Svg>
  ),
  upTo1500: () => (
    <Svg>
      <Coin x={24} y={38} cls="fa-stack" delay={0} />
      <Coin x={24} y={31} cls="fa-stack" delay={0.5} />
      <Coin x={24} y={24} cls="fa-stack" delay={1} />
    </Svg>
  ),
  nolimit: () => (
    <Svg>
      <path d="M24 24 C28 14 40 14 40 24 C40 34 28 34 24 24 C20 14 8 14 8 24 C8 34 20 34 24 24Z" fill="none" stroke={COIN} strokeWidth="3" strokeLinecap="round" opacity="0.35" />
      <path d="M24 24 C28 14 40 14 40 24 C40 34 28 34 24 24 C20 14 8 14 8 24 C8 34 20 34 24 24Z" fill="none" stroke={COIN} strokeWidth="3.4" strokeLinecap="round" pathLength={1} className="fa-dash" />
      <Star x={40} y={10} s={0.7} delay={0.3} />
      <Star x={8} y={38} s={0.6} delay={1} />
    </Svg>
  ),
};

/** Answer ids repeat across questions ("any"), so art is looked up per question. */
export function artFor(question: string, option: string): ReactNode {
  const id =
    question === "care" ? (option === "easy" ? "easy" : "any")
    : question === "style" && option === "any" ? "surprise"
    : question === "budget" && option === "any" ? "nolimit"
    : option;
  return OPTION_ART[id]?.() ?? null;
}
