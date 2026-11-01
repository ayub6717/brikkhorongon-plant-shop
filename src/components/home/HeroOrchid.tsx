"use client";

import { useEffect, useState, type CSSProperties } from "react";
import "./hero-orchid.css";

/**
 * Decorative hero story drawn around the photo (never over its content):
 * a bird flies in, drops a seed, and an orchid grows up along the right edge and blooms.
 * Pure SVG + CSS (see `.orch-*` in globals.css). The SVG covers the photo column exactly
 * (viewBox 400x410 matches the container), is click-through and hidden from assistive tech.
 */

const LEAF = "M0 0 C-10 -8 -10 -26 0 -36 C10 -26 10 -8 0 0Z";
const STEM = "M380 402 C394 372 368 348 384 318 C398 290 370 262 386 232 C398 208 374 184 388 156";
const SPRAY = "M388 156 C400 140 402 122 392 108 C384 98 376 94 370 92";

// [x, y, rotation, size, delay]. Delay tracks how far up the stem has grown at that point.
const LEAVES: [number, number, number, number, number][] = [
  [380, 400, 55, 1.1, 3.35],
  [380, 400, 14, 1.0, 3.5],
  [380, 400, -22, 0.7, 3.65],
  [383, 335, 66, 0.8, 3.95],
  [382, 302, -42, 0.7, 4.25],
  [387, 252, 60, 0.75, 4.75],
  [386, 224, -35, 0.6, 5.0],
  [388, 188, 55, 0.6, 5.3],
];

const FLOWERS: [number, number, number, number][] = [
  [395, 134, 0.95, 6.2],
  [389, 108, 1.05, 6.6],
  [372, 92, 0.85, 7.0],
  [405, 214, 0.5, 6.9], // small side blooms
  [372, 196, 0.45, 7.2],
];

/** Gentle shrink around the pot so the crown stays clear of the badge above. */
const K = 0.9;
const at = (x: number, y: number): [number, number] => [380 + (x - 380) * K, 402 + (y - 402) * K];

// Seeds drift down from the blooms: [startX, startY, landX, delay, duration]
const DUST: [number, number, number, number, number][] = [
  [395, 134, 396, 0.2, 2.3],
  [389, 108, 408, 0.5, 2.5],
  [372, 92, 374, 0.8, 2.6],
  [405, 214, 412, 0.4, 2.1],
  [372, 196, 370, 1.0, 2.2],
];

const PHASE_MS = { growFirst: 9800, growLater: 6800, seed: 3800, wilt: 4800 };

const SPARKS: [number, number, number][] = [[408, 96, 7.5], [356, 78, 7.7], [410, 150, 7.9], [398, 70, 7.6]];

const d = (s: number): CSSProperties => ({ ["--d" as string]: `${s}s` });

function Flower({ x, y, s, delay }: { x: number; y: number; s: number; delay: number }) {
  // sepals first, then the two broad petals, then the lip and column
  const sepals = [0, 125, -125];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {sepals.map((a, i) => (
        <g key={a} transform={`rotate(${a})`}>
          <ellipse cy="-9" rx="5.2" ry="8.5" className="orch-petal" style={d(delay + i * 0.08)} fill="#fff7fb" stroke="#e8b4cb" strokeWidth="0.7" />
        </g>
      ))}
      {[88, -88].map((a, i) => (
        <g key={a} transform={`rotate(${a})`}>
          <ellipse cy="-9.5" rx="8.6" ry="9" className="orch-petal" style={d(delay + 0.25 + i * 0.08)} fill="#fffafc" stroke="#e8b4cb" strokeWidth="0.7" />
        </g>
      ))}
      <g transform="rotate(180)">
        <ellipse cy="-4.6" rx="3.2" ry="4.6" className="orch-petal" style={d(delay + 0.5)} fill="#c43d7a" />
      </g>
      <circle r="2.1" className="orch-petal" style={d(delay + 0.6)} fill="#f2c14e" />
    </g>
  );
}

type Phase = "grow" | "seed" | "wilt";

function Sprout({ x, scale = 1, className }: { x: number; scale?: number; className: string }) {
  return (
    <g transform={`translate(${x} 404) scale(${scale})`}>
      <g className={className}>
        <path d="M0 0 C0 -4 1 -7 0 -11" className="fill-none stroke-primary" strokeWidth="1.7" strokeLinecap="round" />
        <path d={LEAF} className="fill-primary" transform="translate(0 -10) rotate(-55) scale(0.3)" />
        <path d={LEAF} className="fill-primary/75" transform="translate(0 -10) rotate(55) scale(0.3)" />
      </g>
    </g>
  );
}

/**
 * Life cycle, looping: grow + bloom -> seeds fall, seedlings pop up -> the old plant wilts
 * -> a seedling takes its place and grows again. The bird only appears the first time.
 */
export function HeroOrchid() {
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<Phase>("grow");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ms = phase === "grow" ? (cycle === 0 ? PHASE_MS.growFirst : PHASE_MS.growLater) : PHASE_MS[phase];
    const id = window.setTimeout(() => {
      if (phase === "grow") setPhase("seed");
      else if (phase === "seed") setPhase("wilt");
      else {
        setCycle((c) => c + 1);
        setPhase("grow");
      }
    }, ms);
    return () => window.clearTimeout(id);
  }, [phase, cycle]);

  const first = cycle === 0;
  const o = first ? 0 : 3; // later rounds skip the bird's 3s intro
  const dl = (s: number) => d(Math.max(0, s - o));

  return (
    <div aria-hidden className="orch-root pointer-events-none absolute inset-0" data-phase={phase} data-first={first}>
      <svg viewBox="0 0 400 410" className="size-full overflow-visible" focusable="false">
        {/* soil mound */}
        <ellipse cx="380" cy="405" rx="15" ry="3.5" fill="#7a5a3c" className="orch-mound" style={d(3.1)} />

        {/* seedlings: siblings pop up after the seeds land; the main one takes over from the old plant */}
        <g style={d(2.7)}><Sprout x={394} className="orch-sprout orch-sprout-sib" /></g>
        <g style={d(3.0)}><Sprout x={407} scale={0.85} className="orch-sprout orch-sprout-sib" /></g>
        <g style={d(3.0)}><Sprout x={380} scale={1.25} className="orch-sprout orch-sprout-main" /></g>

        {/* the plant (re-mounted each round so its growth replays) */}
        <g key={cycle} transform="translate(380 402) scale(0.9) translate(-380 -402)">
          <g className="orch-sway" style={{ ["--sd" as string]: `${8.5 - o}s` } as CSSProperties}>
            <path d={STEM} pathLength={1} className="orch-stem fill-none stroke-primary" strokeWidth="3.2" strokeLinecap="round" style={dl(3.2)} />
            <path d={SPRAY} pathLength={1} className="orch-spray fill-none stroke-primary" strokeWidth="2.4" strokeLinecap="round" style={dl(5.4)} />
            <path d="M386 232 C394 229 400 224 404 217" pathLength={1} className="orch-spray fill-none stroke-primary" strokeWidth="1.6" strokeLinecap="round" style={dl(6.3)} />
            <path d="M384 206 C378 204 374 200 372 196" pathLength={1} className="orch-spray fill-none stroke-primary" strokeWidth="1.6" strokeLinecap="round" style={dl(6.6)} />

            {LEAVES.map(([x, y, r, s, t], i) => (
              <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
                <path d={LEAF} className={`orch-leaf ${i % 2 ? "fill-primary/75" : "fill-primary"}`} style={dl(t)} />
              </g>
            ))}

            {/* a bud on a short stalk */}
            <path d="M389 168 C397 168 402 172 405 180" pathLength={1} className="orch-spray fill-none stroke-primary" strokeWidth="1.8" strokeLinecap="round" style={dl(5.6)} />
            <g transform="translate(406 184) rotate(-20)">
              <ellipse rx="3.6" ry="5.2" className="orch-petal" style={dl(6.2)} fill="#f6cfe0" stroke="#e8b4cb" strokeWidth="0.6" />
            </g>

            {FLOWERS.map(([x, y, sc, t]) => (
              <Flower key={`${x}-${y}`} x={x} y={y} s={sc} delay={Math.max(0, t - o)} />
            ))}

            {SPARKS.map(([x, y, t]) => (
              <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
                <path d="M0 -5 L1.3 -1.3 L5 0 L1.3 1.3 L0 5 L-1.3 1.3 L-5 0 L-1.3 -1.3Z" className="plant-spark fill-accent" style={dl(t)} />
              </g>
            ))}
          </g>
        </g>

        {/* seeds drifting down from the blooms */}
        {DUST.map(([sx, sy, lx, t, dur], i) => {
          const [x, y] = at(sx, sy);
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <ellipse
                rx="2" ry="1.2" fill="#8a5a2b" className="orch-dust"
                style={{ ["--dx" as string]: `${lx - x}px`, ["--fall" as string]: `${403 - y}px`, ["--d" as string]: `${t}s`, ["--dur" as string]: `${dur}s` } as CSSProperties}
              />
            </g>
          );
        })}

        {/* first visit only: the bird and the seed it drops */}
        {first && (
          <>
            <g className="orch-seed" transform="translate(380 348)">
              <ellipse rx="3" ry="2" fill="#6b4423" transform="rotate(-30)" />
            </g>
            <g className="orch-bird">
              <g className="orch-turn">
                <g transform="scale(1.1)">
                  <path d="M11 -1 L29 -6 L29 3 L11 4Z" className="fill-primary" />
                  <ellipse rx="14" ry="8" className="fill-accent" />
                  <circle cx="-13" cy="-4" r="6" className="fill-accent" />
                  <path d="M-18 -5.5 L-27 -3 L-18 -0.5Z" fill="#e0a93a" />
                  <circle cx="-15" cy="-5.5" r="1.1" fill="#1f2a24" />
                  <ellipse cx="-27" cy="-3" rx="2.6" ry="1.8" fill="#6b4423" className="orch-beakseed" />
                  <g transform="translate(-2 -2)">
                    <path d="M-4 0 C0 -20 16 -22 22 -14 C14 -10 8 -4 6 3Z" className="orch-wing fill-primary/85" />
                  </g>
                </g>
              </g>
            </g>
          </>
        )}
      </svg>
    </div>
  );
}
