"use client";
/* eslint-disable @next/next/no-img-element -- photos are local data URLs */

import { useEffect, type ReactNode } from "react";
import { Button, Pill } from "@/components/ui";
import { hazardById } from "@/lib/flha";
import {
  countersign,
  flagsFor,
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
            First check-in
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
        <p className="text-graphite/70">
          {p.kind} · {formatTime(p.capturedAt)}
        </p>
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
        aria-label={`Check-in record for ${person?.name}`}
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

          <Section title="Times">
            <p className="text-sm">
              Checked in {formatTime(c.inAt)}
              {c.outAt ? ` · checked out ${formatTime(c.outAt)}` : " · still on site"}
              {c.incidentReported !== null && ` · incident reported: ${c.incidentReported ? "yes" : "no"}`}
            </p>
          </Section>

          <Section title="1 · Identity (selfie)">
            <SelfieReview s={s} c={c} />
          </Section>

          <Section title="2 · Presence (site check)">
            <p className="text-sm">
              <Pill tone={c.presence.status === "verified" ? "ink" : "pop"}>{c.presence.status === "verified" ? "On site" : "Flagged"}</Pill>{" "}
              {c.presence.reason}
              {c.presence.accuracyM !== null && ` · ±${c.presence.accuracyM} m`}
            </p>
          </Section>

          <Section title={c.form.kind === "flha" ? "3 · Field Level Hazard Assessment" : "3 · Visitor form"}>
            {c.form.kind === "flha" ? (
              <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[9rem_1fr]">
                <dt className="text-graphite/70">Task</dt>
                <dd>{c.form.answers.task} {c.form.answers.workArea && `· ${c.form.answers.workArea}`}</dd>
                <dt className="text-graphite/70">Supervisor</dt>
                <dd>{c.form.answers.supervisor}</dd>
                <dt className="text-graphite/70">Fit for duty</dt>
                <dd>{c.form.answers.fitForDuty ? "Yes" : <strong className="text-pop-deep">No</strong>}</dd>
                <dt className="text-graphite/70">Knows muster point</dt>
                <dd>{c.form.answers.knowsMuster ? "Yes" : <strong className="text-pop-deep">No</strong>}</dd>
                <dt className="text-graphite/70">Hazards and controls</dt>
                <dd>
                  <ul className="space-y-0.5">
                    {c.form.answers.hazards.map((id) => (
                      <li key={id}>
                        <strong>{hazardById(id)?.label}</strong>: {(c.form.kind === "flha" && c.form.answers.controls[id]?.join(", ")) || "—"}
                      </li>
                    ))}
                    {c.form.answers.otherHazard && <li><strong>Other</strong>: {c.form.answers.otherHazard}</li>}
                  </ul>
                </dd>
                <dt className="text-graphite/70">PPE</dt>
                <dd>{c.form.answers.ppe.join(", ")}</dd>
              </dl>
            ) : (
              <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[9rem_1fr]">
                <dt className="text-graphite/70">Visiting</dt>
                <dd>{c.form.answers.visiting}</dd>
                <dt className="text-graphite/70">Purpose</dt>
                <dd>{c.form.answers.purpose || "—"}</dd>
                <dt className="text-graphite/70">Site rules</dt>
                <dd>{c.form.answers.rulesAck ? "Acknowledged" : "Not acknowledged"}</dd>
              </dl>
            )}
          </Section>

          {c.photos.length > 0 && (
            <Section title="Compliance photos">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {c.photos.map((p) => (
                  <PhotoTile key={p.id} p={p} />
                ))}
              </div>
            </Section>
          )}

          <Section title="Signatures">
            <div className="flex flex-wrap items-end gap-6">
              <figure>
                <img src={c.signature} alt="Worker signature" className="h-20 rounded-xl border border-line bg-white" />
                <figcaption className="mt-1 text-xs text-graphite/70">Signed {formatTime(c.inAt)}</figcaption>
              </figure>
              {c.form.kind === "flha" &&
                (c.review.countersignedAt ? (
                  <p className="text-sm">
                    Countersigned by <strong>{c.review.countersignedBy}</strong> at {formatTime(c.review.countersignedAt)}
                  </p>
                ) : (
                  <Button size="sm" variant="ink" className="no-print" onClick={() => countersign(c.id, s.company!.ownerName)}>
                    Countersign FLHA
                  </Button>
                ))}
            </div>
          </Section>

          <p className="text-xs text-graphite/60">
            Record {c.id} · Times are recorded by the server in the full product · Prototype data is stored in this browser.
          </p>
        </div>
      </div>
    </div>
  );
}
