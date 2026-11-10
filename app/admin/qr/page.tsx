import type { Metadata } from "next";
import QrGenerator from "@/components/QrGenerator";

export const metadata: Metadata = { title: "QR posters" };

export default function QrPage() {
  return (
    <div className="space-y-6">
      <div className="no-print">
        <h1 className="font-display text-3xl font-bold tracking-tight">QR posters</h1>
        <p className="mt-1 text-graphite/70">Print one, tape it by the staff door, and you&apos;re set up.</p>
      </div>
      <QrGenerator />
    </div>
  );
}
