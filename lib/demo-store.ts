"use client";

import { useMemo, useSyncExternalStore } from "react";

// Phase 0 stand-in for Supabase (Phase 1). Keeps the demo employee's name and clock events
// in this browser's localStorage so the clock-in screen and dashboard work end to end.
// Nothing here is shared between devices.

export type ClockAction = "in" | "out";

export type ClockEvent = {
  id: string;
  name: string;
  locationId: string;
  locationName: string;
  action: ClockAction;
  at: string; // ISO timestamp
};

type DemoState = { name: string | null; events: ClockEvent[] };

const KEY = "tock.demo.v1";
const CHANGE = "tock-demo-change";
const EMPTY: DemoState = { name: null, events: [] };

function read(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function write(state: DemoState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage blocked (private mode etc.): the demo still works for this page view.
  }
  window.dispatchEvent(new Event(CHANGE));
}

function parse(raw: string | null): DemoState {
  if (!raw) return EMPTY;
  try {
    const s = JSON.parse(raw) as Partial<DemoState>;
    return { name: s.name ?? null, events: Array.isArray(s.events) ? s.events : [] };
  } catch {
    return EMPTY;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGE, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGE, cb);
  };
}

/** Demo state, or null until the client has hydrated. */
export function useDemoStore(): DemoState | null {
  const raw = useSyncExternalStore(subscribe, read, () => undefined);
  return useMemo(() => (raw === undefined ? null : parse(raw)), [raw]);
}

export function setDemoName(name: string | null) {
  const s = parse(read());
  write({ ...s, name });
}

export function addClockEvent(e: Omit<ClockEvent, "id" | "at">): ClockEvent {
  const s = parse(read());
  const event: ClockEvent = { ...e, id: crypto.randomUUID(), at: new Date().toISOString() };
  write({ ...s, events: [...s.events, event].slice(-200) });
  return event;
}

/** Most recent event for this person at this location, if any. */
export function lastEventFor(state: DemoState, name: string, locationId: string) {
  for (let i = state.events.length - 1; i >= 0; i--) {
    const e = state.events[i];
    if (e.locationId === locationId && e.name.toLowerCase() === name.toLowerCase()) return e;
  }
  return null;
}
