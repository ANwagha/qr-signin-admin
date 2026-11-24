import type { Metadata } from "next";
import Link from "next/link";
import CommandCenter from "@/components/CommandCenter";
import Wordmark from "@/components/Wordmark";

export const metadata: Metadata = { title: "Command center", robots: { index: false } };

export default function CommandPage() {
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
        <CommandCenter />
      </main>
    </div>
  );
}
