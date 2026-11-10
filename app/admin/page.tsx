"use client";

import { useMemo } from "react";
import HeadcountCard from "@/components/HeadcountCard";
import LogTable, { type LogRow } from "@/components/LogTable";
import { useDemoStore } from "@/lib/demo-store";
import { useNow } from "@/lib/time";

// Phase 0 sample data for the Daybreak Coffee demo (see the founding document).
// Real clock events arrive with Supabase in Phase 1.
const SAMPLE: { minsAgo: number; row: Omit<LogRow, "id" | "timestamp"> }[] = [
  { minsAgo: 312, row: { name: "Priya Nair", location: "Main Street", action: "in" } },
  { minsAgo: 296, row: { name: "Omar Reyes", location: "Main Street", action: "in" } },
  { minsAgo: 284, row: { name: "Leo Park", location: "Main Street", action: "in", flag: "3.1 km from Main Street" } },
  { minsAgo: 262, row: { name: "Jordan Lee", location: "Harbour Road", action: "in" } },
  { minsAgo: 205, row: { name: "Mia Chen", location: "Harbour Road", action: "in" } },
  { minsAgo: 48, row: { name: "Omar Reyes", location: "Main Street", action: "out" } },
];

function csvCell(v: string) {
  // Quote every cell, and neutralise values Excel would treat as a formula.
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

function toCsv(rows: LogRow[]) {
  const header = ["Timestamp", "Employee", "Location", "Action", "Flag"].map(csvCell).join(",");
  const body = rows.map((r) =>
    [new Date(r.timestamp).toISOString(), r.name, r.location, r.action, r.flag ?? ""].map(csvCell).join(","),
  );
  return [header, ...body].join("\n");
}

export default function AdminDashboard() {
  const now = useNow();
  const store = useDemoStore();

  const rows = useMemo<LogRow[]>(() => {
    if (now === null) return [];
    const samples = SAMPLE.map((s, i) => ({
      ...s.row,
      id: `sample-${i}`,
      timestamp: new Date(now - s.minsAgo * 60_000).toISOString(),
    }));
    const mine = (store?.events ?? []).map((e) => ({
      id: e.id,
      name: e.name,
      location: e.locationName,
      action: e.action,
      timestamp: e.at,
    }));
    return [...samples, ...mine].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [now, store]);

  // Headcount = people whose most recent accepted clock event is "in". Flagged events don't count.
  const headcount = useMemo(() => {
    const latest = new Map<string, LogRow>();
    [...rows]
      .filter((r) => !r.flag)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .forEach((r) => latest.set(r.name.toLowerCase(), r));
    return [...latest.values()].filter((r) => r.action === "in").length;
  }, [rows]);

  const clockIns = rows.filter((r) => r.action === "in" && !r.flag).length;
  const flagged = rows.filter((r) => r.flag).length;

  function downloadCsv() {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tock-activity-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-graphite/70">
            {now === null
              ? " "
              : new Date(now).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Daybreak Coffee</h1>
        </div>
        <button
          onClick={downloadCsv}
          disabled={rows.length === 0}
          className="rounded-full bg-volt px-5 py-2.5 text-sm font-bold text-ink transition hover:brightness-95 active:scale-[0.98]"
        >
          Download CSV
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <HeadcountCard count={headcount} location="All locations" />
        <div className="rounded-3xl border border-line bg-white/60 p-6">
          <p className="text-sm text-graphite/70">Today</p>
          <p className="mt-3 font-display text-6xl font-bold tabular-nums leading-none">{clockIns}</p>
          <p className="mt-2 font-display text-lg font-semibold">clock-ins</p>
        </div>
        <div className="rounded-3xl border border-line bg-white/60 p-6">
          <p className="text-sm text-graphite/70">Needs a look</p>
          <p className="mt-3 font-display text-6xl font-bold tabular-nums leading-none">
            {flagged}
            {flagged > 0 && <span aria-hidden className="ml-2 inline-block size-3 rounded-full bg-pop align-top" />}
          </p>
          <p className="mt-2 font-display text-lg font-semibold">{flagged === 1 ? "flagged clock-in" : "flagged clock-ins"}</p>
        </div>
      </div>

      <section className="rounded-3xl border border-line bg-white/60">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-display text-lg font-semibold">Activity</h2>
          <p className="text-xs text-graphite/70">Sample data plus clock-ins from this browser</p>
        </div>
        <LogTable rows={rows} />
      </section>
    </div>
  );
}
