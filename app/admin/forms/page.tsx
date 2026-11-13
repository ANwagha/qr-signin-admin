"use client";

import { Card, PageHeader, Pill } from "@/components/ui";
import { FLHA_HAZARDS, PPE_ITEMS } from "@/lib/flha";
import { setPhotoRequired, useStore } from "@/lib/store";

export default function FormsPage() {
  const s = useStore();
  if (!s || !s.company) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Forms" subtitle="Loaded automatically for construction. Adjust them to match your safety program." />

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">Field Level Hazard Assessment</h2>
            <p className="mt-1 text-sm text-graphite/70">Workers and subcontractors complete it at every check-in. Supervisors countersign.</p>
          </div>
          <Pill tone="ink">In use</Pill>
        </div>

        <ol className="mt-5 grid gap-3 text-sm md:grid-cols-3">
          <li className="rounded-2xl border border-line bg-white p-4">
            <p className="font-semibold">1 · Job and fitness</p>
            <p className="mt-1 text-graphite/70">Task, work area, supervisor, fit for duty, knows the muster point.</p>
          </li>
          <li className="rounded-2xl border border-line bg-white p-4">
            <p className="font-semibold">2 · Hazards and controls</p>
            <p className="mt-1 text-graphite/70">{FLHA_HAZARDS.length} hazards, each with its controls. Photo rules below.</p>
          </li>
          <li className="rounded-2xl border border-line bg-white p-4">
            <p className="font-semibold">3 · PPE and sign-off</p>
            <p className="mt-1 text-graphite/70">{PPE_ITEMS.join(", ")}. A PPE photo is always required.</p>
          </li>
        </ol>

        <h3 className="mt-6 font-display font-semibold">Which hazards need a compliance photo?</h3>
        <p className="text-sm text-graphite/70">When a worker ticks one of these, they can&apos;t sign until they take the photo.</p>
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
          {FLHA_HAZARDS.map((h) => {
            const on = !!s.photoRequired[h.id];
            return (
              <li key={h.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="font-medium">{h.label}</p>
                  <p className="text-xs text-graphite/70">Controls: {h.controls.join(", ")}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={on}
                  aria-label={`Require a photo for ${h.label}`}
                  onClick={() => setPhotoRequired(h.id, !on)}
                  className={`relative h-8 w-14 shrink-0 rounded-full transition ${on ? "bg-ink" : "bg-line"}`}
                >
                  <span className={`absolute top-1 size-6 rounded-full bg-bone transition-all ${on ? "left-7" : "left-1"}`} />
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-lg font-bold">Visitor sign-in</h2>
            <Pill tone="ink">In use</Pill>
          </div>
          <p className="mt-1 text-sm text-graphite/70">Who they&apos;re visiting, purpose, site rules, selfie. Visitors stay on the muster list until they check out.</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-lg font-bold">Upload your own form</h2>
            <Pill tone="outline">Coming later</Pill>
          </div>
          <p className="mt-1 text-sm text-graphite/70">Upload a photo or PDF of a paper form and we&apos;ll turn it into a digital one.</p>
        </Card>
        <Card className="p-6 md:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-lg font-bold">Food service templates</h2>
            <Pill tone="outline">Coming next</Pill>
          </div>
          <p className="mt-1 text-sm text-graphite/70">Opening and closing checklists, fridge and cooler temperature logs, food-handler hygiene check.</p>
        </Card>
      </div>
    </div>
  );
}
