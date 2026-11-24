import type { Metadata } from "next";
import Link from "next/link";
import Wordmark from "@/components/Wordmark";

export const metadata: Metadata = { title: "Log in" };

const OPTIONS = [
  {
    href: "/admin",
    title: "Company login",
    who: "For owners, managers and supervisors",
    body: "Your dashboard: who is on site, hours, sites, people, forms and records.",
    icon: (
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <path d="M4 21V8l8-5 8 5v13" />
        <path d="M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    href: "/command",
    title: "Admin login",
    who: "For the Musterpass team",
    body: "The command center: the tester bot, site versions and rollbacks for every company.",
    icon: (
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8M12 17v4M7 9l3 2-3 2M13 13h4" />
      </svg>
    ),
  },
];

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-bg px-6 pb-20 pt-6 text-fg">
      <header className="mx-auto w-full max-w-xl">
        <Link href="/" aria-label="Musterpass home">
          <Wordmark tone="fg" />
        </Link>
      </header>
      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-12">
        <h1 className="font-display text-4xl font-bold tracking-tight">Log in</h1>
        <p className="mt-2 text-muted">Choose how you&apos;re signing in.</p>
        <ul className="mt-8 space-y-3">
          {OPTIONS.map((o) => (
            <li key={o.href}>
              <Link
                href={o.href}
                className="group flex items-start gap-4 rounded-3xl border border-line bg-raised p-5 transition hover:border-fg"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-fg text-bg">{o.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl font-bold">{o.title}</span>
                  <span className="block text-sm font-medium text-muted">{o.who}</span>
                  <span className="mt-2 block text-sm text-muted">{o.body}</span>
                </span>
                <span aria-hidden className="self-center text-xl text-muted transition group-hover:translate-x-0.5 group-hover:text-fg">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 rounded-2xl border border-dashed border-line p-4 text-sm text-muted">
          Prototype: email and password sign-in arrives when we connect Supabase. For now, pick where to go.
        </p>
        <p className="mt-6 text-sm text-muted">
          New to Musterpass?{" "}
          <Link href="/signup" className="font-medium text-fg underline underline-offset-4">
            Start your free trial
          </Link>
        </p>
      </section>
    </main>
  );
}
