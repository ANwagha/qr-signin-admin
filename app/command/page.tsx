import type { Metadata } from "next";
import Link from "next/link";
import Wordmark from "@/components/Wordmark";

export const metadata: Metadata = { title: "Command center", robots: { index: false } };

const COMING = [
  ["Tester bot", "Runs through clock-in, forms and the dashboard like a real person and reports anything broken."],
  ["Versions", "Every release of the site, with what changed and when."],
  ["Rollback", "Put the whole site back to an earlier version for every company, in one click."],
  ["Companies", "Every company on Musterpass, their plan and activity."],
];

export default function CommandCenter() {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="bg-ink text-bone">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Musterpass home">
              <Wordmark tone="bone" />
            </Link>
            <span className="rounded-full bg-volt px-2.5 py-0.5 text-xs font-bold text-ink">Command center</span>
          </div>
          <Link href="/login" className="text-sm text-smoke hover:text-bone">
            Switch login
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8">
        <p className="text-sm text-muted">Musterpass team only</p>
        <h1 className="font-display text-3xl font-bold tracking-tight">Command center</h1>
        <p className="mt-2 max-w-2xl text-muted">Being built next. Here&apos;s what it will hold.</p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {COMING.map(([title, body]) => (
            <li key={title} className="rounded-3xl border border-line bg-surface p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl font-bold">{title}</h2>
                <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold text-muted">Coming next</span>
              </div>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
