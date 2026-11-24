// Supabase settings. Both values are public by design (they ship to the browser); the database's
// row level security decides what each visitor can see. Without them the app runs as the
// browser-only prototype.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/** True when this build is connected to Supabase. */
export const cloudEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const PHOTO_BUCKET = "photos";
