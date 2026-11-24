"use client";

import { makePhoto, placeholderImage } from "@/lib/photo";
import {
  CONSENT_VERSION,
  EMPTY,
  update,
  uid,
  type CheckIn,
  type Industry,
  type Person,
  type Photo,
  type SafetyAnswers,
  type Site,
} from "@/lib/store";
import { defaultPhotoRequired, templateFor, type IndustryTemplate } from "@/lib/templates";

// Made-up demo companies, one per industry. Names and places are fictional; photos are placeholders.

type Demo = {
  company: string;
  domain: string;
  sites: Omit<Site, "id">[];
  owner: string;
  supervisor: string;
  workers: string[];
  sub: { name: string; employer: string };
  visitor: { name: string; org: string; purpose: string };
};

const DEMOS: Record<Industry, Demo> = {
  construction: {
    company: "Northshore Builders",
    domain: "northshore.example",
    sites: [
      { slug: "lonsdale-tower", name: "Lonsdale Tower", address: "1200 Lonsdale Ave, North Vancouver, BC", lat: 49.3205, lng: -123.0731, radiusM: 150 },
      { slug: "brentwood-yard", name: "Brentwood Yard", address: "4500 Still Creek Dr, Burnaby, BC", lat: 49.2645, lng: -123.0012, radiusM: 200 },
    ],
    owner: "Priya Shah",
    supervisor: "Marco Diaz",
    workers: ["Jas Gill", "Leo Park", "Dana Kim"],
    sub: { name: "Ana Ruiz", employer: "Volt Electric Ltd." },
    visitor: { name: "Sam Okafor", org: "City of North Vancouver", purpose: "Building inspection" },
  },
  warehouse: {
    company: "Fraser Valley Logistics",
    domain: "fvlogistics.example",
    sites: [
      { slug: "annacis-dc", name: "Annacis Island DC", address: "1500 Cliveden Ave, Delta, BC", lat: 49.1712, lng: -122.9583, radiusM: 200 },
      { slug: "langley-cross-dock", name: "Langley cross-dock", address: "19500 56 Ave, Langley, BC", lat: 49.1032, lng: -122.6745, radiusM: 200 },
    ],
    owner: "Hannah Lee",
    supervisor: "Raj Patel",
    workers: ["Tom Nguyen", "Maria Santos", "Ben Clarke"],
    sub: { name: "Chris Wong", employer: "Coastal Forklift Services" },
    visitor: { name: "Ellie Brooks", org: "Pacific Freight Co.", purpose: "Carrier audit" },
  },
  kitchen: {
    company: "Harbour Street Kitchen",
    domain: "harbourstreet.example",
    sites: [
      { slug: "main-street-kitchen", name: "Main Street kitchen", address: "2400 Main St, Vancouver, BC", lat: 49.2633, lng: -123.1008, radiusM: 80 },
      { slug: "commissary", name: "Commissary", address: "1100 Clark Dr, Vancouver, BC", lat: 49.2762, lng: -123.0778, radiusM: 80 },
    ],
    owner: "Sofia Romano",
    supervisor: "Kenji Ito",
    workers: ["Luis Ortega", "Amira Haddad", "Josh Taylor"],
    sub: { name: "Pat Murphy", employer: "CleanAir Hood Cleaning" },
    visitor: { name: "Grace Liu", org: "Vancouver Coastal Health", purpose: "Health inspection" },
  },
  manufacturing: {
    company: "Coastline Fabrication",
    domain: "coastlinefab.example",
    sites: [
      { slug: "port-kells-plant", name: "Port Kells plant", address: "9000 196 St, Langley, BC", lat: 49.1708, lng: -122.6834, radiusM: 200 },
      { slug: "surrey-shop", name: "Surrey shop", address: "13000 76 Ave, Surrey, BC", lat: 49.1384, lng: -122.8648, radiusM: 150 },
    ],
    owner: "David Chen",
    supervisor: "Olga Ivanova",
    workers: ["Mike Ross", "Nina Kaur", "Sam Wilson"],
    sub: { name: "Alex Moreau", employer: "Precision Machine Repair" },
    visitor: { name: "Ruth Adams", org: "Northern Steel Supply", purpose: "Supplier visit" },
  },
  cleaning: {
    company: "Brightway Facility Services",
    domain: "brightway.example",
    sites: [
      { slug: "metrotown-tower", name: "Metrotown office tower", address: "4710 Kingsway, Burnaby, BC", lat: 49.2268, lng: -123.0003, radiusM: 120 },
      { slug: "richmond-campus", name: "Richmond campus", address: "13500 Maycrest Way, Richmond, BC", lat: 49.1886, lng: -123.0786, radiusM: 150 },
    ],
    owner: "Fatima Noor",
    supervisor: "Greg Sullivan",
    workers: ["Ivy Tran", "Omar Farouk", "Lena Petrov"],
    sub: { name: "Dev Sharma", employer: "Clearview Window Cleaning" },
    visitor: { name: "Paul Grant", org: "Tower property management", purpose: "Walk-through" },
  },
  general: {
    company: "Cedar & Co.",
    domain: "cedarco.example",
    sites: [
      { slug: "head-office", name: "Head office", address: "800 Granville St, Vancouver, BC", lat: 49.2819, lng: -123.1187, radiusM: 120 },
      { slug: "showroom", name: "Showroom", address: "1500 W 2nd Ave, Vancouver, BC", lat: 49.2706, lng: -123.1386, radiusM: 100 },
    ],
    owner: "Rachel Green",
    supervisor: "Tariq Aziz",
    workers: ["Emma Scott", "Noah Kim", "Zoe Martin"],
    sub: { name: "Victor Hugo", employer: "City Electrical" },
    visitor: { name: "Lisa Park", org: "Insurance broker", purpose: "Site visit" },
  },
};

const COLORS = ["#C6F432", "#FF5C8A", "#F5F5F0", "#9AD0FF", "#FFD27A"];
const initials = (n: string) => n.split(" ").map((w) => w[0]).join("");

/** A good reading for each number check (in range) and a bad one (out of range). */
function readings(t: IndustryTemplate, failId: string | null) {
  const out: SafetyAnswers["checks"] = {};
  for (const c of t.checks) {
    if (c.kind === "passfail") out[c.id] = { pass: c.id !== failId };
    if (c.kind === "number") {
      const good = c.max !== undefined ? c.max - 2 : (c.min ?? 0) + 5;
      const bad = c.max !== undefined ? c.max + 3 : (c.min ?? 0) - 8;
      out[c.id] = { value: c.id === failId ? bad : good };
    }
    if (c.kind === "photo") out[c.id] = {};
  }
  return out;
}

export async function loadDemo(industry: Industry = "construction") {
  const t = templateFor(industry);
  const d = DEMOS[t.id];
  const now = Date.now();
  const at = (minsAgo: number) => new Date(now - minsAgo * 60_000).toISOString();
  const sites: Site[] = d.sites.map((s, i) => ({ ...s, id: `site-${i}` }));

  const person = (name: string, employer: string, role: Person["role"]): Person => ({
    id: `p-${name.split(" ")[0].toLowerCase()}`,
    name,
    employer,
    phone: "604-555-0100",
    role,
    consentVersion: CONSENT_VERSION,
  });
  const owner = person(d.owner, d.company, "safety_manager");
  const sup = person(d.supervisor, d.company, "supervisor");
  const [w1, w2, w3] = d.workers.map((n) => person(n, d.company, "worker"));
  const sub = person(d.sub.name, d.sub.employer, "subcontractor");
  const vis = person(d.visitor.name, d.visitor.org, "visitor");
  const people = [owner, sup, w1, w2, w3, sub, vis];

  const photoReq = defaultPhotoRequired(t);
  const sig = placeholderImage("signed", "#FFFFFF");
  const ok = { status: "verified" as const, distanceM: 40, accuracyM: 12, reason: `Within the ${t.siteNoun} boundary` };
  const proof = (label: string): Promise<Photo> => makePhoto("compliance", label, placeholderImage(`${label} (demo)`, "#2A2A2A", "#F5F5F0"));
  const firstNumberOrPassfail = t.checks.find((c) => c.kind !== "photo")?.id ?? null;

  async function safety(
    p: Person,
    minsAgo: number,
    color: number,
    opts: { hazards: string[]; failReadiness?: boolean; failCheck?: boolean; flaggedLocation?: boolean; site?: number; reviewed?: boolean },
  ): Promise<CheckIn> {
    const readiness = Object.fromEntries(t.readiness.map((q, i) => [q.id, opts.failReadiness && i === 0 ? !q.expected : q.expected]));
    const controls = Object.fromEntries(opts.hazards.map((h) => [h, [t.hazards.find((x) => x.id === h)!.controls[0]]]));
    const failId = opts.failCheck ? firstNumberOrPassfail : null;
    const photos: Photo[] = [];
    for (const h of opts.hazards) if (photoReq[h]) photos.push(await proof(t.hazards.find((x) => x.id === h)!.label));
    for (const c of t.checks) {
      if (c.kind === "photo" || (c.kind === "passfail" && c.id === failId && c.photoOnFail)) photos.push(await proof(c.label));
    }
    photos.push(await proof("PPE"));
    const site = sites[opts.site ?? 0];
    return {
      id: uid(),
      siteId: site.id,
      personId: p.id,
      inAt: at(minsAgo),
      outAt: null,
      incidentReported: null,
      selfie: await makePhoto("identity", "Selfie", placeholderImage(initials(p.name), COLORS[color % COLORS.length])),
      presence: opts.flaggedLocation
        ? { status: "flagged", distanceM: 3100, accuracyM: 25, reason: `3.1 km from ${site.name}` }
        : ok,
      form: {
        kind: "safety",
        answers: {
          templateId: t.id,
          task: t.taskExample,
          workArea: "",
          supervisor: sup.name,
          readiness,
          hazards: opts.hazards,
          controls,
          otherHazard: "",
          checks: readings(t, failId),
          ppe: t.ppe.slice(0, 3),
        },
      },
      photos,
      signature: sig,
      review: opts.reviewed
        ? { selfie: "approved", countersignedAt: at(minsAgo - 10), countersignedBy: owner.name }
        : { selfie: "pending", countersignedAt: null, countersignedBy: null },
    };
  }

  const hz = t.hazards.map((h) => h.id);
  const checkIns: CheckIn[] = [
    await safety(sup, 260, 1, { hazards: [hz[2]], reviewed: true }),
    await safety(w1, 232, 0, { hazards: [hz[0], hz[1]] }),
    await safety(sub, 215, 3, { hazards: [hz[4] ?? hz[1]] }),
    await safety(w2, 190, 2, { hazards: [hz[3] ?? hz[0], hz[2]], flaggedLocation: true, failCheck: t.checks.length > 0 }),
    await safety(w3, 170, 4, { hazards: [hz[hz.length - 1]], failReadiness: true, site: 1 }),
    {
      id: uid(),
      siteId: sites[0].id,
      personId: vis.id,
      inAt: at(95),
      outAt: at(40),
      incidentReported: false,
      selfie: await makePhoto("identity", "Selfie", placeholderImage(initials(vis.name), COLORS[2])),
      presence: ok,
      form: { kind: "visitor", answers: { visiting: owner.name, purpose: d.visitor.purpose, rulesAck: true } },
      photos: [],
      signature: sig,
      review: { selfie: "approved", countersignedAt: null, countersignedBy: null },
    },
  ];

  update(() => ({
    ...EMPTY,
    photoRequired: photoReq,
    company: {
      id: `co-${t.id}`,
      name: d.company,
      industry: t.id,
      ownerName: owner.name,
      ownerEmail: `${owner.name.split(" ")[0].toLowerCase()}@${d.domain}`,
      plan: "trial",
      trialEndsAt: new Date(now + 22 * 86_400_000).toISOString(),
      createdAt: new Date(now - 8 * 86_400_000).toISOString(),
      demo: true,
    },
    sites,
    people,
    invites: [],
    checkIns,
    me: null,
  }));
}
