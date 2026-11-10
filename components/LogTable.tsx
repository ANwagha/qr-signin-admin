import { formatTime } from "@/lib/time";

export type LogRow = {
  id: string;
  name: string;
  location: string;
  action: "in" | "out";
  timestamp: string; // ISO string
  /** Why this clock event needs a manager's review, if it does. */
  flag?: string;
};

function Status({ row }: { row: LogRow }) {
  if (row.flag) {
    return <span className="rounded-full bg-pop px-2.5 py-0.5 text-xs font-semibold text-ink">Flagged</span>;
  }
  return row.action === "in" ? (
    <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-bone">Clocked in</span>
  ) : (
    <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold text-graphite">
      Clocked out
    </span>
  );
}

export default function LogTable({ rows }: { rows: LogRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="font-display text-lg font-semibold">Quiet so far</p>
        <p className="mt-1 text-sm text-graphite/70">Clock-ins show up here as soon as someone scans a poster.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-graphite/70">
          <tr className="border-b border-line">
            <th className="px-6 py-3 font-medium">Time</th>
            <th className="px-6 py-3 font-medium">Employee</th>
            <th className="px-6 py-3 font-medium">Location</th>
            <th className="px-6 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap px-6 py-3.5 tabular-nums text-graphite">{formatTime(r.timestamp)}</td>
              <td className="px-6 py-3.5 font-medium">
                {r.name}
                {r.flag && <span className="block text-xs font-normal text-graphite/70">{r.flag}</span>}
              </td>
              <td className="px-6 py-3.5 text-graphite">{r.location}</td>
              <td className="px-6 py-3.5">
                <Status row={r} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
