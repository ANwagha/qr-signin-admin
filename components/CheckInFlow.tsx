"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import PhotoCapture from "@/components/PhotoCapture";
import SignaturePad from "@/components/SignaturePad";
import { Button, Choice, Field } from "@/components/ui";
import Wordmark from "@/components/Wordmark";
import { loadDemo } from "@/lib/demo-seed";
import { CONSENT_TEXT, FLHA_HAZARDS, PPE_ITEMS, PPE_PHOTO_PROMPT, hazardById } from "@/lib/flha";
import {
  CONSENT_VERSION,
  addCheckIn,
  checkOut,
  distanceM,
  flagsFor,
  forgetMe,
  isToday,
  uid,
  upsertMe,
  useStore,
  type CheckIn,
  type FlhaAnswers,
  type Photo,
  type Presence,
  type Role,
  type Site,
  type State,
} from "@/lib/store";
import { formatTime, greeting, useNow } from "@/lib/time";

type Step =
  | "start"
  | "identify"
  | "selfie"
  | "location"
  | "job"
  | "hazards"
  | "ppe"
  | "visitor"
  | "sign"
  | "done"
  | "checkout"
  | "checkedOut";

const FLOW: Step[] = ["identify", "selfie", "location", "job", "hazards", "ppe", "sign"];
const VISITOR_FLOW: Step[] = ["identify", "selfie", "location", "visitor", "sign"];

export default function CheckInFlow({ slug }: { slug: string }) {
  const store = useStore();
  const now = useNow();
  if (!store || now === null) return <Shell><div className="h-64 animate-pulse rounded-3xl bg-graphite" /></Shell>;
  const site = store.sites.find((s) => s.slug === slug);
  if (!store.company || !site) return <NotSetUp slug={slug} />;
  return <Flow key={site.id} store={store} site={site} now={now} />;
}

function Shell({ children, site, progress, onBack }: { children: ReactNode; site?: string; progress?: number; onBack?: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col bg-ink px-5 pb-8 pt-5 text-bone">
      <header className="mx-auto flex w-full max-w-md items-center justify-between gap-3">
        {onBack ? (
          <button onClick={onBack} className="min-h-11 text-sm text-smoke hover:text-bone">
            ← Back
          </button>
        ) : (
          <Wordmark tone="bone" />
        )}
        {site && <span className="truncate text-sm text-smoke">{site}</span>}
      </header>
      {progress !== undefined && (
        <div className="mx-auto mt-4 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-graphite" aria-hidden>
          <div className="h-full rounded-full bg-bone transition-all" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col pt-6">{children}</div>
    </main>
  );
}

function NotSetUp({ slug }: { slug: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Shell>
      <div className="flex flex-1 flex-col justify-center gap-4 text-center">
        <h1 className="font-display text-3xl font-bold">This site isn&apos;t set up here</h1>
        <p className="text-smoke">
          The prototype keeps companies in this browser. Load the Northshore Builders demo to try a check-in, or sign up your own company.
        </p>
        <Button
          variant="volt"
          size="lg"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await loadDemo();
          }}
        >
          {busy ? "Loading…" : "Load the demo company"}
        </Button>
        <Link href="/signup" className="text-sm text-smoke underline underline-offset-4 hover:text-bone">
          Sign up a company instead
        </Link>
        {slug !== "lonsdale-tower" && (
          <p className="text-xs text-smoke">The demo&apos;s sites are lonsdale-tower and brentwood-yard.</p>
        )}
      </div>
    </Shell>
  );
}

function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-3xl font-bold leading-tight">{children}</h1>
      {sub && <p className="mt-2 text-smoke">{sub}</p>}
    </div>
  );
}

function Err({ children }: { children: ReactNode }) {
  return children ? (
    <p role="alert" className="mt-3 text-sm text-pop">
      {children}
    </p>
  ) : null;
}

function YesNo({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 font-medium">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={`min-h-14 rounded-2xl border font-display text-lg font-bold transition ${
              value === v ? (v ? "border-bone bg-bone text-ink" : "border-pop bg-pop text-ink") : "border-graphite bg-graphite text-bone"
            }`}
          >
            {v ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Flow({ store, site, now }: { store: State; site: Site; now: number }) {
  const company = store.company!;
  const me = store.people.find((p) => p.id === store.me) ?? null;
  const open = me
    ? store.checkIns.find((c) => c.personId === me.id && c.siteId === site.id && !c.outAt && isToday(c.inAt, now))
    : undefined;

  const [step, setStep] = useState<Step>("start");
  const [error, setError] = useState<string | null>(null);

  // Identify
  const [name, setName] = useState(me?.name ?? "");
  const [employer, setEmployer] = useState(me?.employer ?? company.name);
  const [phone, setPhone] = useState(me?.phone ?? "");
  const [role, setRole] = useState<Role>(me && me.role !== "safety_manager" && me.role !== "supervisor" ? me.role : "worker");
  const [consent, setConsent] = useState(false);

  // Evidence
  const [selfie, setSelfie] = useState<Photo | null>(null);
  const [presence, setPresence] = useState<Presence | null>(null);
  const [locating, setLocating] = useState(false);

  // FLHA
  const supervisors = store.people.filter((p) => p.role === "supervisor" || p.role === "safety_manager");
  const [flha, setFlha] = useState<FlhaAnswers>({
    task: "",
    workArea: "",
    supervisor: supervisors[0]?.name ?? "",
    fitForDuty: true,
    knowsMuster: true,
    hazards: [],
    controls: {},
    otherHazard: "",
    ppe: [],
  });
  const [fit, setFit] = useState<boolean | null>(null);
  const [muster, setMuster] = useState<boolean | null>(null);
  const [hazardPhotos, setHazardPhotos] = useState<Record<string, Photo | null>>({});
  const [ppePhoto, setPpePhoto] = useState<Photo | null>(null);

  // Visitor
  const [visiting, setVisiting] = useState("");
  const [purpose, setPurpose] = useState("");
  const [rulesAck, setRulesAck] = useState(false);

  const [signature, setSignature] = useState<string | null>(null);
  const [done, setDone] = useState<CheckIn | null>(null);
  const [incident, setIncident] = useState<boolean | null>(null);

  const isVisitor = role === "visitor";
  const flow = isVisitor ? VISITOR_FLOW : FLOW;
  const idx = flow.indexOf(step);
  const progress = idx >= 0 ? (idx + 1) / (flow.length + 1) : undefined;
  const firstName = (me?.name ?? name).split(/\s+/)[0];

  function go(s: Step) {
    setError(null);
    setStep(s);
    window.scrollTo(0, 0);
  }
  function back() {
    go(idx > 0 ? flow[idx - 1] : "start");
  }
  function forward() {
    go(flow[idx + 1]);
  }

  function submitIdentify() {
    if (!name.trim()) return setError("Add your full name.");
    if (!employer.trim()) return setError("Add the company you work for.");
    if (!phone.trim()) return setError("Add a phone number so the site can reach you in an emergency.");
    if (!consent) return setError("Read and accept how your check-in is recorded to continue.");
    upsertMe(
      { name: name.trim(), employer: employer.trim(), phone: phone.trim(), role, consentVersion: CONSENT_VERSION },
      me?.id ?? null,
    );
    go("selfie");
  }

  function checkLocation() {
    if (!("geolocation" in navigator)) {
      setPresence({ status: "flagged", distanceM: null, accuracyM: null, reason: "This browser can't share location" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        if (site.lat === null || site.lng === null) {
          setPresence({ status: "flagged", distanceM: null, accuracyM: Math.round(p.coords.accuracy), reason: "Site boundary not set yet" });
          return;
        }
        const d = distanceM(p.coords.latitude, p.coords.longitude, site.lat, site.lng);
        const allowed = site.radiusM + Math.min(p.coords.accuracy, 100);
        setPresence(
          d <= allowed
            ? { status: "verified", distanceM: d, accuracyM: Math.round(p.coords.accuracy), reason: "Within the site boundary" }
            : {
                status: "flagged",
                distanceM: d,
                accuracyM: Math.round(p.coords.accuracy),
                reason: `${d >= 1000 ? `${(d / 1000).toFixed(1)} km` : `${d} m`} from ${site.name}`,
              },
        );
      },
      (err) => {
        setLocating(false);
        setPresence({
          status: "flagged",
          distanceM: null,
          accuracyM: null,
          reason: err.code === err.PERMISSION_DENIED ? "Location permission denied" : "Location unavailable (phones need https)",
        });
      },
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  }

  function submitJob() {
    if (!flha.task.trim()) return setError("Describe today's task.");
    if (fit === null || muster === null) return setError("Answer both questions.");
    setFlha((f) => ({ ...f, fitForDuty: fit, knowsMuster: muster }));
    forward();
  }

  function submitHazards() {
    for (const id of flha.hazards) {
      const h = hazardById(id)!;
      if (!(flha.controls[id]?.length > 0)) return setError(`Choose how "${h.label}" is controlled.`);
      if (store.photoRequired[id] && !hazardPhotos[id]) return setError(`Add the photo for "${h.label}".`);
    }
    if (flha.hazards.length === 0 && !flha.otherHazard.trim())
      return setError("Tick at least one hazard, or describe it under Other. Every task has some.");
    forward();
  }

  function submitPpe() {
    if (flha.ppe.length === 0) return setError("Tick the PPE you're wearing.");
    if (!ppePhoto) return setError("Add a photo of your PPE.");
    forward();
  }

  function submitVisitor() {
    if (!visiting.trim()) return setError("Who are you here to see?");
    if (!rulesAck) return setError("Confirm you'll follow the site rules.");
    forward();
  }

  function sign() {
    if (!signature) return setError("Sign with your finger to finish.");
    const photos: Photo[] = isVisitor
      ? []
      : [...flha.hazards.map((id) => hazardPhotos[id]).filter((p): p is Photo => !!p), ...(ppePhoto ? [ppePhoto] : [])];
    const record: CheckIn = {
      id: uid(),
      siteId: site.id,
      personId: store.me!,
      inAt: new Date().toISOString(),
      outAt: null,
      incidentReported: null,
      selfie: selfie!,
      presence: presence!,
      form: isVisitor
        ? { kind: "visitor", answers: { visiting: visiting.trim(), purpose: purpose.trim(), rulesAck } }
        : { kind: "flha", answers: { ...flha, task: flha.task.trim(), otherHazard: flha.otherHazard.trim() } },
      photos,
      signature,
      review: { selfie: "pending", countersignedAt: null, countersignedBy: null },
    };
    addCheckIn(record);
    setDone(record);
    go("done");
  }

  // ---------- Screens ----------

  if (step === "start") {
    if (open)
      return (
        <Shell site={site.name}>
          <div className="flex flex-1 flex-col justify-center text-center">
            <p className="text-smoke">{greeting(now, firstName)}</p>
            <h1 className="mt-2 font-display text-4xl font-bold">You&apos;re checked in</h1>
            <p className="mt-2 text-smoke">
              At {site.name} since {formatTime(open.inAt)}
            </p>
            <div className="mt-10">
              <Button variant="danger" size="lg" onClick={() => go("checkout")}>
                Check out
              </Button>
            </div>
          </div>
        </Shell>
      );
    return (
      <Shell site={site.name}>
        <div className="flex flex-1 flex-col justify-center">
          <p className="text-sm uppercase tracking-[0.2em] text-smoke">{company.name}</p>
          <h1 className="mt-2 font-display text-5xl font-bold leading-[0.95]">
            Check in at
            <br />
            {site.name}
          </h1>
          <p className="mt-4 text-smoke">
            {me ? `${greeting(now, firstName)}. ` : ""}Selfie, site check and today&apos;s safety form. About a minute.
          </p>
          <div className="mt-10 space-y-3">
            <Button variant="volt" size="lg" onClick={() => go(me ? "selfie" : "identify")}>
              {me ? "Check in" : "Start check-in"}
            </Button>
            {me && (
              <button
                onClick={() => {
                  forgetMe();
                  setName("");
                  setPhone("");
                  setEmployer(company.name);
                  go("identify");
                }}
                className="min-h-11 w-full text-sm text-smoke hover:text-bone"
              >
                Not {firstName}? Check in as someone else
              </button>
            )}
          </div>
        </div>
      </Shell>
    );
  }

  if (step === "identify")
    return (
      <Shell site={site.name} progress={progress} onBack={back}>
        <Title sub="You only do this once on this phone.">Who&apos;s checking in?</Title>
        <div className="space-y-5">
          <fieldset>
            <legend className="mb-2 font-medium">I&apos;m here as</legend>
            <div className="grid gap-2">
              {(
                [
                  ["worker", `A worker for ${company.name}`],
                  ["subcontractor", "A subcontractor"],
                  ["visitor", "A visitor or inspector"],
                ] as [Role, string][]
              ).map(([r, label]) => (
                <Choice
                  key={r}
                  selected={role === r}
                  onClick={() => {
                    setRole(r);
                    if (r === "worker") setEmployer(company.name);
                    else if (employer === company.name) setEmployer("");
                  }}
                >
                  {label}
                </Choice>
              ))}
            </div>
          </fieldset>
          <Field dark label="Full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Jas Gill" />
          <Field
            dark
            label={role === "visitor" ? "Organization" : "Company you work for"}
            value={employer}
            onChange={(e) => setEmployer(e.target.value)}
            placeholder={role === "visitor" ? "City of North Vancouver" : "Volt Electric Ltd."}
          />
          <Field dark label="Mobile phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="604-555-0123" />
          <div className="rounded-2xl bg-graphite p-4 text-sm text-smoke">
            <p>{CONSENT_TEXT}</p>
            <div className="mt-3">
              <Choice selected={consent} onClick={() => setConsent(!consent)}>
                I understand and agree
              </Choice>
            </div>
          </div>
        </div>
        <Err>{error}</Err>
        <div className="mt-6">
          <Button variant="volt" size="lg" onClick={submitIdentify}>
            Continue
          </Button>
        </div>
      </Shell>
    );

  if (step === "selfie")
    return (
      <Shell site={site.name} progress={progress} onBack={back}>
        <Title sub="A live photo so your supervisor knows it's really you. It's reviewed by a person, never matched automatically.">
          Take a selfie
        </Title>
        <PhotoCapture kind="identity" label="Selfie" prompt="Front camera" facing="user" round value={selfie} onChange={setSelfie} />
        <Err>{error}</Err>
        <div className="mt-auto pt-8">
          <Button variant="volt" size="lg" onClick={() => (selfie ? forward() : setError("Take your selfie to continue."))}>
            Continue
          </Button>
        </div>
      </Shell>
    );

  if (step === "location")
    return (
      <Shell site={site.name} progress={progress} onBack={back}>
        <Title sub={`We check your location once, right now, against the ${site.name} boundary. Never during your shift.`}>
          Site check
        </Title>
        {presence ? (
          <div className={`rounded-3xl p-6 ${presence.status === "verified" ? "bg-graphite" : "border border-pop bg-graphite"}`}>
            <p className="font-display text-2xl font-bold">{presence.status === "verified" ? "You're on site" : "Couldn't confirm you're on site"}</p>
            <p className="mt-1 text-smoke">
              {presence.reason}
              {presence.accuracyM !== null && ` · ±${presence.accuracyM} m`}
            </p>
            {presence.status === "flagged" && (
              <p className="mt-3 text-sm text-bone">You can still check in. Your supervisor will review it.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Button variant="outline-dark" size="lg" onClick={checkLocation} disabled={locating}>
              {locating ? "Checking…" : "Check my location"}
            </Button>
            <button
              onClick={() => setPresence({ status: "verified", distanceM: 0, accuracyM: null, reason: "Simulated on site (prototype)" })}
              className="min-h-11 w-full text-sm text-smoke underline-offset-4 hover:text-bone hover:underline"
            >
              Prototype: simulate being on site
            </button>
          </div>
        )}
        <Err>{error}</Err>
        <div className="mt-auto pt-8">
          <Button variant="volt" size="lg" onClick={() => (presence ? forward() : setError("Check your location first."))}>
            Continue
          </Button>
        </div>
      </Shell>
    );

  if (step === "job")
    return (
      <Shell site={site.name} progress={progress} onBack={back}>
        <Title sub="Field Level Hazard Assessment · 1 of 3">Today&apos;s job</Title>
        <div className="space-y-5">
          <Field dark label="What are you doing today?" value={flha.task} onChange={(e) => setFlha({ ...flha, task: e.target.value })} placeholder="Framing, level 6" />
          <Field dark label="Where on site?" value={flha.workArea} onChange={(e) => setFlha({ ...flha, workArea: e.target.value })} placeholder="North side" />
          <div>
            <label htmlFor="sup" className="mb-1.5 block text-sm font-medium">
              Your supervisor
            </label>
            <select
              id="sup"
              value={flha.supervisor}
              onChange={(e) => setFlha({ ...flha, supervisor: e.target.value })}
              className="min-h-14 w-full rounded-2xl border border-graphite bg-graphite px-4 text-base text-bone outline-none focus:border-bone"
            >
              {supervisors.map((s) => (
                <option key={s.id}>{s.name}</option>
              ))}
              <option value="Other">Someone else</option>
            </select>
          </div>
          <YesNo label="Are you fit for duty today? (rested, not impaired, no injury)" value={fit} onChange={setFit} />
          <YesNo label="Do you know where the muster point is?" value={muster} onChange={setMuster} />
          {(fit === false || muster === false) && (
            <p className="rounded-2xl border border-pop p-4 text-sm">Your supervisor will be alerted before you start work.</p>
          )}
        </div>
        <Err>{error}</Err>
        <div className="mt-6">
          <Button variant="volt" size="lg" onClick={submitJob}>
            Continue
          </Button>
        </div>
      </Shell>
    );

  if (step === "hazards")
    return (
      <Shell site={site.name} progress={progress} onBack={back}>
        <Title sub="Field Level Hazard Assessment · 2 of 3. Tick every hazard in today's work and how it's controlled.">
          Hazards and controls
        </Title>
        <div className="space-y-2.5">
          {FLHA_HAZARDS.map((h) => {
            const on = flha.hazards.includes(h.id);
            return (
              <div key={h.id} className={on ? "rounded-3xl bg-graphite/60 p-2" : ""}>
                <Choice
                  selected={on}
                  onClick={() =>
                    setFlha({ ...flha, hazards: on ? flha.hazards.filter((x) => x !== h.id) : [...flha.hazards, h.id] })
                  }
                >
                  {h.label}
                  {store.photoRequired[h.id] && <span className="ml-2 text-xs text-smoke">Photo</span>}
                </Choice>
                {on && (
                  <div className="space-y-3 px-2 pb-2 pt-3">
                    <p className="text-sm text-smoke">How is it controlled?</p>
                    <div className="flex flex-wrap gap-2">
                      {h.controls.map((c) => {
                        const sel = flha.controls[h.id]?.includes(c) ?? false;
                        return (
                          <button
                            key={c}
                            type="button"
                            aria-pressed={sel}
                            onClick={() => {
                              const cur = flha.controls[h.id] ?? [];
                              setFlha({ ...flha, controls: { ...flha.controls, [h.id]: sel ? cur.filter((x) => x !== c) : [...cur, c] } });
                            }}
                            className={`min-h-11 rounded-full border px-4 text-sm font-medium ${sel ? "border-bone bg-bone text-ink" : "border-smoke/50 text-bone"}`}
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                    {store.photoRequired[h.id] && (
                      <div className="pt-2">
                        <PhotoCapture
                          kind="compliance"
                          label={h.label}
                          prompt={h.photoPrompt}
                          facing="environment"
                          value={hazardPhotos[h.id] ?? null}
                          onChange={(p) => setHazardPhotos({ ...hazardPhotos, [h.id]: p })}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <Field dark label="Other hazard (optional)" value={flha.otherHazard} onChange={(e) => setFlha({ ...flha, otherHazard: e.target.value })} placeholder="Describe it" />
        </div>
        <Err>{error}</Err>
        <div className="mt-6">
          <Button variant="volt" size="lg" onClick={submitHazards}>
            Continue
          </Button>
        </div>
      </Shell>
    );

  if (step === "ppe")
    return (
      <Shell site={site.name} progress={progress} onBack={back}>
        <Title sub="Field Level Hazard Assessment · 3 of 3">PPE check</Title>
        <div className="grid grid-cols-2 gap-2">
          {PPE_ITEMS.map((p) => {
            const on = flha.ppe.includes(p);
            return (
              <Choice key={p} selected={on} onClick={() => setFlha({ ...flha, ppe: on ? flha.ppe.filter((x) => x !== p) : [...flha.ppe, p] })}>
                {p}
              </Choice>
            );
          })}
        </div>
        <div className="mt-6">
          <PhotoCapture kind="compliance" label="PPE" prompt={PPE_PHOTO_PROMPT} facing="environment" value={ppePhoto} onChange={setPpePhoto} />
        </div>
        <Err>{error}</Err>
        <div className="mt-6">
          <Button variant="volt" size="lg" onClick={submitPpe}>
            Continue
          </Button>
        </div>
      </Shell>
    );

  if (step === "visitor")
    return (
      <Shell site={site.name} progress={progress} onBack={back}>
        <Title sub="Visitors don't do the full FLHA, but you'll be on the muster list until you check out.">Visitor details</Title>
        <div className="space-y-5">
          <Field dark label="Who are you here to see?" value={visiting} onChange={(e) => setVisiting(e.target.value)} placeholder="Priya Shah" />
          <Field dark label="Purpose of visit (optional)" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Inspection" />
          <div className="rounded-2xl bg-graphite p-4 text-sm text-smoke">
            Stay with your host, wear the PPE you&apos;re given, keep out of marked zones, and go to the muster point if the alarm sounds.
            <div className="mt-3">
              <Choice selected={rulesAck} onClick={() => setRulesAck(!rulesAck)}>
                I&apos;ll follow the site rules
              </Choice>
            </div>
          </div>
        </div>
        <Err>{error}</Err>
        <div className="mt-6">
          <Button variant="volt" size="lg" onClick={submitVisitor}>
            Continue
          </Button>
        </div>
      </Shell>
    );

  if (step === "sign") {
    const hazards = flha.hazards.map((id) => hazardById(id)!.label);
    return (
      <Shell site={site.name} progress={progress} onBack={back}>
        <Title sub="Check your answers, then sign.">Sign and check in</Title>
        <dl className="space-y-3 rounded-3xl bg-graphite p-5 text-sm">
          <Row k="Name">{me?.name ?? name}</Row>
          <Row k="Site">{site.name}</Row>
          <Row k="Location">{presence?.status === "verified" ? "On site" : `Flagged: ${presence?.reason}`}</Row>
          {isVisitor ? (
            <Row k="Visiting">{visiting}</Row>
          ) : (
            <>
              <Row k="Task">{flha.task}</Row>
              <Row k="Hazards">{[...hazards, flha.otherHazard.trim()].filter(Boolean).join(", ") || "None"}</Row>
              <Row k="PPE">{flha.ppe.join(", ")}</Row>
              <Row k="Photos">{1 + flha.hazards.filter((id) => hazardPhotos[id]).length + (ppePhoto ? 1 : 0)} taken</Row>
            </>
          )}
        </dl>
        <div className="mt-5">
          <SignaturePad onChange={setSignature} />
        </div>
        <Err>{error}</Err>
        <div className="mt-6">
          <Button variant="volt" size="lg" onClick={sign}>
            Sign and check in
          </Button>
        </div>
      </Shell>
    );
  }

  if (step === "done" && done) {
    const flags = flagsFor(done);
    return (
      <Shell site={site.name}>
        <div className="flex flex-1 flex-col justify-center text-center">
          <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-volt text-ink animate-tock-pulse">
            <svg viewBox="0 0 24 24" className="size-12" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold">You&apos;re checked in</h1>
          <p className="mt-2 text-lg">
            {site.name} · {formatTime(done.inAt)}. Work safe, {firstName}.
          </p>
          {flags.length > 0 && (
            <div className="mt-6 rounded-2xl border border-pop p-4 text-left text-sm">
              <p className="font-semibold">Your supervisor will review:</p>
              <ul className="mt-1 list-disc pl-5 text-smoke">
                {flags.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-8 text-sm text-smoke">Scan the poster again when you leave to check out.</p>
        </div>
      </Shell>
    );
  }

  if (step === "checkout" && open)
    return (
      <Shell site={site.name} onBack={() => go("start")}>
        <Title sub={`Checked in since ${formatTime(open.inAt)}.`}>Check out</Title>
        <YesNo label="Any incidents or near misses today?" value={incident} onChange={setIncident} />
        {incident && <p className="mt-3 text-sm text-smoke">Thanks. Your supervisor will follow up with you.</p>}
        <Err>{error}</Err>
        <div className="mt-auto pt-8">
          <Button
            variant="danger"
            size="lg"
            onClick={() => {
              if (incident === null) return setError("Answer the question to check out.");
              checkOut(open.id, incident);
              go("checkedOut");
            }}
          >
            Check out
          </Button>
        </div>
      </Shell>
    );

  return (
    <Shell site={site.name}>
      <div className="flex flex-1 flex-col justify-center text-center">
        <h1 className="font-display text-4xl font-bold">You&apos;re checked out</h1>
        <p className="mt-2 text-lg text-smoke">
          {formatTime(now)}. Thanks, {firstName}. Get home safe.
        </p>
      </div>
    </Shell>
  );
}

function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-smoke">{k}</dt>
      <dd>{children}</dd>
    </div>
  );
}
