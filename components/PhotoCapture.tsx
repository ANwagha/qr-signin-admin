"use client";
/* eslint-disable @next/next/no-img-element -- photos are local data URLs, not optimizable assets */

import { useId, useState } from "react";
import { fileToDataUrl, makePhoto } from "@/lib/photo";
import type { Photo, PhotoKind } from "@/lib/store";

type Props = {
  kind: PhotoKind;
  label: string;
  prompt: string;
  /** "user" opens the front camera (selfies), "environment" the back camera. */
  facing: "user" | "environment";
  value: Photo | null;
  onChange: (p: Photo | null) => void;
  round?: boolean;
};

export default function PhotoCapture({ kind, label, prompt, facing, value, onChange, round = false }: Props) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await makePhoto(kind, label, await fileToDataUrl(file)));
    } catch {
      setError("That photo didn't work. Try taking it again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {value ? (
        <img
          src={value.dataUrl}
          alt={label}
          className={`border-2 border-graphite object-cover ${round ? "size-48 rounded-full" : "h-48 w-full max-w-xs rounded-2xl"}`}
        />
      ) : (
        <div
          className={`flex items-center justify-center border-2 border-dashed border-graphite text-center text-sm text-smoke ${
            round ? "size-48 rounded-full" : "h-48 w-full max-w-xs rounded-2xl"
          }`}
        >
          {busy ? "Processing…" : prompt}
        </div>
      )}
      {/* capture= asks phones to open the camera directly, so evidence is taken live, not picked from the gallery. */}
      <input
        id={id}
        type="file"
        accept="image/*"
        capture={facing}
        className="sr-only"
        onChange={(e) => {
          void handle(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <label
        htmlFor={id}
        className={`inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full px-6 font-display font-bold transition active:scale-[0.98] ${
          value ? "border border-graphite text-bone hover:border-bone" : "bg-bone text-ink"
        }`}
      >
        {value ? "Retake" : busy ? "Processing…" : "Open camera"}
      </label>
      {error && (
        <p role="alert" className="text-sm text-pop">
          {error}
        </p>
      )}
    </div>
  );
}
