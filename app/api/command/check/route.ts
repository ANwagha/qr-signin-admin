import { requireKey } from "@/lib/command-server";

// Checks a command key before the command center opens. 204 = right key.
export async function POST(request: Request) {
  const denied = requireKey(request);
  if (denied) {
    // Slow down guessing a little; a real key is a long phrase anyway.
    if (denied.status === 401) await new Promise((r) => setTimeout(r, 800));
    return denied;
  }
  return new Response(null, { status: 204 });
}
