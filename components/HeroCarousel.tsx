"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SLIDES } from "@/components/HeroSlides";

const INTERVAL = 5000;

function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Overlapping card carousel: the current card in front, its neighbours peeking out behind.
 * Auto-advances every 5 s (paused on hover, focus, a hidden tab, or reduced motion).
 * Swipe, arrow keys, the side cards and the dots all change slides.
 */
export default function HeroCarousel() {
  const n = SLIDES.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useSyncExternalStore(subscribeMotion, reducedMotion, () => true);
  const drag = useRef<{ x: number; id: number } | null>(null);

  const go = useCallback((i: number) => setIndex(((i % n) + n) % n), [n]);

  useEffect(() => {
    if (paused || reduce) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") setIndex((i) => (i + 1) % n);
    }, INTERVAL);
    return () => clearInterval(t);
  }, [paused, reduce, n]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="How Musterpass works"
      className="relative w-full select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        else if (e.key === "ArrowLeft") go(index - 1);
      }}
    >
      <div
        className="relative aspect-[20/19] w-full touch-pan-y"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, id: e.pointerId };
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (!d || d.id !== e.pointerId) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        }}
        onPointerCancel={() => (drag.current = null)}
      >
        {SLIDES.map((s, i) => {
          // Shortest signed distance from the current slide: 0 front, ±1 neighbours, others hidden.
          let off = i - index;
          if (off > n / 2) off -= n;
          if (off < -n / 2) off += n;
          const abs = Math.abs(off);
          const front = off === 0;
          return (
            <div
              key={s.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${n}: ${s.title}`}
              aria-hidden={!front}
              inert={!front}
              onClick={() => !front && go(i)}
              className={`absolute left-[14%] top-[2%] flex aspect-[4/5] w-[72%] flex-col overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-fg/15 ${
                reduce ? "" : "transition-[transform,opacity] duration-500 ease-[cubic-bezier(.2,.8,.2,1)]"
              } ${front ? "" : "cursor-pointer"}`}
              style={{
                background: s.bg,
                color: s.fg,
                zIndex: 10 - abs,
                opacity: abs > 1 ? 0 : 1,
                transform: `translateX(${off * 34}%) scale(${1 - abs * 0.14}) rotate(${off * 3}deg)`,
                filter: front ? undefined : "brightness(0.92)",
              }}
            >
              <div className="relative min-h-0 flex-1 px-4 pt-4">
                {s.image ? <Image src={s.image.src} alt={s.image.alt} fill className="object-cover" sizes="400px" /> : s.art}
              </div>
              <div className="px-6 pb-6 pt-2">
                <p className="font-display text-xl font-bold leading-tight sm:text-2xl">{s.title}</p>
                <p className="mt-1 text-sm opacity-80">{s.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => go(index - 1)}
          className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition hover:border-fg hover:text-fg"
        >
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 3 5 8l5 5" />
          </svg>
        </button>
        <div className="flex items-center gap-1">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Show slide ${i + 1}: ${s.title}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => go(i)}
              className="flex size-6 items-center justify-center"
            >
              <span className={`block h-2 rounded-full transition-all ${i === index ? "w-6 bg-fg" : "w-2 bg-muted/60 hover:bg-muted"}`} />
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Next slide"
          onClick={() => go(index + 1)}
          className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition hover:border-fg hover:text-fg"
        >
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 3 5 5-5 5" />
          </svg>
        </button>
      </div>
    </section>
  );
}
