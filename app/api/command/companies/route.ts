import { serverDb } from "@/lib/cloud/server";
import { requireKey } from "@/lib/command-server";
import type { CompaniesResponse, CompanySummary } from "@/lib/command-types";

type Row = {
  id: string;
  name: string;
  owner_email: string;
  plan: string;
  trial_ends_at: string;
  created_at: string;
  sites: number;
  people: number;
  check_ins: number;
  on_site: number;
  last_check_in: string | null;
};

// Every company on Musterpass, for the command center. Needs the command key.
export async function GET(request: Request) {
  const denied = requireKey(request);
  if (denied) return denied;
  const db = serverDb();
  if (!db) return Response.json({ connected: false, companies: [] } satisfies CompaniesResponse);
  const { data, error } = await db.rpc("command_company_stats");
  if (error) return Response.json({ error: `Supabase: ${error.message}` }, { status: 502 });
  const companies: CompanySummary[] = ((data ?? []) as Row[]).map((r) => ({
    id: r.id,
    name: r.name,
    ownerEmail: r.owner_email,
    plan: r.plan,
    trialEndsAt: r.trial_ends_at,
    createdAt: r.created_at,
    sites: Number(r.sites),
    people: Number(r.people),
    checkIns: Number(r.check_ins),
    onSite: Number(r.on_site),
    lastCheckIn: r.last_check_in,
  }));
  return Response.json({ connected: true, companies } satisfies CompaniesResponse, { headers: { "cache-control": "no-store" } });
}
