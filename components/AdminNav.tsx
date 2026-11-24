"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import BrandLogo from "@/components/BrandLogo";
import { Button } from "@/components/ui";
import Wordmark from "@/components/Wordmark";
import { cloudEnabled } from "@/lib/cloud/config";
import { backToCompany, dismissCloudError, signOut, useCloud, type CloudStatus } from "@/lib/cloud/sync";
import { loadDemo } from "@/lib/demo-seed";
import { useStore } from "@/lib/store";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/sites", label: "Sites" },
  { href: "/admin/people", label: "People" },
  { href: "/admin/forms", label: "Forms" },
  { href: "/admin/records", label: "Records" },
  { href: "/admin/branding", label: "Branding" },
  { href: "/admin/billing", label: "Billing" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const store = useStore();
  const cloud = useCloud();
  const router = useRouter();
  const company = store?.company;

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="no-print bg-ink text-bone">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Musterpass home">
              <Wordmark tone="bone" />
            </Link>
            {store?.company?.brand?.logo && <BrandLogo brand={store.company.brand} companyName={store.company.name} size="sm" />}
            {store?.company && <span className="hidden text-sm text-smoke sm:inline">{store.company.name}</span>}
            {company?.cloud && (
              <button
                onClick={async () => {
                  await signOut();
                  router.push("/login");
                }}
                title={cloud.email ? `Signed in as ${cloud.email}` : undefined}
                className="rounded-full border border-graphite px-3 py-1 text-xs font-semibold text-smoke transition hover:border-smoke hover:text-bone"
              >
                Log out
              </button>
            )}
          </div>
          <nav className="-mx-1 flex max-w-full gap-1 overflow-x-auto text-sm font-medium [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8">
        {cloud.error && (
          <div role="alert" className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-pop bg-raised p-4 text-sm">
            <p>{cloud.error}</p>
            <button onClick={dismissCloudError} className="shrink-0 font-semibold text-muted hover:text-fg">
              Dismiss
            </button>
          </div>
        )}
        {cloudEnabled && company?.demo && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-raised px-4 py-3 text-sm">
            <p>
              You&apos;re looking at <strong>{company.name}</strong>, a demo company. Changes stay in this browser.
            </p>
            <button
              onClick={backToCompany}
              className="font-semibold underline underline-offset-4"
            >
              {cloud.email ? "Back to your company" : "Leave the demo"}
            </button>
          </div>
        )}
        {(store === null || (!company && (cloud.status === "loading" || cloud.status === "ready"))) && (
          <div className="h-64 animate-pulse rounded-3xl bg-line/60" />
        )}
        {store && !company && cloud.status !== "loading" && cloud.status !== "ready" && <NoCompany status={cloud.status} />}
        {/* Always rendered so Next.js can prerender the route; each page shows nothing until a company exists. */}
        {children}
      </main>
    </div>
  );
}

function NoCompany({ status }: { status: CloudStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const title = { "signed-out": "Log in to see your dashboard", "no-company": "Finish setting up your company" }[status as string] ?? "No company set up yet";
  const body =
    status === "signed-out"
      ? "Log in with your work email, start a free trial, or explore Northshore Builders, a demo construction company."
      : status === "no-company"
        ? "Your account doesn't have a company yet. Add your company and first site to get your dashboard."
        : "Sign up your company to get your dashboard, or explore Northshore Builders, a demo construction company with check-ins already in it.";
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-muted">{body}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {status === "signed-out" && (
          <Button variant="volt" onClick={() => router.push("/login/company")}>
            Log in
          </Button>
        )}
        <Button variant={status === "signed-out" ? "outline" : "volt"} onClick={() => router.push("/signup")}>
          {status === "no-company" ? "Set up your company" : "Start your free trial"}
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
