"use client";

import type { ClockInBody, ClockInResult, ClockOutBody, ClockOutResult, DevicePerson, SiteLookup } from "@/lib/cloud/clock-types";

// The worker's phone side of clocking in to a company saved in Supabase. Workers never sign in:
// this phone remembers who they are, plus a random key that only this phone has.

const KEY = "musterpass.worker.v1";
type Saved = Record<string, DevicePerson>; // by company ID

function readAll(): Saved {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Saved;
  } catch {
    return {};
  }
}

function writeAll(all: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}

export function savedPerson(companyId: string): DevicePerson | null {
  return readAll()[companyId] ?? null;
}

export function savePerson(companyId: string, p: DevicePerson) {
  writeAll({ ...readAll(), [companyId]: p });
}

export function forgetPerson(companyId: string) {
  const all = readAll();
  delete all[companyId];
  writeAll(all);
}

/** 32 random bytes as hex. Works on plain http too (unlike crypto.subtle). */
export function newDeviceKey() {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
  } catch {
    throw new Error("No connection. Check your signal and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? `Something went wrong (${res.status}).`), { status: res.status });
  return data as T;
}

/**
 * Looks up a poster link, and whether this phone's person is clocked in there.
 * Rejects with status 404 when no site uses the link.
 */
export async function lookupSite(slug: string): Promise<SiteLookup> {
  const first = await post<SiteLookup>("/api/clock/site", { slug });
  // Only now do we know the company, so ask again as the person this phone remembers for it.
  const me = savedPerson(first.company.id);
  return me ? post<SiteLookup>("/api/clock/site", { slug, personId: me.id, key: me.key }) : first;
}

export const sendClockIn = (body: ClockInBody) => post<ClockInResult>("/api/clock/in", body);
export const sendClockOut = (body: ClockOutBody) => post<ClockOutResult>("/api/clock/out", body);

