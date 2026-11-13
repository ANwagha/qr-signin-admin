import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sites" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
