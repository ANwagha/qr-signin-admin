"use client";

import { useState } from "react";
import { Button, Card, Field } from "@/components/ui";
import { QUESTION_TYPES, newId, type FormDef, type Question, type QuestionType } from "@/lib/forms";

const inputCls = "w-full rounded-xl border border-line bg-raised px-3 py-2 text-sm outline-none focus:border-fg";

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-fg" : "bg-line"}`}
      >
        <span className={`absolute top-1 size-5 rounded-full bg-bg transition-all ${on ? "left-6" : "left-1"}`} />
      </button>
      <span aria-hidden>{label}</span>
    </label>
  );
}

function QuestionEditor({
  q,
  index,
  count,
  onChange,
  onMove,
  onDelete,
}: {
  q: Question;
  index: number;
  count: number;
  onChange: (q: Question) => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
}) {
  const [optionsText, setOptionsText] = useState((q.options ?? []).join("\n"));
  const setType = (type: QuestionType) =>
    onChange({
      ...q,
      type,
      options: type === "choice" || type === "multi" ? (q.options?.length ? q.options : ["Option 1", "Option 2"]) : undefined,
      flag: undefined,
      unit: type === "number" ? q.unit : undefined,
    });

  return (
    <li className="rounded-2xl border border-line bg-raised p-4">
      <div className="flex items-start gap-3">
        <span className="mt-2 text-sm font-semibold text-muted">{index + 1}</span>
        <div className="flex-1 space-y-3">
          <input aria-label="Question" value={q.label} onChange={(e) => onChange({ ...q, label: e.target.value })} className={`${inputCls} font-medium`} />
          <div className="flex flex-wrap items-center gap-3">
            <select aria-label="Answer type" value={q.type} onChange={(e) => setType(e.target.value as QuestionType)} className={`${inputCls} w-auto`}>
              {QUESTION_TYPES.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label}
                </option>
              ))}
            </select>
            <Toggle on={q.required} onChange={(required) => onChange({ ...q, required })} label="Required" />
          </div>

          {(q.type === "choice" || q.type === "multi") && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted" htmlFor={`opt-${q.id}`}>
                  Options (one per line)
                </label>
                <textarea
                  id={`opt-${q.id}`}
                  rows={4}
                  value={optionsText}
                  onChange={(e) => {
                    setOptionsText(e.target.value);
                    const options = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean);
                    onChange({ ...q, options, flag: q.flag?.options ? { options: q.flag.options.filter((o) => options.includes(o)) } : q.flag });
                  }}
                  className={inputCls}
                />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted">Alert the supervisor when picked</p>
                <div className="flex flex-wrap gap-1.5">
                  {(q.options ?? []).map((o) => {
                    const on = !!q.flag?.options?.includes(o);
                    return (
                      <button
                        key={o}
                        type="button"
                        aria-pressed={on}
                        onClick={() => {
                          const cur = q.flag?.options ?? [];
                          const next = on ? cur.filter((x) => x !== o) : [...cur, o];
                          onChange({ ...q, flag: next.length ? { options: next } : undefined });
                        }}
                        className={`min-h-9 rounded-full border px-3 text-xs font-medium ${on ? "border-pop bg-pop text-ink" : "border-line bg-raised"}`}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {q.type === "yesno" && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted">Alert the supervisor on</span>
              {[
                { v: undefined, l: "Never" },
                { v: true, l: "Yes" },
                { v: false, l: "No" },
              ].map(({ v, l }) => {
                const on = q.flag?.yesno === v;
                return (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onChange({ ...q, flag: v === undefined ? undefined : { yesno: v } })}
                    className={`min-h-9 rounded-full border px-3 text-xs font-medium ${on ? (v === undefined ? "border-fg bg-fg text-bg" : "border-pop bg-pop text-ink") : "border-line bg-raised"}`}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "number" && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted" htmlFor={`unit-${q.id}`}>
                  Unit
                </label>
                <input id={`unit-${q.id}`} value={q.unit ?? ""} placeholder="°C" onChange={(e) => onChange({ ...q, unit: e.target.value || undefined })} className={inputCls} />
              </div>
              {(["min", "max"] as const).map((k) => (
                <div key={k}>
                  <label className="mb-1 block text-xs font-medium text-muted" htmlFor={`${k}-${q.id}`}>
                    Alert if {k === "min" ? "below" : "above"}
                  </label>
                  <input
                    id={`${k}-${q.id}`}
                    inputMode="decimal"
                    value={q.flag?.[k] ?? ""}
                    onChange={(e) => {
                      const n = e.target.value.trim() === "" || e.target.value === "-" ? undefined : Number(e.target.value);
                      const flag = { ...q.flag, [k]: Number.isNaN(n) ? undefined : n };
                      onChange({ ...q, flag: flag.min === undefined && flag.max === undefined ? undefined : flag });
                    }}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <button type="button" aria-label="Move question up" disabled={index === 0} onClick={() => onMove(-1)} className="size-9 rounded-lg border border-line text-sm disabled:opacity-30">
            ↑
          </button>
          <button type="button" aria-label="Move question down" disabled={index === count - 1} onClick={() => onMove(1)} className="size-9 rounded-lg border border-line text-sm disabled:opacity-30">
            ↓
          </button>
          <button type="button" aria-label="Delete question" onClick={onDelete} className="size-9 rounded-lg border border-line text-sm text-alert">
            ✕
          </button>
        </div>
      </div>
    </li>
  );
}

export default function FormEditor({ initial, onSave, onCancel }: { initial: FormDef; onSave: (f: FormDef) => void; onCancel: () => void }) {
  const [f, setF] = useState<FormDef>(initial);
  const [error, setError] = useState<string | null>(null);
  const setQ = (i: number, q: Question) => setF({ ...f, questions: f.questions.map((x, j) => (j === i ? q : x)) });

  function save() {
    if (!f.name.trim()) return setError("Give the form a name.");
    if (f.questions.length === 0) return setError("Add at least one question.");
    if (f.questions.some((q) => !q.label.trim())) return setError("Every question needs some text.");
    if (f.questions.some((q) => (q.type === "choice" || q.type === "multi") && (q.options?.length ?? 0) < 2))
      return setError("Pick-one and pick-any questions need at least two options.");
    onSave({ ...f, name: f.name.trim() });
  }

  return (
    <Card className="p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Form name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={error?.startsWith("Give") ? error : null} />
        <Field label="Description (shown to workers)" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Optional" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted">Ask it when people</span>
          {(["check-in", "check-out"] as const).map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={f.when === w}
              onClick={() => setF({ ...f, when: w })}
              className={`min-h-9 rounded-full px-3.5 text-sm font-medium ${f.when === w ? "bg-fg text-bg" : "border border-line bg-raised"}`}
            >
              {w === "check-in" ? "clock in" : "clock out"}
            </button>
          ))}
        </div>
        {f.when === "check-in" && <Toggle on={f.signature} onChange={(signature) => setF({ ...f, signature })} label="Ask for a signature" />}
        <Toggle on={f.active} onChange={(active) => setF({ ...f, active })} label="In use" />
      </div>

      <h3 className="mt-6 font-display font-semibold">Questions</h3>
      <ol className="mt-3 space-y-3">
        {f.questions.map((q, i) => (
          <QuestionEditor
            key={q.id}
            q={q}
            index={i}
            count={f.questions.length}
            onChange={(nq) => setQ(i, nq)}
            onMove={(dir) => {
              const qs = [...f.questions];
              [qs[i], qs[i + dir]] = [qs[i + dir], qs[i]];
              setF({ ...f, questions: qs });
            }}
            onDelete={() => setF({ ...f, questions: f.questions.filter((_, j) => j !== i) })}
          />
        ))}
      </ol>
      <Button
        type="button"
        variant="outline"
        className="mt-3"
        onClick={() => setF({ ...f, questions: [...f.questions, { id: newId(), label: "", type: "yesno", required: true }] })}
      >
        + Add question
      </Button>

      {error && !error.startsWith("Give") && (
        <p role="alert" className="mt-4 text-sm text-alert">
          {error}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <Button variant="volt" onClick={save}>
          Save form
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
