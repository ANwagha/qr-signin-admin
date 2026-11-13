"use client";

import { QRCodeSVG } from "qrcode.react";
import Wordmark from "@/components/Wordmark";
import type { Site } from "@/lib/store";

/** The printable gate poster for one site. `origin` comes from the browser. */
export default function SitePoster({ site, companyName, origin }: { site: Site; companyName: string; origin: string }) {
  const url = `${origin}/s/${site.slug}`;
  return (
    <div className="print-area mx-auto flex max-w-md flex-col items-center rounded-3xl bg-ink px-8 py-10 text-center text-bone">
      <Wordmark tone="volt" className="text-3xl" />
      <p className="mt-6 text-sm uppercase tracking-[0.2em] text-smoke">{companyName}</p>
      <h2 className="mt-1 font-display text-4xl font-bold leading-tight">{site.name}</h2>
      <p className="mt-2 text-lg text-smoke">Everyone checks in here: workers, subs and visitors</p>
      <div className="my-8 rounded-3xl bg-bone p-5">
        <QRCodeSVG value={url} size={220} level="M" bgColor="#F5F5F0" fgColor="#141414" />
      </div>
      <p className="font-display text-xl font-semibold">Scan in. Sign off. Work safe.</p>
      <p className="mt-6 break-all text-xs text-smoke">{url}</p>
    </div>
  );
}
