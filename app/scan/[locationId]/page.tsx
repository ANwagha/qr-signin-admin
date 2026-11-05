import SignForm from "@/components/SignForm";

// UI-only placeholder: derive a display name from the QR slug until storage exists.
function displayName(locationId: string) {
  return locationId
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function ScanPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  const name = displayName(locationId);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <header className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Location check-in
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{name}</h1>
          <p className="mt-1 text-sm text-slate-500">ID: {locationId}</p>
        </header>
        <SignForm locationName={name} />
      </div>
    </main>
  );
}
