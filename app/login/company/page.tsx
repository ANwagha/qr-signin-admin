import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import CompanyLogin from "@/components/CompanyLogin";
import Wordmark from "@/components/Wordmark";
import { cloudEnabled } from "@/lib/cloud/config";

export const metadata: Metadata = { title: "Company login" };

export default function CompanyLoginPage() {
  // Without Supabase there are no accounts; the dashboard reads this browser's company.
  if (!cloudEnabled) redirect("/admin");
  return (
    <main className="flex min-h-dvh flex-col bg-bg px-6 pb-20 pt-6 text-fg">
      <header className="mx-auto flex w-full max-w-md items-center justify-between">
        <Link href="/" aria-label="Musterpass home">
          <Wordmark tone="fg" />
        </Link>
        <Link href="/login" className="text-sm text-muted hover:text-fg">
          Switch login
        </Link>
      </header>
      <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
        <h1 className="font-display text-4xl font-bold tracking-tight">Company login</h1>
        <p className="mb-8 mt-2 text-muted">For owners, managers and supervisors.</p>
        <CompanyLogin />
      </section>
    </main>
  );
}
