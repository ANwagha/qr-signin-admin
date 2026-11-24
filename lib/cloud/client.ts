"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL, cloudEnabled } from "@/lib/cloud/config";

let client: SupabaseClient | null = null;

/** The browser's Supabase client, or null when Supabase isn't set up. Keeps the sign-in in this browser. */
export function supabase(): SupabaseClient | null {
  if (!cloudEnabled || typeof window === "undefined") return null;
  client ??= createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "musterpass.auth" },
  });
  return client;
}

/** Plain-language message for a Supabase error. */
export function cloudMessage(e: unknown): string {
  const msg = e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : String(e);
  if (/invalid login credentials/i.test(msg)) return "That email and password don't match an account.";
  if (/email not confirmed/i.test(msg)) return "Confirm your email first: open the link we sent you.";
  if (/already registered|already been registered/i.test(msg)) return "There's already an account with this email. Log in instead.";
  if (/password should be at least/i.test(msg)) return "Use a password of at least 8 characters.";
  if (/rate limit|too many/i.test(msg)) return "Too many tries. Wait a minute and try again.";
  if (/failed to fetch|network/i.test(msg)) return "Couldn't reach the server. Check your connection and try again.";
  return msg || "Something went wrong.";
}
