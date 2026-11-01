import type { BonsaiStyle } from "@/data/types";
import "./bonsai-art.css";

type Pad = [cx: number, cy: number, rx: number, ry?: number];

const Pads = ({ pads }: { pads: Pad[] }) => (
  <>
    {pads.map(([cx, cy, rx, ry = 8], i) => (
      <g key={i}>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="var(--primary)" />
        <ellipse cx={cx - rx * 0.2} cy={cy - ry * 0.35} rx={rx * 0.6} ry={ry * 0.45} fill="#fff" fillOpacity="0.16" />
      </g>
    ))}
  </>
);

const Trunk = ({ d, w = 6 }: { d: string; w?: number }) => (
  <path d={d} fill="none" stroke="var(--bs-trunk)" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
);

const Pot = ({ tall = false }: { tall?: boolean }) =>
  tall ? (
    <>
      <path d="M56 84h48l-4 42H60z" fill="var(--bs-pot)" />
      <rect x="54" y="82" width="52" height="5" rx="2.5" fill="var(--bs-pot)" />
    </>
  ) : (
    <>
      <path d="M50 114h60l-6 18H56z" fill="var(--bs-pot)" />
      <rect x="48" y="110" width="64" height="6" rx="3" fill="var(--bs-pot)" />
      <rect x="54" y="109" width="52" height="3" rx="1.5" fill="var(--bs-soil)" />
    </>
  );

const SHAPES: Record<BonsaiStyle, React.ReactNode> = {
  formalUpright: (
    <>
      <Trunk d="M80 112V28" w={7} />
      <g className="bs-sway">
        <Pads pads={[[80, 94, 36, 8], [80, 76, 29, 7.5], [80, 59, 22, 7], [80, 44, 16, 6.5], [80, 31, 10, 6]]} />
      </g>
      <Pot />
    </>
  ),
  informalUpright: (
    <>
      <Trunk d="M78 112C58 92 98 76 78 56S86 34 82 26" w={6} />
      <g className="bs-sway">
        <Pads pads={[[56, 90, 24, 8], [106, 72, 22, 7.5], [62, 52, 20, 7], [86, 28, 18, 7]]} />
      </g>
      <Pot />
    </>
  ),
  windswept: (
    <>
      <Trunk d="M58 112C56 90 50 72 64 56S82 42 94 40" w={6} />
      <g className="bs-sway bs-sway-2">
        <Pads pads={[[90, 38, 24, 7], [118, 48, 24, 6.5], [128, 68, 18, 6], [100, 62, 20, 6.5]]} />
      </g>
      <Pot />
    </>
  ),
  semiCascade: (
    <>
      <Pot tall />
      <Trunk d="M80 84C80 60 60 44 72 30S106 40 112 62S114 108 106 124" w={6} />
      <g className="bs-sway">
        <Pads pads={[[68, 28, 22, 8], [108, 60, 15, 7], [110, 90, 14, 6.5], [104, 120, 12, 6]]} />
      </g>
    </>
  ),
  literati: (
    <>
      <Trunk d="M80 112C70 90 92 70 78 48S76 22 84 12" w={3.5} />
      <g className="bs-sway bs-sway-2">
        <Pads pads={[[84, 14, 14, 6], [66, 52, 10, 4.5], [94, 70, 9, 4.5]]} />
      </g>
      <Pot />
    </>
  ),
  broom: (
    <>
      <Trunk d="M80 112V62" w={7} />
      <g stroke="var(--bs-trunk)" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M80 62L50 40M80 62L64 30M80 62V26M80 62L96 30M80 62L110 40" />
      </g>
      <g className="bs-sway">
        <Pads pads={[[52, 42, 16, 11], [66, 30, 16, 11], [80, 26, 17, 12], [94, 30, 16, 11], [108, 42, 16, 11], [80, 42, 30, 14]]} />
      </g>
      <Pot />
    </>
  ),
};

/** Decorative line-art of a bonsai in a given style. The foliage sways gently. */
export function BonsaiArt({ style, className }: { style: BonsaiStyle; className?: string }) {
  return (
    <svg viewBox="0 0 160 136" aria-hidden className={`bs-art ${className ?? ""}`} focusable="false">
      {SHAPES[style]}
    </svg>
  );
}
