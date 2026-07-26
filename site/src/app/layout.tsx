import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import "@sweny-ai/studio/style.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
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
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-bg text-text antialiased`}
      >
        {children}
        <footer className="border-t border-border mt-16 py-8 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <span className="text-sm font-semibold text-text-muted tracking-tight">
                SWE<span className="text-accent">ny</span> Workflows
              </span>
              <div className="flex items-center gap-6 text-xs text-text-dim">
                <a href="https://docs.sweny.ai" target="_blank" rel="noopener noreferrer" className="hover:text-accent-hover transition">
                  Docs
                </a>
                <a href="https://spec.sweny.ai" target="_blank" rel="noopener noreferrer" className="hover:text-accent-hover transition">
                  Spec
                </a>
                <a href="https://github.com/swenyai/sweny" target="_blank" rel="noopener noreferrer" className="hover:text-accent-hover transition">
                  GitHub
                </a>
              </div>
            </div>
            <p className="text-[11px] text-text-dim text-center opacity-70">
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
