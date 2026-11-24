import type { SiteLookup } from "@/lib/cloud/clock-types";
import {
  PEOPLE_COLUMNS,
  SITE_COLUMNS,
  toCheckIn,
  toCompany,
  toPerson,
  toSite,
  type CheckInRow,
  type CompanyRow,
  type FormRow,
  type PersonRow,
  type SiteRow,
} from "@/lib/cloud/map";
import { DEVICE_KEY, ID, SLUG, bad, hashKey, notSetUp, readJson, serverDb } from "@/lib/cloud/server";

// A worker's phone opening a poster link: the site, its company's branding and forms, and,
// when the phone proves who it is, whether that person is still clocked in here.
// POST so the phone's key never appears in a URL.
export async function POST(request: Request) {
  const db = serverDb();
  if (!db) return notSetUp();
  const body = await readJson<{ slug?: string; personId?: string; key?: string }>(request, 10_000);
  const slug = typeof body?.slug === "string" ? body.slug : "";
  if (!SLUG.test(slug)) return bad("That poster link doesn't look right.");

  const { data: site } = await db.from("sites").select(SITE_COLUMNS).eq("slug", slug).maybeSingle<SiteRow>();
  if (!site) return bad("No site uses this poster link.", 404);

  const [co, forms] = await Promise.all([
    db.from("companies").select("*").eq("id", site.company_id).single<CompanyRow>(),
    db.from("forms").select("*").eq("company_id", site.company_id).order("position").returns<FormRow[]>(),
  ]);
  if (co.error || !co.data) return bad("Couldn't load this site.", 500);

  let me: SiteLookup["me"] = null;
  let open: SiteLookup["open"] = null;
  if (body?.personId && ID.test(body.personId) && body.key && DEVICE_KEY.test(body.key)) {
    const { data: p } = await db
      .from("people")
      .select(`${PEOPLE_COLUMNS}, device_key_hash`)
      .eq("id", body.personId)
      .eq("company_id", site.company_id)
      .maybeSingle<PersonRow & { device_key_hash: string | null }>();
    if (p && p.device_key_hash === hashKey(body.key)) {
      me = toPerson(p);
      const { data: c } = await db
        .from("check_ins")
        .select("*")
        .eq("person_id", p.id)
        .eq("site_id", site.id)
        .is("out_at", null)
        .gte("in_at", new Date(Date.now() - 24 * 3_600_000).toISOString())
        .order("in_at", { ascending: false })
        .limit(1)
        .maybeSingle<CheckInRow>();
      // Only what the clock-out screen needs; photos stay on the server.
      if (c) open = { ...toCheckIn(c), selfie: { ...c.selfie, dataUrl: "" }, photos: [], signature: null };
    }
  }

  // Public view of the company: no owner details.
  const company = { ...toCompany(co.data), ownerName: "", ownerEmail: "" };
  const result: SiteLookup = { company, site: toSite(site), forms: (forms.data ?? []).map((f) => f.def), me, open };
  return Response.json(result, { headers: { "cache-control": "no-store" } });
}
