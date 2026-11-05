export default function HeadcountCard({ count, location }: { count: number; location: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <p className="text-sm font-medium text-slate-500">Currently on site · {location}</p>
      <p className="mt-2 text-5xl font-bold text-indigo-600">{count}</p>
    </div>
  );
}
