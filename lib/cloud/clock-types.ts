// What the phone and the clock-in routes (app/api/clock/*) send each other.
import type { FormDef, FormResponse } from "@/lib/forms";
import type { CheckIn, Company, Person, Photo, Site } from "@/lib/store";

/** Who is clocking in, plus the random key that proves it's the same phone as last time. */
export type DevicePerson = Person & { key: string };

export type SiteLookup = { company: Company; site: Site; forms: FormDef[]; me: Person | null; open: CheckIn | null };

export type ClockInBody = { slug: string; person: DevicePerson; record: CheckIn };
export type ClockInResult = { checkIn: CheckIn; personId: string };

export type ClockOutBody = { checkInId: string; personId: string; key: string; outForms: FormResponse[]; photos: Photo[] };
export type ClockOutResult = { outAt: string };
