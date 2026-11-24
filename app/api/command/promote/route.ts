import { errorResponse, missingSetup, projectId, requireKey, vercel } from "@/lib/command-server";

/**
 * Make a version live and turn automatic releases back on. Used to undo a rollback: after a
 * rollback, Vercel stops putting new pushes live until a version is promoted. Body: { deploymentId }
 */
export async function POST(request: Request) {
  const denied = requireKey(request);
  if (denied) return denied;
  if (missingSetup().length) return Response.json({ error: "The command center isn't set up yet.", missing: missingSetup() }, { status: 503 });

  const { deploymentId } = (await request.json().catch(() => ({}))) as { deploymentId?: string };
  if (!deploymentId || !/^dpl_[A-Za-z0-9]+$/.test(deploymentId)) return Response.json({ error: "Pick a version to make live." }, { status: 400 });

  try {
    await vercel(`/v10/projects/${encodeURIComponent(projectId())}/promote/${deploymentId}`, { method: "POST" });
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
