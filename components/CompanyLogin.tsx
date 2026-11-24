"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button, Field } from "@/components/ui";
import { cloudMessage, supabase } from "@/lib/cloud/client";
import { useCloud } from "@/lib/cloud/sync";

/** Email and password sign-in for company users, with a reset link for forgotten passwords. */
export default function CompanyLogin() {
  const router = useRouter();
  const cloud = useCloud();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  // Already signed in (or just confirmed an email link): straight to the dashboard.
  useEffect(() => {
    if (cloud.status === "ready" || cloud.status === "no-company") router.replace("/admin");
  }, [cloud.status, router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const sb = supabase();
    if (!sb) return;
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Add the email you signed up with.");
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/login/reset` });
        if (error) throw error;
        setSent(true);
      } else {
        if (!password) throw new Error("Add your password.");
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        router.replace("/admin");
      }
    } catch (err) {
      setError(cloudMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (sent)
    return (
      <div className="rounded-3xl border border-line bg-raised p-6">
        <p className="font-display text-xl font-bold">Check your email</p>
        <p className="mt-2 text-muted">
          If {email.trim()} has an account, we&apos;ve sent a link to choose a new password. It works once and expires in an hour.
        </p>
        <button onClick={() => (setSent(false), setMode("login"))} className="mt-4 text-sm font-medium underline underline-offset-4">
          Back to log in
        </button>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Field label="Work email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
      {mode === "login" && (
        <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      )}
      {error && (
        <p role="alert" className="text-sm text-alert">
          {error}
        </p>
      )}
      <Button type="submit" variant="volt" size="lg" disabled={busy}>
        {busy ? "One moment…" : mode === "login" ? "Log in" : "Send reset link"}
      </Button>
      <div className="flex flex-wrap justify-between gap-3 text-sm">
        <button type="button" onClick={() => (setMode(mode === "login" ? "forgot" : "login"), setError(null))} className="text-muted underline-offset-4 hover:text-fg hover:underline">
          {mode === "login" ? "Forgot your password?" : "Back to log in"}
        </button>
        <Link href="/signup" className="text-muted underline-offset-4 hover:text-fg hover:underline">
          New? Start your free trial
        </Link>
      </div>
    </form>
  );
}

/** The page a password-reset email links to: choose a new password. */
export function ResetPassword() {
  const router = useRouter();
  const cloud = useCloud();
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== again) return setError("The two passwords don't match.");
    setBusy(true);
    try {
      const { error } = await supabase()!.auth.updateUser({ password });
      if (error) throw error;
      router.replace("/admin");
    } catch (err) {
      setError(cloudMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (cloud.status === "loading") return <div className="h-40 animate-pulse rounded-3xl bg-raised" />;
  if (cloud.status === "signed-out")
    return (
      <div className="rounded-3xl border border-line bg-raised p-6">
        <p className="font-display text-xl font-bold">This link has expired</p>
        <p className="mt-2 text-muted">Reset links work once and for an hour. Ask for a new one from the log in page.</p>
        <Link href="/login/company" className="mt-4 inline-block text-sm font-medium underline underline-offset-4">
          Back to log in
        </Link>
      </div>
    );
  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Field label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" autoFocus hint="At least 8 characters." />
      <Field label="Type it again" type="password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" />
      {error && (
        <p role="alert" className="text-sm text-alert">
          {error}
        </p>
      )}
      <Button type="submit" variant="volt" size="lg" disabled={busy}>
        {busy ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
