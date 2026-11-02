import type { Metadata } from "next";
import "./globals.css";
import { PersonaProvider } from "@/components/PersonaContext";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "BuildSafe SA | SAPS-Cleared Builders & Milestone Escrow Marketplace",
  description:
    "Connect safely with biometric SAPS-cleared builders, plumbers, electricians, painters and tilers across South Africa. Protected by Milestone Escrow, Gate Check-In OTPs, and Two-Way Ratings.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <PersonaProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-16">
            <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-white font-semibold text-sm mb-1">
                  BuildSafe SA — Trusted Skilled-Trades Infrastructure
                </p>
                <p>
                  Turning informal hardware-store parking-lot hires into governed,
                  biometric-vetted, escrow-protected contracts for homeowners and
                  skilled artisans across South Africa.
                </p>
              </div>
              <div>
                <p className="text-white font-semibold mb-1">
                  South African Governance Architecture
                </p>
                <ul className="space-y-1">
                  <li>• POPIA Digital Consent &amp; Masked 13-Digit SA IDs</li>
                  <li>• AFISwitch / HURU Biometric SAPS Criminal Clearance</li>
                  <li>• PIRB, ECB Wireman &amp; NHBRC Statutory CoC Tiering</li>
                </ul>
              </div>
              <div>
                <p className="text-white font-semibold mb-1">
                  Escrow &amp; Physical Home Security
                </p>
                <ul className="space-y-1">
                  <li>• Regulated Milestone Escrow (0% fee on hardware slips)</li>
                  <li>• 6-Digit Gate Check-In OTP + Vetted Crew Manifest</li>
                  <li>• Verified Two-Way Homeowner &amp; Artisan Trust Scores</li>
                </ul>
              </div>
            </div>
          </footer>
        </PersonaProvider>
      </body>
    </html>
  );
}
