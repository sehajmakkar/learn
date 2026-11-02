import type { Metadata } from "next";
import Script from "next/script";
import {
  IBM_Plex_Mono,
  Instrument_Sans,
  Instrument_Serif,
  Nanum_Pen_Script,
} from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const serif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--f-serif",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--f-sans",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--f-mono",
});

const pen = Nanum_Pen_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--f-pen",
});

const themeScript = `try{var t=localStorage.getItem("theme");var d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}`;

export const metadata: Metadata = {
  metadataBase: new URL("https://learn.sehaj.tech"),
  title: {
    default: "sehaj/learn",
    template: "%s · sehaj/learn",
  },
  description:
    "Free, open-source courses that take one technology from first principles to production, with quizzes, a project and an interview bank.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${serif.variable} ${sans.variable} ${mono.variable} ${pen.variable} antialiased`}
    >
      <body className="flex min-h-screen flex-col font-sans">
        {/* Set the theme before hydration: saved choice, else the system setting. */}
        <Script id="theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
