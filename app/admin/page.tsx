"use client";

import Link from "next/link";
import { useState } from "react";
import RecordDetail, { personFor, SelfieReview } from "@/components/RecordDetail";
import { Button, Card, PageHeader, Pill } from "@/components/ui";
import { hazardById } from "@/lib/flha";
import { countersign, flagsFor, isToday, needsReview, roleLabel, useStore, type CheckIn } from "@/lib/store";
import { formatTime, useNow } from "@/lib/time";

export default function Dashboard() {
  const s = useStore();
  const now = useNow();
  const [siteId, setSiteId] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  if (!s || !s.company || now === null) return null;

  const today = s.checkIns
    .filter((c) => isToday(c.inAt, now) && (siteId === "all" || c.siteId === siteId))
    .sort((a, b) => b.inAt.localeCompare(a.inAt));
  const onSite = today.filter((c) => !c.outAt);
  const flhas = today.filter((c) => c.form.kind === "flha");
  const flagged = today.filter((c) => flagsFor(c).length > 0);
  const queue = today.filter(needsReview);
  const siteName = (id: string) => s.sites.find((x) => x.id === id)?.name ?? "";
  const open = s.checkIns.find((c) => c.id === openId);

  const hazardCounts = new Map<string, number>();
  flhas.forEach((c) => c.form.kind === "flha" && c.form.answers.hazards.forEach((h) => hazardCounts.set(h, (hazardCounts.get(h) ?? 0) + 1)));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Safety dashboard"
        subtitle={new Date(now).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
        action={
          <select
            aria-label="Site"
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="min-h-11 rounded-full border border-line bg-white px-4 text-sm font-medium"
          >
            <option value="all">All sites</option>
            {s.sites.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        }
      />

      <div className="no-print grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl bg-ink p-6 text-bone">
          <p className="text-sm text-smoke">Right now</p>
          <p className="mt-3 font-display text-6xl font-bold tabular-nums leading-none">{onSite.length}</p>
          <p className="mt-2 font-display text-lg font-semibold">on site</p>
        </div>
        <Stat label="Today" value={flhas.length} unit={flhas.length === 1 ? "FLHA signed" : "FLHAs signed"} />
        <Stat label="Waiting on you" value={queue.length} unit="to review" />
        <Stat label="Needs attention" value={flagged.length} unit={flagged.length === 1 ? "flagged check-in" : "flagged check-ins"} dot={flagged.length > 0} />
      </div>

      {s.checkIns.length === 0 && (
        <Card className="no-print p-6">
          <h2 className="font-display text-lg font-semibold">Your first check-in</h2>
          <p className="mt-1 text-sm text-graphite/70">
            Print a site poster from Sites, then scan it with your phone, or open the check-in in this browser.
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/admin/sites" className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-bone">
              Print a poster
            </Link>
            {s.sites[0] && (
              <Link href={`/s/${s.sites[0].slug}`} className="rounded-full border border-line px-5 py-2.5 text-sm font-bold">
                Open check-in
              </Link>
            )}
          </div>
        </Card>
      )}

      {flagged.length > 0 && (
        <Card className="no-print border-pop!">
          <h2 className="px-6 pt-5 font-display text-lg font-semibold">Needs attention</h2>
          <ul className="divide-y divide-line">
            {flagged.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5">
                <div>
                  <p className="font-medium">
                    {personFor(s, c)?.name} <span className="font-normal text-graphite/70">· {siteName(c.siteId)} · {formatTime(c.inAt)}</span>
                  </p>
                  <p className="text-sm text-pop-deep">{flagsFor(c).join(" · ")}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setOpenId(c.id)}>
                  Open record
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {queue.length > 0 && (
        <Card className="no-print">
          <div className="flex items-center justify-between px-6 pt-5">
            <h2 className="font-display text-lg font-semibold">Review queue</h2>
            <p className="text-xs text-graphite/70">Selfies are checked by a person, never matched automatically</p>
          </div>
          <ul className="divide-y divide-line">
            {queue.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-48">
                  <p className="font-medium">{personFor(s, c)?.name}</p>
                  <p className="text-sm text-graphite/70">
                    {siteName(c.siteId)} · {formatTime(c.inAt)} · {c.form.kind === "flha" ? "FLHA" : "Visitor"}
                  </p>
                  <button onClick={() => setOpenId(c.id)} className="mt-1 text-sm underline underline-offset-4">
                    Full record
                  </button>
                </div>
                <SelfieReview s={s} c={c} compact />
                {c.form.kind === "flha" &&
                  (c.review.countersignedAt ? (
                    <Pill tone="ink">Countersigned</Pill>
                  ) : (
                    <Button size="sm" variant="ink" onClick={() => countersign(c.id, s.company!.ownerName)}>
                      Countersign FLHA
                    </Button>
                  ))}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="print-area">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5">
          <div>
            <h2 className="font-display text-lg font-semibold">On site now · muster list</h2>
            <p className="text-xs text-graphite/70">
              {s.company.name} · {siteId === "all" ? "All sites" : siteName(siteId)} · {formatTime(now)}
            </p>
          </div>
          <Button size="sm" variant="volt" className="no-print" onClick={() => window.print()}>
            Print muster list
          </Button>
        </div>
        <RosterTable s={s} rows={onSite} siteName={siteName} onOpen={setOpenId} />
      </Card>

      {hazardCounts.size > 0 && (
        <Card className="no-print p-6">
          <h2 className="font-display text-lg font-semibold">Hazards reported today</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {[...hazardCounts.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([id, n]) => (
                <Pill key={id} tone="outline">
                  {hazardById(id)?.label} · {n}
                </Pill>
              ))}
          </div>
        </Card>
      )}

      {open && <RecordDetail s={s} c={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function Stat({ label, value, unit, dot = false }: { label: string; value: number; unit: string; dot?: boolean }) {
  return (
    <div className="rounded-3xl border border-line bg-white/60 p-6">
      <p className="text-sm text-graphite/70">{label}</p>
      <p className="mt-3 font-display text-6xl font-bold tabular-nums leading-none">
        {value}
        {dot && <span aria-hidden className="ml-2 inline-block size-3 rounded-full bg-pop align-top" />}
      </p>
      <p className="mt-2 font-display text-lg font-semibold">{unit}</p>
    </div>
  );
}

function RosterTable({
  s,
  rows,
  siteName,
  onOpen,
}: {
  s: NonNullable<ReturnType<typeof useStore>>;
  rows: CheckIn[];
  siteName: (id: string) => string;
  onOpen: (id: string) => void;
}) {
  if (rows.length === 0) return <p className="px-6 py-8 text-center text-sm text-graphite/70">Nobody is checked in right now.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-graphite/70">
          <tr className="border-b border-line">
            <th className="px-6 py-3 font-medium">Name</th>
            <th className="px-6 py-3 font-medium">Company</th>
            <th className="px-6 py-3 font-medium">Role</th>
            <th className="px-6 py-3 font-medium">Site</th>
            <th className="px-6 py-3 font-medium">Since</th>
            <th className="px-6 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((c) => {
            const p = personFor(s, c);
            const flags = flagsFor(c);
            return (
              <tr key={c.id} onClick={() => onOpen(c.id)} className="cursor-pointer hover:bg-white">
                <td className="px-6 py-3 font-medium">{p?.name}</td>
                <td className="px-6 py-3 text-graphite">{p?.employer}</td>
                <td className="px-6 py-3 text-graphite">{p && roleLabel(p.role)}</td>
                <td className="px-6 py-3 text-graphite">{siteName(c.siteId)}</td>
                <td className="px-6 py-3 tabular-nums text-graphite">{formatTime(c.inAt)}</td>
                <td className="px-6 py-3">
                  {flags.length ? <Pill tone="pop">Flagged</Pill> : needsReview(c) ? <Pill tone="outline">To review</Pill> : <Pill tone="ink">Cleared</Pill>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
