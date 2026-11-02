import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { PersonaProvider } from "@/components/PersonaContext";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "BuildSafe SA | SAPS-Cleared Builders & Milestone Escrow Marketplace",
  description:
    "Connect safely with biometric SAPS-cleared builders, plumbers, electricians, painters and tilers across South Africa. Protected by Milestone Escrow, Gate Check-In OTPs, and Two-Way Ratings.",
  manifest: "/manifest.json",
};

const TRADES = [
  { label: "Plumbing (PIRB CoC)", slug: "PLUMBING" },
  { label: "Electrical (ECB Wireman)", slug: "ELECTRICAL" },
  { label: "Building & Masonry (NHBRC)", slug: "BUILDING_BRICKWORK" },
  { label: "Painting & Waterproofing", slug: "PAINTING" },
  { label: "Tiling & Flooring", slug: "TILING" },
  { label: "Carpentry & Roofing", slug: "CARPENTRY" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-mortar-100 text-iron-950 font-sans antialiased selection:bg-brick-600 selection:text-white">
        <PersonaProvider>
          <Navbar />
          <main className="flex-1">{children}</main>

          {/* Compact Brutalist Footer */}
          <footer className="bg-iron-950 text-mortar-200 text-xs border-t-4 border-brick-600 mt-16">
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {TRADES.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/jobs?trade=${t.slug}`}
                    className="border border-iron-700 bg-iron-900 px-2 py-1 font-mono text-[11px] text-mortar-300 hover:border-brick-500 hover:text-white transition-colors"
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-mortar-400">
                <span className="text-brick-500 font-bold">BUILDSAFE ZA</span>
                <span>•</span>
                <span>POPIA &amp; SAPS Biometric Vetted</span>
                <span>•</span>
                <span>TradeSafe Escrow</span>
              </div>
            </div>
          </footer>
        </PersonaProvider>
      </body>
    </html>
  );
}
