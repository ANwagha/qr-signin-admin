"use client";

import { useState, type FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";
import Wordmark from "@/components/Wordmark";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function QrGenerator() {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<{ name: string; id: string; url: string } | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const id = slugify(input);
    if (!id) {
      setError("Add a location name, like Main Street.");
      return;
    }
    setActive({ name: input.trim(), id, url: `${window.location.origin}/scan/${id}` });
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <form onSubmit={handleSubmit} className="no-print space-y-3 rounded-3xl border border-line bg-white/60 p-6">
        <label htmlFor="location" className="block font-display text-lg font-semibold">
          Location name
        </label>
        <p className="text-sm text-graphite/70">One poster per entrance. Employees scan it to clock in and out.</p>
        <input
          id="location"
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          placeholder="Main Street"
          aria-invalid={!!error}
          aria-describedby={error ? "location-error" : undefined}
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-ink"
        />
        {error && (
          <p id="location-error" role="alert" className="text-sm text-pop-deep">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="w-full rounded-full bg-volt px-6 py-3 font-bold text-ink transition hover:brightness-95 active:scale-[0.98]"
        >
          Make poster
        </button>
      </form>

      {active ? (
        <div>
          <div className="print-area mx-auto flex max-w-md flex-col items-center rounded-3xl bg-ink px-8 py-10 text-center text-bone">
            <Wordmark tone="volt" className="text-3xl" />
            <h2 className="mt-8 font-display text-4xl font-bold leading-tight">{active.name}</h2>
            <p className="mt-2 text-lg text-smoke">Scan to clock in</p>
            <div className="my-8 rounded-3xl bg-bone p-5">
              <QRCodeSVG value={active.url} size={240} level="M" bgColor="#F5F5F0" fgColor="#141414" />
            </div>
            <p className="font-display text-xl font-semibold">Scan, tap, you&apos;re in.</p>
            <p className="mt-6 break-all text-xs text-smoke">{active.url}</p>
          </div>
          <div className="no-print mt-4 flex justify-center gap-3">
            <button
              onClick={() => window.print()}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-bone hover:bg-graphite"
            >
              Print poster
            </button>
            <a
              href={`/scan/${active.id}`}
              target="_blank"
              className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:border-ink"
            >
              Open clock-in screen
            </a>
          </div>
        </div>
      ) : (
        <div className="no-print flex min-h-80 items-center justify-center rounded-3xl border border-dashed border-line p-8 text-center text-graphite/70">
          Your poster preview shows up here.
        </div>
      )}
    </div>
  );
}
