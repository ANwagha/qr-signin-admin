import type { Metadata } from "next";
import AdminShell from "@/components/AdminNav";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · Musterpass" } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
