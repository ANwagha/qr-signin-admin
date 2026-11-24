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
  description: "Scan in. Clock in. Proven on site. QR clock-in with selfie, location check and your own forms.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#141414" },
  ],
};

// Applies the saved Light/Dark choice before the page paints, so there is no flash of the wrong theme.
const THEME_SCRIPT = `try{var t=localStorage.getItem("musterpass.theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the theme script sets data-theme on <html> before React loads.
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      {/* suppressHydrationWarning: some browser extensions add attributes (e.g. style="isolation:isolate")
          to <body> before React loads. This only ignores <body>'s own attributes, not its children. */}
      <body className="flex min-h-full flex-col bg-bg text-fg" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
