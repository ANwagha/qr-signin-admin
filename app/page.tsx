import Link from "next/link";
import HeroCarousel from "@/components/HeroCarousel";
import HowItWorks from "@/components/HowItWorks";
import TryItOut from "@/components/TryItOut";
import Wordmark from "@/components/Wordmark";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col overflow-x-clip bg-bg px-6 pb-20 pt-6 text-fg">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Wordmark tone="fg" />
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/login" className="text-muted hover:text-fg">
            Log in
          </Link>
          <Link href="/admin/billing" className="text-muted hover:text-fg">
            Billing
          </Link>
        </nav>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-16">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div>
            <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl lg:text-5xl xl:text-[3.6rem]">
              Scan in. Clock in.
              <br />
              <span className="text-accent-fg">Proven on site.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted">
              Musterpass replaces keycards and clipboards with one QR code.
              Staff, contractors and visitors clock in on their own phones with
              a selfie and location check, answer any forms you add, and are
              done in under a minute. You get accurate hours, a live roster and
              records that stand up when it matters.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-fg px-6 py-3.5 font-display font-bold text-bg transition hover:opacity-90"
              >
                Start your free trial
              </Link>
              <TryItOut />
            </div>
          </div>
          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <HeroCarousel />
          </div>
        </div>

        <HowItWorks />
      </section>

      <footer className="mx-auto w-full max-w-5xl text-xs text-muted">
        Prototype · Construction first · Data stays in this browser until
        Supabase is connected
      </footer>
    </main>
  );
}
