"use client";

import type { RealtimeChannel, Session } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { cloudMessage, supabase } from "@/lib/cloud/client";
import { PHOTO_BUCKET, cloudEnabled } from "@/lib/cloud/config";
import {
  PEOPLE_COLUMNS,
  SITE_COLUMNS,
  photosOf,
  toCheckIn,
  toCompany,
  toInvite,
  toPerson,
  toSite,
  type CheckInRow,
  type CompanyRow,
  type FormRow,
  type InviteRow,
  type PersonRow,
  type SiteRow,
} from "@/lib/cloud/map";
import { starterForms } from "@/lib/forms";
import { EMPTY, connectRemote, getState, resetDemo, update, type Remote, type Role, type Site, type State } from "@/lib/store";

// Keeps the browser's copy of a signed-in company in step with Supabase:
// fills it after sign-in, refreshes it when check-ins arrive or the tab comes back,
// and sends each change the screens make (through `connectRemote`).

export type CloudStatus = "off" | "loading" | "signed-out" | "no-company" | "ready";
type CloudState = { status: CloudStatus; email: string | null; error: string | null };

let cloud: CloudState = { status: cloudEnabled ? "loading" : "off", email: null, error: null };
const listeners = new Set<() => void>();
function setCloud(patch: Partial<CloudState>) {
  cloud = { ...cloud, ...patch };
  listeners.forEach((l) => l());
}

/** Sign-in and sync status for screens. Starts watching the sign-in the first time it's used. */
export function useCloud(): CloudState {
  return useSyncExternalStore(
    (cb) => {
      start();
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => cloud,
    () => cloud,
  );
}

export function dismissCloudError() {
  setCloud({ error: null });
}

// ---------- Reading the company ----------

const PHOTO_LINK_SECONDS = 2 * 60 * 60;
let pullSeq = 0;

/** Replaces this browser's copy with the signed-in user's company. */
export async function pull(): Promise<CloudStatus> {
  const sb = supabase();
  if (!sb) return "off";
  // The demo was picked on purpose; leave it until the user leaves it.
  if (getState().company?.demo) return cloud.status === "loading" ? "ready" : cloud.status;
  const seq = ++pullSeq;

  const { data: mem, error: memErr } = await sb.from("members").select("company_id").limit(1);
  if (memErr) throw memErr;
  if (!mem?.length) return "no-company";
  const cid = mem[0].company_id as string;

  const [co, sites, people, invites, forms, checks] = await Promise.all([
    sb.from("companies").select("*").eq("id", cid).single<CompanyRow>(),
    sb.from("sites").select(SITE_COLUMNS).eq("company_id", cid).order("created_at").returns<SiteRow[]>(),
    sb.from("people").select(PEOPLE_COLUMNS).eq("company_id", cid).order("created_at").returns<PersonRow[]>(),
    sb.from("invites").select("*").eq("company_id", cid).order("created_at").returns<InviteRow[]>(),
    sb.from("forms").select("*").eq("company_id", cid).order("position").returns<FormRow[]>(),
    sb.from("check_ins").select("*").eq("company_id", cid).order("in_at", { ascending: false }).limit(1000).returns<CheckInRow[]>(),
  ]);
  for (const r of [co, sites, people, invites, forms, checks]) if (r.error) throw r.error;

  const checkIns = (checks.data ?? []).map(toCheckIn).reverse();

  // Photos are private: swap each stored path for a link that works for a couple of hours.
  const paths = [...new Set(checkIns.flatMap(photosOf).flatMap((p) => (p?.path ? [p.path] : [])))];
  const links = new Map<string, string>();
  for (let i = 0; i < paths.length; i += 500) {
    const { data, error } = await sb.storage.from(PHOTO_BUCKET).createSignedUrls(paths.slice(i, i + 500), PHOTO_LINK_SECONDS);
    if (error) throw error;
    for (const l of data ?? []) if (l.path && l.signedUrl) links.set(l.path, l.signedUrl);
  }
  const withLink = <T extends { path?: string; dataUrl: string }>(p: T): T => (p.path ? { ...p, dataUrl: links.get(p.path) ?? "" } : p);
  for (const c of checkIns) {
    c.selfie = withLink(c.selfie);
    c.photos = c.photos.map(withLink);
  }

  // A newer refresh started meanwhile, or the user opened the demo: keep what's there.
  if (seq !== pullSeq || getState().company?.demo) return cloud.status;

  const next: State = {
    ...EMPTY,
    company: toCompany(co.data!),
    sites: (sites.data ?? []).map(toSite),
    people: (people.data ?? []).map(toPerson),
    invites: (invites.data ?? []).map(toInvite),
    forms: (forms.data ?? []).map((f) => f.def),
    checkIns,
  };
  update(() => next);
  watchCheckIns(cid);
  return "ready";
}

let pullTimer: ReturnType<typeof setTimeout> | null = null;
/** Refresh soon, folding bursts of changes into one refresh. */
export function refreshSoon(ms = 400) {
  if (pullTimer) clearTimeout(pullTimer);
  pullTimer = setTimeout(() => {
    pullTimer = null;
    pull()
      .then((status) => setCloud({ status }))
      .catch((e) => setCloud({ error: `Couldn't refresh: ${cloudMessage(e)}` }));
  }, ms);
}

// ---------- Live check-ins ----------

let channel: RealtimeChannel | null = null;
let channelCompany: string | null = null;

function watchCheckIns(cid: string) {
  const sb = supabase();
  if (!sb || channelCompany === cid) return;
  stopWatching();
  channelCompany = cid;
  channel = sb
    .channel(`check-ins:${cid}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "check_ins", filter: `company_id=eq.${cid}` }, () => refreshSoon(800))
    .subscribe();
}

function stopWatching() {
  if (channel) void supabase()?.removeChannel(channel);
  channel = null;
  channelCompany = null;
}

// ---------- Sending changes ----------

function companyId() {
  const id = getState().company?.id;
  if (!id) throw new Error("No company loaded.");
  return id;
}

/** Runs a database change; on failure shows the error. Either way, refreshes so the screen matches the database. */
function op<A extends unknown[]>(what: string, fn: (...args: A) => PromiseLike<{ error: unknown }>) {
  return async (...args: A) => {
    try {
      const { error } = await fn(...args);
      if (error) throw error;
    } catch (e) {
      setCloud({ error: `Couldn't save ${what}: ${cloudMessage(e)}` });
    } finally {
      refreshSoon();
    }
  };
}

const remote: Remote = {
  addSite: op("the site", (input) => supabase()!.rpc("add_site", { p_company: companyId(), p_site: input })),
  addInvite: op("the invite", (email: string, role: Role) => supabase()!.from("invites").insert({ company_id: companyId(), email, role })),
  setPlan: op("the plan", (plan) => supabase()!.from("companies").update({ plan }).eq("id", companyId())),
  setBrand: op("your branding", (brand) => supabase()!.from("companies").update({ brand }).eq("id", companyId())),
  saveForms: op("your forms", (forms) =>
    supabase()!
      .from("forms")
      .upsert(forms.map((def, position) => ({ company_id: companyId(), id: def.id, position, def }))),
  ),
  deleteForm: op("the form change", (id) => supabase()!.from("forms").delete().eq("company_id", companyId()).eq("id", id)),
  setReview: op("the review", (c) => supabase()!.from("check_ins").update({ review: c.review }).eq("id", c.id)),
};

// ---------- Sign-in ----------

let started = false;

function start() {
  if (started) return;
  started = true;
  const sb = supabase();
  if (!sb) return setCloud({ status: "off" });
  // Supabase asks that no other calls run inside this callback, so the work waits a tick.
  sb.auth.onAuthStateChange((event, session) => {
    if (event === "TOKEN_REFRESHED") return;
    setTimeout(() => void onSession(session), 0);
  });
  window.addEventListener("focus", () => {
    if (cloud.status === "ready") refreshSoon(0);
  });
}

async function onSession(session: Session | null) {
  if (!session) {
    connectRemote(null);
    stopWatching();
    // A company copy left from an earlier sign-in shouldn't stay readable after signing out.
    if (getState().company?.cloud) resetDemo();
    return setCloud({ status: "signed-out", email: null });
  }
  connectRemote(remote);
  setCloud({ email: session.user.email ?? null });
  try {
    let status = await pull();
    if (status === "no-company") {
      // Signed up with email confirmation: the company details waited here until now.
      const pending = takePendingSignup();
      if (pending) {
        await createCompanyInCloud(pending);
        status = await pull();
      }
    }
    setCloud({ status });
  } catch (e) {
    setCloud({ status: "ready", error: `Couldn't load your company: ${cloudMessage(e)}` });
  }
}

export async function signOut() {
  await supabase()?.auth.signOut();
  connectRemote(null);
  stopWatching();
  resetDemo();
  setCloud({ status: "signed-out", email: null });
}

/** After leaving the demo: show the signed-in company again. */
export function backToCompany() {
  resetDemo();
  if (cloud.email) {
    setCloud({ status: "loading" });
    refreshSoon(0);
  }
}

// ---------- Sign-up ----------

export type SignupInput = {
  name: string;
  ownerName: string;
  ownerEmail: string;
  site: Omit<Site, "id" | "slug">;
  invites: { email: string; role: Role }[];
};

const PENDING = "musterpass.pendingSignup";

/** Keeps the sign-up details (never the password) until the email is confirmed. */
export function savePendingSignup(input: SignupInput) {
  try {
    localStorage.setItem(PENDING, JSON.stringify(input));
  } catch {}
}

function takePendingSignup(): SignupInput | null {
  try {
    const raw = localStorage.getItem(PENDING);
    localStorage.removeItem(PENDING);
    return raw ? (JSON.parse(raw) as SignupInput) : null;
  } catch {
    return null;
  }
}

/** Creates the company for the signed-in user and loads it. Returns the first site. */
export async function createCompanyInCloud(input: SignupInput): Promise<Site> {
  const sb = supabase();
  if (!sb) throw new Error("Supabase isn't set up.");
  // Signing up replaces whatever this browser was showing, including the demo.
  resetDemo();
  const { data, error } = await sb.rpc("create_company", {
    p_name: input.name,
    p_owner_name: input.ownerName,
    p_owner_email: input.ownerEmail,
    p_site: input.site,
    p_forms: starterForms(),
    p_invites: input.invites,
  });
  if (error) throw error;
  connectRemote(remote);
  const status = await pull();
  setCloud({ status });
  const site = getState().sites.find((s) => s.id === (data as { siteId: string }).siteId);
  if (!site) throw new Error("The company was created but didn't load. Refresh the page.");
  return site;
}
