"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, Field, PageHeader, Pill } from "@/components/ui";
import { addInvite, roleLabel, useStore, type Role } from "@/lib/store";

const FILTERS: { key: "all" | Role; label: string }[] = [
  { key: "all", label: "Everyone" },
  { key: "worker", label: "Workers" },
  { key: "subcontractor", label: "Subcontractors" },
  { key: "visitor", label: "Visitors" },
  { key: "supervisor", label: "Supervisors" },
];

export default function PeoplePage() {
  const s = useStore();
  const [filter, setFilter] = useState<"all" | Role>("all");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("supervisor");
  const [error, setError] = useState<string | null>(null);
  if (!s || !s.company) return null;

  const people = s.people
    .filter((p) => filter === "all" || p.role === filter || (filter === "supervisor" && p.role === "safety_manager"))
    .map((p) => {
      const mine = s.checkIns.filter((c) => c.personId === p.id).sort((a, b) => b.inAt.localeCompare(a.inAt));
      return { p, count: mine.length, last: mine[0]?.inAt };
    });
  const subcontractorCompanies = [...new Set(s.people.filter((p) => p.role === "subcontractor").map((p) => p.employer))];

  function invite(e: FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Add a valid email.");
    addInvite(email.trim(), role);
    setEmail("");
    setError(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="People" subtitle="Everyone who has checked in, plus your dashboard team" />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`min-h-10 rounded-full px-4 text-sm font-medium ${filter === f.key ? "bg-ink text-bone" : "border border-line bg-white"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-graphite/70">
              <tr className="border-b border-line">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Company</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Check-ins</th>
                <th className="px-6 py-3 font-medium">Last seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {people.map(({ p, count, last }) => (
                <tr key={p.id}>
                  <td className="px-6 py-3 font-medium">{p.name}</td>
                  <td className="px-6 py-3 text-graphite">{p.employer}</td>
                  <td className="px-6 py-3">
                    <Pill tone={p.role === "subcontractor" || p.role === "visitor" ? "outline" : "neutral"}>{roleLabel(p.role)}</Pill>
                  </td>
                  <td className="px-6 py-3 tabular-nums text-graphite">{count}</td>
                  <td className="px-6 py-3 text-graphite">
                    {last ? new Date(last).toLocaleDateString([], { month: "short", day: "numeric" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold">Invite dashboard users</h2>
          <p className="mt-1 text-sm text-graphite/70">
            Supervisors and safety staff. Workers, subs and visitors don&apos;t need invites: they scan the poster.
          </p>
          <form onSubmit={invite} className="mt-4 space-y-3">
            <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="marco@northshore.ca" error={error} />
            <div className="flex gap-2">
              {(["supervisor", "safety_manager"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={role === r}
                  onClick={() => setRole(r)}
                  className={`min-h-10 rounded-full px-4 text-sm font-medium ${role === r ? "bg-ink text-bone" : "border border-line bg-white"}`}
                >
                  {roleLabel(r)}
                </button>
              ))}
            </div>
            <Button type="submit" variant="ink">
              Send invite
            </Button>
          </form>
          {s.invites.length > 0 && (
            <ul className="mt-5 space-y-1.5 text-sm">
              {s.invites.map((i) => (
                <li key={i.id} className="flex justify-between gap-3">
                  <span>{i.email}</span>
                  <span className="text-graphite/70">{roleLabel(i.role)} · invited (prototype: no email sent)</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold">Subcontractor companies</h2>
          <p className="mt-1 text-sm text-graphite/70">Companies whose crews have checked in on your sites.</p>
          {subcontractorCompanies.length ? (
            <ul className="mt-4 space-y-2">
              {subcontractorCompanies.map((c) => (
                <li key={c} className="flex items-center justify-between rounded-2xl border border-line bg-white px-4 py-3 text-sm">
                  <span className="font-medium">{c}</span>
                  <span className="text-graphite/70">{s.people.filter((p) => p.employer === c).length} people</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-graphite/70">None yet. They appear here after their first check-in.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
