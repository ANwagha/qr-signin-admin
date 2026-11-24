import { errorResponse, missingSetup, projectId, requireKey, vercel } from "@/lib/command-server";
import type { Version, VersionsResponse } from "@/lib/command-types";

type ApiDeployment = {
  uid: string;
  url: string | null;
  createdAt?: number;
  created: number;
  readyState: string;
  readySubstate?: string;
  isRollbackCandidate?: boolean | null;
  creator?: { username?: string; githubLogin?: string };
  meta?: Record<string, string | undefined>;
};

type ApiProject = {
  lastAliasRequest?: { toDeploymentId?: string; requestedAt?: number; type?: string; jobStatus?: string } | null;
  rollbackDescription?: { description?: string } | null;
};

/** Production versions of the site, newest first, with which one is live. */
export async function GET(request: Request) {
  const denied = requireKey(request);
  if (denied) return denied;
  if (missingSetup().length) return Response.json({ error: "The command center isn't set up yet.", missing: missingSetup() }, { status: 503 });

  try {
    const [list, project] = await Promise.all([
      vercel<{ deployments: ApiDeployment[] }>("/v7/deployments", {
        query: { projectId: projectId(), target: "production", limit: "20" },
      }),
      vercel<ApiProject>(`/v9/projects/${encodeURIComponent(projectId())}`, { query: { rollbackInfo: "true" } }),
    ]);

    // Which deployment the production domain points at right now.
    let liveId: string | null = null;
    const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    if (host) {
      try {
        liveId = (await vercel<{ id: string }>(`/v13/deployments/${encodeURIComponent(host)}`)).id;
      } catch {
        liveId = null;
      }
    }
    if (!liveId) liveId = list.deployments.find((d) => d.readyState === "READY" && d.readySubstate === "PROMOTED")?.uid ?? null;

    const last = project.lastAliasRequest;
    const busy = last?.jobStatus === "pending" || last?.jobStatus === "in-progress";
    const rolledBack =
      last?.type === "rollback" && last.jobStatus === "succeeded" && last.toDeploymentId
        ? { to: last.toDeploymentId, at: last.requestedAt ?? 0, reason: project.rollbackDescription?.description ?? null }
        : null;

    const versions: Version[] = list.deployments.map((d) => ({
      id: d.uid,
      url: d.url ? `https://${d.url}` : null,
      createdAt: d.createdAt ?? d.created,
      state: d.readyState,
      live: d.uid === liveId,
      canRollBack: d.readyState === "READY" && d.uid !== liveId && d.isRollbackCandidate !== false,
      commit: {
        sha: d.meta?.githubCommitSha ?? null,
        message: d.meta?.githubCommitMessage ?? null,
        branch: d.meta?.githubCommitRef ?? null,
      },
      by: d.meta?.githubCommitAuthorLogin ?? d.creator?.githubLogin ?? d.creator?.username ?? null,
    }));

    const body: VersionsResponse = { versions, rolledBack, busy, serving: process.env.VERCEL_GIT_COMMIT_SHA ?? null };
    return Response.json(body);
  } catch (e) {
    return errorResponse(e);
  }
}
