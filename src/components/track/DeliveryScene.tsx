"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import type { OrderStatus } from "@/store/orders";
import "./delivery-scene.css";

/**
 * A little delivery story: the rider loads plants at the nursery, cycles to the house, knocks,
 * hands the plants over and the customer is delighted.
 * - With a `status` the scene shows that stage of the order (and idles there).
 * - Without one it plays the whole story on a loop.
 * Pure SVG + CSS; phases are switched by a small timer and styled in delivery-scene.css.
 */

type Phase = "prep" | "load" | "loaded" | "riding" | "ride" | "arrive" | "knock" | "handover" | "joy" | "reset";

const STATUS_PHASE: Record<OrderStatus, Phase> = {
  ordered: "prep",
  packed: "loaded",
  shipped: "riding",
  outForDelivery: "knock",
  delivered: "joy",
};

const STORY: [Phase, number][] = [
  ["prep", 900], ["load", 3400], ["ride", 5800], ["arrive", 2400], ["knock", 2400], ["handover", 2800], ["joy", 4000], ["reset", 700],
];

const CAPTION: Record<Phase, string> = {
  prep: "load", load: "load", loaded: "ride", riding: "ride", ride: "ride",
  arrive: "arrive", knock: "knock", handover: "handover", joy: "joy", reset: "joy",
};

const SKIN = "#e0ac82";
const SKIN2 = "#c98f66";
const DARK = "#2f3b36";
const LEAF = "M0 0 C-5 -4 -5 -12 0 -17 C5 -12 5 -4 0 0Z";
const v = (o: Record<string, string | number>) => o as CSSProperties;

function PotPlant({ i }: { i: number }) {
  return (
    <>
      {i === 0 && [-38, 0, 38].map((a, k) => (
        <path key={a} d={LEAF} className={k === 1 ? "fill-primary" : "fill-primary/75"} transform={`translate(0 -11) rotate(${a}) scale(${k === 1 ? 1.05 : 0.9})`} />
      ))}
      {i === 1 && (
        <>
          <path d="M0 -11 C0 -18 2 -22 3 -27" className="fill-none stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
          <path d={LEAF} className="fill-primary" transform="translate(0 -11) rotate(-50) scale(0.7)" />
          <circle cx="3" cy="-28" r="3.6" fill="#fff7fb" stroke="#e8b4cb" strokeWidth="0.8" />
          <circle cx="-1.5" cy="-23" r="2.8" fill="#fff7fb" stroke="#e8b4cb" strokeWidth="0.8" />
          <circle cx="3" cy="-28" r="1.3" fill="#c43d7a" />
        </>
      )}
      {i === 2 && [-55, -28, 0, 28, 55].map((a, k) => (
        <path key={a} d="M0 0 C-2 -7 -2 -14 0 -20 C2 -14 2 -7 0 0Z" className={k % 2 ? "fill-primary/75" : "fill-primary"} transform={`translate(0 -11) rotate(${a})`} />
      ))}
    </>
  );
}

const RM = "(prefers-reduced-motion: reduce)";
const subscribeRM = (cb: () => void) => {
  const m = window.matchMedia(RM);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const useReducedMotion = () => useSyncExternalStore(subscribeRM, () => window.matchMedia(RM).matches, () => false);

export function DeliveryScene({ status }: { status?: OrderStatus }) {
  const t = useTranslations("Track.story");
  const fixed = status ? STATUS_PHASE[status] : null;
  const [idx, setIdx] = useState(0);
  const still = useReducedMotion();

  useEffect(() => {
    if (fixed || still) return;
    const id = window.setTimeout(() => setIdx((i) => (i + 1) % STORY.length), STORY[idx][1]);
    return () => window.clearTimeout(id);
  }, [idx, fixed, still]);

  const phase: Phase = fixed ?? (still ? "joy" : STORY[idx][0]);

  return (
    <figure className="m-0">
      <div className="ds-root overflow-hidden rounded-2xl border border-border" data-phase={phase} aria-hidden>
        <svg viewBox="0 0 700 260" className="block h-auto w-full" focusable="false">
          <defs>
            <linearGradient id="ds-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: "var(--ds-sky1)" }} />
              <stop offset="1" style={{ stopColor: "var(--ds-sky2)" }} />
            </linearGradient>
          </defs>
          <rect width="700" height="260" fill="url(#ds-sky)" />

          <g className="ds-stage">
            {/* sky */}
            <circle cx="632" cy="44" r="30" fill="#f2b632" opacity="0.2" className="ds-glow" />
            <circle cx="632" cy="44" r="16" fill="#f2b632" />
            <g className="ds-cloud" style={v({ "--cd": "0s" })}><g fill="var(--ds-cloud)" opacity="0.9"><circle cx="150" cy="52" r="12" /><circle cx="168" cy="46" r="16" /><circle cx="188" cy="54" r="11" /><rect x="150" y="52" width="38" height="13" rx="6" /></g></g>
            <g className="ds-cloud" style={v({ "--cd": "-12s" })}><g fill="var(--ds-cloud)" opacity="0.9"><circle cx="400" cy="34" r="10" /><circle cx="414" cy="28" r="13" /><circle cx="430" cy="35" r="9" /><rect x="400" y="34" width="30" height="11" rx="5" /></g></g>

            {/* land */}
            <path d="M0 200 C80 150 160 172 240 160 S400 138 470 164 S600 148 700 170 V204 H0Z" fill="var(--ds-hill)" />
            <path d="M0 204 C100 178 200 190 300 180 S520 176 700 190 V204 H0Z" fill="var(--ds-hill2)" />
            {[[300, 0.9], [352, 1.1], [504, 1], [250, 0.7]].map(([x, s]) => (
              <g key={x} transform={`translate(${x} 200) scale(${s})`}>
                <rect x="-2.5" y="-22" width="5" height="22" fill="#8a6a4a" />
                <circle cy="-30" r="14" className="fill-primary/80" />
                <circle cx="-8" cy="-24" r="9" className="fill-primary/65" />
              </g>
            ))}

            {/* nursery */}
            <path d="M12 200 V150 Q12 126 62 124 Q112 126 112 150 V200Z" fill="var(--ds-glass)" stroke="#8fb59d" strokeWidth="2" />
            <path d="M37 130 V200 M62 124 V200 M87 130 V200" stroke="#8fb59d" strokeWidth="1.5" />
            {[26, 50, 74, 98].map((x, k) => (
              <path key={x} d={LEAF} className={k % 2 ? "fill-primary/70" : "fill-primary"} transform={`translate(${x} 200) scale(${1.1 + (k % 2) * 0.3})`} />
            ))}
            <rect x="116" y="186" width="80" height="5" rx="2" fill="var(--ds-wood)" />
            <path d="M122 191 V200 M190 191 V200" stroke="var(--ds-wood)" strokeWidth="3" />

            {/* house */}
            <rect x="556" y="118" width="134" height="82" fill="var(--ds-house)" stroke="#d9c7ad" strokeWidth="1.5" />
            <path d="M546 120 L623 74 L700 120Z" className="fill-accent" />
            <rect x="568" y="140" width="26" height="22" rx="2" fill="var(--ds-glass)" stroke="#bfae94" strokeWidth="1.5" />
            <path d="M581 140 V162 M568 151 H594" stroke="#bfae94" strokeWidth="1.2" />
            <rect x="640" y="140" width="26" height="22" rx="2" fill="var(--ds-glass)" stroke="#bfae94" strokeWidth="1.5" />
            <path d="M653 140 V162 M640 151 H666" stroke="#bfae94" strokeWidth="1.2" />
            <rect x="602" y="150" width="32" height="50" fill="#3a2e28" />
            <circle cx="548" cy="194" r="9" className="fill-primary/80" />

            {/* customer in the doorway */}
            <g className="ds-customer">
              <g className="ds-jump">
                <path d="M-3 -14 L-3 0 M3 -14 L3 0" stroke={DARK} strokeWidth="4" strokeLinecap="round" />
                <path d="M-9 -14 L-6 -35 H6 L9 -14Z" className="fill-accent" />
                <g transform="translate(-6 -32)"><g className="ds-carm"><path d="M0 0 V15" stroke={SKIN2} strokeWidth="4.2" strokeLinecap="round" /></g></g>
                <g transform="translate(6 -32)"><g className="ds-carm ds-carm-b"><path d="M0 0 V15" stroke={SKIN2} strokeWidth="4.2" strokeLinecap="round" /></g></g>
                <circle cy="-43" r="8" fill={SKIN2} />
                <path d="M-8.4 -44 A8.4 8.4 0 0 1 8.4 -44 C4 -49 -4 -49 -8.4 -44Z" fill="#2b2220" />
                <circle cx="-3" cy="-43" r="1" fill="#2b2220" />
                <circle cx="3" cy="-43" r="1" fill="#2b2220" />
                <path d="M-3.5 -39 Q0 -34.5 3.5 -39" fill="none" stroke="#7a2e2e" strokeWidth="1.3" strokeLinecap="round" />
                <circle cx="-5.5" cy="-40" r="1.6" fill="#e9857a" opacity="0.6" />
                <circle cx="5.5" cy="-40" r="1.6" fill="#e9857a" opacity="0.6" />
              </g>
            </g>
            <g className="ds-door"><rect x="602" y="150" width="32" height="50" fill="#9a6b45" stroke="#7a5236" strokeWidth="1.5" /><circle cx="628" cy="177" r="2" fill="#f2c14e" /><rect x="608" y="156" width="20" height="14" rx="1.5" fill="none" stroke="#7a5236" strokeWidth="1" /></g>

            {/* pavement + road */}
            <rect x="0" y="200" width="700" height="24" fill="var(--ds-pave)" />
            <rect x="0" y="224" width="700" height="36" fill="var(--ds-road)" />
            <g className="ds-dashes" fill="var(--ds-dash)">
              {Array.from({ length: 12 }, (_, k) => <rect key={k} x={k * 70 - 70} y="240" width="34" height="3.5" rx="1.7" />)}
            </g>

            {/* knock sound arcs */}
            <g className="ds-knockfx" fill="none" stroke="#f2b632" strokeWidth="2" strokeLinecap="round">
              <path d="M592 164 q-5 6 0 12" /><path d="M586 160 q-9 10 0 20" /><path d="M580 156 q-13 14 0 28" />
            </g>

            {/* bike + seated rider */}
            <g className="ds-bike">
              <g className="ds-bob">
                {[-20, 20].map((x) => (
                  <g key={x} transform={`translate(${x} -15)`}>
                    <g className="ds-spin">
                      <circle r="15" fill="none" stroke={DARK} strokeWidth="3" />
                      <path d="M-15 0 H15 M0 -15 V15 M-10.6 -10.6 L10.6 10.6 M-10.6 10.6 L10.6 -10.6" stroke="#8d9893" strokeWidth="1" />
                    </g>
                  </g>
                ))}
                <path d="M-20 -15 L-4 -15 L-8 -37 M-4 -15 L14 -35 M14 -35 L20 -15 M10 -39 L19 -39 M-8 -37 L-3 -37" className="fill-none stroke-accent" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M-50 -38 H-14 M-48 -38 L-24 -16" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" />
                <g className="ds-seated">
                  <g transform="translate(-8 -38)"><g className="ds-pedal"><path d="M0 0 L5 22" stroke={DARK} strokeWidth="5.5" strokeLinecap="round" /></g></g>
                  <path d="M-8 -38 L5 -62" className="stroke-primary" strokeWidth="12" strokeLinecap="round" />
                  <rect x="-18" y="-66" width="12" height="17" rx="3" className="fill-accent" transform="rotate(-18 -12 -58)" />
                  <path d="M5 -60 L15 -39" stroke={SKIN} strokeWidth="4.2" strokeLinecap="round" />
                  <circle cx="9" cy="-72" r="7.5" fill={SKIN} />
                  <path d="M1.2 -73 A8 8 0 0 1 17 -73 H1.2Z" className="fill-accent" />
                  <circle cx="12.5" cy="-72" r="1" fill="#2b2220" />
                </g>
              </g>
            </g>

            {/* standing rider */}
            <g className="ds-rider">
              <g className="ds-bob2">
                <path d="M-3 198 L-4 224" className="ds-leg ds-leg-b" stroke="#233029" strokeWidth="5" strokeLinecap="round" />
                <path d="M3 198 L4 224" className="ds-leg ds-leg-a" stroke={DARK} strokeWidth="5" strokeLinecap="round" />
                <rect x="-8" y="170" width="16" height="30" rx="6" className="fill-primary" />
                <rect x="-13" y="172" width="8" height="18" rx="3" className="fill-accent" />
                <circle cy="160" r="7.5" fill={SKIN} />
                <path d="M-8 159 A8 8 0 0 1 8 159 H-8Z" className="fill-accent" />
                <circle cx="3.5" cy="160" r="1" fill="#2b2220" />
                <path d="M1.5 164 Q4.5 167 7 163" fill="none" stroke="#7a2e2e" strokeWidth="1.2" strokeLinecap="round" />
                <g transform="translate(4 174)">
                  <g className="ds-arm">
                    <path d="M0 0 V9" className="stroke-primary" strokeWidth="4.8" strokeLinecap="round" />
                    <path d="M0 9 V17" stroke={SKIN} strokeWidth="4.2" strokeLinecap="round" />
                  </g>
                </g>
              </g>
            </g>

            {/* plants */}
            {[0, 1, 2].map((i) => (
              <g key={i} className="ds-pot" style={v({ "--i": i })}>
                <g className="ds-potbob" style={v({ "--j": i })}>
                  <g transform="scale(0.85)">
                  <g className="ds-plant"><PotPlant i={i} /></g>
                  <path d="M-7 0 H7 L5.6 -10 H-5.6Z" className="fill-accent" />
                  <rect x="-7.6" y="-12.5" width="15.2" height="3.2" rx="1.6" fill="#8f4527" />
                  </g>
                </g>
              </g>
            ))}

            {/* joy: hearts + sparkles */}
            {[[604, 146], [618, 140], [632, 148]].map(([x, y], k) => (
              <g key={x} transform={`translate(${x} ${y})`}>
                <path className="ds-heart" style={v({ "--d": `${k * 0.55}s` })} d="M0 3 C-6 -2 -4 -7 0 -4 C4 -7 6 -2 0 3Z" fill="#e0527a" />
              </g>
            ))}
            {[[586, 150], [640, 138], [610, 128]].map(([x, y], k) => (
              <g key={x} transform={`translate(${x} ${y})`}>
                <path className="ds-spark" style={v({ "--d": `${k * 0.4}s` })} d="M0 -5 L1.3 -1.3 L5 0 L1.3 1.3 L0 5 L-1.3 1.3 L-5 0 L-1.3 -1.3Z" fill="#f2b632" />
              </g>
            ))}
          </g>
        </svg>
      </div>
      {!fixed && (
        <figcaption className="mt-3 text-center text-sm font-medium text-muted-foreground" key={CAPTION[phase]}>
          <span className="ds-cap inline-block">{t(CAPTION[phase])}</span>
        </figcaption>
      )}
    </figure>
  );
}
