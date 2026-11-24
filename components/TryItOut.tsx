"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { loadDemo } from "@/lib/demo-seed";
import { useStore } from "@/lib/store";

type Target = { href: string; label: string };

const TARGETS: (Target & { body: string; icon: React.ReactNode })[] = [
  {
    href: "/s/lonsdale-tower",
    label: "Try clocking in",
    body: "Clock in at a demo site the way a worker would on their phone.",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <rect x="6" y="2.5" width="12" height="19" rx="3" />
        <path d="M10.5 18h3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/admin",
    label: "Look at a test dashboard",
    body: "Northshore Builders, a demo company with people already clocked in.",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <rect x="3" y="3" width="7.5" height="9" rx="1.5" />
        <rect x="13.5" y="3" width="7.5" height="5" rx="1.5" />
        <rect x="13.5" y="11" width="7.5" height="10" rx="1.5" />
        <rect x="3" y="15" width="7.5" height="6" rx="1.5" />
      </svg>
    ),
  },
];

/**
 * "Try it out" button with two choices. Both use the demo company. If this browser holds a real
 * company, it asks before replacing it (prototype data lives only in this browser).
 */
export default function TryItOut() {
  const router = useRouter();
  const store = useStore();
  const [open, setOpen] = useState(false);
  // The company that would be replaced, remembered so the message stays right while the demo loads.
  const [confirm, setConfirm] = useState<(Target & { company: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
    setConfirm(null);
  }

  async function go(t: Target, replace = false) {
    const company = store?.company;
    if (company && !company.demo && !replace) return setConfirm({ ...t, company: company.name });
    setBusy(true);
    if (!company?.demo) await loadDemo();
    router.push(t.href);
  }

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => (open ? close() : setOpen(true))}
        className="flex items-center gap-2 rounded-full border border-line px-6 py-3.5 font-display font-bold text-fg transition hover:border-fg"
      >
        Try it out
        <svg viewBox="0 0 16 16" className={`size-4 transition ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div
          id={menuId}
          className="animate-tock-in absolute left-0 top-full z-30 mt-2 w-[min(22rem,calc(100vw-3rem))] rounded-3xl border border-line bg-raised p-2 shadow-xl"
        >
          {confirm ? (
            <div className="p-3">
              <p className="font-display font-bold">Replace your company in this browser?</p>
              <p className="mt-1 text-sm text-muted">
                {confirm.company} is saved in this browser. The demo replaces it here. Your company comes back only if you set it up
                again.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => go(confirm, true)}
                  className="rounded-full bg-pop px-4 py-2 text-sm font-bold text-white hover:brightness-90 disabled:opacity-50"
                >
                  {busy ? "Loading…" : "Replace with demo"}
                </button>
                <button type="button" onClick={() => setConfirm(null)} className="rounded-full border border-line px-4 py-2 text-sm font-bold">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <ul>
              {TARGETS.map((t) => (
                <li key={t.href}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => go(t)}
                    className="flex w-full items-start gap-3 rounded-2xl p-3 text-left transition hover:bg-bg disabled:opacity-50"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-fg text-bg">{t.icon}</span>
                    <span>
                      <span className="block font-display font-bold">{busy ? "Loading…" : t.label}</span>
                      <span className="block text-sm text-muted">{t.body}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
