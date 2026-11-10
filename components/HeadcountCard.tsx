export default function HeadcountCard({ count, location }: { count: number; location: string }) {
  return (
    <div className="rounded-3xl bg-ink p-6 text-bone">
      <p className="text-sm text-smoke">Right now · {location}</p>
      <p className="mt-3 font-display text-6xl font-bold tabular-nums leading-none">{count}</p>
      <p className="mt-2 font-display text-lg font-semibold">
        {count === 1 ? "person in the building" : "people in the building"}
      </p>
    </div>
  );
}
