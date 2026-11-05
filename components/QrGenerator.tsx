"use client";

import { useState, type FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function QrGenerator() {
  const [input, setInput] = useState("");
  const [active, setActive] = useState<{ name: string; id: string } | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const id = slugify(input);
    if (!id) return;
    setActive({ name: input.trim(), id });
  }

  // Build the scan URL from the current origin in the browser.
  const scanUrl = active
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/scan/${active.id}`
    : "";

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Location name, e.g. Warehouse Floor 2"
          className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <button
          type="submit"
          className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Generate QR
        </button>
      </form>

      {active && (
        <div className="print-area flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Scan to sign in / out
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">{active.name}</h2>
          <div className="my-6 rounded-xl border border-slate-200 p-4">
            <QRCodeSVG value={scanUrl} size={256} level="M" includeMargin />
          </div>
          <p className="break-all text-xs text-slate-500">{scanUrl}</p>
          <button
            onClick={() => window.print()}
            className="no-print mt-6 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Print
          </button>
        </div>
      )}
    </div>
  );
}
