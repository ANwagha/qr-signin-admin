"use client";

import { useState, type FormEvent } from "react";
import Wordmark from "@/components/Wordmark";
import { addClockEvent, lastEventFor, setDemoName, useDemoStore } from "@/lib/demo-store";
import { formatDuration, formatTime, greeting, useNow } from "@/lib/time";

type Props = { locationId: string; locationName: string };

export default function ClockIn({ locationId, locationName }: Props) {
  const store = useDemoStore();
  const now = useNow();

  if (!store || now === null) return <ClockInSkeleton locationName={locationName} />;
  if (!store.name) return <WhoAreYou locationName={locationName} />;

  const last = lastEventFor(store, store.name, locationId);
  return (
    <ClockFace
      key={store.name}
      name={store.name}
      now={now}
      locationId={locationId}
      locationName={locationName}
      clockedInAt={last?.action === "in" ? last.at : null}
    />
  );
}

function Shell({ children, onNotYou }: { children: React.ReactNode; onNotYou?: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col bg-ink px-6 pb-8 pt-6 text-bone">
      <header className="flex items-center justify-between">
        <Wordmark tone="bone" />
        {onNotYou && (
          <button onClick={onNotYou} className="text-sm text-smoke underline-offset-4 hover:text-bone hover:underline">
            Not you?
          </button>
        )}
      </header>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">{children}</div>
    </main>
  );
}

function LocationChip({ locationName }: { locationName: string }) {
  return (
    <p className="inline-flex items-center gap-2 self-center rounded-full bg-graphite px-3.5 py-1.5 text-sm text-bone">
      <svg aria-hidden viewBox="0 0 24 24" className="size-4 text-smoke" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </svg>
      At {locationName}
    </p>
  );
}

function ClockInSkeleton({ locationName }: { locationName: string }) {
  return (
    <Shell>
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <LocationChip locationName={locationName} />
        <div className="h-20 w-48 animate-pulse rounded-2xl bg-graphite" />
        <div className="size-44 animate-pulse rounded-full bg-graphite" />
      </div>
    </Shell>
  );
}

function WhoAreYou({ locationName }: { locationName: string }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Add your name to continue.");
      return;
    }
    setDemoName(trimmed);
  }

  return (
    <Shell>
      <form onSubmit={submit} className="flex flex-1 flex-col justify-center gap-6 animate-tock-in">
        <LocationChip locationName={locationName} />
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold leading-tight">First time here?</h1>
          <p className="mt-2 text-smoke">Tell us who you are. You&apos;ll only do this once on this phone.</p>
        </div>
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-bone">
            Your name
          </label>
          <input
            id="name"
            autoComplete="name"
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="Sam Rivera"
            aria-invalid={!!error}
            aria-describedby={error ? "name-error" : undefined}
            className="w-full rounded-2xl border border-graphite bg-graphite px-4 py-4 text-lg text-bone placeholder:text-smoke outline-none focus:border-bone"
          />
          {error && (
            <p id="name-error" role="alert" className="mt-2 text-sm text-pop">
              {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          className="rounded-2xl bg-volt py-4 font-display text-lg font-bold text-ink transition active:scale-[0.98]"
        >
          Continue
        </button>
      </form>
    </Shell>
  );
}

function ClockFace({
  name,
  now,
  locationId,
  locationName,
  clockedInAt,
}: {
  name: string;
  now: number;
  locationId: string;
  locationName: string;
  clockedInAt: string | null;
}) {
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const isIn = clockedInAt !== null;
  const firstName = name.split(/\s+/)[0];

  function punch() {
    const action = isIn ? "out" : "in";
    const event = addClockEvent({ name, locationId, locationName, action });
    const time = formatTime(event.at);
    setConfirmation(action === "in" ? `You're in at ${time}. Have a good one.` : `You're out at ${time}. Nice work today.`);
    setPulseKey((k) => k + 1);
    if ("vibrate" in navigator) navigator.vibrate(30);
  }

  const [clock, meridiem] = formatTime(now).split(" ");

  return (
    <Shell onNotYou={() => setDemoName(null)}>
      <div className="flex flex-1 flex-col items-center justify-center gap-7 text-center">
        <LocationChip locationName={locationName} />

        <div>
          <p className="text-lg text-smoke">{greeting(now, firstName)}</p>
          <p className="mt-1 font-display text-7xl font-bold tabular-nums tracking-tight" aria-label={`Time ${formatTime(now)}`}>
            {clock}
            {meridiem && <span className="ml-1.5 text-2xl font-semibold text-smoke">{meridiem}</span>}
          </p>
        </div>

        <button
          key={pulseKey}
          onClick={punch}
          className={`flex size-44 items-center justify-center rounded-full font-display text-2xl font-bold text-ink transition active:scale-95 ${
            isIn ? "bg-pop" : "bg-volt"
          } ${pulseKey > 0 ? "animate-tock-pulse" : ""}`}
        >
          {isIn ? "Clock out" : "Clock in"}
        </button>

        <div className="min-h-14" aria-live="polite">
          {confirmation ? (
            <p key={confirmation} className="animate-tock-in text-lg font-medium text-bone">
              {confirmation}
            </p>
          ) : (
            <p className="text-smoke">
              {isIn
                ? `In since ${formatTime(clockedInAt)} · ${formatDuration(new Date(clockedInAt).getTime(), now)} on the clock`
                : "You're clocked out."}
            </p>
          )}
        </div>
      </div>
      <p className="text-center text-xs text-smoke">Tock checks your location only when you clock in or out.</p>
    </Shell>
  );
}
