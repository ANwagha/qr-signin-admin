import type { Metadata } from "next";
import AdminNav from "@/components/AdminNav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Tock" } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen bg-bone text-ink">
      <AdminNav />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
