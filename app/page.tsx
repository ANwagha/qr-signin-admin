import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">QR Sign-In / Sign-Out</h1>
      <div className="flex gap-3">
        <Link href="/admin" className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">
          Admin Dashboard
        </Link>
        <Link href="/admin/qr" className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-900 shadow hover:bg-slate-100">
          QR Codes
        </Link>
      </div>
    </main>
  );
}
