// Only imported by route handlers under app/api/command (server code).
import { createHash, timingSafeEqual } from "node:crypto";

// Server-side helpers for the command center. Secrets come only from environment variables
// (set in Vercel → Project → Settings → Environment Variables), never from the code:
//   COMMAND_KEY        the key the Musterpass team types to unlock versions and rollback
//   VERCEL_TOKEN       a Vercel access token that can manage this project
//   VERCEL_PROJECT_ID  the project's ID (Project → Settings → General)
//   VERCEL_TEAM_ID     only if the project belongs to a Vercel team

const API = "https://api.vercel.com";

export function missingSetup(): string[] {
  return ["COMMAND_KEY", "VERCEL_TOKEN", "VERCEL_PROJECT_ID"].filter((k) => !process.env[k]);
}

const digest = (s: string) => createHash("sha256").update(s).digest();

/** null when the request carries the right command key; otherwise the error response to send. */
export function requireKey(request: Request): Response | null {
  const expected = process.env.COMMAND_KEY;
  if (!expected) return Response.json({ error: "The command center isn't set up yet.", missing: missingSetup() }, { status: 503 });
  const given = request.headers.get("x-command-key") ?? "";
  // Compare hashes so the check takes the same time whatever was typed.
  if (!given || !timingSafeEqual(digest(given), digest(expected))) return Response.json({ error: "Wrong command key." }, { status: 401 });
  return null;
}

export async function vercel<T>(path: string, init: RequestInit & { query?: Record<string, string> } = {}): Promise<T> {
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(init.query ?? {})) url.searchParams.set(k, v);
  if (process.env.VERCEL_TEAM_ID) url.searchParams.set("teamId", process.env.VERCEL_TEAM_ID);
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}`, ...init.headers },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) throw new VercelError(res.status, body?.error?.message ?? `Vercel answered ${res.status}`);
  return body;
}

export class VercelError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function errorResponse(e: unknown) {
  if (e instanceof VercelError) {
    if (e.status === 401 || e.status === 403)
      return Response.json({ error: `Vercel didn't accept VERCEL_TOKEN for this project (${e.message}). Check the token and project ID.` }, { status: 502 });
    return Response.json({ error: e.message }, { status: e.status });
  }
  return Response.json({ error: "Something went wrong talking to Vercel." }, { status: 502 });
}

export const projectId = () => process.env.VERCEL_PROJECT_ID!;
