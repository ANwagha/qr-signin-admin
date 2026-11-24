import type { ClockOutBody, ClockOutResult } from "@/lib/cloud/clock-types";
import { DEVICE_KEY, ID, bad, hashKey, notSetUp, readJson, serverDb, storePhotos } from "@/lib/cloud/server";

// A worker clocking out. Only the phone that clocked in (it holds the person's key) can do it.
export async function POST(request: Request) {
  const db = serverDb();
  if (!db) return notSetUp();
  const body = await readJson<ClockOutBody>(request);
  if (!body || !ID.test(String(body.checkInId)) || !ID.test(String(body.personId)) || !DEVICE_KEY.test(String(body.key)))
    return bad("Missing clock-out details.");
  if ((body.photos ?? []).length > 30) return bad("Too many photos.");

  const { data: person } = await db.from("people").select("id, device_key_hash").eq("id", body.personId).maybeSingle();
  if (!person || person.device_key_hash !== hashKey(body.key)) return bad("This phone can't clock out for that person.", 403);

  const { data: c } = await db.from("check_ins").select("id, company_id, person_id, out_at, photos").eq("id", body.checkInId).maybeSingle();
  if (!c || c.person_id !== person.id) return bad("That clock-in wasn't found.", 404);
  if (c.out_at) return bad("Already clocked out.", 409);

  let photos;
  try {
    photos = await storePhotos(db, c.company_id, c.id, body.photos ?? []);
  } catch (e) {
    return bad(e instanceof Error ? e.message : "Couldn't store the photos.");
  }

  const outAt = new Date().toISOString();
  const { error } = await db
    .from("check_ins")
    .update({ out_at: outAt, out_forms: body.outForms ?? [], photos: [...(c.photos ?? []), ...photos] })
    .eq("id", c.id)
    .is("out_at", null);
  if (error) return bad("Couldn't save your clock-out. Try again.", 500);
  return Response.json({ outAt } satisfies ClockOutResult);
}
