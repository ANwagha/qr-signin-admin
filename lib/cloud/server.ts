// Server-only Supabase access for route handlers under app/api. Uses the secret key, which skips
// row level security, so every route that imports this checks its own requests.
//   NEXT_PUBLIC_SUPABASE_URL                the project URL
//   SUPABASE_SECRET_KEY (or the older SUPABASE_SERVICE_ROLE_KEY)  Project Settings → API keys
import { createHash, randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PHOTO_BUCKET, SUPABASE_URL } from "@/lib/cloud/config";
import type { Photo } from "@/lib/store";

const SECRET = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let admin: SupabaseClient | null = null;

/** The server's Supabase client, or null when Supabase isn't set up. */
export function serverDb(): SupabaseClient | null {
  if (!SUPABASE_URL || !SECRET) return null;
  admin ??= createClient(SUPABASE_URL, SECRET, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

export const notSetUp = () => Response.json({ error: "Supabase isn't connected yet." }, { status: 503 });
export const bad = (error: string, status = 400) => Response.json({ error }, { status });

export const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");

export const ID = /^[A-Za-z0-9_-]{4,64}$/;
export const SLUG = /^[a-z0-9-]{1,80}$/;
export const newId = () => randomBytes(8).toString("hex");
export const DEVICE_KEY = /^[a-f0-9]{64}$/;
const IMAGE = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/;
const MAX_PHOTO_BYTES = 2_000_000;

/** Reads a JSON body, refusing anything bigger than Vercel would pass on anyway. */
export async function readJson<T>(request: Request, maxBytes = 4_000_000): Promise<T | null> {
  const text = await request.text();
  if (text.length > maxBytes) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Saves photos taken on the phone to private storage and returns them without the image data,
 * pointing at where they're stored instead.
 */
export async function storePhotos(db: SupabaseClient, companyId: string, checkInId: string, photos: Photo[]): Promise<Photo[]> {
  const out: Photo[] = [];
  for (const p of photos) {
    if (!p || !ID.test(p.id)) throw new Error("A photo is missing its ID.");
    const m = IMAGE.exec(p.dataUrl ?? "");
    if (!m) throw new Error("Photos must be JPEG, PNG or WebP.");
    const bytes = Buffer.from(m[2], "base64");
    if (bytes.length > MAX_PHOTO_BYTES) throw new Error("A photo is too large.");
    const ext = m[1] === "jpeg" ? "jpg" : m[1];
    const path = `${companyId}/${checkInId}/${p.id}.${ext}`;
    const { error } = await db.storage.from(PHOTO_BUCKET).upload(path, bytes, { contentType: `image/${m[1]}`, upsert: true });
    if (error) throw new Error(`Couldn't store a photo: ${error.message}`);
    out.push({
      id: p.id,
      kind: p.kind,
      label: String(p.label ?? "").slice(0, 200),
      dataUrl: "",
      capturedAt: p.capturedAt,
      sha256: p.sha256 ?? null,
      path,
    });
  }
  return out;
}
