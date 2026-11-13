"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui";
import Wordmark from "@/components/Wordmark";
import { loadDemo } from "@/lib/demo-seed";
import { useStore } from "@/lib/store";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/sites", label: "Sites" },
  { href: "/admin/people", label: "People" },
  { href: "/admin/forms", label: "Forms" },
  { href: "/admin/records", label: "Records" },
  { href: "/admin/billing", label: "Billing" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const store = useStore();

  return (
    <div className="min-h-screen bg-bone text-ink">
      <header className="no-print bg-ink text-bone">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Musterpass home">
              <Wordmark tone="bone" />
            </Link>
            {store?.company && <span className="hidden text-sm text-smoke sm:inline">{store.company.name}</span>}
          </div>
          <nav className="-mx-1 flex max-w-full gap-1 overflow-x-auto text-sm font-medium">
            {links.map((l) => {
              const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 transition ${active ? "bg-graphite text-bone" : "text-smoke hover:text-bone"}`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        {store === null && <div className="h-64 animate-pulse rounded-3xl bg-line/60" />}
        {store && !store.company && <NoCompany />}
        {/* Always rendered so Next.js can prerender the route; each page shows nothing until a company exists. */}
        {children}
      </main>
    </div>
  );
}

function NoCompany() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="font-display text-3xl font-bold">No company set up yet</h1>
      <p className="mt-2 text-graphite/70">
        Sign up your company to get your dashboard, or explore Northshore Builders, a demo construction company with
        check-ins already in it.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="volt" onClick={() => router.push("/signup")}>
          Start your free trial
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await loadDemo();
          }}
        >
          {busy ? "Loading…" : "Explore the demo"}
        </Button>
      </div>
    </div>
  );
}
