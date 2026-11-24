"use client";

import { Card, PageHeader, Pill } from "@/components/ui";
import { setPhotoRequired, useStore } from "@/lib/store";
import { templateFor } from "@/lib/templates";

export default function FormsPage() {
  const s = useStore();
  if (!s || !s.company) return null;
  const t = templateFor(s.company.industry);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Forms"
        subtitle={`Loaded automatically for ${t.label.toLowerCase()}. Adjust them to match your safety program.`}
      />

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">{t.formName}</h2>
            <p className="mt-1 text-sm text-graphite/70">
              Everyone except visitors completes it at every check-in. Supervisors countersign.
            </p>
          </div>
          <Pill tone="ink">In use</Pill>
        </div>

        <ol className={`mt-5 grid gap-3 text-sm ${t.checks.length ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
          <li className="rounded-2xl border border-line bg-white p-4">
            <p className="font-semibold">Job and readiness</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-graphite/80">
              <li>Task, work area, supervisor</li>
              {t.readiness.map((q) => (
                <li key={q.id}>{q.question}</li>
              ))}
            </ul>
          </li>
          <li className="rounded-2xl border border-line bg-white p-4">
            <p className="font-semibold">Hazards and controls</p>
            <p className="mt-1 text-graphite/70">{t.hazards.length} hazards, each with its controls. Photo rules below.</p>
          </li>
          {t.checks.length > 0 && (
            <li className="rounded-2xl border border-line bg-white p-4">
              <p className="font-semibold">{t.checksTitle}</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-graphite/80">
                {t.checks.map((c) => (
                  <li key={c.id}>
                    {c.label}
                    {c.kind === "number" && ` (${c.max !== undefined ? `≤ ${c.max}` : `≥ ${c.min}`} ${c.unit})`}
                    {c.kind === "passfail" && " (pass/fail)"}
                    {c.kind === "photo" && " (photo)"}
                  </li>
                ))}
              </ul>
            </li>
          )}
          <li className="rounded-2xl border border-line bg-white p-4">
            <p className="font-semibold">PPE and sign-off</p>
            <p className="mt-1 text-graphite/70">{t.ppe.join(", ")}. A PPE photo is always required.</p>
          </li>
        </ol>

        <h3 className="mt-6 font-display font-semibold">Which hazards need a compliance photo?</h3>
        <p className="text-sm text-graphite/70">When a worker ticks one of these, they can&apos;t sign until they take the photo.</p>
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
          {t.hazards.map((h) => {
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
          <p className="mt-1 text-sm text-graphite/70">
            Who they&apos;re visiting, purpose, {t.siteNoun} rules and a selfie. Visitors stay on the muster list until they check out.
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-lg font-bold">Tailor these forms with Claude</h2>
            <Pill tone="outline">Coming later</Pill>
          </div>
          <p className="mt-1 text-sm text-graphite/70">
            Describe your work or upload a photo of a paper form, and Claude will adapt these templates for your company.
          </p>
        </Card>
      </div>
    </div>
  );
}
