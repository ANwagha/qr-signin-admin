"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Wordmark from "@/components/Wordmark";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/qr", label: "QR posters" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <header className="bg-ink text-bone">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" aria-label="Tock home">
          <Wordmark tone="bone" />
        </Link>
        <nav className="flex gap-1 text-sm font-medium">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 transition ${
                  active ? "bg-graphite text-bone" : "text-smoke hover:text-bone"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
