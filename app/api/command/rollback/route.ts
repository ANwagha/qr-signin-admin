import { errorResponse, missingSetup, projectId, requireKey, vercel } from "@/lib/command-server";

/** Point the live site at an earlier version, for everyone. Body: { deploymentId, reason? } */
export async function POST(request: Request) {
  const denied = requireKey(request);
  if (denied) return denied;
  if (missingSetup().length) return Response.json({ error: "The command center isn't set up yet.", missing: missingSetup() }, { status: 503 });

  const { deploymentId, reason } = (await request.json().catch(() => ({}))) as { deploymentId?: string; reason?: string };
  if (!deploymentId || !/^dpl_[A-Za-z0-9]+$/.test(deploymentId)) return Response.json({ error: "Pick a version to roll back to." }, { status: 400 });

  try {
    const query: Record<string, string> = {};
    if (reason?.trim()) query.description = reason.trim().slice(0, 200);
    await vercel(`/v1/projects/${encodeURIComponent(projectId())}/rollback/${deploymentId}`, { method: "POST", query });
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
