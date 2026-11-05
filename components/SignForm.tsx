"use client";

import { useState, type FormEvent } from "react";

type Action = "in" | "out";

export default function SignForm({ locationName }: { locationName: string }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [action, setAction] = useState<Action>("in");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) {
      setSuccess(null);
      setError("Please enter your name and email or phone.");
      return;
    }
    setError(null);
    // UI-only: persistence is wired up in a later step.
    setSuccess(
      action === "in"
        ? `Signed in to ${locationName}. Welcome, ${name.trim()}!`
        : `Signed out of ${locationName}. Thanks, ${name.trim()}!`,
    );
    setName("");
    setContact("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {success && (
        <div
          role="status"
          className="rounded-xl border border-green-300 bg-green-100 px-4 py-3 text-base font-medium text-green-800"
        >
          ✓ {success}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
          Full name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          placeholder="Jane Smith"
        />
      </div>

      <div>
        <label htmlFor="contact" className="mb-1 block text-sm font-medium text-slate-700">
          Email or phone
        </label>
        <input
          id="contact"
          type="text"
          inputMode="email"
          autoComplete="email"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          placeholder="jane@example.com"
        />
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-slate-700">Action</span>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-200 p-1" role="radiogroup">
          {(["in", "out"] as const).map((value) => {
            const active = action === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setAction(value)}
                className={`rounded-lg py-3 text-base font-semibold transition ${
                  active
                    ? value === "in"
                      ? "bg-green-600 text-white shadow"
                      : "bg-slate-800 text-white shadow"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {value === "in" ? "Sign In" : "Sign Out"}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-indigo-600 py-4 text-lg font-semibold text-white shadow hover:bg-indigo-700 active:scale-[0.99]"
      >
        Submit
      </button>
    </form>
  );
}
