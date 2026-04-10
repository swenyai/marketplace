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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
