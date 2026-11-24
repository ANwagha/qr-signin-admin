import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import Wordmark from "@/components/Wordmark";

const steps = [
  { n: "1", title: "Scan", body: "Everyone scans the gate poster with their phone camera. No app." },
  { n: "2", title: "Selfie + location", body: "A live selfie and a one-time location check prove who is really there." },
  { n: "3", title: "Your forms, if any", body: "Add your own quick questions, checklists or photos, or skip forms entirely." },
  { n: "4", title: "Clocked in", body: "Hours, attendance and the emergency list update instantly." },
];

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col bg-bg px-6 py-6 text-fg">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Wordmark tone="fg" />
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/admin" className="text-muted hover:text-fg">
            Admin
          </Link>
          <Link href="/admin/billing" className="text-muted hover:text-fg">
            Billing
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-16">
        <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl">
          Scan in. Clock in.
          <br />
          <span className="text-accent-fg">Proven on site.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          Musterpass replaces keycards and clipboards with one QR code. Staff, contractors and visitors clock in on their own
          phones with a selfie and location check, answer any forms you add, and are done in under a
          minute. You get accurate hours, a live roster and records that stand up when it matters.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/signup" className="rounded-full bg-fg px-6 py-3.5 font-display font-bold text-bg transition hover:opacity-90">
            Start your free trial
          </Link>
          <Link
            href="/s/lonsdale-tower"
            className="rounded-full border border-line px-6 py-3.5 font-display font-bold text-fg transition hover:border-fg"
          >
            Try clocking in
          </Link>
        </div>

        <ol className="mt-16 grid gap-3 sm:grid-cols-4">
          {steps.map((s) => (
            <li key={s.n} className="rounded-3xl bg-raised p-5">
              <span className="font-display text-sm font-bold text-muted">{s.n}</span>
              <h2 className="mt-1 font-display text-lg font-bold">{s.title}</h2>
              <p className="mt-1 text-sm text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mx-auto w-full max-w-5xl text-xs text-muted">
        Prototype · Construction first · Data stays in this browser until Supabase is connected
      </footer>
    </main>
  );
}
