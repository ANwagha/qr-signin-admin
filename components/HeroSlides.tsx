// Illustrations for the homepage carousel, drawn for Musterpass (no stock photos).
// Each slide is a self-contained colour block, so it reads the same in light and dark mode.
// To use real photos later, give a slide an `image` instead of `art` (see HeroCarousel).

import type { ReactNode } from "react";

const INK = "#141414";
const VOLT = "#c6f432";
const BONE = "#f5f5f0";
const GRAPHITE = "#2a2a2a";
const SMOKE = "#8a8a85";
const POP = "#ca2a30";
const FONT = "var(--font-space-grotesk), system-ui, sans-serif";

export type Slide = {
  id: string;
  title: string;
  body: string;
  /** Card colour and the text colour that reads on it. */
  bg: string;
  fg: string;
  art?: ReactNode;
  image?: { src: string; alt: string };
};

/** A QR-like block pattern: three finder squares and a fixed scatter of modules. */
function Qr({ x, y, size, fg = INK, bg = BONE }: { x: number; y: number; size: number; fg?: string; bg?: string }) {
  const n = 21;
  const m = size / n;
  const cells: ReactNode[] = [];
  const finder = (cx: number, cy: number) => (
    <g key={`f${cx}${cy}`}>
      <rect x={x + cx * m} y={y + cy * m} width={7 * m} height={7 * m} fill={fg} />
      <rect x={x + (cx + 1) * m} y={y + (cy + 1) * m} width={5 * m} height={5 * m} fill={bg} />
      <rect x={x + (cx + 2) * m} y={y + (cy + 2) * m} width={3 * m} height={3 * m} fill={fg} />
    </g>
  );
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      const inFinder = (r < 8 && c < 8) || (r < 8 && c > 12) || (r > 12 && c < 8);
      if (inFinder) continue;
      if ((r * 7 + c * 13 + r * c) % 5 < 2) cells.push(<rect key={`${r}-${c}`} x={x + c * m} y={y + r * m} width={m} height={m} fill={fg} />);
    }
  return (
    <g>
      <rect x={x - m} y={y - m} width={size + 2 * m} height={size + 2 * m} fill={bg} rx={m} />
      {cells}
      {finder(0, 0)}
      {finder(14, 0)}
      {finder(0, 14)}
    </g>
  );
}

function Check({ cx, cy, r, bg = VOLT, fg = INK }: { cx: number; cy: number; r: number; bg?: string; fg?: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={bg} />
      <path
        d={`M${cx - r * 0.45} ${cy + r * 0.02} l${r * 0.3} ${r * 0.3} l${r * 0.6} -${r * 0.62}`}
        fill="none"
        stroke={fg}
        strokeWidth={r * 0.26}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

function Phone({ x, y, w, h, rotate = 0, children }: { x: number; y: number; w: number; h: number; rotate?: number; children: ReactNode }) {
  return (
    <g transform={`rotate(${rotate} ${x + w / 2} ${y + h / 2})`}>
      <rect x={x} y={y} width={w} height={h} rx={w * 0.16} fill={INK} />
      <rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} rx={w * 0.12} fill={BONE} />
      <rect x={x + w / 2 - 14} y={y + 11} width={28} height={6} rx={3} fill={INK} />
      {children}
    </g>
  );
}

const ScanArt = (
  <svg viewBox="0 0 320 260" className="h-full w-full" aria-hidden>
    {/* site hoarding */}
    {Array.from({ length: 9 }, (_, i) => (
      <rect key={i} x={i * 36 - 4} y={36} width={34} height={190} fill={GRAPHITE} opacity={i % 2 ? 0.9 : 1} />
    ))}
    <rect x={0} y={226} width={320} height={34} fill={INK} opacity={0.35} />
    {/* poster */}
    <rect x={40} y={56} width={120} height={160} rx={10} fill={INK} stroke={SMOKE} strokeOpacity={0.4} />
    <circle cx={60} cy={74} r={5} fill="none" stroke={VOLT} strokeWidth={2.5} />
    <rect x={70} y={70} width={52} height={8} rx={4} fill={VOLT} />
    <rect x={56} y={88} width={72} height={6} rx={3} fill={BONE} opacity={0.85} />
    <Qr x={62} y={106} size={76} />
    <rect x={60} y={196} width={80} height={6} rx={3} fill={BONE} opacity={0.6} />
    {/* phone scanning */}
    <Phone x={188} y={84} w={92} h={164} rotate={-8}>
      <rect x={202} y={110} width={64} height={110} rx={8} fill={INK} opacity={0.9} />
      <Qr x={214} y={136} size={40} fg={INK} bg={BONE} />
      {[
        [208, 128, 1, 1],
        [260, 128, -1, 1],
        [208, 186, 1, -1],
        [260, 186, -1, -1],
      ].map(([px, py, dx, dy]) => (
        <path key={`${px}${py}`} d={`M${px} ${py + 10 * dy} v${-10 * dy} h${10 * dx}`} fill="none" stroke={VOLT} strokeWidth={3} strokeLinecap="round" />
      ))}
      <rect x={210} y={200} width={48} height={10} rx={5} fill={VOLT} />
    </Phone>
  </svg>
);

const SelfieArt = (
  <svg viewBox="0 0 320 260" className="h-full w-full" aria-hidden>
    {/* map tile */}
    <g transform="rotate(4 230 120)">
      <rect x={170} y={44} width={124} height={150} rx={16} fill={GRAPHITE} />
      <path d="M170 110 H294 M218 44 V194 M170 160 L294 128" stroke={SMOKE} strokeOpacity={0.45} strokeWidth={6} />
      <circle cx={234} cy={118} r={40} fill={VOLT} fillOpacity={0.12} stroke={VOLT} strokeDasharray="5 5" strokeWidth={2} />
      <path d="M234 92 c-11 0 -19 8 -19 18 c0 14 19 30 19 30 s19 -16 19 -30 c0 -10 -8 -18 -19 -18z" fill={VOLT} />
      <circle cx={234} cy={110} r={6.5} fill={INK} />
    </g>
    {/* phone with selfie */}
    <Phone x={42} y={28} w={118} h={212} rotate={-4}>
      <rect x={56} y={52} width={90} height={110} rx={12} fill={GRAPHITE} />
      <circle cx={101} cy={96} r={20} fill={SMOKE} />
      <path d="M67 162 c4 -26 20 -36 34 -36 s30 10 34 36z" fill={SMOKE} />
      {[
        [62, 58, 1, 1],
        [140, 58, -1, 1],
        [62, 156, 1, -1],
        [140, 156, -1, -1],
      ].map(([px, py, dx, dy]) => (
        <path key={`${px}${py}`} d={`M${px} ${py + 12 * dy} v${-12 * dy} h${12 * dx}`} fill="none" stroke={VOLT} strokeWidth={3} strokeLinecap="round" />
      ))}
      <rect x={58} y={176} width={86} height={9} rx={4.5} fill={INK} opacity={0.18} />
      <rect x={58} y={192} width={60} height={9} rx={4.5} fill={INK} opacity={0.12} />
      <rect x={56} y={210} width={90} height={18} rx={9} fill={VOLT} />
    </Phone>
    <Check cx={162} cy={196} r={20} />
  </svg>
);

const FormsArt = (
  <svg viewBox="0 0 320 260" className="h-full w-full" aria-hidden>
    <rect x={56} y={22} width={208} height={226} rx={18} fill="#ffffff" stroke={INK} strokeOpacity={0.12} />
    <rect x={76} y={42} width={110} height={12} rx={6} fill={INK} />
    <rect x={76} y={62} width={150} height={7} rx={3.5} fill={SMOKE} opacity={0.6} />
    {/* yes / no question */}
    <rect x={76} y={86} width={130} height={8} rx={4} fill={INK} opacity={0.75} />
    <rect x={76} y={102} width={80} height={26} rx={13} fill={INK} />
    <text x={116} y={119.5} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={12} fill={BONE}>
      Yes
    </text>
    <rect x={164} y={102} width={80} height={26} rx={13} fill="none" stroke={INK} strokeOpacity={0.25} />
    <text x={204} y={119.5} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={12} fill={INK} opacity={0.7}>
      No
    </text>
    {/* checklist */}
    {[146, 168, 190].map((cy, i) => (
      <g key={cy}>
        <rect x={76} y={cy - 8} width={16} height={16} rx={4} fill={i < 2 ? INK : "none"} stroke={INK} strokeOpacity={i < 2 ? 1 : 0.3} strokeWidth={1.5} />
        {i < 2 && <path d={`M80 ${cy} l3 3 l6 -6`} fill="none" stroke={BONE} strokeWidth={2} strokeLinecap="round" />}
        <rect x={100} y={cy - 4} width={[96, 70, 110][i]} height={8} rx={4} fill={INK} opacity={0.6} />
      </g>
    ))}
    {/* photo field */}
    <rect x={76} y={210} width={168} height={26} rx={13} fill={VOLT} />
    <g transform="translate(140 216)">
      <rect x={0} y={3} width={18} height={12} rx={3} fill={INK} />
      <rect x={5} y={0} width={8} height={4} rx={1.5} fill={INK} />
      <circle cx={9} cy={9} r={3.2} fill={VOLT} />
    </g>
    <text x={166} y={228} fontFamily={FONT} fontWeight={700} fontSize={12} fill={INK}>
      Photo
    </text>
  </svg>
);

const RosterArt = (
  <svg viewBox="0 0 320 260" className="h-full w-full" aria-hidden>
    <rect x={24} y={30} width={126} height={110} rx={16} fill={INK} />
    <text x={42} y={60} fontFamily={FONT} fontSize={11} fill={SMOKE}>
      Right now
    </text>
    <text x={40} y={112} fontFamily={FONT} fontWeight={700} fontSize={54} fill={BONE}>
      12
    </text>
    <text x={42} y={130} fontFamily={FONT} fontSize={11} fill={SMOKE}>
      clocked in
    </text>
    {/* hours chart */}
    <rect x={162} y={30} width={134} height={110} rx={16} fill={BONE} />
    <text x={176} y={52} fontFamily={FONT} fontSize={11} fill={INK} opacity={0.7}>
      Hours this week
    </text>
    {[46, 64, 52, 74, 38].map((h, i) => (
      <rect key={i} x={178 + i * 22} y={128 - h} width={14} height={h} rx={4} fill={i === 3 ? INK : VOLT} />
    ))}
    {/* roster rows */}
    {[
      ["DK", "#e8d3a6"],
      ["LP", "#b9d7f0"],
      ["TN", "#f2b8a0"],
    ].map(([init, c], i) => (
      <g key={init} transform={`translate(24 ${154 + i * 32})`}>
        <rect width={272} height={26} rx={13} fill={INK} opacity={0.55} />
        <circle cx={14} cy={13} r={10} fill={c} />
        <text x={14} y={17} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={8.5} fill={INK}>
          {init}
        </text>
        <rect x={32} y={9} width={[90, 70, 104][i]} height={8} rx={4} fill={BONE} opacity={0.8} />
        <circle cx={256} cy={13} r={5} fill={VOLT} />
      </g>
    ))}
  </svg>
);

const MusterArt = (
  <svg viewBox="0 0 320 260" className="h-full w-full" aria-hidden>
    {/* printed list */}
    <g transform="rotate(-3 120 140)">
      <rect x={34} y={24} width={168} height={222} rx={8} fill="#ffffff" />
      <rect x={34} y={24} width={168} height={34} rx={8} fill={INK} />
      <rect x={34} y={46} width={168} height={12} fill={INK} />
      <text x={48} y={46} fontFamily={FONT} fontWeight={700} fontSize={12} fill={BONE}>
        Emergency list
      </text>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i} transform={`translate(48 ${74 + i * 27})`}>
          <rect width={14} height={14} rx={3} fill={i < 4 ? INK : "none"} stroke={INK} strokeWidth={1.5} />
          {i < 4 && <path d="M3.5 7 l2.5 2.5 l5 -5" fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />}
          <rect x={24} y={3} width={[84, 64, 96, 72, 80, 58][i]} height={8} rx={4} fill={INK} opacity={0.65} />
        </g>
      ))}
    </g>
    {/* muster point sign */}
    <rect x={250} y={120} width={8} height={130} fill={INK} />
    <rect x={208} y={52} width={96} height={84} rx={12} fill={INK} />
    <circle cx={256} cy={84} r={22} fill={VOLT} />
    {[-9, 0, 9].map((dx) => (
      <g key={dx} fill={INK}>
        <circle cx={256 + dx} cy={77} r={3.6} />
        <rect x={252.5 + dx} y={82} width={7} height={11} rx={3} />
      </g>
    ))}
    <text x={256} y={126} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={11} fill={BONE}>
      MUSTER
    </text>
  </svg>
);

export const SLIDES: Slide[] = [
  { id: "scan", title: "Scan the gate poster", body: "Any phone camera. No app to install.", bg: VOLT, fg: INK, art: ScanArt },
  { id: "selfie", title: "Selfie and location check", body: "Proof of who is really on site.", bg: INK, fg: BONE, art: SelfieArt },
  { id: "forms", title: "Your forms, if you want them", body: "Questions, checklists and photos in seconds.", bg: BONE, fg: INK, art: FormsArt },
  { id: "roster", title: "Hours and a live roster", body: "Know who is here and for how long.", bg: GRAPHITE, fg: BONE, art: RosterArt },
  { id: "muster", title: "Emergency list in one tap", body: "Everyone on site, ready to print.", bg: POP, fg: "#ffffff", art: MusterArt },
];
