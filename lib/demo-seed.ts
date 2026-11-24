"use client";

import { fromLibrary, type FormDef, type FormResponse } from "@/lib/forms";
import { makePhoto, placeholderImage } from "@/lib/photo";
import { CONSENT_VERSION, EMPTY, update, uid, type CheckIn, type Person, type Photo, type Site } from "@/lib/store";

// Northshore Builders: a made-up company for demos. Photos are placeholders, never real people.

const SITES: Site[] = [
  { id: "site-lonsdale", slug: "lonsdale-tower", name: "Lonsdale Tower", address: "1200 Lonsdale Ave, North Vancouver, BC", lat: 49.3205, lng: -123.0731, radiusM: 150 },
  { id: "site-brentwood", slug: "brentwood-yard", name: "Brentwood Yard", address: "4500 Still Creek Dr, Burnaby, BC", lat: 49.2645, lng: -123.0012, radiusM: 200 },
];

const COLORS = ["#C6F432", "#FF5C8A", "#F5F5F0", "#9AD0FF", "#FFD27A"];
const initials = (n: string) => n.split(" ").map((w) => w[0]).join("");

function person(name: string, employer: string, role: Person["role"]): Person {
  return { id: `p-${name.split(" ")[0].toLowerCase()}`, name, employer, phone: "604-555-0100", role, consentVersion: CONSENT_VERSION };
}

/** Answer a form: every question gets its "all clear" answer unless overridden by label. */
function answer(form: FormDef, overrides: Record<string, unknown> = {}, photoIds: string[] = []): FormResponse {
  let p = 0;
  const answers: FormResponse["answers"] = {};
  for (const q of form.questions) {
    const o = Object.entries(overrides).find(([k]) => q.label.startsWith(k));
    if (o) answers[q.id] = o[1] as never;
    else if (q.type === "yesno") answers[q.id] = q.flag?.yesno === undefined ? true : !q.flag.yesno;
    else if (q.type === "multi") answers[q.id] = [q.options?.[0] ?? "", q.options?.[1] ?? ""].filter(Boolean);
    else if (q.type === "choice") answers[q.id] = q.options?.[0] ?? null;
    else if (q.type === "number") answers[q.id] = 0;
    else if (q.type === "photo") answers[q.id] = photoIds[p++] ?? null;
    else answers[q.id] = q.required ? "Framing, level 6" : "";
  }
  return { formId: form.id, name: form.name, questions: form.questions, answers };
}

export async function loadDemo() {
  const now = Date.now();
  const at = (minsAgo: number) => new Date(now - minsAgo * 60_000).toISOString();

  const fit = fromLibrary("Fit for work");
  const ppe = fromLibrary("PPE check");
  const end = fromLibrary("End of shift");
  const forms = [fit, ppe, end];

  const owner = person("Priya Shah", "Northshore Builders", "safety_manager");
  const sup = person("Marco Diaz", "Northshore Builders", "supervisor");
  const jas = person("Jas Gill", "Northshore Builders", "worker");
  const leo = person("Leo Park", "Northshore Builders", "worker");
  const dana = person("Dana Kim", "Northshore Builders", "worker");
  const ana = person("Ana Ruiz", "Volt Electric Ltd.", "subcontractor");
  const sam = person("Sam Okafor", "City of North Vancouver", "visitor");
  const people = [owner, sup, jas, leo, dana, ana, sam];

  const sig = placeholderImage("signed", "#FFFFFF");
  const ok = { status: "verified" as const, distanceM: 40, accuracyM: 12, reason: "Within the site boundary" };

  async function shift(
    p: Person,
    i: number,
    opts: { inMins: number; outMins?: number; site?: number; fitOverrides?: Record<string, unknown>; flagged?: boolean; reviewed?: boolean; incident?: boolean },
  ): Promise<CheckIn> {
    const ppePhoto: Photo = await makePhoto("compliance", "Photo of your PPE", placeholderImage("PPE (demo)", "#2A2A2A", "#F5F5F0"));
    const site = SITES[opts.site ?? 0];
    return {
      id: uid(),
      siteId: site.id,
      personId: p.id,
      inAt: at(opts.inMins),
      outAt: opts.outMins !== undefined ? at(opts.outMins) : null,
      selfie: await makePhoto("identity", "Selfie", placeholderImage(initials(p.name), COLORS[i % COLORS.length])),
      presence: opts.flagged ? { status: "flagged", distanceM: 3100, accuracyM: 25, reason: `3.1 km from ${site.name}` } : ok,
      forms: [answer(fit, opts.fitOverrides), answer(ppe, {}, [ppePhoto.id])],
      outForms: opts.outMins !== undefined ? [answer(end, opts.incident ? { "Any incidents": true } : {})] : [],
      visitor: null,
      photos: [ppePhoto],
      signature: sig,
      review: opts.reviewed
        ? { selfie: "approved", countersignedAt: at(opts.inMins - 10), countersignedBy: owner.name }
        : { selfie: "pending", countersignedAt: null, countersignedBy: null },
    };
  }

  const checkIns: CheckIn[] = [
    await shift(sup, 1, { inMins: 260, reviewed: true }),
    await shift(jas, 0, { inMins: 232 }),
    await shift(ana, 3, { inMins: 215 }),
    await shift(leo, 2, { inMins: 190, flagged: true }),
    await shift(dana, 4, { inMins: 170, site: 1, fitOverrides: { "Are you fit": false } }),
    await shift(person("Tom Nguyen", "Northshore Builders", "worker"), 2, { inMins: 600, outMins: 120, incident: true, reviewed: true }),
    {
      id: uid(),
      siteId: SITES[0].id,
      personId: sam.id,
      inAt: at(95),
      outAt: at(40),
      selfie: await makePhoto("identity", "Selfie", placeholderImage(initials(sam.name), COLORS[2])),
      presence: ok,
      forms: [],
      outForms: [],
      visitor: { visiting: owner.name, purpose: "Building inspection", rulesAck: true },
      photos: [],
      signature: null,
      review: { selfie: "approved", countersignedAt: null, countersignedBy: null },
    },
  ];
  people.push(person("Tom Nguyen", "Northshore Builders", "worker"));

  update(() => ({
    ...EMPTY,
    company: {
      id: "co-northshore",
      name: "Northshore Builders",
      ownerName: owner.name,
      ownerEmail: "priya@northshore.example",
      plan: "trial",
      trialEndsAt: new Date(now + 22 * 86_400_000).toISOString(),
      createdAt: new Date(now - 8 * 86_400_000).toISOString(),
      demo: true,
    },
    sites: SITES,
    people,
    forms,
    invites: [],
    checkIns,
    me: null,
  }));
}
