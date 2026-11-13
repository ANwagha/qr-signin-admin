"use client";

import { makePhoto, placeholderImage } from "@/lib/photo";
import { CONSENT_VERSION, EMPTY, update, uid, type CheckIn, type FlhaAnswers, type Person, type Site } from "@/lib/store";

// Northshore Builders: the made-up demo company from the founding document.

const LONSDALE: Site = {
  id: "site-lonsdale",
  slug: "lonsdale-tower",
  name: "Lonsdale Tower",
  address: "1200 Lonsdale Ave, North Vancouver, BC",
  lat: 49.3205,
  lng: -123.0731,
  radiusM: 150,
};
const BRENTWOOD: Site = {
  id: "site-brentwood",
  slug: "brentwood-yard",
  name: "Brentwood Yard",
  address: "4500 Still Creek Dr, Burnaby, BC",
  lat: 49.2645,
  lng: -123.0012,
  radiusM: 200,
};

function person(name: string, employer: string, role: Person["role"]): Person {
  return { id: `p-${name.split(" ")[0].toLowerCase()}`, name, employer, phone: "604-555-0100", role, consentVersion: CONSENT_VERSION };
}

const PEOPLE: Person[] = [
  person("Priya Shah", "Northshore Builders", "safety_manager"),
  person("Marco Diaz", "Northshore Builders", "supervisor"),
  person("Jas Gill", "Northshore Builders", "worker"),
  person("Leo Park", "Northshore Builders", "worker"),
  person("Dana Kim", "Northshore Builders", "worker"),
  person("Ana Ruiz", "Volt Electric Ltd.", "subcontractor"),
  person("Sam Okafor", "City of North Vancouver", "visitor"),
];

const COLORS = ["#C6F432", "#FF5C8A", "#F5F5F0", "#9AD0FF", "#FFD27A"];

function flha(partial: Partial<FlhaAnswers>): FlhaAnswers {
  return {
    task: "Framing, level 6",
    workArea: "North side",
    supervisor: "Marco Diaz",
    fitForDuty: true,
    knowsMuster: true,
    hazards: [],
    controls: {},
    otherHazard: "",
    ppe: ["Hard hat", "Hi-vis", "Safety boots", "Eye protection", "Gloves"],
    ...partial,
  };
}

export async function loadDemo() {
  const now = Date.now();
  const at = (minsAgo: number) => new Date(now - minsAgo * 60_000).toISOString();
  const selfie = async (p: Person, i: number) =>
    makePhoto("identity", "Selfie", placeholderImage(p.name.split(" ").map((w) => w[0]).join(""), COLORS[i % COLORS.length]));
  const proof = (label: string) => makePhoto("compliance", label, placeholderImage(`${label} (demo)`, "#2A2A2A", "#F5F5F0"));
  const sig = placeholderImage("signed", "#FFFFFF");
  const ok = { status: "verified" as const, distanceM: 40, accuracyM: 12, reason: "Within the site boundary" };

  const [priya, marco, jas, leo, dana, ana, sam] = PEOPLE;
  const checkIns: CheckIn[] = [
    {
      id: uid(), siteId: LONSDALE.id, personId: marco.id, inAt: at(260), outAt: null, incidentReported: null,
      selfie: await selfie(marco, 1), presence: ok,
      form: { kind: "flha", answers: flha({ task: "Site supervision", hazards: ["equipment"], controls: { equipment: ["Spotter"] } }) },
      photos: [await proof("PPE")], signature: sig,
      review: { selfie: "approved", countersignedAt: at(250), countersignedBy: "Priya Shah" },
    },
    {
      id: uid(), siteId: LONSDALE.id, personId: jas.id, inAt: at(232), outAt: null, incidentReported: null,
      selfie: await selfie(jas, 0), presence: ok,
      form: { kind: "flha", answers: flha({ hazards: ["heights", "falling"], controls: { heights: ["Guardrails", "Fall arrest / tie-off"], falling: ["Toe boards"] }, ppe: ["Hard hat", "Hi-vis", "Safety boots", "Eye protection", "Gloves", "Fall protection"] }) },
      photos: [await proof("Harness"), await proof("PPE")], signature: sig,
      review: { selfie: "pending", countersignedAt: null, countersignedBy: null },
    },
    {
      id: uid(), siteId: LONSDALE.id, personId: ana.id, inAt: at(215), outAt: null, incidentReported: null,
      selfie: await selfie(ana, 3), presence: ok,
      form: { kind: "flha", answers: flha({ task: "Rough-in wiring, level 4", supervisor: "Marco Diaz", hazards: ["electrical"], controls: { electrical: ["Lockout / tagout", "Qualified worker only"] } }) },
      photos: [await proof("PPE")], signature: sig,
      review: { selfie: "pending", countersignedAt: null, countersignedBy: null },
    },
    {
      id: uid(), siteId: LONSDALE.id, personId: leo.id, inAt: at(190), outAt: null, incidentReported: null,
      selfie: await selfie(leo, 2),
      presence: { status: "flagged", distanceM: 3100, accuracyM: 25, reason: "3.1 km from Lonsdale Tower" },
      form: { kind: "flha", answers: flha({ task: "Excavation for footings", hazards: ["excavation", "equipment"], controls: { excavation: ["Barricade"], equipment: ["Spotter"] } }) },
      photos: [await proof("Barricade"), await proof("PPE")], signature: sig,
      review: { selfie: "pending", countersignedAt: null, countersignedBy: null },
    },
    {
      id: uid(), siteId: BRENTWOOD.id, personId: dana.id, inAt: at(170), outAt: null, incidentReported: null,
      selfie: await selfie(dana, 4), presence: ok,
      form: { kind: "flha", answers: flha({ task: "Concrete pour prep", workArea: "Pad B", fitForDuty: false, hazards: ["slips", "lifting"], controls: { slips: ["Area cleaned"], lifting: ["Team lift"] } }) },
      photos: [await proof("PPE")], signature: sig,
      review: { selfie: "approved", countersignedAt: null, countersignedBy: null },
    },
    {
      id: uid(), siteId: LONSDALE.id, personId: sam.id, inAt: at(95), outAt: at(40), incidentReported: false,
      selfie: await selfie(sam, 2), presence: ok,
      form: { kind: "visitor", answers: { visiting: "Priya Shah", purpose: "Building inspection", rulesAck: true } },
      photos: [], signature: sig,
      review: { selfie: "approved", countersignedAt: null, countersignedBy: null },
    },
  ];

  update(() => ({
    ...EMPTY,
    company: {
      id: "co-northshore",
      name: "Northshore Builders",
      industry: "construction",
      ownerName: priya.name,
      ownerEmail: "priya@northshore.example",
      plan: "trial",
      trialEndsAt: new Date(now + 22 * 86_400_000).toISOString(),
      createdAt: new Date(now - 8 * 86_400_000).toISOString(),
      demo: true,
    },
    sites: [LONSDALE, BRENTWOOD],
    people: PEOPLE,
    invites: [],
    checkIns,
    me: null,
  }));
}
