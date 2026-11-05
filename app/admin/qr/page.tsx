import QrGenerator from "@/components/QrGenerator";

export default function QrPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">QR Code Generator</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter a location name to create a printable QR code linking to its sign-in page.
        </p>
      </div>
      <QrGenerator />
    </div>
  );
}
