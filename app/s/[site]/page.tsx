import type { Metadata } from "next";
import { Suspense } from "react";
import CheckInFlow from "@/components/CheckInFlow";

export const metadata: Metadata = { title: "Site check-in" };

async function Flow({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  return <CheckInFlow slug={decodeURIComponent(site)} />;
}

export default function SiteCheckInPage({ params }: PageProps<"/s/[site]">) {
  // params is request data; keep it inside <Suspense> so the shell can prerender (cacheComponents).
  return (
    <Suspense fallback={<main className="min-h-dvh bg-ink" />}>
      <Flow params={params} />
    </Suspense>
  );
}
