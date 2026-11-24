"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import SitePoster from "@/components/SitePoster";
import { Button, Choice, Field } from "@/components/ui";
import Wordmark from "@/components/Wordmark";
import { loadDemo } from "@/lib/demo-seed";
import { createCompany, roleLabel, useStore, type Role, type Site } from "@/lib/store";

const STEPS = ["Company", "First site", "Your team", "Ready"];

export default function SignupWizard() {
  const router = useRouter();
  const store = useStore();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [company, setCompany] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [siteName, setSiteName] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locStatus, setLocStatus] = useState<string | null>(null);
  const [radius, setRadius] = useState("150");
  const [inviteText, setInviteText] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("supervisor");
  const [created, setCreated] = useState<Site | null>(null);
  const [demoBusy, setDemoBusy] = useState(false);

  function emails() {
    return inviteText
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function next(e?: FormEvent) {
    e?.preventDefault();
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!company.trim()) errs.company = "Add your company name.";
      if (!ownerName.trim()) errs.ownerName = "Add your name.";
      if (!/^\S+@\S+\.\S+$/.test(ownerEmail.trim())) errs.ownerEmail = "Add a valid work email.";
    }
    if (step === 1) {
      if (!siteName.trim()) errs.siteName = "Name the site, like Main Street office.";
      if (!Number(radius) || Number(radius) < 25) errs.radius = "Use at least 25 metres.";
    }
    if (step === 2) {
      const bad = emails().filter((m) => !/^\S+@\S+\.\S+$/.test(m));
      if (bad.length) errs.invites = `Check these emails: ${bad.join(", ")}`;
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (step === 2) {
      const site = createCompany({
        name: company.trim(),
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim(),
        site: { name: siteName.trim(), address: address.trim(), lat: coords?.lat ?? null, lng: coords?.lng ?? null, radiusM: Number(radius) },
        invites: emails().map((email) => ({ email, role: inviteRole })),
      });
      setCreated(site);
    }
    setStep((s) => s + 1);
  }

  function locateMe() {
    if (!("geolocation" in navigator)) {
      setLocStatus("This browser can't share location. You can add it later.");
      return;
    }
    setLocStatus("Getting your location…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setLocStatus(`Location set (±${Math.round(p.coords.accuracy)} m).`);
      },
      () => setLocStatus("Couldn't get your location. Location needs https on phones; you can add it later."),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  async function exploreDemo() {
    setDemoBusy(true);
    await loadDemo();
    router.push("/admin");
  }

  return (
    <main className="min-h-dvh bg-bone text-ink">
      <header className="bg-ink">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" aria-label="Musterpass home">
            <Wordmark tone="bone" />
          </Link>
          <button onClick={exploreDemo} disabled={demoBusy} className="text-sm text-smoke hover:text-bone">
            {demoBusy ? "Loading demo…" : "Explore the demo instead"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-4 py-10">
        <ol className="mb-8 flex gap-1.5" aria-label="Sign-up steps">
          {STEPS.map((s, i) => (
            <li key={s} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? "bg-ink" : "bg-line"}`} />
              <p className={`mt-1.5 text-xs ${i === step ? "font-semibold" : "text-graphite/60"}`}>{s}</p>
            </li>
          ))}
        </ol>

        {store?.company && step === 0 && (
          <p className="mb-6 rounded-2xl border border-line bg-white/60 p-4 text-sm">
            This browser already has <strong>{store.company.name}</strong>. Signing up again replaces it.{" "}
            <Link href="/admin" className="underline">
              Go to its dashboard
            </Link>
          </p>
        )}

        <form onSubmit={next} className="space-y-5">
          {step === 0 && (
            <>
              <h1 className="font-display text-3xl font-bold">Start your free trial</h1>
              <p className="text-graphite/70">30 days free. One price per company after that, with unlimited staff, contractors and visitors.</p>
              <Field label="Company name" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Northshore Builders" error={errors.company} autoFocus />
              <Field label="Your name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Priya Shah" autoComplete="name" error={errors.ownerName} />
              <Field label="Work email" type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="priya@northshore.ca" autoComplete="email" error={errors.ownerEmail} />
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="font-display text-3xl font-bold">Add your first site</h1>
              <p className="text-graphite/70">Each site or location gets its own QR poster and boundary for the location check.</p>
              <Field label="Site name" value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Main Street office" error={errors.siteName} autoFocus />
              <Field label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="1200 Main St, Vancouver, BC" />
              <div className="rounded-2xl border border-line bg-white p-4">
                <p className="text-sm font-medium">Site location</p>
                <p className="mt-1 text-xs text-graphite/70">
                  Standing at the site? Use your location to set the boundary centre. In the full product we&apos;ll look up the address instead.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button type="button" variant="outline" size="sm" onClick={locateMe}>
                    Use my current location
                  </Button>
                  {locStatus && <span className="text-sm text-graphite/80">{locStatus}</span>}
                </div>
              </div>
              <Field label="Boundary radius (metres)" type="number" inputMode="numeric" value={radius} onChange={(e) => setRadius(e.target.value)} error={errors.radius} hint="Clock-ins further away than this are flagged for review." />
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="font-display text-3xl font-bold">Invite your team</h1>
              <p className="text-graphite/70">
                Supervisors and managers get dashboard access. Staff, contractors and visitors don&apos;t need an invite: they just scan the poster.
              </p>
              <div>
                <label htmlFor="invites" className="mb-1.5 block text-sm font-medium">
                  Emails (optional)
                </label>
                <textarea
                  id="invites"
                  rows={3}
                  value={inviteText}
                  onChange={(e) => setInviteText(e.target.value)}
                  placeholder="marco@northshore.ca, sana@northshore.ca"
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-ink"
                />
                {errors.invites && <p role="alert" className="mt-1.5 text-sm text-pop-deep">{errors.invites}</p>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["supervisor", "safety_manager"] as Role[]).map((r) => (
                  <Choice key={r} dark={false} selected={inviteRole === r} onClick={() => setInviteRole(r)}>
                    {roleLabel(r)}
                  </Choice>
                ))}
              </div>
              <p className="text-xs text-graphite/60">Prototype: invites are listed in People but no email is sent yet.</p>
            </>
          )}

          {step === 3 && created && (
            <div className="space-y-5">
              <h1 className="font-display text-3xl font-bold">{company} is ready</h1>
              <ul className="space-y-2 text-sm">
                {[
                  `${created.name} added with a ${radius} m boundary`,
                  "Clock-in with selfie and location check, plus two starter forms you can edit or turn off in Forms",
                  "Dashboard with who's in, hours, reviews and the emergency list",
                  emails().length ? `${emails().length} invite${emails().length > 1 ? "s" : ""} queued` : "Invite people any time from People",
                  "30-day free trial started. Choose a plan any time in Billing",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <span aria-hidden className="mt-1 size-2.5 shrink-0 rounded-full bg-ink" />
                    {t}
                  </li>
                ))}
              </ul>
              <SitePoster site={created} companyName={company} origin={window.location.origin} />
              <div className="no-print flex flex-wrap items-center justify-center gap-3">
                <Button type="button" variant="volt" onClick={() => router.push("/admin")}>
                  Go to your dashboard
                </Button>
                <Button type="button" variant="outline" onClick={() => window.print()}>
                  Print poster
                </Button>
                <Link href={`/s/${created.slug}`} target="_blank" className="self-center text-sm underline underline-offset-4">
                  Try clocking in
                </Link>
              </div>
            </div>
          )}

          {step < 3 && (
            <div className="flex items-center justify-between pt-2">
              {step > 0 ? (
                <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>
                  Back
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit" variant="volt">
                {step === 2 ? (emails().length ? "Send invites and finish" : "Skip and finish") : "Continue"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
