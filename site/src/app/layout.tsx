import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import "@sweny-ai/studio/style.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SWEny Workflows — AI Workflow Marketplace",
    template: "%s | SWEny Workflows",
  },
  description:
    "Discover, share, and create AI-powered workflows for software engineering. Browse community workflows with interactive DAG visualization.",
  metadataBase: new URL("https://marketplace.sweny.ai"),
  openGraph: {
    type: "website",
    siteName: "SWEny Workflows",
    title: "SWEny Workflows — AI Workflow Marketplace",
    description:
      "Discover, share, and create AI-powered workflows for software engineering.",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans bg-[#09090b] text-gray-100 antialiased`}
      >
        {children}
        <footer className="border-t border-[#1e1e2e] mt-16 py-8 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <span className="text-sm font-semibold text-gray-400 tracking-tight">
                SWE<span className="text-blue-500">ny</span> Workflows
              </span>
              <div className="flex items-center gap-6 text-xs text-gray-500">
                <a href="https://cloud.sweny.ai" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition">
                  Dashboard
                </a>
                <a href="https://spec.sweny.ai" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition">
                  Spec
                </a>
                <a href="https://github.com/swenyai/sweny" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition">
                  GitHub
                </a>
              </div>
            </div>
            <p className="text-[11px] text-gray-700 text-center">
              Read-only by design. SWEny never writes to your repos.
            </p>
          </div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
