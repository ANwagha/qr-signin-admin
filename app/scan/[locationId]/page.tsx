import type { Metadata } from "next";
import { Suspense } from "react";
import ClockIn from "@/components/ClockIn";

export const metadata: Metadata = { title: "Clock in" };

// Until locations are stored (Phase 2), derive a display name from the QR slug.
function displayName(locationId: string) {
  return decodeURIComponent(locationId)
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function Scan({ params }: { params: Promise<{ locationId: string }> }) {
  const { locationId } = await params;
  return <ClockIn locationId={locationId} locationName={displayName(locationId)} />;
}

export default function ScanPage({ params }: PageProps<"/scan/[locationId]">) {
  // params is request data; reading it inside <Suspense> keeps the rest of the route prerenderable.
  return (
    <Suspense fallback={<main className="min-h-dvh bg-ink" />}>
      <Scan params={params} />
    </Suspense>
  );
}
