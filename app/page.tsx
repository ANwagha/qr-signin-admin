import Link from "next/link";
import Wordmark from "@/components/Wordmark";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col bg-ink px-6 py-6 text-bone">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Wordmark tone="bone" />
        <Link href="/admin" className="text-sm text-smoke hover:text-bone">
          Admin
        </Link>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-16">
        <h1 className="font-display text-6xl font-bold leading-[0.95] tracking-tight sm:text-8xl">
          Scan, tap,
          <br />
          <span className="text-volt">you&apos;re in.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-smoke">
          Tock turns any wall into a time clock. Employees clock in from their own phones in three seconds, checked
          on-site. No keycards, no hardware, no app to install.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="rounded-full bg-bone px-6 py-3.5 font-display font-bold text-ink transition hover:bg-white"
          >
            Open the dashboard
          </Link>
          <Link
            href="/admin/qr"
            className="rounded-full border border-graphite px-6 py-3.5 font-display font-bold text-bone transition hover:border-bone"
          >
            Make a QR poster
          </Link>
          <Link
            href="/scan/main-street"
            className="rounded-full px-6 py-3.5 font-display font-bold text-smoke underline-offset-4 transition hover:text-bone hover:underline"
          >
            Try the clock-in screen →
          </Link>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-5xl text-xs text-smoke">Prototype · Phase 0 · Demo data only</footer>
    </main>
  );
}
