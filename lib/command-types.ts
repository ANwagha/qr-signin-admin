// Shapes shared by the command center page and its server routes.

export type Version = {
  id: string;
  url: string | null;
  createdAt: number;
  state: string;
  live: boolean;
  canRollBack: boolean;
  commit: { sha: string | null; message: string | null; branch: string | null };
  by: string | null;
};

export type VersionsResponse = {
  versions: Version[];
  /** Set while production is pinned to an older version (new pushes don't go live until undone). */
  rolledBack: { to: string; at: number; reason: string | null } | null;
  /** A rollback or promotion still running at Vercel. */
  busy: boolean;
  /** The commit this server is running, when deployed on Vercel. */
  serving: string | null;
};

export type CompanySummary = {
  id: string;
  name: string;
  ownerEmail: string;
  plan: string;
  trialEndsAt: string;
  createdAt: string;
  sites: number;
  people: number;
  checkIns: number;
  onSite: number;
  lastCheckIn: string | null;
};

/** `connected: false` when Supabase isn't set up on the server yet. */
export type CompaniesResponse = { connected: boolean; companies: CompanySummary[] };
