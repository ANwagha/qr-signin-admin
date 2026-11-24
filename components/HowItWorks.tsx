"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// The four homepage steps, each with a small looping animation drawn for Musterpass.
// Cards fade up as they scroll into view; the loops only run while the section is on screen.
// Animation styles live in globals.css (the `hiw-` classes) and switch off for reduced motion.

const INK = "#141414";
const VOLT = "#c6f432";
const BONE = "#f5f5f0";
const GRAPHITE = "#2a2a2a";
const SMOKE = "#8a8a85";
const FONT = "var(--font-space-grotesk), system-ui, sans-serif";

function QrBlock({ x, y, s }: { x: number; y: number; s: number }) {
  const m = s / 9;
  const on = [1, 3, 4, 6, 10, 12, 14, 19, 22, 23, 25, 28, 31, 33, 34, 37, 40, 42, 44, 46, 48, 51, 53, 55, 58, 60, 62, 66, 69, 70, 72, 75, 77, 79];
  return (
    <g>
      <rect x={x - m} y={y - m} width={s + 2 * m} height={s + 2 * m} rx={m} fill={BONE} />
      {on.map((i) => (
        <rect key={i} x={x + (i % 9) * m} y={y + Math.floor(i / 9) * m} width={m} height={m} fill={INK} />
      ))}
      {[
        [0, 0],
        [6, 0],
        [0, 6],
      ].map(([cx, cy]) => (
        <g key={`${cx}${cy}`}>
          <rect x={x + cx * m} y={y + cy * m} width={3 * m} height={3 * m} fill={INK} />
          <rect x={x + (cx + 0.75) * m} y={y + (cy + 0.75) * m} width={1.5 * m} height={1.5 * m} fill={BONE} />
        </g>
      ))}
    </g>
  );
}

function CheckBadge({ cx, cy, r, className }: { cx: number; cy: number; r: number; className: string }) {
  return (
    <g className={className}>
      <circle cx={cx} cy={cy} r={r} fill={VOLT} />
      <path
        d={`M${cx - r * 0.45} ${cy} l${r * 0.3} ${r * 0.3} l${r * 0.6} -${r * 0.6}`}
        fill="none"
        stroke={INK}
        strokeWidth={r * 0.28}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

const ScanArt = (
  <svg viewBox="0 0 200 140" className="h-full w-full" aria-hidden>
    {/* poster on the fence */}
    <rect x={22} y={22} width={74} height={98} rx={8} fill={GRAPHITE} />
    <circle cx={35} cy={34} r={3.5} fill="none" stroke={VOLT} strokeWidth={2} />
    <rect x={42} y={31} width={36} height={6} rx={3} fill={VOLT} />
    <QrBlock x={36} y={50} s={46} />
    {/* phone moves in, scans, confirms */}
    <g className="hiw-nudge">
      <rect x={112} y={30} width={62} height={104} rx={11} fill={BONE} />
      <rect x={116} y={34} width={54} height={96} rx={8} fill={INK} />
      <g stroke={VOLT} strokeWidth={2.5} fill="none" strokeLinecap="round">
        <path d="M124 52 v-8 h8 M162 44 h8 v8 M124 92 v8 h8 M170 92 v8 h-8" transform="translate(-2 0)" />
      </g>
      <rect className="hiw-scanline" x={124} y={48} width={42} height={2.5} rx={1.25} fill={VOLT} />
      <CheckBadge cx={143} cy={118} r={9} className="hiw-pop" />
    </g>
  </svg>
);

const SelfieArt = (
  <svg viewBox="0 0 200 140" className="h-full w-full" aria-hidden>
    {/* phone with selfie */}
    <rect x={22} y={12} width={72} height={124} rx={12} fill={BONE} />
    <rect x={27} y={17} width={62} height={114} rx={9} fill={INK} />
    <circle cx={58} cy={60} r={13} fill={SMOKE} />
    <path d="M36 102 c3 -18 13 -24 22 -24 s19 6 22 24z" fill={SMOKE} />
    <g className="hiw-focus" stroke={VOLT} strokeWidth={2.5} fill="none" strokeLinecap="round">
      <path d="M36 42 v-8 h8 M72 34 h8 v8 M36 96 v8 h8 M80 96 v8 h-8" />
    </g>
    {/* map with geofence */}
    <rect x={106} y={26} width={76} height={96} rx={12} fill={GRAPHITE} />
    <path d="M106 70 H182 M140 26 V122 M106 104 L182 84" stroke={SMOKE} strokeOpacity={0.4} strokeWidth={4} />
    <circle className="hiw-ripple" cx={144} cy={78} r={26} fill="none" stroke={VOLT} strokeWidth={2} />
    <circle cx={144} cy={78} r={26} fill={VOLT} fillOpacity={0.1} stroke={VOLT} strokeOpacity={0.6} strokeDasharray="4 4" />
    <g className="hiw-drop">
      <path d="M144 56 c-8 0 -14 6 -14 13 c0 10 14 22 14 22 s14 -12 14 -22 c0 -7 -6 -13 -14 -13z" fill={VOLT} />
      <circle cx={144} cy={69} r={4.5} fill={INK} />
    </g>
  </svg>
);

const FormsArt = (
  <svg viewBox="0 0 200 140" className="h-full w-full" aria-hidden>
    <rect x={40} y={10} width={120} height={124} rx={12} fill={BONE} />
    <rect x={54} y={22} width={60} height={8} rx={4} fill={INK} />
    {/* yes / no */}
    <rect x={54} y={38} width={44} height={16} rx={8} fill="none" stroke={INK} strokeOpacity={0.25} />
    <rect className="hiw-fill" x={54} y={38} width={44} height={16} rx={8} fill={INK} />
    <text x={76} y={49.5} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={8} fill={SMOKE} className="hiw-yes">
      Yes
    </text>
    <rect x={102} y={38} width={44} height={16} rx={8} fill="none" stroke={INK} strokeOpacity={0.25} />
    <text x={124} y={49.5} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={8} fill={INK} opacity={0.6}>
      No
    </text>
    {/* checklist ticks itself */}
    {[70, 88, 106].map((y, i) => (
      <g key={y}>
        <rect x={54} y={y - 6} width={12} height={12} rx={3} fill="none" stroke={INK} strokeWidth={1.5} />
        <path
          className={`hiw-tick hiw-tick-${i + 1}`}
          d={`M57 ${y} l2.5 2.5 l4.5 -5`}
          fill="none"
          stroke={INK}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
        />
        <rect x={74} y={y - 3} width={[62, 48, 70][i]} height={6} rx={3} fill={INK} opacity={0.55} />
      </g>
    ))}
    {/* photo button */}
    <g className="hiw-flash">
      <circle cx={150} cy={118} r={13} fill={VOLT} />
      <rect x={143} y={114} width={14} height={9} rx={2} fill={INK} />
      <rect x={147} y={111.5} width={6} height={3} rx={1} fill={INK} />
      <circle cx={150} cy={118.5} r={2.6} fill={VOLT} />
    </g>
  </svg>
);

const ClockedArt = (
  <svg viewBox="0 0 200 140" className="h-full w-full" aria-hidden>
    {/* counter rolls 11 → 12 */}
    <rect x={18} y={18} width={78} height={70} rx={12} fill={BONE} />
    <text x={30} y={34} fontFamily={FONT} fontSize={7.5} fill={INK} opacity={0.6}>
      Clocked in
    </text>
    <svg x={26} y={38} width={64} height={40} overflow="hidden">
      <g className="hiw-roll" fontFamily={FONT} fontWeight={700} fontSize={34} fill={INK}>
        <text x={2} y={32}>
          11
        </text>
        <text x={2} y={72}>
          12
        </text>
      </g>
    </svg>
    {/* clock */}
    <circle cx={146} cy={53} r={33} fill={GRAPHITE} />
    {Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6;
      return <circle key={i} cx={146 + Math.sin(a) * 26} cy={53 - Math.cos(a) * 26} r={i % 3 ? 1.2 : 2} fill={SMOKE} />;
    })}
    <path d="M146 53 v-15" stroke={BONE} strokeWidth={3} strokeLinecap="round" />
    <path className="hiw-hand" d="M146 53 v-23" stroke={VOLT} strokeWidth={2} strokeLinecap="round" />
    <circle cx={146} cy={53} r={3} fill={VOLT} />
    {/* roster */}
    {[0, 1, 2].map((i) => (
      <g key={i} transform={`translate(18 ${98 + i * 13})`}>
        <rect width={164} height={10} rx={5} fill={GRAPHITE} />
        <rect x={10} y={3} width={[64, 48, 80][i]} height={4} rx={2} fill={SMOKE} />
        <circle className={i === 2 ? "hiw-blink" : undefined} cx={154} cy={5} r={3} fill={VOLT} />
      </g>
    ))}
  </svg>
);

const STEPS: { n: string; title: string; body: string; art: ReactNode }[] = [
  { n: "1", title: "Scan", body: "Everyone scans the gate poster with their phone camera. No app.", art: ScanArt },
  { n: "2", title: "Selfie + location", body: "A live selfie and a one-time location check prove who is really there.", art: SelfieArt },
  { n: "3", title: "Your forms, if any", body: "Add your own quick questions, checklists or photos, or skip forms entirely.", art: FormsArt },
  { n: "4", title: "Clocked in", body: "Hours, attendance and the emergency list update instantly.", art: ClockedArt },
];

export default function HowItWorks() {
  const ref = useRef<HTMLOListElement>(null);
  // "idle" before the browser has checked; then "out" or "in" with the viewport.
  const [view, setView] = useState<"idle" | "out" | "in">("idle");
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setView("in");
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        setView(e.isIntersecting ? "in" : "out");
        if (e.isIntersecting) setSeen(true);
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <ol
      ref={ref}
      aria-label="How it works"
      data-play={view === "in" ? "" : undefined}
      data-reveal={view === "idle" ? undefined : seen ? "shown" : "waiting"}
      className="hiw mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      {STEPS.map((s, i) => (
        <li key={s.n} className="hiw-card flex flex-col rounded-3xl bg-raised p-3" style={{ animationDelay: `${i * 110}ms` }}>
          <div className="aspect-[10/7] overflow-hidden rounded-2xl bg-ink">{s.art}</div>
          <div className="px-2 pb-2 pt-4">
            <span className="font-display text-sm font-bold text-muted">{s.n}</span>
            <h2 className="mt-1 font-display text-lg font-bold">{s.title}</h2>
            <p className="mt-1 text-sm text-muted">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
