export type LogRow = {
  id: string;
  name: string;
  contact: string;
  action: "in" | "out";
  timestamp: string; // ISO string
};

export default function LogTable({ rows }: { rows: LogRow[] }) {
  if (rows.length === 0) {
    return <p className="p-6 text-center text-sm text-slate-500">No sign-ins yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email / Phone</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {new Date(r.timestamp).toLocaleString()}
              </td>
              <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
              <td className="px-4 py-3 text-slate-600">{r.contact}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    r.action === "in" ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {r.action === "in" ? "Sign In" : "Sign Out"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
