"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import PhotoCapture from "@/components/PhotoCapture";
import SignaturePad from "@/components/SignaturePad";
import ThemeToggle from "@/components/ThemeToggle";
import { Button, Choice, Field } from "@/components/ui";
import Wordmark from "@/components/Wordmark";
import { loadDemo } from "@/lib/demo-seed";
import {
  CONSENT_TEXT,
  flagsForResponse,
  isAnswered,
  isFlagged,
  type AnswerValue,
  type FormDef,
  type FormResponse,
  type Question,
} from "@/lib/forms";
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
  type Photo,
  type Presence,
  type Role,
  type Site,
  type State,
} from "@/lib/store";
import { formatDuration, formatTime, greeting, useNow } from "@/lib/time";

export default function CheckInFlow({ slug }: { slug: string }) {
  const store = useStore();
  const now = useNow();
  if (!store || now === null) return <Shell><div className="h-64 animate-pulse rounded-3xl bg-raised" /></Shell>;
  const site = store.sites.find((s) => s.slug === slug);
  if (!store.company || !site) return <NotSetUp slug={slug} />;
  return <Flow key={site.id} store={store} site={site} now={now} />;
}

function Shell({ children, site, progress, onBack }: { children: ReactNode; site?: string; progress?: number; onBack?: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col bg-bg px-5 pb-8 pt-5 text-fg">
      <header className="mx-auto flex w-full max-w-md items-center justify-between gap-3">
        {onBack ? (
          <button onClick={onBack} className="min-h-11 text-sm text-muted hover:text-fg">
            ← Back
          </button>
        ) : (
          <Wordmark tone="fg" />
        )}
        <div className="flex min-w-0 items-center gap-3">
          {site && <span className="truncate text-sm text-muted">{site}</span>}
          <ThemeToggle />
        </div>
      </header>
      {progress !== undefined && (
        <div className="mx-auto mt-4 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-raised" aria-hidden>
          <div className="h-full rounded-full bg-fg transition-all" style={{ width: `${progress * 100}%` }} />
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
        <p className="text-muted">
          The prototype keeps companies in this browser. Load the demo company to try clocking in, or sign up your own company.
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
        <Link href="/signup" className="text-sm text-muted underline underline-offset-4 hover:text-fg">
          Sign up a company instead
        </Link>
        {slug !== "lonsdale-tower" && <p className="text-xs text-muted">The demo&apos;s sites are lonsdale-tower and brentwood-yard.</p>}
      </div>
    </Shell>
  );
}

function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-3xl font-bold leading-tight">{children}</h1>
      {sub && <p className="mt-2 text-muted">{sub}</p>}
    </div>
  );
}

function Err({ children }: { children: ReactNode }) {
  return children ? (
    <p role="alert" className="mt-3 text-sm text-alert">
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
              value === v ? "border-fg bg-fg text-bg" : "border-line bg-raised text-fg"
            }`}
          >
            {v ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Number entry with a separate +/− button: iPhone's decimal keypad has no minus key. */
function SignedNumber({ q, value, onChange }: { q: Question; value: AnswerValue; onChange: (v: number | null) => void }) {
  const initialNeg = typeof value === "number" ? value < 0 : q.flag?.max !== undefined && q.flag.max < 0;
  const [neg, setNeg] = useState(initialNeg);
  const [text, setText] = useState(typeof value === "number" ? String(Math.abs(value)) : "");
  const emit = (t: string, isNeg: boolean) => {
    const clean = t.replace(",", ".").replace(/[-−]/g, "").trim();
    const n = Number(clean);
    onChange(clean === "" || Number.isNaN(n) ? null : isNeg ? -n : n);
  };
  const id = `q-${q.id}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-medium">
        {q.label}
        {q.unit && ` (${q.unit})`}
        {!q.required && <span className="ml-1 text-sm font-normal text-muted">(optional)</span>}
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          aria-pressed={neg}
          aria-label={neg ? "Below zero. Tap to make it above zero" : "Above zero. Tap to make it below zero"}
          onClick={() => {
            setNeg(!neg);
            emit(text, !neg);
          }}
          className={`min-h-14 w-16 shrink-0 rounded-2xl border font-display text-2xl font-bold transition ${
            neg ? "border-fg bg-fg text-bg" : "border-line bg-bg text-fg"
          }`}
        >
          {neg ? "−" : "+"}
        </button>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          onChange={(e) => {
            const typedMinus = /[-−]/.test(e.target.value);
            const isNeg = typedMinus ? true : neg;
            if (typedMinus) setNeg(true);
            const digits = e.target.value.replace(/[-−]/g, "");
            setText(digits);
            emit(digits, isNeg);
          }}
          className="min-h-14 w-full min-w-0 rounded-2xl border border-line bg-raised px-4 text-lg text-fg outline-none placeholder:text-muted focus:border-fg"
        />
      </div>
      <p className="mt-1.5 text-xs text-muted">Tap {neg ? "−" : "+"} to switch between below and above zero.</p>
    </div>
  );
}

function QuestionField({
  q,
  value,
  onChange,
  photo,
  onPhoto,
}: {
  q: Question;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
  photo: Photo | null;
  onPhoto: (p: Photo | null) => void;
}) {
  const optional = !q.required && <span className="ml-1 text-sm font-normal text-muted">(optional)</span>;
  let field: ReactNode;
  if (q.type === "yesno") field = <YesNo label={q.label} value={typeof value === "boolean" ? value : null} onChange={onChange} />;
  else if (q.type === "choice" || q.type === "multi") {
    const sel = q.type === "multi" ? ((value as string[] | null) ?? []) : value ? [String(value)] : [];
    field = (
      <fieldset>
        <legend className="mb-2 font-medium">
          {q.label}
          {optional}
          {q.type === "multi" && <span className="ml-1 text-sm font-normal text-muted">(pick any)</span>}
        </legend>
        <div className="grid gap-2">
          {(q.options ?? []).map((o) => (
            <Choice
              key={o}
              selected={sel.includes(o)}
              onClick={() =>
                q.type === "multi" ? onChange(sel.includes(o) ? sel.filter((x) => x !== o) : [...sel, o]) : onChange(o)
              }
            >
              {o}
            </Choice>
          ))}
        </div>
      </fieldset>
    );
  } else if (q.type === "number") field = <SignedNumber q={q} value={value} onChange={onChange} />;
  else if (q.type === "photo")
    field = (
      <div>
        <p className="mb-3 font-medium">
          {q.label}
          {optional}
        </p>
        <PhotoCapture kind="compliance" label={q.label} prompt={q.label} facing="environment" value={photo} onChange={(p) => {
          onPhoto(p);
          onChange(p ? p.id : null);
        }} />
      </div>
    );
  else
    field = (
      <div>
        <label htmlFor={`q-${q.id}`} className="mb-1.5 block font-medium">
          {q.label}
          {optional}
        </label>
        <textarea
          id={`q-${q.id}`}
          rows={2}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl border border-line bg-raised px-4 py-3 text-base text-fg outline-none placeholder:text-muted focus:border-fg"
        />
      </div>
    );
  return (
    <div>
      {field}
      {isFlagged(q, value) && <p className="mt-2 text-sm text-alert">Your supervisor will be alerted.</p>}
    </div>
  );
}

type Answers = Record<string, Record<string, AnswerValue>>;

/** Answers + photos for a set of forms, with validation. */
function useFormState() {
  const [answers, setAnswers] = useState<Answers>({});
  const [photos, setPhotos] = useState<Record<string, Photo | null>>({});
  const set = (formId: string, qid: string, v: AnswerValue) =>
    setAnswers((a) => ({ ...a, [formId]: { ...a[formId], [qid]: v } }));
  const missing = (f: FormDef) => f.questions.find((q) => q.required && !isAnswered(q, answers[f.id]?.[q.id]));
  const response = (f: FormDef): FormResponse => ({ formId: f.id, name: f.name, questions: f.questions, answers: answers[f.id] ?? {} });
  const photosFor = (fs: FormDef[]) =>
    fs.flatMap((f) => f.questions.filter((q) => q.type === "photo").map((q) => photos[`${f.id}:${q.id}`])).filter((p): p is Photo => !!p);
  return { answers, set, photos, setPhotos, missing, response, photosFor };
}

function FormFields({ form, st }: { form: FormDef; st: ReturnType<typeof useFormState> }) {
  return (
    <div className="space-y-6">
      {form.questions.map((q) => (
        <QuestionField
          key={q.id}
          q={q}
          value={st.answers[form.id]?.[q.id] ?? null}
          onChange={(v) => st.set(form.id, q.id, v)}
          photo={st.photos[`${form.id}:${q.id}`] ?? null}
          onPhoto={(p) => st.setPhotos((x) => ({ ...x, [`${form.id}:${q.id}`]: p }))}
        />
      ))}
    </div>
  );
}

type Step = "start" | "identify" | "selfie" | "location" | `form-${number}` | "visitor" | "finish" | "done" | "checkout" | "checkedOut";

function Flow({ store, site, now }: { store: State; site: Site; now: number }) {
  const company = store.company!;
  const me = store.people.find((p) => p.id === store.me) ?? null;
  const open = me
    ? store.checkIns.find((c) => c.personId === me.id && c.siteId === site.id && !c.outAt && isToday(c.inAt, now))
    : undefined;
  const inForms = store.forms.filter((f) => f.active && f.when === "check-in");
  const outForms = store.forms.filter((f) => f.active && f.when === "check-out");

  const [step, setStep] = useState<Step>("start");
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(me?.name ?? "");
  const [employer, setEmployer] = useState(me?.employer ?? company.name);
  const [phone, setPhone] = useState(me?.phone ?? "");
  const [role, setRole] = useState<Role>(me && me.role !== "safety_manager" && me.role !== "supervisor" ? me.role : "worker");
  const [consent, setConsent] = useState(false);

  const [selfie, setSelfie] = useState<Photo | null>(null);
  const [presence, setPresence] = useState<Presence | null>(null);
  const [locating, setLocating] = useState(false);

  const inState = useFormState();
  const outState = useFormState();

  const [visiting, setVisiting] = useState("");
  const [purpose, setPurpose] = useState("");
  const [rulesAck, setRulesAck] = useState(false);

  const [signature, setSignature] = useState<string | null>(null);
  const [done, setDone] = useState<CheckIn | null>(null);

  const isVisitor = role === "visitor";
  const flow: Step[] = isVisitor
    ? ["identify", "selfie", "location", "visitor", "finish"]
    : ["identify", "selfie", "location", ...inForms.map((_, i) => `form-${i}` as Step), "finish"];
  const idx = flow.indexOf(step);
  const progress = idx >= 0 ? (idx + 1) / (flow.length + 1) : undefined;
  const firstName = (me?.name ?? name).split(/\s+/)[0];
  const needsSignature = !isVisitor && inForms.some((f) => f.signature);

  function go(s: Step) {
    setError(null);
    setStep(s);
    window.scrollTo(0, 0);
  }
  const back = () => go(idx > 0 ? flow[idx - 1] : "start");
  const forward = () => go(flow[idx + 1]);

  function submitIdentify() {
    if (!name.trim()) return setError("Add your full name.");
    if (!employer.trim()) return setError("Add the company you work for.");
    if (!phone.trim()) return setError("Add a phone number so the site can reach you in an emergency.");
    if (!consent) return setError("Read and accept how your time and check-in are recorded to continue.");
    upsertMe({ name: name.trim(), employer: employer.trim(), phone: phone.trim(), role, consentVersion: CONSENT_VERSION }, me?.id ?? null);
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
            : { status: "flagged", distanceM: d, accuracyM: Math.round(p.coords.accuracy), reason: `${d >= 1000 ? `${(d / 1000).toFixed(1)} km` : `${d} m`} from ${site.name}` },
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

  function submitForm(f: FormDef) {
    const q = inState.missing(f);
    if (q) return setError(`Answer "${q.label}".`);
    forward();
  }

  function finish() {
    if (needsSignature && !signature) return setError("Sign with your finger to finish.");
    if (isVisitor && !rulesAck) return setError(`Confirm you'll follow the site rules.`);
    const record: CheckIn = {
      id: uid(),
      siteId: site.id,
      personId: store.me!,
      inAt: new Date().toISOString(),
      outAt: null,
      selfie: selfie!,
      presence: presence!,
      forms: isVisitor ? [] : inForms.map(inState.response),
      outForms: [],
      visitor: isVisitor ? { visiting: visiting.trim(), purpose: purpose.trim(), rulesAck } : null,
      photos: isVisitor ? [] : inState.photosFor(inForms),
      signature: needsSignature ? signature : null,
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
            <p className="text-muted">{greeting(now, firstName)}</p>
            <h1 className="mt-2 font-display text-4xl font-bold">You&apos;re clocked in</h1>
            <p className="mt-2 text-muted">
              At {site.name} since {formatTime(open.inAt)} · {formatDuration(new Date(open.inAt).getTime(), now)}
            </p>
            <div className="mt-10">
              <Button variant="danger" size="lg" onClick={() => go("checkout")}>
                Clock out
              </Button>
            </div>
          </div>
        </Shell>
      );
    return (
      <Shell site={site.name}>
        <div className="flex flex-1 flex-col justify-center">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">{company.name}</p>
          <h1 className="mt-2 font-display text-5xl font-bold leading-[0.95]">
            Clock in at
            <br />
            {site.name}
          </h1>
          <p className="mt-4 text-muted">
            {me ? `${greeting(now, firstName)}. ` : ""}A selfie, a quick location check{inForms.length ? " and a short form" : ""}. Under a minute.
          </p>
          <div className="mt-10 space-y-3">
            <Button variant="volt" size="lg" onClick={() => go(me ? "selfie" : "identify")}>
              {me ? "Clock in" : "Start"}
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
                className="min-h-11 w-full text-sm text-muted hover:text-fg"
              >
                Not {firstName}? Clock in as someone else
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
        <Title sub="You only do this once on this phone.">Who&apos;s clocking in?</Title>
        <div className="space-y-5">
          <fieldset>
            <legend className="mb-2 font-medium">I&apos;m here as</legend>
            <div className="grid gap-2">
              {(
                [
                  ["worker", `Staff at ${company.name}`],
                  ["subcontractor", "A contractor"],
                  ["visitor", "A visitor"],
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
          <div className="rounded-2xl bg-raised p-4 text-sm text-muted">
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
        <Title sub={`We check your location once, right now, against the ${site.name} boundary. Never during your shift.`}>Location check</Title>
        {presence ? (
          <div className={`rounded-3xl p-6 ${presence.status === "verified" ? "bg-raised" : "border border-pop bg-raised"}`}>
            <p className="font-display text-2xl font-bold">{presence.status === "verified" ? "You're on site" : "Couldn't confirm you're on site"}</p>
            <p className="mt-1 text-muted">
              {presence.reason}
              {presence.accuracyM !== null && ` · ±${presence.accuracyM} m`}
            </p>
            {presence.status === "flagged" && <p className="mt-3 text-sm text-fg">You can still clock in. Your supervisor will review it.</p>}
          </div>
        ) : (
          <div className="space-y-3">
            <Button variant="outline-dark" size="lg" onClick={checkLocation} disabled={locating}>
              {locating ? "Checking…" : "Check my location"}
            </Button>
            <button
              onClick={() => setPresence({ status: "verified", distanceM: 0, accuracyM: null, reason: "Simulated on site (prototype)" })}
              className="min-h-11 w-full text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
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

  if (step.startsWith("form-")) {
    const f = inForms[Number(step.slice(5))];
    return (
      <Shell site={site.name} progress={progress} onBack={back}>
        <Title sub={f.description || undefined}>{f.name}</Title>
        <FormFields form={f} st={inState} />
        <Err>{error}</Err>
        <div className="mt-6">
          <Button variant="volt" size="lg" onClick={() => submitForm(f)}>
            Continue
          </Button>
        </div>
      </Shell>
    );
  }

  if (step === "visitor")
    return (
      <Shell site={site.name} progress={progress} onBack={back}>
        <Title sub="You'll be on the emergency list until you sign out.">Visitor details</Title>
        <div className="space-y-5">
          <Field dark label="Who are you here to see?" value={visiting} onChange={(e) => setVisiting(e.target.value)} placeholder="Priya Shah" />
          <Field dark label="Purpose of visit (optional)" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Meeting" />
          <div className="rounded-2xl bg-raised p-4 text-sm text-muted">
            Stay with your host, follow posted signs, and leave by the nearest exit if the alarm sounds.
            <div className="mt-3">
              <Choice selected={rulesAck} onClick={() => setRulesAck(!rulesAck)}>
                I&apos;ll follow the site rules
              </Choice>
            </div>
          </div>
        </div>
        <Err>{error}</Err>
        <div className="mt-6">
          <Button variant="volt" size="lg" onClick={() => (visiting.trim() ? forward() : setError("Who are you here to see?"))}>
            Continue
          </Button>
        </div>
      </Shell>
    );

  if (step === "finish") {
    const flags = isVisitor ? [] : inForms.flatMap((f) => flagsForResponse(inState.response(f)));
    return (
      <Shell site={site.name} progress={progress} onBack={back}>
        <Title sub={needsSignature ? "Check your answers, then sign." : "Check your details."}>
          {isVisitor ? "Sign in" : "Clock in"}
        </Title>
        <dl className="space-y-3 rounded-3xl bg-raised p-5 text-sm">
          <Row k="Name">{me?.name ?? name}</Row>
          <Row k="Site">{site.name}</Row>
          <Row k="Location">{presence?.status === "verified" ? "On site" : `Flagged: ${presence?.reason}`}</Row>
          {isVisitor ? (
            <Row k="Visiting">{visiting}</Row>
          ) : (
            inForms.length > 0 && <Row k="Forms">{inForms.map((f) => f.name).join(", ")}</Row>
          )}
          {flags.length > 0 && (
            <Row k="Alerts">
              <span className="text-alert">{flags.length} answer{flags.length > 1 ? "s" : ""} for your supervisor</span>
            </Row>
          )}
        </dl>
        {needsSignature && (
          <div className="mt-5">
            <SignaturePad onChange={setSignature} />
          </div>
        )}
        <Err>{error}</Err>
        <div className="mt-6">
          <Button variant="volt" size="lg" onClick={finish}>
            {isVisitor ? "Sign in" : needsSignature ? "Sign and clock in" : "Clock in"}
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
          <h1 className="mt-6 font-display text-4xl font-bold">{isVisitor ? "You're signed in" : "You're clocked in"}</h1>
          <p className="mt-2 text-lg">
            {site.name} · {formatTime(done.inAt)}. Have a good one, {firstName}.
          </p>
          {flags.length > 0 && (
            <div className="mt-6 rounded-2xl border border-pop p-4 text-left text-sm">
              <p className="font-semibold">Your supervisor will review:</p>
              <ul className="mt-1 list-disc pl-5 text-muted">
                {flags.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-8 text-sm text-muted">Scan the poster again when you leave to clock out.</p>
        </div>
      </Shell>
    );
  }

  if (step === "checkout" && open)
    return (
      <Shell site={site.name} onBack={() => go("start")}>
        <Title sub={`Clocked in since ${formatTime(open.inAt)} · ${formatDuration(new Date(open.inAt).getTime(), now)}.`}>Clock out</Title>
        {open.visitor === null && (
          <div className="space-y-8">
            {outForms.map((f) => (
              <section key={f.id}>
                {outForms.length > 1 && <h2 className="mb-3 font-display text-lg font-bold">{f.name}</h2>}
                <FormFields form={f} st={outState} />
              </section>
            ))}
          </div>
        )}
        <Err>{error}</Err>
        <div className="mt-auto pt-8">
          <Button
            variant="danger"
            size="lg"
            onClick={() => {
              const forms = open.visitor === null ? outForms : [];
              for (const f of forms) {
                const q = outState.missing(f);
                if (q) return setError(`Answer "${q.label}".`);
              }
              checkOut(open.id, forms.map(outState.response), outState.photosFor(forms));
              go("checkedOut");
            }}
          >
            {open.visitor ? "Sign out" : "Clock out"}
          </Button>
        </div>
      </Shell>
    );

  return (
    <Shell site={site.name}>
      <div className="flex flex-1 flex-col justify-center text-center">
        <h1 className="font-display text-4xl font-bold">You&apos;re clocked out</h1>
        <p className="mt-2 text-lg text-muted">
          {formatTime(now)}. Thanks, {firstName}. Get home safe.
        </p>
      </div>
    </Shell>
  );
}

function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-muted">{k}</dt>
      <dd>{children}</dd>
    </div>
  );
}
