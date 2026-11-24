"use client";

import { useSyncExternalStore } from "react";

// Auto follows the device; Light and Dark are saved in this browser. The layout's inline script
// applies the saved choice before the page paints.

type Theme = "auto" | "light" | "dark";
const KEY = "musterpass.theme";
const EVENT = "musterpass-theme";

function read(): Theme {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : "auto";
  } catch {
    return "auto";
  }
}

function apply(t: Theme) {
  try {
    if (t === "auto") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, t);
  } catch {}
  if (t === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

const OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  {
    value: "auto",
    label: "Auto (match device)",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
      </svg>
    ),
  },
  {
    value: "light",
    label: "Light",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      </svg>
    ),
  },
];

/**
 * Three-way switch. `onDark` styles it for the fixed black top bar; otherwise it follows the theme.
 */
export default function ThemeToggle({ onDark = false }: { onDark?: boolean }) {
  const theme = useSyncExternalStore(subscribe, read, () => "auto" as Theme);
  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={`inline-flex rounded-full border p-0.5 ${onDark ? "border-graphite" : "border-line"}`}
    >
      {OPTIONS.map((o) => {
        const on = theme === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.label}
            title={o.label}
            onClick={() => apply(o.value)}
            className={`flex size-8 items-center justify-center rounded-full transition ${
              on
                ? onDark
                  ? "bg-bone text-ink"
                  : "bg-fg text-bg"
                : onDark
                  ? "text-smoke hover:text-bone"
                  : "text-muted hover:text-fg"
            }`}
          >
            {o.icon}
          </button>
        );
      })}
    </div>
  );
}
