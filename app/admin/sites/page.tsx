"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import SitePoster from "@/components/SitePoster";
import { Button, Card, Field, PageHeader, Pill } from "@/components/ui";
import { addSite, isToday, useStore } from "@/lib/store";
import { useNow } from "@/lib/time";

export default function SitesPage() {
  const s = useStore();
  const now = useNow();
  const [posterId, setPosterId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  if (!s || !s.company || now === null) return null;

  const poster = s.sites.find((x) => x.id === posterId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sites"
        subtitle="Each site has its own gate poster and boundary"
        action={
          <Button variant="volt" onClick={() => setAdding(true)}>
            Add site
          </Button>
        }
      />
      {adding && <AddSite onDone={() => setAdding(false)} />}
      <div className="no-print grid gap-4 md:grid-cols-2">
        {s.sites.map((site) => {
          const onSite = s.checkIns.filter((c) => c.siteId === site.id && !c.outAt && isToday(c.inAt, now)).length;
          return (
            <Card key={site.id} className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold">{site.name}</h2>
                  <p className="text-sm text-graphite/70">{site.address || "No address yet"}</p>
                </div>
                <Pill tone={onSite ? "ink" : "outline"}>{onSite} on site</Pill>
              </div>
              <p className="mt-3 text-sm text-graphite">
                Boundary: {site.radiusM} m{" "}
                {site.lat === null ? <span className="text-pop-deep">· centre not set (check-ins will be flagged)</span> : `· ${site.lat.toFixed(4)}, ${site.lng?.toFixed(4)}`}
              </p>
              <p className="mt-1 font-mono text-xs text-graphite/70">/s/{site.slug}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="ink" onClick={() => setPosterId(site.id === posterId ? null : site.id)}>
                  {site.id === posterId ? "Hide poster" : "Show poster"}
                </Button>
                <Link href={`/s/${site.slug}`} target="_blank" className="rounded-full border border-line px-3.5 py-1.5 text-sm font-bold hover:border-ink">
                  Open check-in
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
      {poster && (
        <div className="space-y-3">
          <SitePoster site={poster} companyName={s.company.name} origin={window.location.origin} />
          <div className="no-print flex justify-center">
            <Button variant="ink" onClick={() => window.print()}>
              Print poster
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddSite({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [radius, setRadius] = useState("150");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function locate() {
    setStatus("Getting your location…");
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setStatus(`Centre set (±${Math.round(p.coords.accuracy)} m)`);
      },
      () => setStatus("Couldn't get your location (phones need https)."),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Name the site.");
    addSite({ name: name.trim(), address: address.trim(), lat: coords?.lat ?? null, lng: coords?.lng ?? null, radiusM: Number(radius) || 150 });
    onDone();
  }

  return (
    <Card className="no-print p-6">
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <Field label="Site name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Brentwood Yard" error={error} autoFocus />
        <Field label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="4500 Still Creek Dr, Burnaby, BC" />
        <Field label="Boundary radius (metres)" type="number" value={radius} onChange={(e) => setRadius(e.target.value)} />
        <div className="flex flex-wrap items-end gap-3">
          <Button type="button" variant="outline" onClick={locate}>
            Use my current location
          </Button>
          {status && <span className="pb-2 text-sm text-graphite/80">{status}</span>}
        </div>
        <div className="flex gap-3 md:col-span-2">
          <Button type="submit" variant="ink">
            Add site
          </Button>
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
