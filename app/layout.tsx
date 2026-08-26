import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { SiteChrome } from "@/components/frame/SiteChrome";
import { HUD_LEFT, HUD_RIGHT, LEAGUE } from "@/components/data/league";
import "./globals.css";

/**
 * The reference site licenses TWK Everett (display) + RM Mono (HUD). These are
 * the closest free stand-ins: Archivo is a grotesque that holds up at 120px
 * with tight negative tracking, JetBrains Mono stays legible at 10px uppercase.
 * Swap in your licensed faces here and nothing else changes.
 */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${LEAGUE.name} — Season ${LEAGUE.season}`,
  description: LEAGUE.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${jetbrains.variable}`}>
      <head>
        {/*
          Split text is hidden until GSAP animates it in. If the bundle never
          runs, that copy would be invisible forever — the failure mode the
          reference site ships. <noscript> styles apply only when scripting is
          off, so the text comes back with no JS, no hydration mismatch, and no
          flash for everyone else.
        */}
        <noscript>
          <style>{`[data-split]{opacity:1 !important}`}</style>
        </noscript>
      </head>
      <body className="bg-turf text-chalk antialiased">
        {children}
        <SiteChrome left={HUD_LEFT} right={HUD_RIGHT} />
      </body>
    </html>
  );
}
