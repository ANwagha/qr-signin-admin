"use client";

import { useMemo, useSyncExternalStore } from "react";
import { FLHA_HAZARDS } from "@/lib/flha";

// Prototype data layer. Everything lives in this browser's localStorage until Supabase
// (founding document, step 2). The shapes mirror the planned database tables.

export type Industry = "construction" | "food";
export type Plan = "trial" | "crew" | "company" | "enterprise";
export type Role = "safety_manager" | "supervisor" | "worker" | "subcontractor" | "visitor";
export type PhotoKind = "identity" | "presence" | "compliance";

export type Photo = {
  id: string;
  kind: PhotoKind;
  label: string;
  dataUrl: string;
  capturedAt: string;
  sha256: string | null; // null when the browser can't hash (http on a phone)
};

export type Company = {
  id: string;
  name: string;
  industry: Industry;
  ownerName: string;
  ownerEmail: string;
  plan: Plan;
  trialEndsAt: string;
  createdAt: string;
  demo: boolean;
};

export type Site = {
  id: string;
  slug: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  radiusM: number;
};

export type Person = {
  id: string;
  name: string;
  employer: string;
  phone: string;
  role: Role;
  consentVersion: string | null;
};

export type Invite = { id: string; email: string; role: Role; at: string };

export type Presence = {
  status: "verified" | "flagged";
  distanceM: number | null;
  accuracyM: number | null;
  reason: string;
};

export type FlhaAnswers = {
  task: string;
  workArea: string;
  supervisor: string;
  fitForDuty: boolean;
  knowsMuster: boolean;
  hazards: string[];
  controls: Record<string, string[]>;
  otherHazard: string;
  ppe: string[];
};

export type VisitorAnswers = { visiting: string; purpose: string; rulesAck: boolean };

export type FormRecord =
  | { kind: "flha"; answers: FlhaAnswers }
  | { kind: "visitor"; answers: VisitorAnswers };

export type CheckIn = {
  id: string;
  siteId: string;
  personId: string;
  inAt: string;
  outAt: string | null;
  incidentReported: boolean | null;
  selfie: Photo;
  presence: Presence;
  form: FormRecord;
  photos: Photo[]; // compliance photos
  signature: string;
  review: {
    selfie: "pending" | "approved" | "mismatch";
    countersignedAt: string | null;
    countersignedBy: string | null;
  };
};

export type State = {
  company: Company | null;
  sites: Site[];
  people: Person[];
  invites: Invite[];
  checkIns: CheckIn[];
  photoRequired: Record<string, boolean>;
  me: string | null; // the person who checks in on this device
};

export const CONSENT_VERSION = "2026-11-v1";

const KEY = "musterpass.demo.v1";
const CHANGE = "musterpass-change";

function defaultPhotoRequired() {
  return Object.fromEntries(FLHA_HAZARDS.map((h) => [h.id, h.photoByDefault]));
}

export const EMPTY: State = {
  company: null,
  sites: [],
  people: [],
  invites: [],
  checkIns: [],
  photoRequired: defaultPhotoRequired(),
  me: null,
};

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function read(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): State {
  if (!raw) return EMPTY;
  try {
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<State>) };
  } catch {
    return EMPTY;
  }
}

export function getState(): State {
  return parse(read());
}

export function update(fn: (s: State) => State) {
  const next = fn(getState());
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    window.alert(
      "This browser's demo storage is full (photos take space). Use Reset demo on the Billing page to clear it.",
    );
    return;
  }
  window.dispatchEvent(new Event(CHANGE));
}

export function resetDemo() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new Event(CHANGE));
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGE, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGE, cb);
  };
}

/** The whole demo state, or null until the browser has hydrated. */
export function useStore(): State | null {
  const raw = useSyncExternalStore(subscribe, read, () => undefined);
  return useMemo(() => (raw === undefined ? null : parse(raw)), [raw]);
}

// ---------- Derived helpers ----------

export function isToday(iso: string, now = Date.now()) {
  return new Date(iso).toDateString() === new Date(now).toDateString();
}

export function flagsFor(c: CheckIn): string[] {
  const flags: string[] = [];
  if (c.presence.status === "flagged") flags.push(`Location: ${c.presence.reason}`);
  if (c.review.selfie === "mismatch") flags.push("Selfie doesn't match");
  if (c.form.kind === "flha") {
    const a = c.form.answers;
    if (!a.fitForDuty) flags.push("Not fit for duty");
    if (!a.knowsMuster) flags.push("Hasn't reviewed the muster point");
    if (a.otherHazard.trim()) flags.push(`Other hazard: ${a.otherHazard.trim()}`);
  }
  if (c.incidentReported) flags.push("Incident or near miss reported at check-out");
  return flags;
}

export function needsReview(c: CheckIn) {
  return c.review.selfie === "pending" || (c.form.kind === "flha" && !c.review.countersignedAt);
}

export function roleLabel(r: Role) {
  return {
    safety_manager: "Safety manager",
    supervisor: "Supervisor",
    worker: "Worker",
    subcontractor: "Subcontractor",
    visitor: "Visitor",
  }[r];
}

/** First selfie on file for a person, used as the reference photo in reviews. */
export function referenceSelfie(s: State, personId: string, excludeId?: string) {
  return s.checkIns
    .filter((c) => c.personId === personId && c.id !== excludeId)
    .sort((a, b) => a.inAt.localeCompare(b.inAt))[0]?.selfie;
}

export function distanceM(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

// ---------- Actions ----------

export function createCompany(input: {
  name: string;
  industry: Industry;
  ownerName: string;
  ownerEmail: string;
  site: Omit<Site, "id" | "slug">;
  invites: { email: string; role: Role }[];
}) {
  const now = new Date();
  const company: Company = {
    id: uid(),
    name: input.name,
    industry: input.industry,
    ownerName: input.ownerName,
    ownerEmail: input.ownerEmail,
    plan: "trial",
    trialEndsAt: new Date(now.getTime() + 30 * 86_400_000).toISOString(),
    createdAt: now.toISOString(),
    demo: false,
  };
  const site: Site = { ...input.site, id: uid(), slug: slugify(input.site.name) || "site" };
  const owner: Person = {
    id: uid(),
    name: input.ownerName,
    employer: input.name,
    phone: "",
    role: "safety_manager",
    consentVersion: null,
  };
  update(() => ({
    ...EMPTY,
    company,
    sites: [site],
    people: [owner],
    invites: input.invites.map((i) => ({ ...i, id: uid(), at: now.toISOString() })),
  }));
  return site;
}

export function addSite(input: Omit<Site, "id" | "slug">) {
  update((s) => {
    let slug = slugify(input.name) || "site";
    while (s.sites.some((x) => x.slug === slug)) slug += "-2";
    return { ...s, sites: [...s.sites, { ...input, id: uid(), slug }] };
  });
}

export function addInvite(email: string, role: Role) {
  update((s) => ({ ...s, invites: [...s.invites, { id: uid(), email, role, at: new Date().toISOString() }] }));
}

export function setPlan(plan: Plan) {
  update((s) => (s.company ? { ...s, company: { ...s.company, plan } } : s));
}

export function setPhotoRequired(hazardId: string, required: boolean) {
  update((s) => ({ ...s, photoRequired: { ...s.photoRequired, [hazardId]: required } }));
}

export function reviewSelfie(checkInId: string, result: "approved" | "mismatch") {
  update((s) => ({
    ...s,
    checkIns: s.checkIns.map((c) => (c.id === checkInId ? { ...c, review: { ...c.review, selfie: result } } : c)),
  }));
}

export function countersign(checkInId: string, by: string) {
  update((s) => ({
    ...s,
    checkIns: s.checkIns.map((c) =>
      c.id === checkInId
        ? { ...c, review: { ...c.review, countersignedAt: new Date().toISOString(), countersignedBy: by } }
        : c,
    ),
  }));
}

export function upsertMe(p: Omit<Person, "id">, existingId: string | null) {
  const id = existingId ?? uid();
  update((s) => ({
    ...s,
    me: id,
    people: existingId
      ? s.people.map((x) => (x.id === id ? { ...x, ...p } : x))
      : [...s.people, { ...p, id }],
  }));
  return id;
}

export function forgetMe() {
  update((s) => ({ ...s, me: null }));
}

export function addCheckIn(c: CheckIn) {
  update((s) => ({ ...s, checkIns: [...s.checkIns, c] }));
}

export function checkOut(checkInId: string, incidentReported: boolean) {
  update((s) => ({
    ...s,
    checkIns: s.checkIns.map((c) =>
      c.id === checkInId ? { ...c, outAt: new Date().toISOString(), incidentReported } : c,
    ),
  }));
}
