"use client";

import { useState } from "react";
import RecordDetail, { personFor } from "@/components/RecordDetail";
import { Button, Card, PageHeader, Pill } from "@/components/ui";
import { hazardById } from "@/lib/flha";
import { flagsFor, needsReview, roleLabel, useStore, type CheckIn, type State } from "@/lib/store";
import { formatTime, useNow } from "@/lib/time";

function csvCell(v: string) {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v; // stop spreadsheets running formulas
  return `"${safe.replace(/"/g, '""')}"`;
}

function toCsv(s: State, rows: CheckIn[]) {
  const header = ["Checked in", "Checked out", "Name", "Company", "Role", "Site", "Location check", "Form", "Task", "Hazards", "PPE", "Selfie review", "Countersigned by", "Flags"];
  const lines = rows.map((c) => {
    const p = personFor(s, c);
    const f = c.form.kind === "flha" ? c.form.answers : null;
    return [
      c.inAt,
      c.outAt ?? "",
      p?.name ?? "",
      p?.employer ?? "",
      p ? roleLabel(p.role) : "",
      s.sites.find((x) => x.id === c.siteId)?.name ?? "",
      `${c.presence.status}: ${c.presence.reason}`,
      c.form.kind === "flha" ? "FLHA" : "Visitor",
      f?.task ?? "",
      f ? f.hazards.map((h) => hazardById(h)?.label).join("; ") : "",
      f ? f.ppe.join("; ") : "",
      c.review.selfie,
      c.review.countersignedBy ?? "",
      flagsFor(c).join("; "),
    ]
      .map(csvCell)
      .join(",");
  });
  return [header.map(csvCell).join(","), ...lines].join("\n");
}

export default function RecordsPage() {
  const s = useStore();
  const now = useNow();
  const [q, setQ] = useState("");
  const [siteId, setSiteId] = useState("all");
  const [range, setRange] = useState<"today" | "7" | "all">("7");
  const [openId, setOpenId] = useState<string | null>(null);
  if (!s || !s.company || now === null) return null;

  const since = range === "today" ? new Date(new Date(now).toDateString()).getTime() : range === "7" ? now - 7 * 86_400_000 : 0;
  const rows = s.checkIns
    .filter((c) => new Date(c.inAt).getTime() >= since)
    .filter((c) => siteId === "all" || c.siteId === siteId)
    .filter((c) => {
      if (!q.trim()) return true;
      const p = personFor(s, c);
      return `${p?.name} ${p?.employer}`.toLowerCase().includes(q.trim().toLowerCase());
    })
    .sort((a, b) => b.inAt.localeCompare(a.inAt));
  const open = s.checkIns.find((c) => c.id === openId);

  function exportCsv() {
    const blob = new Blob([toCsv(s!, rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `musterpass-records-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Records"
        subtitle="Every check-in, form and photo, ready for audits, COR and incident investigations"
        action={
          <Button variant="volt" onClick={exportCsv} disabled={rows.length === 0}>
            Export CSV
          </Button>
        }
      />
      <div className="flex flex-wrap gap-3">
        <input
          aria-label="Search by name or company"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or company"
          className="min-h-11 min-w-56 flex-1 rounded-full border border-line bg-white px-4 text-sm outline-none focus:border-ink"
        />
        <select aria-label="Site" value={siteId} onChange={(e) => setSiteId(e.target.value)} className="min-h-11 rounded-full border border-line bg-white px-4 text-sm">
          <option value="all">All sites</option>
          {s.sites.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
        <select aria-label="Date range" value={range} onChange={(e) => setRange(e.target.value as typeof range)} className="min-h-11 rounded-full border border-line bg-white px-4 text-sm">
          <option value="today">Today</option>
          <option value="7">Last 7 days</option>
          <option value="all">All time</option>
        </select>
      </div>
      <Card>
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-graphite/70">No records match.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-graphite/70">
                <tr className="border-b border-line">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Site</th>
                  <th className="px-6 py-3 font-medium">Form</th>
                  <th className="px-6 py-3 font-medium">In / out</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((c) => {
                  const p = personFor(s, c);
                  return (
                    <tr key={c.id} onClick={() => setOpenId(c.id)} className="cursor-pointer hover:bg-white">
                      <td className="whitespace-nowrap px-6 py-3 text-graphite">
                        {new Date(c.inAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </td>
                      <td className="px-6 py-3">
                        <p className="font-medium">{p?.name}</p>
                        <p className="text-xs text-graphite/70">
                          {p && roleLabel(p.role)} · {p?.employer}
                        </p>
                      </td>
                      <td className="px-6 py-3 text-graphite">{s.sites.find((x) => x.id === c.siteId)?.name}</td>
                      <td className="px-6 py-3 text-graphite">{c.form.kind === "flha" ? "FLHA" : "Visitor"}</td>
                      <td className="whitespace-nowrap px-6 py-3 tabular-nums text-graphite">
                        {formatTime(c.inAt)} – {c.outAt ? formatTime(c.outAt) : "on site"}
                      </td>
                      <td className="px-6 py-3">
                        {flagsFor(c).length ? <Pill tone="pop">Flagged</Pill> : needsReview(c) ? <Pill tone="outline">To review</Pill> : <Pill tone="ink">Complete</Pill>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {open && <RecordDetail s={s} c={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}
