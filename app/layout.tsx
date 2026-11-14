import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Musterpass", template: "%s · Musterpass" },
  description: "Scan in. Sign off. Proven on site. Site check-in and safety forms with photo evidence.",
};

export const viewport: Viewport = {
  themeColor: "#141414",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} h-full`}>
      {/* suppressHydrationWarning: some browser extensions add attributes (e.g. style="isolation:isolate")
          to <body> before React loads. This only ignores <body>'s own attributes, not its children. */}
      <body className="flex min-h-full flex-col bg-ink text-bone" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
