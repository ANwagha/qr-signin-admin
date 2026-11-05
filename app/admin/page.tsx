"use client";

import { useMemo, useState } from "react";
import HeadcountCard from "@/components/HeadcountCard";
import LogTable, { type LogRow } from "@/components/LogTable";

// UI-only sample data. Replaced by the real log store in a later step.
const SAMPLE_ROWS: LogRow[] = [
  { id: "1", name: "Jane Smith", contact: "jane@example.com", action: "in", timestamp: new Date(Date.now() - 45 * 60_000).toISOString() },
  { id: "2", name: "Omar Reyes", contact: "+1 555 0142", action: "in", timestamp: new Date(Date.now() - 30 * 60_000).toISOString() },
  { id: "3", name: "Priya Nair", contact: "priya@example.com", action: "out", timestamp: new Date(Date.now() - 10 * 60_000).toISOString() },
];

function toCsv(rows: LogRow[]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = "Timestamp,Name,Email/Phone,Action";
  const body = rows.map((r) =>
    [esc(new Date(r.timestamp).toISOString()), esc(r.name), esc(r.contact), r.action].join(","),
  );
  return [header, ...body].join("\n");
}

export default function AdminDashboard() {
  const [location] = useState("All locations");
  const rows = SAMPLE_ROWS;

  // Headcount = people whose most recent action is "in".
  const headcount = useMemo(() => {
    const latest = new Map<string, LogRow>();
    [...rows]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .forEach((r) => latest.set(r.contact.toLowerCase(), r));
    return [...latest.values()].filter((r) => r.action === "in").length;
  }, [rows]);

  function downloadCsv() {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sign-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <button
          onClick={downloadCsv}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Download CSV
        </button>
      </div>

      <HeadcountCard count={headcount} location={location} />

      <section className="rounded-2xl bg-white shadow">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Recent activity</h2>
        </div>
        <LogTable rows={rows} />
      </section>
    </div>
  );
}
