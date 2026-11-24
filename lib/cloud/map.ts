// Database rows ⇄ the app's own shapes (lib/store.ts). Used by the browser and the server.

import type { Brand } from "@/lib/brand";
import type { FormDef } from "@/lib/forms";
import type { CheckIn, Company, Invite, Person, Photo, Site } from "@/lib/store";

export type CompanyRow = {
  id: string;
  name: string;
  owner_name: string;
  owner_email: string;
  plan: Company["plan"];
  trial_ends_at: string;
  brand: Brand | null;
  created_at: string;
};
export type SiteRow = { id: string; company_id: string; slug: string; name: string; address: string; lat: number | null; lng: number | null; radius_m: number };
export type PersonRow = { id: string; company_id: string; name: string; employer: string; phone: string; role: Person["role"]; consent_version: string | null };
export type InviteRow = { id: string; company_id: string; email: string; role: Invite["role"]; created_at: string };
export type FormRow = { company_id: string; id: string; position: number; def: FormDef };
export type CheckInRow = {
  id: string;
  company_id: string;
  site_id: string;
  person_id: string;
  in_at: string;
  out_at: string | null;
  selfie: Photo;
  presence: CheckIn["presence"];
  forms: CheckIn["forms"];
  out_forms: CheckIn["outForms"];
  visitor: CheckIn["visitor"];
  photos: Photo[];
  signature: string | null;
  review: CheckIn["review"];
};

export const PEOPLE_COLUMNS = "id, company_id, name, employer, phone, role, consent_version";
export const SITE_COLUMNS = "id, company_id, slug, name, address, lat, lng, radius_m";

export const toCompany = (r: CompanyRow): Company => ({
  id: r.id,
  name: r.name,
  ownerName: r.owner_name,
  ownerEmail: r.owner_email,
  plan: r.plan,
  trialEndsAt: r.trial_ends_at,
  createdAt: r.created_at,
  demo: false,
  cloud: true,
  ...(r.brand ? { brand: r.brand } : {}),
});

export const toSite = (r: SiteRow): Site => ({ id: r.id, slug: r.slug, name: r.name, address: r.address, lat: r.lat, lng: r.lng, radiusM: r.radius_m });

export const toPerson = (r: PersonRow): Person => ({
  id: r.id,
  name: r.name,
  employer: r.employer,
  phone: r.phone,
  role: r.role,
  consentVersion: r.consent_version,
});

export const toInvite = (r: InviteRow): Invite => ({ id: r.id, email: r.email, role: r.role, at: r.created_at });

export const toCheckIn = (r: CheckInRow): CheckIn => ({
  id: r.id,
  siteId: r.site_id,
  personId: r.person_id,
  inAt: r.in_at,
  outAt: r.out_at,
  selfie: r.selfie,
  presence: r.presence,
  forms: r.forms ?? [],
  outForms: r.out_forms ?? [],
  visitor: r.visitor,
  photos: r.photos ?? [],
  signature: r.signature,
  review: r.review,
});

/** Every stored photo in a check-in, selfie first. */
export const photosOf = (c: Pick<CheckIn, "selfie" | "photos">) => [c.selfie, ...c.photos];
