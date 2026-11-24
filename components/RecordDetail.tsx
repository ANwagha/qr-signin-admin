"use client";
/* eslint-disable @next/next/no-img-element -- photos are local data URLs */

import { useEffect, type ReactNode } from "react";
import { Button, Pill } from "@/components/ui";
import { answerText, isFlagged, type FormResponse } from "@/lib/forms";
import {
  countersign,
  flagsFor,
  hoursWorked,
  referenceSelfie,
  reviewSelfie,
  roleLabel,
  type CheckIn,
  type Photo,
  type State,
} from "@/lib/store";
import { formatTime } from "@/lib/time";

export function personFor(s: State, c: CheckIn) {
  return s.people.find((p) => p.id === c.personId);
}

export function SelfieReview({ s, c, compact = false }: { s: State; c: CheckIn; compact?: boolean }) {
  const ref = referenceSelfie(s, c.personId, c.id);
  const size = compact ? "size-20" : "size-28";
  return (
    <div className="flex items-start gap-3">
      <figure className="text-center">
        <img src={c.selfie.dataUrl} alt="Today's selfie" className={`${size} rounded-2xl object-cover`} />
        <figcaption className="mt-1 text-xs text-graphite/70">Today</figcaption>
      </figure>
      <figure className="text-center">
        {ref ? (
          <img src={ref.dataUrl} alt="Earlier selfie on file" className={`${size} rounded-2xl object-cover`} />
        ) : (
          <div className={`${size} flex items-center justify-center rounded-2xl border border-dashed border-line p-2 text-xs text-graphite/60`}>
            First clock-in
          </div>
        )}
        <figcaption className="mt-1 text-xs text-graphite/70">On file</figcaption>
      </figure>
      <div className="flex flex-col gap-2">
        {c.review.selfie === "pending" ? (
          <>
            <Button size="sm" variant="ink" onClick={() => reviewSelfie(c.id, "approved")}>
              Same person
            </Button>
            <Button size="sm" variant="outline" onClick={() => reviewSelfie(c.id, "mismatch")}>
              Doesn&apos;t match
            </Button>
          </>
        ) : (
          <Pill tone={c.review.selfie === "approved" ? "ink" : "pop"}>{c.review.selfie === "approved" ? "Selfie approved" : "Mismatch"}</Pill>
        )}
      </div>
    </div>
  );
}

function PhotoTile({ p }: { p: Photo }) {
  return (
    <figure className="rounded-2xl border border-line bg-white p-2">
      <img src={p.dataUrl} alt={p.label} className="aspect-square w-full rounded-xl object-cover" />
      <figcaption className="mt-1.5 space-y-0.5 text-xs">
        <p className="font-semibold">{p.label}</p>
        <p className="text-graphite/70">{formatTime(p.capturedAt)}</p>
        <p className="truncate font-mono text-[10px] text-graphite/60" title={p.sha256 ?? undefined}>
          {p.sha256 ? `sha256 ${p.sha256.slice(0, 16)}…` : "hash needs https"}
        </p>
      </figcaption>
    </figure>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-4">
      <h3 className="mb-2 font-display font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function Responses({ responses, photos }: { responses: FormResponse[]; photos: Photo[] }) {
  return (
    <div className="space-y-4">
      {responses.map((r) => (
        <div key={r.formId}>
          <p className="mb-1.5 text-sm font-semibold">{r.name}</p>
          <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            {r.questions.map((q) => {
              const v = r.answers[q.id];
              const photo = q.type === "photo" ? photos.find((p) => p.id === v) : undefined;
              return (
                <div key={q.id} className="contents">
                  <dt className="text-graphite/70">{q.label}</dt>
                  <dd className={isFlagged(q, v) ? "font-semibold text-pop-deep" : ""}>
                    {photo ? <img src={photo.dataUrl} alt={q.label} className="h-20 w-20 rounded-xl object-cover" /> : answerText(q, v)}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      ))}
    </div>
  );
}

export default function RecordDetail({ s, c, onClose }: { s: State; c: CheckIn; onClose: () => void }) {
  const person = personFor(s, c);
  const site = s.sites.find((x) => x.id === c.siteId);
  const flags = flagsFor(c);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Time record for ${person?.name}`}
        onClick={(e) => e.stopPropagation()}
        className="print-area h-full w-full max-w-2xl overflow-y-auto bg-bone p-6 text-ink"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-graphite/70">
              {site?.name} · {new Date(c.inAt).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
            </p>
            <h2 className="font-display text-2xl font-bold">{person?.name}</h2>
            <p className="text-sm text-graphite/80">
              {person && roleLabel(person.role)} · {person?.employer}
            </p>
          </div>
          <div className="no-print flex gap-2">
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              Print
            </Button>
            <Button size="sm" variant="ink" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          {flags.length > 0 && (
            <div className="rounded-2xl border border-pop bg-white p-4 text-sm">
              <p className="font-semibold">Needs attention</p>
              <ul className="mt-1 list-disc pl-5">
                {flags.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          <Section title="Time">
            <p className="text-sm">
              In {formatTime(c.inAt)}
              {c.outAt ? ` · out ${formatTime(c.outAt)}` : " · still clocked in"} · {hoursWorked(c).toFixed(2)} h
            </p>
          </Section>

          <Section title="Identity (selfie)">
            <SelfieReview s={s} c={c} />
          </Section>

          <Section title="Location check">
            <p className="text-sm">
              <Pill tone={c.presence.status === "verified" ? "ink" : "pop"}>{c.presence.status === "verified" ? "On site" : "Flagged"}</Pill>{" "}
              {c.presence.reason}
              {c.presence.accuracyM !== null && ` · ±${c.presence.accuracyM} m`}
            </p>
          </Section>

          {c.visitor && (
            <Section title="Visitor">
              <p className="text-sm">
                Visiting <strong>{c.visitor.visiting}</strong>
                {c.visitor.purpose && ` · ${c.visitor.purpose}`} · site rules {c.visitor.rulesAck ? "acknowledged" : "not acknowledged"}
              </p>
            </Section>
          )}

          {c.forms.length > 0 && (
            <Section title="Clock-in forms">
              <Responses responses={c.forms} photos={c.photos} />
            </Section>
          )}

          {c.outForms.length > 0 && (
            <Section title="Clock-out forms">
              <Responses responses={c.outForms} photos={c.photos} />
            </Section>
          )}

          {c.photos.length > 0 && (
            <Section title="Photo evidence">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {c.photos.map((p) => (
                  <PhotoTile key={p.id} p={p} />
                ))}
              </div>
            </Section>
          )}

          {c.signature && (
            <Section title="Signatures">
              <div className="flex flex-wrap items-end gap-6">
                <figure>
                  <img src={c.signature} alt="Signature" className="h-20 rounded-xl border border-line bg-white" />
                  <figcaption className="mt-1 text-xs text-graphite/70">Signed {formatTime(c.inAt)}</figcaption>
                </figure>
                {c.review.countersignedAt ? (
                  <p className="text-sm">
                    Countersigned by <strong>{c.review.countersignedBy}</strong> at {formatTime(c.review.countersignedAt)}
                  </p>
                ) : (
                  <Button size="sm" variant="ink" className="no-print" onClick={() => countersign(c.id, s.company!.ownerName)}>
                    Countersign
                  </Button>
                )}
              </div>
            </Section>
          )}

          <p className="text-xs text-graphite/60">Record {c.id} · Prototype data is stored in this browser.</p>
        </div>
      </div>
    </div>
  );
}
