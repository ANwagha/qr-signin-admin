import Link from "next/link";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/qr", label: "QR Codes" },
];

export default function AdminNav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <span className="font-bold text-slate-900">Sign-In Admin</span>
        <nav className="flex gap-4 text-sm font-medium">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-slate-600 hover:text-indigo-600">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
