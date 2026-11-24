import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ResetPassword } from "@/components/CompanyLogin";
import Wordmark from "@/components/Wordmark";
import { cloudEnabled } from "@/lib/cloud/config";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  if (!cloudEnabled) redirect("/login");
  return (
    <main className="flex min-h-dvh flex-col bg-bg px-6 pb-20 pt-6 text-fg">
      <header className="mx-auto w-full max-w-md">
        <Link href="/" aria-label="Musterpass home">
          <Wordmark tone="fg" />
        </Link>
      </header>
      <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
        <h1 className="mb-8 font-display text-4xl font-bold tracking-tight">Choose a new password</h1>
        <ResetPassword />
      </section>
    </main>
  );
}
