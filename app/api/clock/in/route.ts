import type { ClockInBody, ClockInResult } from "@/lib/cloud/clock-types";
import { SITE_COLUMNS, type SiteRow } from "@/lib/cloud/map";
import { DEVICE_KEY, ID, SLUG, bad, hashKey, newId, notSetUp, readJson, serverDb, storePhotos } from "@/lib/cloud/server";
import type { CheckIn, Presence } from "@/lib/store";

const WORKER_ROLES = new Set(["worker", "subcontractor", "visitor"]);
const text = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);

// A worker finishing clock-in. The phone isn't signed in, so this checks everything itself:
// the site exists, the person is who the phone says (or is new), photos are real images.
export async function POST(request: Request) {
  const db = serverDb();
  if (!db) return notSetUp();
  const body = await readJson<ClockInBody>(request);
  if (!body?.record || !body.person) return bad("Missing clock-in details.");
  const { person, record } = body;

  if (!SLUG.test(String(body.slug))) return bad("That poster link doesn't look right.");
  if (!ID.test(String(record.id)) || !ID.test(String(person.id)) || !DEVICE_KEY.test(String(person.key))) return bad("Missing IDs.");
  if (!WORKER_ROLES.has(person.role)) return bad("Choose staff, contractor or visitor.");
  if (!text(person.name) || !text(person.phone)) return bad("Add your name and phone number.");
  if (!record.selfie || !record.presence) return bad("A selfie and location check are needed.");
  if ((record.photos ?? []).length > 30) return bad("Too many photos.");
  if (record.signature && (!/^data:image\/png;base64,/.test(record.signature) || record.signature.length > 400_000))
    return bad("The signature didn't come through.");

  const { data: site } = await db.from("sites").select(SITE_COLUMNS).eq("slug", body.slug).maybeSingle<SiteRow>();
  if (!site) return bad("No site uses this poster link.", 404);
  const cid = site.company_id;

  // Same phone as before: update their details. Unknown ID: a new person. Someone else's ID: a new person too.
  let personId = person.id;
  const details = {
    name: text(person.name),
    employer: text(person.employer),
    phone: text(person.phone, 40),
    role: person.role,
    consent_version: person.consentVersion ? text(person.consentVersion, 40) : null,
  };
  const keyHash = hashKey(person.key);
  const { data: existing } = await db.from("people").select("id, company_id, device_key_hash").eq("id", personId).maybeSingle();
  if (existing && existing.company_id === cid && existing.device_key_hash === keyHash) {
    const { error } = await db.from("people").update(details).eq("id", personId);
    if (error) return bad("Couldn't save your details.", 500);
  } else {
    if (existing) personId = newId();
    const { error } = await db.from("people").insert({ id: personId, company_id: cid, device_key_hash: keyHash, ...details });
    if (error) return bad("Couldn't save your details.", 500);
  }

  const { data: dupe } = await db.from("check_ins").select("id").eq("id", record.id).maybeSingle();
  if (dupe) return bad("This clock-in was already saved.", 409);

  let selfie, photos;
  try {
    [selfie] = await storePhotos(db, cid, record.id, [record.selfie]);
    photos = await storePhotos(db, cid, record.id, record.photos ?? []);
  } catch (e) {
    return bad(e instanceof Error ? e.message : "Couldn't store the photos.");
  }

  // The prototype's "simulate being on site" button never counts for a real company.
  const presence: Presence = /simulated/i.test(String(record.presence.reason))
    ? { status: "flagged", distanceM: null, accuracyM: null, reason: "Location was simulated" }
    : {
        status: record.presence.status === "verified" ? "verified" : "flagged",
        distanceM: typeof record.presence.distanceM === "number" ? record.presence.distanceM : null,
        accuracyM: typeof record.presence.accuracyM === "number" ? record.presence.accuracyM : null,
        reason: text(record.presence.reason),
      };

  const inAt = new Date().toISOString();
  const review: CheckIn["review"] = { selfie: "pending", countersignedAt: null, countersignedBy: null };
  const visitor = record.visitor
    ? { visiting: text(record.visitor.visiting), purpose: text(record.visitor.purpose), rulesAck: !!record.visitor.rulesAck }
    : null;
  const { error } = await db.from("check_ins").insert({
    id: record.id,
    company_id: cid,
    site_id: site.id,
    person_id: personId,
    in_at: inAt,
    selfie,
    presence,
    forms: record.forms ?? [],
    out_forms: [],
    visitor,
    photos,
    signature: record.signature ?? null,
    review,
  });
  if (error) return bad("Couldn't save your clock-in. Try again.", 500);

  const checkIn: CheckIn = { ...record, siteId: site.id, personId, inAt, outAt: null, presence, visitor, review };
  return Response.json({ checkIn, personId } satisfies ClockInResult);
}
