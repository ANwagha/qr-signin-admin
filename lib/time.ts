"use client";

import { useSyncExternalStore } from "react";

// Current time at minute resolution, shared by every component that needs it.
// Returns null during server rendering and hydration so server and client HTML match.
let currentMinute = Math.floor(Date.now() / 60_000);
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    currentMinute = Math.floor(Date.now() / 60_000);
    timer = setInterval(() => {
      const m = Math.floor(Date.now() / 60_000);
      if (m !== currentMinute) {
        currentMinute = m;
        listeners.forEach((l) => l());
      }
    }, 1_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Milliseconds timestamp of the current minute, or null before the client has hydrated. */
export function useNow(): number | null {
  const minute = useSyncExternalStore(
    subscribe,
    () => currentMinute,
    () => null,
  );
  return minute === null ? null : minute * 60_000;
}

export function formatTime(ms: number | string) {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatDuration(fromMs: number, toMs: number) {
  const mins = Math.max(0, Math.round((toMs - fromMs) / 60_000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function greeting(ms: number, name: string) {
  const h = new Date(ms).getHours();
  if (h < 5) return `Late one tonight, ${name}?`;
  if (h < 12) return `Morning, ${name}`;
  if (h < 17) return `Afternoon, ${name}`;
  if (h < 22) return `Evening, ${name}`;
  return `Late one tonight, ${name}?`;
}
