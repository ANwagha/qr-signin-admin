"use client";

import { useState } from "react";
import FormEditor from "@/components/FormEditor";
import { Button, Card, PageHeader, Pill } from "@/components/ui";
import { FORM_LIBRARY, QUESTION_TYPES, blankForm, flagRuleText, fromLibrary, type FormDef } from "@/lib/forms";
import { deleteForm, moveForm, saveForm, useStore } from "@/lib/store";

export default function FormsPage() {
  const s = useStore();
  const [editing, setEditing] = useState<FormDef | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  if (!s || !s.company) return null;

  if (editing)
    return (
      <div className="space-y-6">
        <PageHeader title={s.forms.some((f) => f.id === editing.id) ? "Edit form" : "New form"} subtitle="Forms" />
        <FormEditor
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={(f) => {
            saveForm(f);
            setEditing(null);
          }}
        />
      </div>
    );

  const typeLabel = (t: string) => QUESTION_TYPES.find((x) => x.type === t)?.label ?? t;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Forms"
        subtitle="Questions people answer when they clock in or out. Leave everything off for a plain time clock."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLibraryOpen((o) => !o)} aria-expanded={libraryOpen}>
              Add from library
            </Button>
            <Button variant="volt" onClick={() => setEditing(blankForm())}>
              New form
            </Button>
          </div>
        }
      />

      {libraryOpen && (
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold">Form library</h2>
          <p className="mt-1 text-sm text-graphite/70">Start from a ready-made form, then change anything you like.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FORM_LIBRARY.map((t) => (
              <button
                key={t.name}
                onClick={() => {
                  setLibraryOpen(false);
                  setEditing(fromLibrary(t.name, false));
                }}
                className="rounded-2xl border border-line bg-white p-4 text-left transition hover:border-ink"
              >
                <p className="font-semibold">{t.name}</p>
                <p className="mt-1 text-sm text-graphite/70">{t.description}</p>
                <p className="mt-2 text-xs text-graphite/70">
                  {t.questions.length} questions · at clock-{t.when === "check-in" ? "in" : "out"}
                </p>
              </button>
            ))}
          </div>
        </Card>
      )}

      {s.forms.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-display text-lg font-semibold">No forms yet</p>
          <p className="mt-1 text-sm text-graphite/70">People will just take a selfie, pass the location check and clock in.</p>
        </Card>
      ) : (
        <ul className="space-y-4">
          {s.forms.map((f, i) => (
            <li key={f.id}>
              <Card className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl font-bold">{f.name}</h2>
                      <Pill tone={f.active ? "ink" : "outline"}>{f.active ? "In use" : "Off"}</Pill>
                      <Pill tone="neutral">At clock-{f.when === "check-in" ? "in" : "out"}</Pill>
                      {f.signature && f.when === "check-in" && <Pill tone="neutral">Signature</Pill>}
                    </div>
                    {f.description && <p className="mt-1 text-sm text-graphite/70">{f.description}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" aria-label={`Move ${f.name} up`} disabled={i === 0} onClick={() => moveForm(f.id, -1)}>
                      ↑
                    </Button>
                    <Button size="sm" variant="outline" aria-label={`Move ${f.name} down`} disabled={i === s.forms.length - 1} onClick={() => moveForm(f.id, 1)}>
                      ↓
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => saveForm({ ...f, active: !f.active })}>
                      {f.active ? "Turn off" : "Turn on"}
                    </Button>
                    <Button size="sm" variant="ink" onClick={() => setEditing(f)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm(`Delete "${f.name}"? Past answers stay in your records.`)) deleteForm(f.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <ol className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white text-sm">
                  {f.questions.map((q, n) => (
                    <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                      <span>
                        <span className="mr-2 text-graphite/60">{n + 1}.</span>
                        {q.label}
                        {!q.required && <span className="ml-1 text-graphite/60">(optional)</span>}
                      </span>
                      <span className="flex flex-wrap gap-1.5">
                        <Pill tone="outline">{typeLabel(q.type)}</Pill>
                        {flagRuleText(q) && <Pill tone="pop">{flagRuleText(q)}</Pill>}
                      </span>
                    </li>
                  ))}
                </ol>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Card className="p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Build forms with Claude</h2>
          <Pill tone="outline">Coming later</Pill>
        </div>
        <p className="mt-1 text-sm text-graphite/70">Describe what you need or upload a photo of a paper form, and Claude will build it here.</p>
      </Card>
    </div>
  );
}
